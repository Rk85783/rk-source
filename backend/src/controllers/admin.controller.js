import { AdminProfile } from "../models/profile.model.js";
import { profileHandlers } from "./profile.factory.js";

const handlers = profileHandlers(AdminProfile, "admin");

export const getMyProfile = handlers.get;
export const createMyProfile = handlers.create;
export const updateMyProfile = handlers.update;
