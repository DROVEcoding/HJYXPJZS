import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { createPool } from "./db.js";
import { createUserRepository } from "./repositories/userRepository.js";
import { createProjectRepository } from "./repositories/projectRepository.js";
import { createAuthRouter } from "./routes/authRoutes.js";

export function createApp(options = {}) {
  const app = express();
  const repositories = options.repositories ?? createRepositories();
  const jwtSecret = options.jwtSecret ?? config.jwtSecret;

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (request, response) => {
    response.json({
      ok: true,
      service: "hjyxpjzs-api"
    });
  });

  app.use("/api/auth", createAuthRouter({
    userRepository: repositories.userRepository,
    jwtSecret
  }));

  app.use((error, request, response, next) => {
    console.error(error);
    response.status(500).json({ error: "服务器处理失败，请稍后重试。" });
  });

  return app;
}

function createRepositories() {
  const pool = createPool();
  return {
    userRepository: createUserRepository(pool),
    projectRepository: createProjectRepository(pool)
  };
}
