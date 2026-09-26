import { Router } from "express";
import { root } from "../controllers/health.controller.js";
import authRoutes from "./auth.routes.js";
import healthRoutes from "./health.routes.js";

const router = Router();

router.get("/", root);
router.use(healthRoutes);
router.use("/api/auth", authRoutes);

export default router;
