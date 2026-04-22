import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!user || !user.isActive) {
    res.status(401).json({ error: "Invalid credentials or inactive account" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const permissions = getRolePermissions(user.role);

  (req.session as any).userId = user.id;

  res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    permissions,
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || !user.isActive) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const permissions = getRolePermissions(user.role);

  res.json({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    permissions,
  });
});

export function getRolePermissions(role: string): string[] {
  const allPerms = [
    "view_manufacturing_plan",
    "add_inventory",
    "transfer_stock",
    "adjust_inventory",
    "view_reports",
    "manage_users",
    "manage_permissions",
    "view_all_locations",
  ];
  switch (role) {
    case "admin":
      return allPerms;
    case "manager":
      return [
        "view_manufacturing_plan",
        "add_inventory",
        "transfer_stock",
        "adjust_inventory",
        "view_reports",
        "view_all_locations",
      ];
    case "storekeeper":
      return ["add_inventory", "transfer_stock", "adjust_inventory", "view_all_locations"];
    case "viewer":
      return ["view_reports", "view_all_locations"];
    default:
      return [];
  }
}

export default router;
