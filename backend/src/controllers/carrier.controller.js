import { CarrierProfile } from "../models/profile.model.js";
import { profileAdminHandlers, profileHandlers } from "./profile.factory.js";

const handlers = profileHandlers(CarrierProfile, "carrier");
const adminHandlers = profileAdminHandlers(
  CarrierProfile,
  "carrier",
  "carriers",
);

export const getMyProfile = handlers.get;
export const createMyProfile = handlers.create;
export const updateMyProfile = handlers.update;

export const list = adminHandlers.list;
export const details = adminHandlers.details;
