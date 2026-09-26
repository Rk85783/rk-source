import { Router } from "express";
import {
  addDriver,
  createMyProfile,
  getMyProfile,
  updateMyProfile,
} from "../controllers/carrier.controller.js";
import { authorize, requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/me", getMyProfile);
router.post("/me", createMyProfile);
router.patch("/me", updateMyProfile);

router.post("/drivers", authorize("carrier"), addDriver);

export default router;
