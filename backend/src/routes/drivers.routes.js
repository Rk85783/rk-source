import { Router } from "express";
import {
  createMyProfile,
  details,
  getMyProfile,
  list,
  updateMyProfile,
} from "../controllers/driver.controller.js";
import { PERMISSIONS } from "../config/permissions.js";
import {
  requireAuth,
  requirePermission,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission(PERMISSIONS.DRIVER_LIST), list);
router.get("/:userId", requirePermission(PERMISSIONS.DRIVER_READ), details);

router.get("/me", getMyProfile);
router.post("/me", createMyProfile);
router.patch("/me", updateMyProfile);

export default router;
