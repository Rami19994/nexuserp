import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, productionLinesTable, productionJobsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// ── Doc number generator ──────────────────────────────────────────────
async function genDocNumber(prefix: string): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const full = `${prefix}-${dateStr}-`;
  const all = await db.select({ d: productionJobsTable.docNumber }).from(productionJobsTable);
  const todayDocs = all.map(r => r.d).filter(d => d.startsWith(full));
  const seq = todayDocs.length
    ? Math.max(...todayDocs.map(d => parseInt(d.split("-").pop() || "0", 10))) + 1
    : 1;
  return `${full}${String(seq).padStart(4, "0")}`;
}

// ── Production Lines ──────────────────────────────────────────────────

router.get("/production-lines", requireAuth, async (req, res): Promise<void> => {
  const lines = await db.select().from(productionLinesTable).orderBy(productionLinesTable.lineCode);
  res.json(lines);
});

router.post("/production-lines", requireAuth, async (req, res): Promise<void> => {
  const { lineCode, lineName, lineType } = req.body;
  if (!lineCode || !lineName || !lineType) {
    res.status(400).json({ error: "lineCode, lineName, lineType are required" });
    return;
  }
  const [line] = await db.insert(productionLinesTable).values({ lineCode, lineName, lineType }).returning();
  res.status(201).json(line);
});

router.put("/production-lines/:id", requireAuth, async (req, res): Promise<void> => {
  const { lineName, lineType, isActive } = req.body;
  const [line] = await db
    .update(productionLinesTable)
    .set({ lineName, lineType, ...(isActive !== undefined && { isActive }) })
    .where(eq(productionLinesTable.id, parseInt(String(req.params.id))))
    .returning();
  if (!line) { res.status(404).json({ error: "Line not found" }); return; }
  res.json(line);
});

router.delete("/production-lines/:id", requireAuth, async (req, res): Promise<void> => {
  await db.delete(productionLinesTable).where(eq(productionLinesTable.id, parseInt(String(req.params.id))));
  res.json({ message: "Deleted" });
});

// ── Production Jobs ───────────────────────────────────────────────────

// List jobs
router.get("/production-jobs", requireAuth, async (req, res): Promise<void> => {
  const jobs = await db
    .select({
      id: productionJobsTable.id,
      docNumber: productionJobsTable.docNumber,
      productCode: productionJobsTable.productCode,
      productName: productionJobsTable.productName,
      plannedQty: productionJobsTable.plannedQty,
      status: productionJobsTable.status,
      createdAt: productionJobsTable.createdAt,
      assembledQty: productionJobsTable.assembledQty,
      packagedQty: productionJobsTable.packagedQty,
      dispatchedQty: productionJobsTable.dispatchedQty,
      issuedAt: productionJobsTable.issuedAt,
      assembledAt: productionJobsTable.assembledAt,
      packagingSentAt: productionJobsTable.packagingSentAt,
      packagedAt: productionJobsTable.packagedAt,
      dispatchedAt: productionJobsTable.dispatchedAt,
      customer: productionJobsTable.customer,
      notes: productionJobsTable.notes,
      issuedNotes: productionJobsTable.issuedNotes,
      assemblyNotes: productionJobsTable.assemblyNotes,
      packagingSentNotes: productionJobsTable.packagingSentNotes,
      packagingNotes: productionJobsTable.packagingNotes,
      dispatchNotes: productionJobsTable.dispatchNotes,
      assemblyLineId: productionJobsTable.assemblyLineId,
      packagingLineId: productionJobsTable.packagingLineId,
    })
    .from(productionJobsTable)
    .orderBy(desc(productionJobsTable.createdAt));

  // Attach line info
  const lines = await db.select().from(productionLinesTable);
  const withLines = jobs.map(j => ({
    ...j,
    assemblyLine: lines.find(l => l.id === j.assemblyLineId) || null,
    packagingLine: lines.find(l => l.id === j.packagingLineId) || null,
  }));

  res.json(withLines);
});

// Get one job
router.get("/production-jobs/:id", requireAuth, async (req, res): Promise<void> => {
  const [job] = await db
    .select()
    .from(productionJobsTable)
    .where(eq(productionJobsTable.id, parseInt(String(req.params.id))));
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  const lines = await db.select().from(productionLinesTable);
  res.json({
    ...job,
    assemblyLine: lines.find(l => l.id === job.assemblyLineId) || null,
    packagingLine: lines.find(l => l.id === job.packagingLineId) || null,
  });
});

// Create job (draft)
router.post("/production-jobs", requireAuth, async (req, res): Promise<void> => {
  const { productCode, productName, plannedQty, assemblyLineId, packagingLineId, notes } = req.body;
  if (!productCode || !plannedQty || !assemblyLineId) {
    res.status(400).json({ error: "productCode, plannedQty, assemblyLineId are required" });
    return;
  }
  const session = req.session as any;
  const docNumber = await genDocNumber("WO");
  const [job] = await db.insert(productionJobsTable).values({
    docNumber,
    productCode,
    productName: productName || null,
    plannedQty: String(plannedQty),
    assemblyLineId: parseInt(String(assemblyLineId)),
    packagingLineId: packagingLineId ? parseInt(String(packagingLineId)) : null,
    status: "draft",
    createdById: session?.userId || null,
    notes: notes || null,
  }).returning();
  res.status(201).json(job);
});

