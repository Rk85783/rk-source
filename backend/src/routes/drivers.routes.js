import { Router } from "express";
import {
  createMyProfile,
  getMyProfile,
  updateMyProfile,
} from "../controllers/driver.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/me", getMyProfile);
router.post("/me", createMyProfile);
router.patch("/me", updateMyProfile);

export default router;
