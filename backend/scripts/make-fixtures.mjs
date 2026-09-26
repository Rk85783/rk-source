import { connectDB, disconnectDB } from "../src/config/db.js";
import { User } from "../src/models/user.model.js";

/**
 * Creates the fixtures the network test needs and prints the ids, so the shell
 * script does not have to scrape them out of an API response.
 */
const tag = process.argv[2];

await connectDB();

const hash = "$2b$12$gkOUUa0KxYCDeq8/IWYtoePJC2taa.6VV70X1E2RVcicqxA/MLrC.";

const make = async (name, role) => {
  const email = `${role}-${name.toLowerCase().replace(/\s+/g, "-")}-${tag}@test.local`;
  await User.deleteOne({ email });
  const u = await User.create({ name, email, password: hash, role });
  return u;
};

const shipperA = await make("Shipper One", "shipper");
const shipperB = await make("Shipper Two", "shipper");
const carrierA = await make("Carrier One", "carrier");
const carrierB = await make("Carrier Two", "carrier");
const driver = await make("Driver One", "driver");

console.log(
  JSON.stringify({
    tag,
    shipperA: shipperA.email,
    shipperB: shipperB.email,
    carrierA: carrierA.email,
    carrierB: carrierB.email,
    driver: driver.email,
    ids: {
      shipperA: shipperA._id.toString(),
      shipperB: shipperB._id.toString(),
      carrierA: carrierA._id.toString(),
      carrierB: carrierB._id.toString(),
      driver: driver._id.toString(),
    },
  }),
);

await disconnectDB();
