import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function signUserToken(user, jwtSecret) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email
    },
    jwtSecret,
    { expiresIn: "7d" }
  );
}

export function requireAuth({ userRepository, jwtSecret }) {
  return async function authMiddleware(request, response, next) {
    const header = request.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

    if (!token) {
      response.status(401).json({ error: "请先登录。" });
      return;
    }

    try {
      const payload = jwt.verify(token, jwtSecret);
      const user = await userRepository.findById(payload.sub);
      if (!user) {
        response.status(401).json({ error: "登录状态已失效，请重新登录。" });
        return;
      }
      request.user = user;
      next();
    } catch (error) {
      response.status(401).json({ error: "登录状态已失效，请重新登录。" });
    }
  };
}
