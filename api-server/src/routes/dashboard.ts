import { Router, type IRouter } from "express";
import { db, materialsTable, productsTable, locationsTable, inventoryBalancesTable, inventoryTransactionsTable } from "@workspace/db";
import { sql, gte } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (_req, res): Promise<void> => {
  const [materialsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(materialsTable);
  const [productsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(productsTable);
  const [locationsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(locationsTable);

  // Low stock: quantity < 10
  const balances = await db.select().from(inventoryBalancesTable);
  const lowStockItems = balances.filter((b) => parseFloat(b.quantity) < 10 && parseFloat(b.quantity) >= 0).length;

  // Recent transactions (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const [recentTxCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(inventoryTransactionsTable)
    .where(gte(inventoryTransactionsTable.txDatetime, weekAgo));

  res.json({
    totalMaterials: materialsCount?.count ?? 0,
    totalProducts: productsCount?.count ?? 0,
    totalLocations: locationsCount?.count ?? 0,
    lowStockItems,
    recentTransactions: recentTxCount?.count ?? 0,
    totalStockValue: 0,
  });
});

export default router;
