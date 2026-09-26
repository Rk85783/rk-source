import { ApiError } from "../utils/api-error.js";

/**
 * Runs a Zod schema against one part of the request and fails with 400 on the
 * first problem it finds set.
 *
 * For `body`, the parsed result replaces req.body, so controllers receive
 * coerced, trimmed, stripped values instead of whatever the client sent.
 *
 * For `query`, the parsed result is placed on req.validated. It cannot replace
 * req.query, because Express 5 defines that as a getter-only property and
 * assigning to it throws a TypeError.
 */
export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || source,
        message: issue.message,
      }));

      const summary = details.map((d) => `${d.field}: ${d.message}`).join("; ");

      return next(new ApiError(400, summary, details));
    }

    if (source === "query") {
      req.validated = result.data;
    } else {
      req[source] = result.data;
    }

    next();
  };
};
