import { Router } from "express";
import {
  changePassword,
  createAdmin,
  getUserPermissions,
  listPermissions,
  listUsers,
  login,
  me,
  register,
  setUserPermissions,
  updateRole,
} from "../controllers/auth.controller.js";
import {
  authorizeAtLeast,
  requireAuth,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", requireAuth, me);
router.patch("/me/password", requireAuth, changePassword);

router.get("/users", requireAuth, authorizeAtLeast("admin"), listUsers);

router.get(
  "/permissions",
  requireAuth,
  authorizeAtLeast("super_admin"),
  listPermissions,
);

router
  .route("/users/:userId/permissions")
  .get(requireAuth, authorizeAtLeast("super_admin"), getUserPermissions)
  .put(requireAuth, authorizeAtLeast("super_admin"), setUserPermissions);

router.post(
  "/users/admins",
  requireAuth,
  authorizeAtLeast("super_admin"),
  createAdmin,
);

router.patch(
  "/users/:userId/role",
  requireAuth,
  authorizeAtLeast("super_admin"),
  updateRole,
);

export default router;
