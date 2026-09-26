import bcrypt from "bcryptjs";
import { config } from "../src/config/index.js";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { User } from "../src/models/user.model.js";

/**
 * Seeds the first admin accounts. Signup deliberately refuses to create admin
 * roles, so without this a fresh install could never have an administrator.
 *
 * Usage:
 *   node scripts/seed-admin.mjs <role> <name> <email> <password>
 *   role: admin | super_admin
 *
 * Passwords are read from the argument or SEED_PASSWORD, never defaulted.
 * The password is not echoed to the log.
 */

const [role, name, email, argPassword] = process.argv.slice(2);
const password = argPassword || process.env.SEED_PASSWORD;

if (!role || !name || !email || !password) {
  console.error(
    "usage: node scripts/seed-admin.mjs <admin|super_admin> <name> <email> <password>",
  );
  process.exit(2);
}

if (!["admin", "super_admin"].includes(role)) {
  console.error("role must be admin or super_admin");
  process.exit(2);
}

if (password.length < 8) {
  console.error("password must be at least 8 characters");
  process.exit(2);
}

await connectDB();

const mail = String(email).trim().toLowerCase();
const existing = await User.findOne({ email: mail });

if (existing) {
  console.info(`${mail} already exists as ${existing.role}, nothing to do`);
} else {
  if (role === "super_admin") {
    const supers = await User.countDocuments({ role: "super_admin" });
    if (supers > 0) {
      console.error(
        `a super admin already exists (${supers} found). ` +
          "super_admin is created once by hand, not through the API.",
      );
      await disconnectDB();
      process.exit(1);
    }
  }

  const user = await User.create({
    name: String(name).trim(),
    email: mail,
    password: await bcrypt.hash(password, config.bcryptRounds),
    role,
  });
  console.info(`created ${user.role}: ${user.email} (id ${user._id})`);
}

await disconnectDB();
