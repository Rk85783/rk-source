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
  createdAt: user.createdAt,
});

export const validateCredentials = ({ name, email, password }) => {
  if (!name || String(name).trim().length < 2) {
    throw new ApiError(400, "Name must be at least 2 characters");
  }
  if (!normaliseEmail(email)) {
    throw new ApiError(400, "Email is required");
  }
  if (!password || String(password).length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }
};

export const createUser = async ({ name, email, password, role }) => {
  validateCredentials({ name, email, password });

  const mail = normaliseEmail(email);
  if (await User.exists({ email: mail })) {
    throw new ApiError(409, "Email already registered");
  }

  return User.create({
    name: String(name).trim(),
    email: mail,
    password: await bcrypt.hash(String(password), config.bcryptRounds),
    role,
  });
};
