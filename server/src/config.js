import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://127.0.0.1:8788"
};

export function assertRuntimeConfig() {
  const missing = [];
  if (!config.databaseUrl) {
    missing.push("DATABASE_URL");
  }
  if (!config.jwtSecret) {
    missing.push("JWT_SECRET");
  }

  if (missing.length) {
    throw new Error(`后端缺少环境变量：${missing.join(", ")}`);
  }
}
