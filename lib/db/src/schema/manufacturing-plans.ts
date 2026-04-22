import { pgTable, serial, integer, numeric, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const manufacturingPlansTable = pgTable("manufacturing_plans", {
  id: serial("id").primaryKey(),
  docNumber: text("doc_number").notNull().unique(),
  productCode: text("product_code").notNull(),
  productName: text("product_name"),
  targetQty: numeric("target_qty", { precision: 18, scale: 6 }).notNull(),
  locationId: integer("location_id"),
  locationLabel: text("location_label"),
  status: text("status").notNull().default("draft"), // draft | approved
  items: jsonb("items").notNull(), // BOM explosion snapshot
  createdById: integer("created_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  approvedById: integer("approved_by_id").references(() => usersTable.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  notes: text("notes"),
});

export type ManufacturingPlan = typeof manufacturingPlansTable.$inferSelect;
