import crypto from "node:crypto";
import mongoose from "mongoose";

export const INVITE_STATUS = {
  PENDING: "pending",
  ACTIVATED: "activated",
  REVOKED: "revoked",
};

const driverInvitationSchema = new mongoose.Schema(
  {
    carrier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    token: { type: String, required: true, unique: true, select: false },
    status: {
      type: String,
      enum: Object.values(INVITE_STATUS),
      required: true,
      default: INVITE_STATUS.PENDING,
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    activatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// A carrier can hold one live invitation per driver email, so revoking and
// re-inviting does not pile up rows.
driverInvitationSchema.index(
  { carrier: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [INVITE_STATUS.PENDING, INVITE_STATUS.ACTIVATED] },
    },
  },
);

export const DriverInvitation = mongoose.model(
  "DriverInvitation",
  driverInvitationSchema,
);

export const newInviteToken = () => crypto.randomBytes(32).toString("hex");

export const isExpired = (invitation) =>
  invitation.status === INVITE_STATUS.PENDING &&
  invitation.expiresAt.getTime() <= Date.now();
