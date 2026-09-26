import "dotenv/config";

const toList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const config = {
  port: Number(process.env.PORT) || 4000,
  env: process.env.NODE_ENV || "development",
  clientOrigins: toList(
    process.env.CLIENT_URL || "http://localhost:5173,http://127.0.0.1:5173",
  ),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rk-source",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
};
