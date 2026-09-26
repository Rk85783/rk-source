import app from "./app.js";
import { config } from "./config/index.js";
import { connectDB, disconnectDB } from "./config/db.js";

const start = async () => {
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
