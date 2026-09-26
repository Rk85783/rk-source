import bcrypt from "bcryptjs";
import { config } from "../config/index.js";
import { isValidRole, PUBLIC_ROLES, ROLES } from "../config/roles.js";
import { User } from "../models/user.model.js";
import { profileModelFor } from "../models/profile.model.js";
import { publicProfile } from "./profile.factory.js";
import { ApiError } from "../utils/api-error.js";
import { signToken } from "../utils/token.js";
import { createUser, normaliseEmail, publicUser } from "../utils/user.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const requestedRole = role || "carrier";
    if (!isValidRole(requestedRole) || !PUBLIC_ROLES.includes(requestedRole)) {
      throw new ApiError(
        400,
        `Role must be one of: ${PUBLIC_ROLES.join(", ")}. Other roles are assigned by an administrator.`,
      );
    }

    const user = await createUser({
      name,
      email,
      password,
      role: requestedRole,
    });

    // A profile is created only when the client sends the profile fields, so
    // signup stays a single step without making them mandatory.
    let profile = null;
    const Profile = profileModelFor(user.role);
    const { firstName, lastName, profileImage } = req.body;

    if (Profile && firstName && lastName) {
      profile = await Profile.create({
        user: user._id,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        profileImage: profileImage ? String(profileImage).trim() : "",
      });
    }

    res.status(201).json({
      user: publicUser(user),
      ...(profile && { profile: publicProfile(profile) }),
      token: signToken(user),
    });
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

export const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await createUser({ name, email, password, role: "admin" });
    res.status(201).json({ user: publicUser(user) });
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

    if (role === "super_admin") {
      throw new ApiError(
        403,
        "super_admin cannot be granted through the API. Use the seed script.",
      );
    }

    const target = await User.findById(req.params.userId);
    if (!target) throw new ApiError(404, "User not found");

    if (target.role === "super_admin") {
      throw new ApiError(403, "The super admin role cannot be changed");
    }

    target.role = role;
    await target.save();

    res.json({ user: publicUser(target) });
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) {
      if (!isValidRole(role)) {
        throw new ApiError(400, `Role must be one of: ${ROLES.join(", ")}`);
      }
      filter.role = role;
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const perPage = Math.min(100, Math.max(1, Number(limit)));

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(perPage),
      User.countDocuments(filter),
    ]);

    res.json({
      users: users.map(publicUser),
      page: Math.max(1, Number(page)),
      limit: perPage,
      total,
      pages: Math.ceil(total / perPage),
    });
  } catch (err) {
    next(err);
  }
};
