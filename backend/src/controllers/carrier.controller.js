import { CarrierProfile, DriverProfile } from "../models/profile.model.js";
import { createUser, publicUser } from "../utils/user.js";
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

/**
 * A carrier adds a driver. Drivers cannot self-register, so this is the only
 * way a driver account comes into existence.
 *
 * Note: a carrier-to-driver relationship is not modelled yet, so there is
 * deliberately no "list my drivers" endpoint. Every carrier would see the
 * entire driver roster, which is not something anyone asked for.
 */
export const addDriver = async (req, res, next) => {
  try {
    const { name, email, password, firstName, lastName, profileImage } =
      req.body;

    const driver = await createUser({ name, email, password, role: "driver" });

    const parts = name.trim().split(/\s+/);
    const profile = await DriverProfile.create({
      user: driver._id,
      firstName: firstName || parts[0],
      lastName: lastName || parts.slice(1).join(" ") || "-",
      profileImage: profileImage || "",
    });

    res.status(201).json({ driver: publicUser(driver), profile });
  } catch (err) {
    next(err);
  }
};
