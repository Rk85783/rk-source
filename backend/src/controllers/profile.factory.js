import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { publicUser } from "../utils/user.js";

export const publicProfile = (profile) => ({
  id: profile._id.toString(),
  user: profile.user.toString(),
  firstName: profile.firstName,
  lastName: profile.lastName,
  profileImage: profile.profileImage,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
});

const requireRole = (req, role) => {
  if (req.user.role !== role) {
    throw new ApiError(403, `This endpoint is for the "${role}" role only`);
  }
};

/**
 * Builds the profile handlers for one role. Each role gets its own controller
 * and route file, but the shared behaviour lives here so the four stay in sync
 * and role-specific fields can be added to a single controller later.
 *
 * The role check is strict and has no bypass: a user may only write to the
 * collection that matches their own role.
 */
export const profileHandlers = (Model, role) => {
  const get = async (req, res, next) => {
    try {
      requireRole(req, role);
      const profile = await Model.findOne({ user: req.user._id });
      if (!profile) throw new ApiError(404, "Profile not found");
      res.json({ profile: publicProfile(profile) });
    } catch (err) {
      next(err);
    }
  };

  const create = async (req, res, next) => {
    try {
      requireRole(req, role);
      const { firstName, lastName, profileImage } = req.body;

      if (!firstName || String(firstName).trim().length < 1) {
        throw new ApiError(400, "firstName is required");
      }
      if (!lastName || String(lastName).trim().length < 1) {
        throw new ApiError(400, "lastName is required");
      }

      if (await Model.findOne({ user: req.user._id })) {
        throw new ApiError(409, "Profile already exists");
      }

      const profile = await Model.create({
        user: req.user._id,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        profileImage: profileImage ? String(profileImage).trim() : "",
      });

      res.status(201).json({ profile: publicProfile(profile) });
    } catch (err) {
      next(err);
    }
  };

  const update = async (req, res, next) => {
    try {
      requireRole(req, role);
      const { firstName, lastName, profileImage } = req.body;

      const profile = await Model.findOne({ user: req.user._id });
      if (!profile) throw new ApiError(404, "Profile not found");

      if (firstName !== undefined) {
        if (String(firstName).trim().length < 1) {
          throw new ApiError(400, "firstName cannot be empty");
        }
        profile.firstName = String(firstName).trim();
      }
      if (lastName !== undefined) {
        if (String(lastName).trim().length < 1) {
          throw new ApiError(400, "lastName cannot be empty");
        }
        profile.lastName = String(lastName).trim();
      }
      if (profileImage !== undefined) {
        profile.profileImage = String(profileImage).trim();
      }

      await profile.save();
      res.json({ profile: publicProfile(profile) });
    } catch (err) {
      next(err);
    }
  };

  return { get, create, update };
};

/**
 * Builds the administrative list and detail handlers for one role. These are
 * guarded by requirePermission on the route, not here, so each role decides its
 * own required permission.
 */
export const profileAdminHandlers = (Model, role, key) => {
  const list = async (req, res, next) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
      const search = String(req.query.search || "").trim();

      const filter = { role };
      if (search) {
        const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.name = { $regex: safe, $options: "i" };
      }

      const [users, total] = await Promise.all([
        User.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        User.countDocuments(filter),
      ]);

      const profiles = await Model.find({
        user: { $in: users.map((u) => u._id) },
      });
      const byUser = new Map(profiles.map((p) => [p.user.toString(), p]));

      res.json({
        [key]: users.map((u) => ({
          ...publicUser(u),
          profile: byUser.has(u._id.toString())
            ? publicProfile(byUser.get(u._id.toString()))
            : null,
        })),
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      });
    } catch (err) {
      next(err);
    }
  };

  const details = async (req, res, next) => {
    try {
      const user = await User.findOne({ _id: req.params.userId, role });
      if (!user) throw new ApiError(404, `${role} not found`);

      const profile = await Model.findOne({ user: user._id });

      res.json({
        [key]: {
          ...publicUser(user),
          profile: profile ? publicProfile(profile) : null,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  return { list, details };
};
