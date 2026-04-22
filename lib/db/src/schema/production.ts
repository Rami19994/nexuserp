import { pgTable, serial, text, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const productionLinesTable = pgTable("production_lines", {
  id: serial("id").primaryKey(),
  lineCode: text("line_code").notNull().unique(),
  lineName: text("line_name").notNull(),
  lineType: text("line_type").notNull(), // assembly | packaging | other
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Full lifecycle production job
// Status flow: draft → issued → assembled → packaging → packaged → dispatched
export const productionJobsTable = pgTable("production_jobs", {
  id: serial("id").primaryKey(),
  docNumber: text("doc_number").notNull().unique(),

  // Product
  productCode: text("product_code").notNull(),
  productName: text("product_name"),
  plannedQty: numeric("planned_qty", { precision: 18, scale: 6 }).notNull(),

  // Lines
  assemblyLineId: integer("assembly_line_id").references(() => productionLinesTable.id),
  packagingLineId: integer("packaging_line_id").references(() => productionLinesTable.id),

  // Status
  status: text("status").notNull().default("draft"),
  // draft | issued | assembled | packaging | packaged | dispatched

  // Stage 1: Issue to Assembly Line
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  issuedById: integer("issued_by_id").references(() => usersTable.id),
  issuedNotes: text("issued_notes"),

  // Stage 2: Receive from Assembly
  assembledQty: numeric("assembled_qty", { precision: 18, scale: 6 }),
  assembledAt: timestamp("assembled_at", { withTimezone: true }),
  assembledById: integer("assembled_by_id").references(() => usersTable.id),
  assemblyNotes: text("assembly_notes"),

  // Stage 3: Send to Packaging
  packagingSentAt: timestamp("packaging_sent_at", { withTimezone: true }),
  packagingSentById: integer("packaging_sent_by_id").references(() => usersTable.id),
  packagingSentNotes: text("packaging_sent_notes"),

  // Stage 4: Receive from Packaging
  packagedQty: numeric("packaged_qty", { precision: 18, scale: 6 }),
  packagedAt: timestamp("packaged_at", { withTimezone: true }),
  packagedById: integer("packaged_by_id").references(() => usersTable.id),
  packagingNotes: text("packaging_notes"),

  // Stage 5: Dispatch to Market
  dispatchedQty: numeric("dispatched_qty", { precision: 18, scale: 6 }),
  dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
  dispatchedById: integer("dispatched_by_id").references(() => usersTable.id),
  customer: text("customer"),
  dispatchNotes: text("dispatch_notes"),

  // Meta
  createdById: integer("created_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  notes: text("notes"),
});

export type ProductionLine = typeof productionLinesTable.$inferSelect;
export type ProductionJob = typeof productionJobsTable.$inferSelect;
