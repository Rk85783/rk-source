import "dotenv/config";
import express from "express";

const app = express();

app.get("/", (req, res) => res.send("API Working..."));

export default app;