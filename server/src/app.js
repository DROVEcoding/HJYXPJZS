import cors from "cors";
import express from "express";
import { config } from "./config.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (request, response) => {
    response.json({
      ok: true,
      service: "hjyxpjzs-api"
    });
  });

  return app;
}
