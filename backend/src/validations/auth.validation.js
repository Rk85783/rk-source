import { z } from "zod";
import { ALL_PERMISSIONS } from "../config/permissions.js";
import { PUBLIC_ROLES, ROLES } from "../config/roles.js";

const trimmed = (min, max) =>
  z
    .string()
    .trim()
    .min(min, `Must be at least ${min} characters`)
    .max(max, `Must be at most ${max} characters`);

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Invalid email address")
  .max(254, "Must be at most 254 characters");

export const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

export const nameField = trimmed(2, 60);

export const registerSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  role: z.enum(PUBLIC_ROLES).optional(),
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
  profileImage: z.string().trim().max(2048).optional(),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordField,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from the current one",
    path: ["newPassword"],
  });

export const createAdminSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
});

export const updateRoleSchema = z.object({
  role: z.enum(ROLES),
});

export const setPermissionsSchema = z.object({
  permissions: z
    .array(z.enum(ALL_PERMISSIONS))
    .max(ALL_PERMISSIONS.length)
    .default([]),
});

export const listUsersQuerySchema = z.object({
  role: z.enum(ROLES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
