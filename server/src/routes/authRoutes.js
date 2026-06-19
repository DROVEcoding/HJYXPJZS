import express from "express";
import { hashPassword, requireAuth, signUserToken, verifyPassword } from "../auth.js";

export function createAuthRouter({ userRepository, jwtSecret }) {
  const router = express.Router();
  const authRequired = requireAuth({ userRepository, jwtSecret });

  router.post("/register", async (request, response, next) => {
    try {
      const email = normalizeEmail(request.body.email);
      const password = String(request.body.password ?? "");

      if (!email || password.length < 6) {
        response.status(400).json({ error: "邮箱不能为空，密码至少 6 位。" });
        return;
      }

      const passwordHash = await hashPassword(password);
      const user = await userRepository.createUser({ email, passwordHash });
      const token = signUserToken(user, jwtSecret);

      response.status(201).json({ user, token });
    } catch (error) {
      if (error.code === "23505") {
        response.status(409).json({ error: "这个邮箱已经注册。" });
        return;
      }
      next(error);
    }
  });

  router.post("/login", async (request, response, next) => {
    try {
      const email = normalizeEmail(request.body.email);
      const password = String(request.body.password ?? "");
      const user = await userRepository.findByEmail(email);

      if (!user || !(await verifyPassword(password, user.password_hash))) {
        response.status(401).json({ error: "邮箱或密码不正确。" });
        return;
      }

      const publicUser = {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      };
      const token = signUserToken(publicUser, jwtSecret);

      response.json({ user: publicUser, token });
    } catch (error) {
      next(error);
    }
  });

  router.get("/me", authRequired, (request, response) => {
    response.json({ user: request.user });
  });

  return router;
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}
