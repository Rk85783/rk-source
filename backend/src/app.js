import cors from "cors";
import express from "express";
import { config } from "./config/index.js";
import { errorHandler, notFound } from "./middlewares/error-handler.js";
import routes from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin: config.clientOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());

app.use(routes);

app.use(notFound);
app.use(errorHandler);

export default app;
