import { Router } from "express";
import { PERMISSIONS } from "../config/permissions.js";
import {
  createMyProfile,
  details,
  getMyProfile,
  list,
  updateMyProfile,
} from "../controllers/shipper.controller.js";
import {
  requireAuth,
  requirePermission,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createProfileSchema,
  profileQuerySchema,
  updateProfileSchema,
} from "../validations/profile.validation.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  requirePermission(PERMISSIONS.SHIPPER_LIST),
  validate(profileQuerySchema, "query"),
  list,
);
router.get("/:userId", requirePermission(PERMISSIONS.SHIPPER_READ), details);

router.get("/me", getMyProfile);
router.post("/me", validate(createProfileSchema), createMyProfile);
router.patch("/me", validate(updateProfileSchema), updateMyProfile);

export default router;
