import { ShipperProfile } from "../models/profile.model.js";
import { profileHandlers } from "./profile.factory.js";

const handlers = profileHandlers(ShipperProfile, "shipper");

export const getMyProfile = handlers.get;
export const createMyProfile = handlers.create;
export const updateMyProfile = handlers.update;
