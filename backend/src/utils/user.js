import bcrypt from "bcryptjs";
import { config } from "../config/index.js";
import { User } from "../models/user.model.js";
import { ApiError } from "./api-error.js";

export const normaliseEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

export const publicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  ...(user.role === "admin" || user.role === "super_admin"
    ? { permissions: user.permissions || [] }
    : {}),
  createdAt: user.createdAt,
});

/**
 * Assumes the shape has already been validated by the route's Zod schema. This
 * only enforces the one rule that needs a database lookup.
 */
export const createUser = async ({ name, email, password, role }) => {
  const mail = normaliseEmail(email);

  if (await User.exists({ email: mail })) {
    throw new ApiError(409, "Email already registered");
  }

  return User.create({
    name,
    email: mail,
    password: await bcrypt.hash(password, config.bcryptRounds),
    role,
  });
};
