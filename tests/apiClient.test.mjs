import test from "node:test";
import assert from "node:assert/strict";
import { createApiClient } from "../scripts/apiClient.js";

test("apiClient 会带上 JSON 请求头和登录 token", async () => {
  const calls = [];
  const client = createApiClient({
    baseUrl: "http://127.0.0.1:3001",
    getToken: () => "token-001",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true })
      };
    }
  });

  const result = await client.post("/api/projects", { projectName: "测试项目" });

  assert.deepEqual(result, { ok: true });
  assert.equal(calls[0].url, "http://127.0.0.1:3001/api/projects");
  assert.equal(calls[0].options.headers.Authorization, "Bearer token-001");
  assert.equal(calls[0].options.headers["Content-Type"], "application/json");
});
