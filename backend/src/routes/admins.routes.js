import { Router } from "express";
import {
  createMyProfile,
  getMyProfile,
  updateMyProfile,
} from "../controllers/admin.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createProfileSchema,
  updateProfileSchema,
} from "../validations/profile.validation.js";

const router = Router();

router.use(requireAuth);

router.get("/me", getMyProfile);
router.post("/me", validate(createProfileSchema), createMyProfile);
router.patch("/me", validate(updateProfileSchema), updateMyProfile);

export default router;
