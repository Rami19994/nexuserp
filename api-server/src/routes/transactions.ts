import { Router, type IRouter } from "express";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db, inventoryTransactionsTable, materialsTable, locationsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/transactions", requireAuth, async (req, res): Promise<void> => {
  const { txType, materialId, locationId, fromDate, toDate, limit } = req.query;

  const conditions = [];
  if (txType) conditions.push(eq(inventoryTransactionsTable.txType, String(txType)));
  if (materialId) conditions.push(eq(inventoryTransactionsTable.materialId, Number(materialId)));
  if (fromDate) conditions.push(gte(inventoryTransactionsTable.txDatetime, new Date(String(fromDate))));
  if (toDate) {
    const end = new Date(String(toDate));
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(inventoryTransactionsTable.txDatetime, end));
  }

  const rowLimit = limit ? Number(limit) : 500;

  const query = db
    .select({
      id: inventoryTransactionsTable.id,
      txType: inventoryTransactionsTable.txType,
      materialId: inventoryTransactionsTable.materialId,
      fromLocationId: inventoryTransactionsTable.fromLocationId,
      toLocationId: inventoryTransactionsTable.toLocationId,
      quantity: inventoryTransactionsTable.quantity,
      txDatetime: inventoryTransactionsTable.txDatetime,
      reference: inventoryTransactionsTable.reference,
      userNote: inventoryTransactionsTable.userNote,
      material: {
        id: materialsTable.id,
        materialCode: materialsTable.materialCode,
        materialName: materialsTable.materialName,
        unit: materialsTable.unit,
      },
    })
    .from(inventoryTransactionsTable)
    .innerJoin(materialsTable, eq(inventoryTransactionsTable.materialId, materialsTable.id))
    .orderBy(desc(inventoryTransactionsTable.txDatetime))
    .limit(rowLimit);

  const rows = conditions.length > 0 ? await query.where(and(...conditions)) : await query;

  // Get location details separately
  const locationIds = new Set<number>();
  rows.forEach((r) => {
    if (r.fromLocationId) locationIds.add(r.fromLocationId);
    if (r.toLocationId) locationIds.add(r.toLocationId);
  });

  const allLocations = await db.select().from(locationsTable);
  const locationMap = new Map(allLocations.map((l) => [l.id, l]));

  const result = rows.map((r) => {
    // Filter by locationId if provided
    if (locationId) {
      const locId = Number(locationId);
      if (r.fromLocationId !== locId && r.toLocationId !== locId) return null;
    }
    return {
      ...r,
      quantity: parseFloat(r.quantity),
      fromLocation: r.fromLocationId ? locationMap.get(r.fromLocationId) || null : null,
      toLocation: r.toLocationId ? locationMap.get(r.toLocationId) || null : null,
    };
  }).filter(Boolean);

  res.json(result);
});

export default router;
