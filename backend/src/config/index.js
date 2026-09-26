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
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  mailFrom: process.env.MAIL_FROM || "no-reply@rk-source.local",
  appUrl: process.env.APP_URL || "http://localhost:5173",
  inviteExpiresInDays: Number(process.env.INVITE_EXPIRES_DAYS) || 7,
};
