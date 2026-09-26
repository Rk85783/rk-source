import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { User } from "../src/models/user.model.js";

const email = process.argv[2];
const password = process.argv[3];

await connectDB();
const user = await User.findOne({ email }).select("+password +isActive");

if (!user) {
  console.log(`no user with email ${email}`);
} else {
  const ok = await bcrypt.compare(password, user.password);
  console.log(`email    : ${user.email}`);
  console.log(`role     : ${user.role}`);
  console.log(`isActive : ${user.isActive}`);
  console.log(`password : ${ok ? "MATCHES" : "does NOT match"}`);
}

await disconnectDB();
