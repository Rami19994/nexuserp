import { Router, type IRouter } from "express";
import { eq, and, gte, lte, isNull, or } from "drizzle-orm";
import { db, materialsTable, locationsTable, inventoryBalancesTable, inventoryTransactionsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Stock In
router.post("/inventory/stock-in", requireAuth, async (req, res): Promise<void> => {
  const { materialCode, materialName, quantity, locationId, unit, reference, userNote } = req.body;

  if (!materialCode || !materialName) {
    res.status(400).json({ error: "materialCode and materialName are required" });
    return;
  }
  if (!quantity || Number(quantity) <= 0) {
    res.status(400).json({ error: "quantity must be greater than 0" });
    return;
  }
  if (!locationId) {
    res.status(400).json({ error: "locationId is required" });
    return;
  }

  const qty = Number(quantity);

  // Upsert material
  let [material] = await db.select().from(materialsTable).where(eq(materialsTable.materialCode, materialCode));
  if (!material) {
    [material] = await db
      .insert(materialsTable)
      .values({ materialCode, materialName, unit: unit || null })
      .returning();
  }

  // Upsert inventory balance
  const [existing] = await db
    .select()
    .from(inventoryBalancesTable)
    .where(
      and(
        eq(inventoryBalancesTable.materialId, material.id),
        eq(inventoryBalancesTable.locationId, Number(locationId))
      )
    );

  let balance;
  if (existing) {
    const newQty = parseFloat(existing.quantity) + qty;
    [balance] = await db
      .update(inventoryBalancesTable)
      .set({ quantity: String(newQty) })
      .where(eq(inventoryBalancesTable.id, existing.id))
      .returning();
  } else {
    [balance] = await db
      .insert(inventoryBalancesTable)
      .values({ materialId: material.id, locationId: Number(locationId), quantity: String(qty) })
      .returning();
  }

  // Record transaction
  await db.insert(inventoryTransactionsTable).values({
    txType: "IN",
    materialId: material.id,
    toLocationId: Number(locationId),
    quantity: String(qty),
    reference: reference || null,
    userNote: userNote || null,
  });

  res.json({
    id: balance!.id,
    materialId: balance!.materialId,
    locationId: balance!.locationId,
    quantity: parseFloat(balance!.quantity),
  });
});

// Bulk Stock In
router.post("/inventory/stock-in/bulk", requireAuth, async (req, res): Promise<void> => {
  const { items, locationId, reference } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "items array is required and must not be empty" });
    return;
  }
  if (!locationId) {
    res.status(400).json({ error: "locationId is required" });
    return;
  }

  const results: { materialCode: string; materialName: string; quantity: number; status: string; error?: string }[] = [];

  for (const item of items) {
    const { materialCode, materialName, quantity, unit } = item;
    if (!materialCode || !materialName || !quantity || Number(quantity) <= 0) {
      results.push({ materialCode: materialCode || "", materialName: materialName || "", quantity: Number(quantity) || 0, status: "error", error: "Invalid data" });
      continue;
    }

    try {
      const qty = Number(quantity);

      // Upsert material
      let [material] = await db.select().from(materialsTable).where(eq(materialsTable.materialCode, materialCode));
      if (!material) {
        [material] = await db
          .insert(materialsTable)
          .values({ materialCode, materialName, unit: unit || null })
          .returning();
      }

      // Upsert inventory balance
      const [existing] = await db
        .select()
        .from(inventoryBalancesTable)
        .where(
          and(
            eq(inventoryBalancesTable.materialId, material.id),
            eq(inventoryBalancesTable.locationId, Number(locationId))
          )
        );

      if (existing) {
        const newQty = parseFloat(existing.quantity) + qty;
        await db
          .update(inventoryBalancesTable)
          .set({ quantity: String(newQty) })
          .where(eq(inventoryBalancesTable.id, existing.id));
      } else {
        await db
          .insert(inventoryBalancesTable)
          .values({ materialId: material.id, locationId: Number(locationId), quantity: String(qty) });
      }

      // Record transaction
      await db.insert(inventoryTransactionsTable).values({
        txType: "IN",
        materialId: material.id,
        toLocationId: Number(locationId),
        quantity: String(qty),
        reference: reference || null,
        userNote: "Bulk import from Excel",
      });

      results.push({ materialCode, materialName, quantity: qty, status: "success" });
    } catch (err: any) {
      results.push({ materialCode, materialName, quantity: Number(quantity), status: "error", error: err.message });
    }
  }

  const successCount = results.filter(r => r.status === "success").length;
  const errorCount = results.filter(r => r.status === "error").length;

  res.json({ results, successCount, errorCount });
});

// List inventory balances
router.get("/inventory/balances", requireAuth, async (req, res): Promise<void> => {
  const { locationId, materialId } = req.query;

  const conditions = [];
  if (locationId) conditions.push(eq(inventoryBalancesTable.locationId, Number(locationId)));
  if (materialId) conditions.push(eq(inventoryBalancesTable.materialId, Number(materialId)));

  const query = db
    .select({
      id: inventoryBalancesTable.id,
      materialId: inventoryBalancesTable.materialId,
      locationId: inventoryBalancesTable.locationId,
      quantity: inventoryBalancesTable.quantity,
      material: {
        id: materialsTable.id,
        materialCode: materialsTable.materialCode,
        materialName: materialsTable.materialName,
        unit: materialsTable.unit,
      },
      location: {
        id: locationsTable.id,
        locationName: locationsTable.locationName,
      },
    })
    .from(inventoryBalancesTable)
    .innerJoin(materialsTable, eq(inventoryBalancesTable.materialId, materialsTable.id))
    .innerJoin(locationsTable, eq(inventoryBalancesTable.locationId, locationsTable.id));

  const rows = conditions.length > 0 ? await query.where(and(...conditions)) : await query;

  res.json(
    rows.map((r) => ({
      ...r,
      quantity: parseFloat(r.quantity),
    }))
  );
});

