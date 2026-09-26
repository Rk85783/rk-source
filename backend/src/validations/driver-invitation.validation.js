import { z } from "zod";
import { INVITE_STATUS } from "../models/driver-invitation.model.js";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Invalid email address");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

export const inviteDriverSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email,
  password,
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
  profileImage: z.string().trim().max(2048).optional(),
});

export const listInvitedDriversQuerySchema = z.object({
  status: z
    .enum([...Object.values(INVITE_STATUS), "all"])
    .default("all")
    .catch("all"),
});

export const activateDriverSchema = z.object({
  token: z.string().trim().min(10, "A token is required"),
  password,
});