// Stage 1: Issue to Assembly Line
router.post("/production-jobs/:id/issue", requireAuth, async (req, res): Promise<void> => {
  const { notes } = req.body;
  const session = req.session as any;
  const [existing] = await db.select().from(productionJobsTable)
    .where(eq(productionJobsTable.id, parseInt(String(req.params.id))));
  if (!existing) { res.status(404).json({ error: "Job not found" }); return; }
  if (existing.status !== "draft") { res.status(400).json({ error: "Job must be in draft status to issue" }); return; }
  const [job] = await db.update(productionJobsTable).set({
    status: "issued",
    issuedAt: new Date(),
    issuedById: session?.userId || null,
    issuedNotes: notes || null,
  }).where(eq(productionJobsTable.id, existing.id)).returning();
  res.json(job);
});

// Stage 2: Receive from Assembly
router.post("/production-jobs/:id/receive-assembly", requireAuth, async (req, res): Promise<void> => {
  const { assembledQty, notes } = req.body;
  const session = req.session as any;
  const [existing] = await db.select().from(productionJobsTable)
    .where(eq(productionJobsTable.id, parseInt(String(req.params.id))));
  if (!existing) { res.status(404).json({ error: "Job not found" }); return; }
  if (existing.status !== "issued") { res.status(400).json({ error: "Job must be issued before receiving from assembly" }); return; }
  if (!assembledQty || Number(assembledQty) <= 0) { res.status(400).json({ error: "assembledQty is required and must be > 0" }); return; }
  const [job] = await db.update(productionJobsTable).set({
    status: "assembled",
    assembledQty: String(assembledQty),
    assembledAt: new Date(),
    assembledById: session?.userId || null,
    assemblyNotes: notes || null,
  }).where(eq(productionJobsTable.id, existing.id)).returning();
  res.json(job);
});

// Stage 3: Send to Packaging Line
router.post("/production-jobs/:id/send-packaging", requireAuth, async (req, res): Promise<void> => {
  const { packagingLineId, notes } = req.body;
  const session = req.session as any;
  const [existing] = await db.select().from(productionJobsTable)
    .where(eq(productionJobsTable.id, parseInt(String(req.params.id))));
  if (!existing) { res.status(404).json({ error: "Job not found" }); return; }
  if (existing.status !== "assembled") { res.status(400).json({ error: "Job must be assembled before sending to packaging" }); return; }
  const [job] = await db.update(productionJobsTable).set({
    status: "packaging",
    packagingLineId: packagingLineId ? parseInt(String(packagingLineId)) : existing.packagingLineId,
    packagingSentAt: new Date(),
    packagingSentById: session?.userId || null,
    packagingSentNotes: notes || null,
  }).where(eq(productionJobsTable.id, existing.id)).returning();
  res.json(job);
});

// Stage 4: Receive from Packaging
router.post("/production-jobs/:id/receive-packaging", requireAuth, async (req, res): Promise<void> => {
  const { packagedQty, notes } = req.body;
  const session = req.session as any;
  const [existing] = await db.select().from(productionJobsTable)
    .where(eq(productionJobsTable.id, parseInt(String(req.params.id))));
  if (!existing) { res.status(404).json({ error: "Job not found" }); return; }
  if (existing.status !== "packaging") { res.status(400).json({ error: "Job must be in packaging before receiving" }); return; }
  if (!packagedQty || Number(packagedQty) <= 0) { res.status(400).json({ error: "packagedQty is required and must be > 0" }); return; }
  const [job] = await db.update(productionJobsTable).set({
    status: "packaged",
    packagedQty: String(packagedQty),
    packagedAt: new Date(),
    packagedById: session?.userId || null,
    packagingNotes: notes || null,
  }).where(eq(productionJobsTable.id, existing.id)).returning();
  res.json(job);
});

// Stage 5: Dispatch to Market
router.post("/production-jobs/:id/dispatch", requireAuth, async (req, res): Promise<void> => {
  const { dispatchedQty, customer, notes } = req.body;
  const session = req.session as any;
  const [existing] = await db.select().from(productionJobsTable)
    .where(eq(productionJobsTable.id, parseInt(String(req.params.id))));
  if (!existing) { res.status(404).json({ error: "Job not found" }); return; }
  if (existing.status !== "packaged") { res.status(400).json({ error: "Job must be packaged before dispatch" }); return; }
  if (!dispatchedQty || Number(dispatchedQty) <= 0) { res.status(400).json({ error: "dispatchedQty is required and must be > 0" }); return; }
  const [job] = await db.update(productionJobsTable).set({
    status: "dispatched",
    dispatchedQty: String(dispatchedQty),
    dispatchedAt: new Date(),
    dispatchedById: session?.userId || null,
    customer: customer || null,
    dispatchNotes: notes || null,
  }).where(eq(productionJobsTable.id, existing.id)).returning();
  res.json(job);
});

// Delete draft job
router.delete("/production-jobs/:id", requireAuth, async (req, res): Promise<void> => {
  const [existing] = await db.select().from(productionJobsTable)
    .where(eq(productionJobsTable.id, parseInt(String(req.params.id))));
  if (!existing) { res.status(404).json({ error: "Job not found" }); return; }
  if (existing.status !== "draft") { res.status(400).json({ error: "Only draft jobs can be deleted" }); return; }
  await db.delete(productionJobsTable).where(eq(productionJobsTable.id, existing.id));
  res.json({ message: "Deleted" });
});

export default router;
