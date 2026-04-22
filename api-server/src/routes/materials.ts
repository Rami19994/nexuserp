import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, materialsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/materials", requireAuth, async (_req, res): Promise<void> => {
  const materials = await db.select().from(materialsTable).orderBy(materialsTable.materialCode);
  res.json(materials);
});

router.post("/materials", requireAuth, async (req, res): Promise<void> => {
  const { materialCode, materialName, unit } = req.body;
  if (!materialCode || !materialName) {
    res.status(400).json({ error: "materialCode and materialName are required" });
    return;
  }

  const [material] = await db
    .insert(materialsTable)
    .values({ materialCode, materialName, unit: unit || null })
    .onConflictDoNothing()
    .returning();

  if (!material) {
    res.status(400).json({ error: `Material code '${materialCode}' already exists` });
    return;
  }

  res.status(201).json(material);
});

router.patch("/materials/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const { materialName, unit } = req.body;
  const updates: Record<string, unknown> = {};
  if (materialName !== undefined) updates.materialName = materialName;
  if (unit !== undefined) updates.unit = unit;

  const [material] = await db
    .update(materialsTable)
    .set(updates)
    .where(eq(materialsTable.id, id))
    .returning();

  if (!material) {
    res.status(404).json({ error: "Material not found" });
    return;
  }
  res.json(material);
});

router.delete("/materials/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(materialsTable).where(eq(materialsTable.id, id));
  res.sendStatus(204);
});

export default router;
