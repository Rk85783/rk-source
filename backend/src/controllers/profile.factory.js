import { ApiError } from "../utils/api-error.js";

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
