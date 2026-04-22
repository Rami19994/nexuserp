import { pgTable, text, serial, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { materialsTable } from "./materials";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  productCode: text("product_code").notNull().unique(),
  productName: text("product_name"),
});

export const bomItemsTable = pgTable("bom_items", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  materialId: integer("material_id").notNull().references(() => materialsTable.id, { onDelete: "cascade" }),
  qtyPerUnit: numeric("qty_per_unit", { precision: 18, scale: 6 }).notNull(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true });
export const insertBomItemSchema = createInsertSchema(bomItemsTable).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertBomItem = z.infer<typeof insertBomItemSchema>;
export type Product = typeof productsTable.$inferSelect;
export type BomItem = typeof bomItemsTable.$inferSelect;