// Transfer stock
router.post("/inventory/transfer", requireAuth, async (req, res): Promise<void> => {
  const { materialId, fromLocationId, toLocationId, quantity, reference, userNote } = req.body;

  if (!materialId || !fromLocationId || !toLocationId || !quantity) {
    res.status(400).json({ error: "materialId, fromLocationId, toLocationId, quantity are required" });
    return;
  }
  if (Number(fromLocationId) === Number(toLocationId)) {
    res.status(400).json({ error: "fromLocationId and toLocationId must be different" });
    return;
  }
  if (Number(quantity) <= 0) {
    res.status(400).json({ error: "quantity must be greater than 0" });
    return;
  }

  const qty = Number(quantity);

  // Check source balance
  const [sourceBalance] = await db
    .select()
    .from(inventoryBalancesTable)
    .where(
      and(
        eq(inventoryBalancesTable.materialId, Number(materialId)),
        eq(inventoryBalancesTable.locationId, Number(fromLocationId))
      )
    );

  if (!sourceBalance || parseFloat(sourceBalance.quantity) < qty) {
    const available = sourceBalance ? parseFloat(sourceBalance.quantity) : 0;
    res.status(400).json({ error: `Insufficient stock. Available: ${available}, Requested: ${qty}` });
    return;
  }

  // Deduct from source
  const newSourceQty = parseFloat(sourceBalance.quantity) - qty;
  const [updatedSource] = await db
    .update(inventoryBalancesTable)
    .set({ quantity: String(newSourceQty) })
    .where(eq(inventoryBalancesTable.id, sourceBalance.id))
    .returning();

  // Add to destination
  const [existingDest] = await db
    .select()
    .from(inventoryBalancesTable)
    .where(
      and(
        eq(inventoryBalancesTable.materialId, Number(materialId)),
        eq(inventoryBalancesTable.locationId, Number(toLocationId))
      )
    );

  let updatedDest;
  if (existingDest) {
    const newDestQty = parseFloat(existingDest.quantity) + qty;
    [updatedDest] = await db
      .update(inventoryBalancesTable)
      .set({ quantity: String(newDestQty) })
      .where(eq(inventoryBalancesTable.id, existingDest.id))
      .returning();
  } else {
    [updatedDest] = await db
      .insert(inventoryBalancesTable)
      .values({ materialId: Number(materialId), locationId: Number(toLocationId), quantity: String(qty) })
      .returning();
  }

  // Record transaction
  await db.insert(inventoryTransactionsTable).values({
    txType: "TRANSFER",
    materialId: Number(materialId),
    fromLocationId: Number(fromLocationId),
    toLocationId: Number(toLocationId),
    quantity: String(qty),
    reference: reference || null,
    userNote: userNote || null,
  });

  res.json({
    success: true,
    message: `Successfully transferred ${qty} units`,
    fromBalance: {
      id: updatedSource!.id,
      materialId: updatedSource!.materialId,
      locationId: updatedSource!.locationId,
      quantity: parseFloat(updatedSource!.quantity),
    },
    toBalance: {
      id: updatedDest!.id,
      materialId: updatedDest!.materialId,
      locationId: updatedDest!.locationId,
      quantity: parseFloat(updatedDest!.quantity),
    },
  });
});

// Adjust inventory (stock count)
router.post("/inventory/adjust", requireAuth, async (req, res): Promise<void> => {
  const { materialId, locationId, actualQty, userNote } = req.body;

  if (materialId === undefined || locationId === undefined || actualQty === undefined) {
    res.status(400).json({ error: "materialId, locationId, actualQty are required" });
    return;
  }
  if (Number(actualQty) < 0) {
    res.status(400).json({ error: "actualQty cannot be negative" });
    return;
  }

  const actual = Number(actualQty);

  // Get current balance
  const [existing] = await db
    .select()
    .from(inventoryBalancesTable)
    .where(
      and(
        eq(inventoryBalancesTable.materialId, Number(materialId)),
        eq(inventoryBalancesTable.locationId, Number(locationId))
      )
    );

  const systemQty = existing ? parseFloat(existing.quantity) : 0;
  const variance = actual - systemQty;

  let balance;
  if (existing) {
    [balance] = await db
      .update(inventoryBalancesTable)
      .set({ quantity: String(actual) })
      .where(eq(inventoryBalancesTable.id, existing.id))
      .returning();
  } else {
    [balance] = await db
      .insert(inventoryBalancesTable)
      .values({ materialId: Number(materialId), locationId: Number(locationId), quantity: String(actual) })
      .returning();
  }

  // Record ADJUST transaction
  if (variance !== 0) {
    await db.insert(inventoryTransactionsTable).values({
      txType: "ADJUST",
      materialId: Number(materialId),
      toLocationId: Number(locationId),
      quantity: String(Math.abs(variance)),
      userNote: userNote ? `Variance: ${variance > 0 ? "+" : ""}${variance}. ${userNote}` : `Variance: ${variance > 0 ? "+" : ""}${variance}`,
    });
  }

  res.json({
    id: balance!.id,
    materialId: balance!.materialId,
    locationId: balance!.locationId,
    quantity: parseFloat(balance!.quantity),
  });
});

export default router;
