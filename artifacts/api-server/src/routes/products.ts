import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, productsTable, bomItemsTable, materialsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/products", requireAuth, async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(productsTable.productCode);
  res.json(products);
});

router.post("/products", requireAuth, async (req, res): Promise<void> => {
  const { productCode, productName } = req.body;
  if (!productCode) {
    res.status(400).json({ error: "productCode is required" });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({ productCode, productName: productName || null })
    .onConflictDoNothing()
    .returning();

  if (!product) {
    res.status(400).json({ error: `Product code '${productCode}' already exists` });
    return;
  }

  res.status(201).json(product);
});

router.get("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const bomRows = await db
    .select({
      id: bomItemsTable.id,
      productId: bomItemsTable.productId,
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
    .where(eq(bomItemsTable.productId, id));

  res.json({
    ...product,
    bomItems: bomRows.map((r) => ({
      ...r,
      qtyPerUnit: parseFloat(r.qtyPerUnit),
    })),
  });
});

router.delete("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.sendStatus(204);
});

router.post("/products/:id/bom", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const productId = parseInt(raw, 10);

  const { materialId, qtyPerUnit } = req.body;
  if (!materialId || !qtyPerUnit) {
    res.status(400).json({ error: "materialId and qtyPerUnit are required" });
    return;
  }
  if (qtyPerUnit <= 0) {
    res.status(400).json({ error: "qtyPerUnit must be greater than 0" });
    return;
  }

  const [bom] = await db
    .insert(bomItemsTable)
    .values({ productId, materialId, qtyPerUnit: String(qtyPerUnit) })
    .returning();

  const [material] = await db.select().from(materialsTable).where(eq(materialsTable.id, materialId));

  res.status(201).json({
    ...bom,
    qtyPerUnit: parseFloat(bom.qtyPerUnit),
    material,
  });
});

router.delete("/products/:id/bom/:bomId", requireAuth, async (req, res): Promise<void> => {
  const rawBomId = Array.isArray(req.params.bomId) ? req.params.bomId[0] : req.params.bomId;
  const bomId = parseInt(rawBomId, 10);
  const rawProdId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const productId = parseInt(rawProdId, 10);

  await db.delete(bomItemsTable).where(and(eq(bomItemsTable.id, bomId), eq(bomItemsTable.productId, productId)));
  res.sendStatus(204);
});

export default router;
