import { z } from "zod";
import { nameField, passwordField } from "./auth.validation.js";

export const profileFields = {
  firstName: z.string().trim().min(1, "firstName is required").max(60),
  lastName: z.string().trim().min(1, "lastName is required").max(60),
  profileImage: z.string().trim().max(2048, "Too long").optional(),
};

export const profileQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(60).optional(),
});

export const createProfileSchema = z.object({
  firstName: profileFields.firstName,
  lastName: profileFields.lastName,
  profileImage: profileFields.profileImage,
});

export const updateProfileSchema = z
  .object({
    firstName: profileFields.firstName.optional(),
    lastName: profileFields.lastName.optional(),
    profileImage: profileFields.profileImage,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export const addDriverSchema = z
  .object({
    name: nameField,
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: passwordField,
    firstName: profileFields.firstName.optional(),
    lastName: profileFields.lastName.optional(),
    profileImage: profileFields.profileImage,
  })
  .refine((data) => Boolean(data.firstName) === Boolean(data.lastName), {
    message: "Provide both firstName and lastName, or neither",
    path: ["firstName"],
  });
