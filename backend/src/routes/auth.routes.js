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
import { activateDriver } from "../controllers/driver-invitation.controller.js";
import {
  authorizeAtLeast,
  requireAuth,
} from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { activateDriverSchema } from "../validations/driver-invitation.validation.js";
import {
  changePasswordSchema,
  createAdminSchema,
  listUsersQuerySchema,
  loginSchema,
  registerSchema,
  setPermissionsSchema,
  updateRoleSchema,
} from "../validations/auth.validation.js";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/activate-driver", validate(activateDriverSchema), activateDriver);

router.get("/me", requireAuth, me);
router.patch(
  "/me/password",
  requireAuth,
  validate(changePasswordSchema),
  changePassword,
);

router.get(
  "/users",
  requireAuth,
  authorizeAtLeast("admin"),
  validate(listUsersQuerySchema, "query"),
  listUsers,
);

router.get(
  "/permissions",
  requireAuth,
  authorizeAtLeast("super_admin"),
  listPermissions,
);

router
  .route("/users/:userId/permissions")
  .get(requireAuth, authorizeAtLeast("super_admin"), getUserPermissions)
  .put(
    requireAuth,
    authorizeAtLeast("super_admin"),
    validate(setPermissionsSchema),
    setUserPermissions,
  );

router.post(
  "/users/admins",
  requireAuth,
  authorizeAtLeast("super_admin"),
  validate(createAdminSchema),
  createAdmin,
);

router.patch(
  "/users/:userId/role",
  requireAuth,
  authorizeAtLeast("super_admin"),
  validate(updateRoleSchema),
  updateRole,
);

export default router;
