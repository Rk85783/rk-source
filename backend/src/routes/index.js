import { Router } from "express";
import { root } from "../controllers/health.controller.js";
import healthRoutes from "./health.routes.js";

const router = Router();

router.get("/", root);
router.use(healthRoutes);

export default router;
