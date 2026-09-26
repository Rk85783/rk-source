import mongoose from "mongoose";
import { ROLES } from "../config/roles.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: "carrier" },
    isActive: { type: Boolean, default: true, select: false },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
