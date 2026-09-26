import mongoose from "mongoose";
import { config } from "./index.js";

export const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.info(`mongo connected: ${config.mongoUri}`);
  });

  mongoose.connection.on("error", (err) => {
    console.error("mongo error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("mongo disconnected");
  });

  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    return true;
  } catch (err) {
    console.error("mongo connection failed:", err.message);
    return false;
  }
};

export const disconnectDB = async () => {
  await mongoose.connection.close();
};

export const dbReady = () => mongoose.connection.readyState === 1;

export const dbState = () =>
  ["disconnected", "connected", "connecting", "disconnecting"][
    mongoose.connection.readyState
  ];
