import { Router } from "express";
import {
  cancelConnection,
  listConnections,
  respondConnection,
  searchDirectory,
  sendConnection,
} from "../controllers/connection.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  listConnectionsQuerySchema,
  respondConnectionSchema,
  sendConnectionSchema,
} from "../validations/connection.validation.js";
import { directoryQuerySchema } from "../validations/directory.validation.js";

const router = Router();

router.use(requireAuth);

router.get("/", validate(listConnectionsQuerySchema, "query"), listConnections);

router.post("/", validate(sendConnectionSchema), sendConnection);

router.patch("/:id", validate(respondConnectionSchema), respondConnection);
router.patch("/:id/cancel", cancelConnection);

router.get(
  "/directory/search",
  validate(directoryQuerySchema, "query"),
  searchDirectory,
);

export default router;
