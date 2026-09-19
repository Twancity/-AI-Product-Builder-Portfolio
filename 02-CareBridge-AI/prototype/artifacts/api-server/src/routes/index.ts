import { Router, type IRouter } from "express";
import healthRouter from "./health";
import carebridgeRouter from "./carebridge";

const router: IRouter = Router();

router.use(healthRouter);
router.use(carebridgeRouter);

export default router;
