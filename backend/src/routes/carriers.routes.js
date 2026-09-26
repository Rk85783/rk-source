import { Router } from "express";
import { PERMISSIONS } from "../config/permissions.js";
import {
  addDriver,
  createMyProfile,
  details,
  getMyProfile,
  list,
  updateMyProfile,
} from "../controllers/carrier.controller.js";
import {
  authorize,
  requireAuth,
  requirePermission,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission(PERMISSIONS.CARRIER_LIST), list);
router.get("/:userId", requirePermission(PERMISSIONS.CARRIER_READ), details);

router.post("/drivers", authorize("carrier"), addDriver);

router.get("/me", getMyProfile);
router.post("/me", createMyProfile);
router.patch("/me", updateMyProfile);

export default router;
