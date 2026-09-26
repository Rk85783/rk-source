import { config } from "../config/index.js";
import { dbReady, dbState } from "../config/db.js";

export const health = (req, res) => {
  res.json({
    status: "ok",
    env: config.env,
    database: { state: dbState(), ready: dbReady() },
    timestamp: new Date().toISOString(),
  });
};

export const root = (req, res) => res.send("API Working...");
