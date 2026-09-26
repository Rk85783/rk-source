import mongoose from "mongoose";

export const profileFields = {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  firstName: { type: String, required: true, trim: true, maxlength: 60 },
  lastName: { type: String, required: true, trim: true, maxlength: 60 },
  profileImage: { type: String, default: "", trim: true },
};

const profileOptions = { timestamps: true };

const shipperSchema = new mongoose.Schema({ ...profileFields }, profileOptions);
const carrierSchema = new mongoose.Schema({ ...profileFields }, profileOptions);
const driverSchema = new mongoose.Schema({ ...profileFields }, profileOptions);
const adminSchema = new mongoose.Schema({ ...profileFields }, profileOptions);

export const ShipperProfile = mongoose.model("ShipperProfile", shipperSchema);
export const CarrierProfile = mongoose.model("CarrierProfile", carrierSchema);
export const DriverProfile = mongoose.model("DriverProfile", driverSchema);
export const AdminProfile = mongoose.model("AdminProfile", adminSchema);

// Maps a role to the collection that holds its profile. The controller always
// resolves the model from the authenticated user's role, never from request
// input, so a caller cannot write into a collection they do not belong to.
export const PROFILE_MODELS = {
  shipper: ShipperProfile,
  carrier: CarrierProfile,
  driver: DriverProfile,
  admin: AdminProfile,
};

export const profileModelFor = (role) => PROFILE_MODELS[role] || null;
