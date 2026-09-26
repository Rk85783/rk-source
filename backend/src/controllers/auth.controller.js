import bcrypt from "bcryptjs";
import { config } from "../config/index.js";
import { PERMISSION_GROUPS } from "../config/permissions.js";
import { User } from "../models/user.model.js";
import { profileModelFor } from "../models/profile.model.js";
import { publicProfile } from "./profile.factory.js";
import { ApiError } from "../utils/api-error.js";
import { signToken } from "../utils/token.js";
import { createUser, normaliseEmail, publicUser } from "../utils/user.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, firstName, lastName, profileImage } =
      req.body;

    const user = await createUser({
      name,
      email,
      password,
      role: role || "carrier",
    });

    // A profile is created only when the client sends the profile fields, so
    // signup stays a single step without making them mandatory.
    let profile = null;
    const Profile = profileModelFor(user.role);

    if (Profile && firstName && lastName) {
      profile = await Profile.create({
        user: user._id,
        firstName,
        lastName,
        profileImage: profileImage || "",
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

    const user = await User.findOne({ email: normaliseEmail(email) }).select(
      "+password +isActive",
    );

    if (!user || !(await bcrypt.compare(password, user.password))) {
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

    const user = await User.findById(req.user._id).select("+password");
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new ApiError(401, "Current password is incorrect");
    }

    user.password = await bcrypt.hash(newPassword, config.bcryptRounds);
    await user.save();

    res.json({ message: "Password updated" });
  } catch (err) {
    next(err);
  }
};

export const createAdmin = async (req, res, next) => {
  try {
    const user = await createUser({ ...req.body, role: "admin" });
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

export const listPermissions = async (req, res) => {
  res.json({ permissions: PERMISSION_GROUPS });
};

export const getUserPermissions = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.userId);
    if (!target) throw new ApiError(404, "User not found");
    assertPermissionTarget(target);

    res.json({ user: publicUser(target), permissions: target.permissions });
  } catch (err) {
    next(err);
  }
};

export const setUserPermissions = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.userId);
    if (!target) throw new ApiError(404, "User not found");
    assertPermissionTarget(target);

    target.permissions = [...new Set(req.body.permissions)];
    await target.save();

    res.json({ user: publicUser(target), permissions: target.permissions });
  } catch (err) {
    next(err);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;

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
    const { role, page, limit } = req.validated;

    const filter = role ? { role } : {};

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      users: users.map(publicUser),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

const assertPermissionTarget = (user) => {
  if (user.role !== "admin") {
    throw new ApiError(
      400,
      `Permissions are managed for admins, not ${user.role}s`,
    );
  }
};
