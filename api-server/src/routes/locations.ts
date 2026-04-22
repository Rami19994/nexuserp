import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, locationsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/locations", requireAuth, async (_req, res): Promise<void> => {
  const locations = await db.select().from(locationsTable).orderBy(locationsTable.locationName);
  res.json(locations);
});

router.post("/locations", requireAuth, async (req, res): Promise<void> => {
  const { locationName } = req.body;
  if (!locationName) {
    res.status(400).json({ error: "locationName is required" });
    return;
  }

  const [location] = await db
    .insert(locationsTable)
    .values({ locationName })
    .onConflictDoNothing()
    .returning();

  if (!location) {
    res.status(400).json({ error: `Location '${locationName}' already exists` });
    return;
  }

  res.status(201).json(location);
});

router.delete("/locations/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(locationsTable).where(eq(locationsTable.id, id));
  res.sendStatus(204);
});

export default router;
