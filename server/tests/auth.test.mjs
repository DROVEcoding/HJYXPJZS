import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";

function createMemoryRepositories() {
  const users = [];
  return {
    users,
    userRepository: {
      async createUser({ email, passwordHash }) {
        if (users.some((user) => user.email === email)) {
          const error = new Error("duplicate email");
          error.code = "23505";
          throw error;
        }
        const user = {
          id: `user-${users.length + 1}`,
          email,
          password_hash: passwordHash,
          created_at: new Date().toISOString()
        };
        users.push(user);
        return { id: user.id, email: user.email, created_at: user.created_at };
      },
      async findByEmail(email) {
        return users.find((user) => user.email === email) ?? null;
      },
      async findById(id) {
        const user = users.find((item) => item.id === id);
        return user ? { id: user.id, email: user.email, created_at: user.created_at } : null;
      }
    },
    projectRepository: {}
  };
}

test("用户可以注册并用 token 获取当前用户", async () => {
  const repositories = createMemoryRepositories();
  const app = createApp({
    repositories,
    jwtSecret: "test-secret"
  });

  const registerResponse = await request(app)
    .post("/api/auth/register")
    .send({ email: "teacher@example.com", password: "123456" })
    .expect(201);

  assert.equal(registerResponse.body.user.email, "teacher@example.com");
  assert.equal(typeof registerResponse.body.token, "string");
  assert.equal(repositories.users[0].password_hash === "123456", false);

  const meResponse = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${registerResponse.body.token}`)
    .expect(200);

  assert.equal(meResponse.body.user.email, "teacher@example.com");
});

test("用户可以登录，错误密码会被拒绝", async () => {
  const repositories = createMemoryRepositories();
  const app = createApp({
    repositories,
    jwtSecret: "test-secret"
  });

  await request(app)
    .post("/api/auth/register")
    .send({ email: "teacher@example.com", password: "123456" })
    .expect(201);

  await request(app)
    .post("/api/auth/login")
    .send({ email: "teacher@example.com", password: "wrong-password" })
    .expect(401);

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({ email: "teacher@example.com", password: "123456" })
    .expect(200);

  assert.equal(typeof loginResponse.body.token, "string");
});
