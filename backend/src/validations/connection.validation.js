import { z } from "zod";
import { CONNECTION_STATUS } from "../models/connection.model.js";

export const sendConnectionSchema = z.object({
  toUserId: z
    .string()
    .trim()
    .min(1, "A recipient is required")
    .regex(/^[a-f\d]{24}$/i, "Not a valid user id"),
});

export const respondConnectionSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

export const listConnectionsQuerySchema = z.object({
  view: z
    .enum(["received", "sent", "connected"])
    .default("received")
    .catch("received"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const connectionStatuses = Object.values(CONNECTION_STATUS);
