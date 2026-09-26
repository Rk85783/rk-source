import bcrypt from "bcryptjs";
import { config } from "../config/index.js";
import {
  isValidRole,
  PUBLIC_ROLES,
  ROLES,
  isAdminRole,
} from "../config/roles.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { signToken } from "../utils/token.js";

const publicUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

const normaliseEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || String(name).trim().length < 2) {
      throw new ApiError(400, "Name must be at least 2 characters");
    }
    if (!password || String(password).length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters");
    }

    const requestedRole = role || "carrier";
    if (!isValidRole(requestedRole) || !PUBLIC_ROLES.includes(requestedRole)) {
      throw new ApiError(
        400,
        `Role must be one of: ${PUBLIC_ROLES.join(", ")}. Admin roles are assigned by an administrator.`,
      );
    }

    const mail = normaliseEmail(email);
    if (await User.exists({ email: mail })) {
      throw new ApiError(409, "Email already registered");
    }

    const hashed = await bcrypt.hash(String(password), config.bcryptRounds);
    const user = await User.create({
      name: String(name).trim(),
      email: mail,
      password: hashed,
      role: requestedRole,
    });

    res.status(201).json({ user: publicUser(user), token: signToken(user) });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email: normaliseEmail(email) }).select(
      "+password +isActive",
    );

    if (!user || !(await bcrypt.compare(String(password), user.password))) {
      throw new ApiError(401, "Invalid email or password");
    }
    if (!user.isActive) throw new ApiError(403, "Account is disabled");

    res.json({ user: publicUser(user), token: signToken(user) });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "Current and new password are required");
    }
    if (String(newPassword).length < 8) {
      throw new ApiError(400, "New password must be at least 8 characters");
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!(await bcrypt.compare(String(currentPassword), user.password))) {
      throw new ApiError(401, "Current password is incorrect");
    }

    user.password = await bcrypt.hash(String(newPassword), config.bcryptRounds);
    await user.save();

    res.json({ message: "Password updated" });
  } catch (err) {
    next(err);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!isValidRole(role)) {
      throw new ApiError(400, `Role must be one of: ${ROLES.join(", ")}`);
    }

    if (role === "super_admin" && req.user.role !== "super_admin") {
      throw new ApiError(403, "Only a super admin can grant super admin");
    }

    const target = await User.findById(req.params.userId);
    if (!target) throw new ApiError(404, "User not found");

    if (target.role === "super_admin" && req.user.role !== "super_admin") {
      throw new ApiError(403, "Only a super admin can change a super admin");
    }
    if (
      target._id.equals(req.user._id) &&
      role !== req.user.role &&
      !isAdminRole(req.user.role)
    ) {
      throw new ApiError(403, "You cannot change your own role");
    }

    target.role = role;
    await target.save();

    res.json({ user: publicUser(target) });
  } catch (err) {
    next(err);
  }
};
