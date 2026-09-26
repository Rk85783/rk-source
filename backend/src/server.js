import app from "./app.js";
import { config } from "./config/index.js";
import { connectDB, disconnectDB } from "./config/db.js";

const assertConfig = () => {
  const problems = [];

  if (!config.jwtSecret) {
    problems.push("JWT_SECRET is not set");
  } else if (config.jwtSecret.length < 32) {
    problems.push("JWT_SECRET must be at least 32 characters");
  }

  if (config.env !== "production" && problems.length) {
    console.warn(`config warning: ${problems.join("; ")}`);
    return;
  }

  if (problems.length) {
    console.error(`invalid config: ${problems.join("; ")}`);
    process.exit(1);
  }
};

const start = async () => {
  assertConfig();

  const connected = await connectDB();

  if (!connected && config.env === "production") {
    console.error("cannot reach mongo, refusing to start in production");
    process.exit(1);
  }

  const server = app.listen(config.port, () =>
    console.info(`server is running at http://localhost:${config.port}`),
  );

  const shutdown = async (signal) => {
    console.info(`${signal} received, shutting down`);
    server.close();
    await disconnectDB();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

start();
