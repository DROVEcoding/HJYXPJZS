import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";

test("GET /api/health 返回后端健康状态", async () => {
  const app = createApp();

  const response = await request(app).get("/api/health").expect(200);

  assert.deepEqual(response.body, {
    ok: true,
    service: "hjyxpjzs-api"
  });
});
