import { z } from "zod";

const trimmed = (min, max) =>
  z
    .string()
    .trim()
    .min(min, `Must be at least ${min} characters`)
    .max(max, `Must be at most ${max} characters`);

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .email("Enter a valid email address");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

export const loginSchema = z.object({ email, password });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: password,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from the current one",
    path: ["newPassword"],
  });

export const registerSchema = z
  .object({
    name: trimmed(2, 60),
    email,
    password,
    confirmPassword: z.string().min(1, "Confirm your password"),
    role: z.enum(["carrier", "shipper"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Flattens a Zod result into a field -> message map a form can render, plus a
 * single summary line. Kept here so every form reports errors the same way.
 */
export const toFieldErrors = (result) => {
  if (result.success) return { fields: {}, summary: null };

  const fields = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "form";
    if (!fields[key]) fields[key] = issue.message;
  }

  return { fields, summary: Object.values(fields)[0] };
};
