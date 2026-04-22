import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, productsTable, bomItemsTable, materialsTable, inventoryBalancesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/manufacturing/plan", requireAuth, async (req, res): Promise<void> => {
  const { productCode, targetQty, locationId } = req.body;

  if (!productCode) {
    res.status(400).json({ error: "productCode is required" });
    return;
  }
  if (!targetQty || Number(targetQty) <= 0) {
    res.status(400).json({ error: "targetQty must be greater than 0" });
    return;
  }

  const qty = Number(targetQty);

  const [product] = await db.select().from(productsTable).where(eq(productsTable.productCode, productCode));
  if (!product) {
    res.status(400).json({ error: `Product code '${productCode}' not found` });
    return;
  }

  const bomRows = await db
    .select({
      id: bomItemsTable.id,
      materialId: bomItemsTable.materialId,
      qtyPerUnit: bomItemsTable.qtyPerUnit,
      material: {
        id: materialsTable.id,
        materialCode: materialsTable.materialCode,
        materialName: materialsTable.materialName,
        unit: materialsTable.unit,
      },
    })
    .from(bomItemsTable)
    .innerJoin(materialsTable, eq(bomItemsTable.materialId, materialsTable.id))
    .where(eq(bomItemsTable.productId, product.id));

  if (bomRows.length === 0) {
    res.status(400).json({ error: `No BOM defined for product '${productCode}'` });
    return;
  }

  const items = await Promise.all(
    bomRows.map(async (row) => {
      const qtyPerUnit = parseFloat(row.qtyPerUnit);
      const requiredQty = qtyPerUnit * qty;

      let availableQty = 0;
      if (locationId) {
        const [balance] = await db
          .select()
          .from(inventoryBalancesTable)
          .where(
            eq(inventoryBalancesTable.materialId, row.materialId)
          );
        // Filter by location if provided
        const balances = await db
          .select()
          .from(inventoryBalancesTable)
          .where(eq(inventoryBalancesTable.materialId, row.materialId));
        const locationBalance = balances.find((b) => b.locationId === Number(locationId));
        availableQty = locationBalance ? parseFloat(locationBalance.quantity) : 0;
      } else {
        // Sum across all locations
        const balances = await db
          .select()
          .from(inventoryBalancesTable)
          .where(eq(inventoryBalancesTable.materialId, row.materialId));
        availableQty = balances.reduce((sum, b) => sum + parseFloat(b.quantity), 0);
      }

      const shortageQty = Math.max(0, requiredQty - availableQty);

      return {
        materialId: row.material.id,
        materialCode: row.material.materialCode,
        materialName: row.material.materialName,
        unit: row.material.unit,
        qtyPerUnit,
        requiredQty,
        availableQty,
        shortageQty,
      };
    })
  );

  res.json({
    productCode: product.productCode,
    productName: product.productName,
    targetQty: qty,
    totalMaterials: items.length,
    items,
  });
});

export default router;
