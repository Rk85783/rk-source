import { connectDB, disconnectDB } from "../src/config/db.js";
import { User } from "../src/models/user.model.js";
import {
  ShipperProfile,
  CarrierProfile,
  DriverProfile,
  AdminProfile,
} from "../src/models/profile.model.js";

await connectDB();
for (const M of [ShipperProfile, CarrierProfile, DriverProfile, AdminProfile]) {
  await M.deleteMany({});
}
const users = await User.deleteMany({});
console.log(`reset: ${users.deletedCount} users cleared`);
await disconnectDB();
