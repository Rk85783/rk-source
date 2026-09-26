import { Router } from "express";
import {
  inviteDriver,
  listInvitedDrivers,
  invitedDriverDetails,
  revokeInvitation,
} from "../controllers/driver-invitation.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  inviteDriverSchema,
  listInvitedDriversQuerySchema,
} from "../validations/driver-invitation.validation.js";

const router = Router();

router.use(requireAuth);

router.post("/", validate(inviteDriverSchema), inviteDriver);

router.get(
  "/",
  validate(listInvitedDriversQuerySchema, "query"),
  listInvitedDrivers,
);

router.get("/:id", invitedDriverDetails);
router.patch("/:id/revoke", revokeInvitation);

export default router;
