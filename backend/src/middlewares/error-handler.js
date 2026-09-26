import mongoose from "mongoose";
import { ApiError } from "../utils/api-error.js";

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: "Resource already exists" });
  }

  if (!(err instanceof mongoose.Error)) {
    console.error(err);
  }

  res.status(statusCode).json({
    message: err.message || "Internal server error",
    ...(err.details && { errors: err.details }),
  });
};
