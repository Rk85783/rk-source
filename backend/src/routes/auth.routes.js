import { Router } from "express";
import {
  changePassword,
  login,
  me,
  register,
  updateRole,
} from "../controllers/auth.controller.js";
import { authorize, requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", requireAuth, me);
router.patch("/me/password", requireAuth, changePassword);

router.patch(
  "/users/:userId/role",
  requireAuth,
  authorize("admin"),
  updateRole,
);

export default router;
