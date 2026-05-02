import { Router, type IRouter } from "express";
import healthRouter from "./health";
import recordsRouter from "./records";
import retractRouter from "./retract";

const router: IRouter = Router();

router.use(healthRouter);
router.use(recordsRouter);
router.use(retractRouter);

export default router;
