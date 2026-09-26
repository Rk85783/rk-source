import mongoose from "mongoose";

export const CONNECTION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

export const LIVE_STATUSES = [
  CONNECTION_STATUS.PENDING,
  CONNECTION_STATUS.ACCEPTED,
];

/**
 * Only these two roles take part in the network. A driver has no counterpart
 * here, and admins manage the platform rather than trading connections.
 */
export const CONNECTABLE_ROLES = ["shipper", "carrier"];

export const counterpartRole = (role) =>
  role === "shipper" ? "carrier" : role === "carrier" ? "shipper" : null;

/**
 * A pair of users, order independent. It carries a unique index so the same two
 * people can never hold two documents, whatever direction the request went.
 */
export const pairKey = (a, b) => [String(a), String(b)].sort().join(":");

const connectionSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pairKey: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: Object.values(CONNECTION_STATUS),
      required: true,
      default: CONNECTION_STATUS.PENDING,
      index: true,
    },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Connection = mongoose.model("Connection", connectionSchema);
