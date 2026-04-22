import { pgTable, serial, integer, numeric, text, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { materialsTable } from "./materials";
import { locationsTable } from "./locations";

export const inventoryBalancesTable = pgTable("inventory_balances", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").notNull().references(() => materialsTable.id, { onDelete: "cascade" }),
  locationId: integer("location_id").notNull().references(() => locationsTable.id, { onDelete: "cascade" }),
  quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull().default("0"),
}, (t) => [
  unique().on(t.materialId, t.locationId),
]);

export const inventoryTransactionsTable = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  txType: text("tx_type").notNull(), // IN, OUT, TRANSFER, ADJUST
  materialId: integer("material_id").notNull().references(() => materialsTable.id),
  fromLocationId: integer("from_location_id").references(() => locationsTable.id),
  toLocationId: integer("to_location_id").references(() => locationsTable.id),
  quantity: numeric("quantity", { precision: 18, scale: 6 }).notNull(),
  txDatetime: timestamp("tx_datetime", { withTimezone: true }).notNull().defaultNow(),
  reference: text("reference"),
  userNote: text("user_note"),
});

export const insertInventoryBalanceSchema = createInsertSchema(inventoryBalancesTable).omit({ id: true });
export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactionsTable).omit({ id: true });
export type InsertInventoryBalance = z.infer<typeof insertInventoryBalanceSchema>;
export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;
export type InventoryBalance = typeof inventoryBalancesTable.$inferSelect;
export type InventoryTransaction = typeof inventoryTransactionsTable.$inferSelect;
