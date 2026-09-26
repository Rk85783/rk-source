import { User } from "../models/user.model.js";
import { atLeast, isAdminRole } from "../config/roles.js";
import { ApiError } from "../utils/api-error.js";
import { verifyToken } from "../utils/token.js";

const readToken = (req) => {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = readToken(req);
    if (!token) throw new ApiError(401, "Authentication required");

    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      const message =
        err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
      throw new ApiError(401, message);
    }

    const user = await User.findById(payload.sub).select("+isActive");
    if (!user) throw new ApiError(401, "User no longer exists");
    if (!user.isActive) throw new ApiError(403, "Account is disabled");

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const authorize = (...allowed) => {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));

    if (!isAdminRole(req.user.role) && !allowed.includes(req.user.role)) {
      return next(new ApiError(403, `Requires one of: ${allowed.join(", ")}`));
    }

    next();
  };
};

export const authorizeAtLeast = (minimum) => {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));
    if (!atLeast(req.user.role, minimum)) {
      return next(new ApiError(403, `Requires ${minimum} or higher`));
    }
    next();
  };
};

/**
 * Guards a route behind a named permission. A super admin holds every
 * permission implicitly, so no list is stored for that role. An admin holds
 * exactly what a super admin granted. Non-admin roles never pass, even if a
 * permission string is somehow attached to them.
 *
 * All listed permissions are required.
 */
export const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));

    if (req.user.role === "super_admin") return next();

    if (req.user.role !== "admin") {
      return next(
        new ApiError(403, "This endpoint is for administrators only"),
      );
    }

    const held = req.user.permissions || [];
    const missing = permissions.filter((p) => !held.includes(p));

    if (missing.length) {
      return next(
        new ApiError(403, `Missing permission: ${missing.join(", ")}`),
      );
    }

    next();
  };
};
