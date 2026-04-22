import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import materialsRouter from "./materials";
import locationsRouter from "./locations";
import productsRouter from "./products";
import manufacturingRouter from "./manufacturing";
import manufacturingPlansRouter from "./manufacturing-plans";
import productionRouter from "./production";
import inventoryRouter from "./inventory";
import transactionsRouter from "./transactions";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(materialsRouter);
router.use(locationsRouter);
router.use(productsRouter);
router.use(manufacturingRouter);
router.use(manufacturingPlansRouter);
router.use(productionRouter);
router.use(inventoryRouter);
router.use(transactionsRouter);
router.use(dashboardRouter);

export default router;
