import { DriverProfile } from "../models/profile.model.js";
import { profileAdminHandlers, profileHandlers } from "./profile.factory.js";

const handlers = profileHandlers(DriverProfile, "driver");
const adminHandlers = profileAdminHandlers(DriverProfile, "driver", "drivers");

export const getMyProfile = handlers.get;
export const createMyProfile = handlers.create;
export const updateMyProfile = handlers.update;

export const list = adminHandlers.list;
export const details = adminHandlers.details;
