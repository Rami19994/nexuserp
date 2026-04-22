import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, manufacturingPlansTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Generate unique document number: MFP-YYYYMMDD-XXXX
async function generateDocNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `MFP-${dateStr}-`;

  // Find highest sequence for today
  const existing = await db
    .select({ docNumber: manufacturingPlansTable.docNumber })
    .from(manufacturingPlansTable);

  const todayDocs = existing
    .map(r => r.docNumber)
    .filter(d => d.startsWith(prefix));

  let seq = 1;
  if (todayDocs.length > 0) {
    const maxSeq = Math.max(
      ...todayDocs.map(d => parseInt(d.split("-").pop() || "0", 10))
    );
    seq = maxSeq + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

// GET /api/manufacturing-plans — List all saved plans
router.get("/manufacturing-plans", requireAuth, async (req, res): Promise<void> => {
  const plans = await db
    .select({
      id: manufacturingPlansTable.id,
      docNumber: manufacturingPlansTable.docNumber,
      productCode: manufacturingPlansTable.productCode,
      productName: manufacturingPlansTable.productName,
      targetQty: manufacturingPlansTable.targetQty,
      locationLabel: manufacturingPlansTable.locationLabel,
      status: manufacturingPlansTable.status,
      createdAt: manufacturingPlansTable.createdAt,
      approvedAt: manufacturingPlansTable.approvedAt,
      notes: manufacturingPlansTable.notes,
      items: manufacturingPlansTable.items,
      createdBy: {
        id: usersTable.id,
        username: usersTable.username,
        fullName: usersTable.fullName,
      },
    })
    .from(manufacturingPlansTable)
    .leftJoin(usersTable, eq(manufacturingPlansTable.createdById, usersTable.id))
    .orderBy(desc(manufacturingPlansTable.createdAt));

  res.json(plans);
});

// GET /api/manufacturing-plans/:id — Get one plan
router.get("/manufacturing-plans/:id", requireAuth, async (req, res): Promise<void> => {
  const { id } = req.params;

  const [plan] = await db
    .select()
    .from(manufacturingPlansTable)
    .where(eq(manufacturingPlansTable.id, parseInt(String(id))));

  if (!plan) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  res.json(plan);
});

// POST /api/manufacturing-plans — Save a plan (draft)
router.post("/manufacturing-plans", requireAuth, async (req, res): Promise<void> => {
  const { productCode, productName, targetQty, locationId, locationLabel, items, notes } = req.body;

  if (!productCode || !targetQty || !items) {
    res.status(400).json({ error: "productCode, targetQty, and items are required" });
    return;
  }

  const session = req.session as any;
  const userId = session?.userId || null;

  const docNumber = await generateDocNumber();

  const [plan] = await db
    .insert(manufacturingPlansTable)
    .values({
      docNumber,
      productCode,
      productName: productName || null,
      targetQty: String(targetQty),
      locationId: locationId || null,
      locationLabel: locationLabel || "All Locations",
      status: "draft",
      items,
      createdById: userId,
      notes: notes || null,
    })
    .returning();

  res.status(201).json(plan);
});

// POST /api/manufacturing-plans/:id/approve — Approve a plan
router.post("/manufacturing-plans/:id/approve", requireAuth, async (req, res): Promise<void> => {
  const { id } = req.params;
  const { notes } = req.body;

  const session = req.session as any;
  const userId = session?.userId || null;

  const [existing] = await db
    .select()
    .from(manufacturingPlansTable)
    .where(eq(manufacturingPlansTable.id, parseInt(String(id))));

  if (!existing) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  if (existing.status === "approved") {
    res.status(400).json({ error: "Plan is already approved" });
    return;
  }

  const [updated] = await db
    .update(manufacturingPlansTable)
    .set({
      status: "approved",
      approvedById: userId,
      approvedAt: new Date(),
      notes: notes || existing.notes,
    })
    .where(eq(manufacturingPlansTable.id, parseInt(String(id))))
    .returning();

  res.json(updated);
});

// DELETE /api/manufacturing-plans/:id — Delete a draft plan
router.delete("/manufacturing-plans/:id", requireAuth, async (req, res): Promise<void> => {
  const { id } = req.params;

  const [existing] = await db
    .select()
    .from(manufacturingPlansTable)
    .where(eq(manufacturingPlansTable.id, parseInt(String(id))));

  if (!existing) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }

  if (existing.status === "approved") {
    res.status(400).json({ error: "Cannot delete an approved plan" });
    return;
  }

  await db
    .delete(manufacturingPlansTable)
    .where(eq(manufacturingPlansTable.id, parseInt(String(id))));

  res.json({ message: "Plan deleted" });
});

export default router;
