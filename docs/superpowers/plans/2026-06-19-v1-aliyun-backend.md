# V1 Aliyun Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为“环境影响评价助手”增加真实的 Node.js 后端 API，让用户可以注册、登录、保存项目、读取自己的项目列表，并为后续部署到阿里云 SAE + RDS PostgreSQL 做准备。

**Architecture:** 前端仍是静态页面，浏览器不直连数据库。新增 `server/` 后端服务，后端用 Express 暴露 API，用 PostgreSQL 保存用户和项目，用 JWT 识别当前用户。前端通过 `scripts/apiClient.js` 调用后端 API。

**Tech Stack:** HTML、CSS、原生 JavaScript ES modules、Node.js、Express、PostgreSQL、`pg`、`bcryptjs`、`jsonwebtoken`、`node:test`、`supertest`。

---

## 前置说明

当前项目根目录：

```text
C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS
```

当前分支：

```text
v1-aliyun-backend
```

旧分支：

```text
v1-cloud-project-save
```

旧分支记录 Supabase 方向，不合并进本路线。

## 文件结构

计划新增：

| 文件 | 责任 |
|---|---|
| `server/package.json` | 后端 Node 项目配置和测试命令 |
| `server/.env.example` | 后端环境变量示例，不放真实密钥 |
| `server/sql/001_init.sql` | PostgreSQL 建表脚本 |
| `server/src/config.js` | 读取并校验后端环境变量 |
| `server/src/db.js` | 创建 PostgreSQL 连接池 |
| `server/src/app.js` | 创建 Express 应用并挂载路由 |
| `server/src/server.js` | 本地或 SAE 启动入口 |
| `server/src/auth.js` | 密码哈希、JWT、登录认证中间件 |
| `server/src/repositories/userRepository.js` | 用户表读写 |
| `server/src/repositories/projectRepository.js` | 项目表读写 |
| `server/src/routes/authRoutes.js` | 注册、登录、当前用户接口 |
| `server/src/routes/projectRoutes.js` | 项目列表、新建、打开、更新接口 |
| `server/tests/auth.test.mjs` | 认证接口测试 |
| `server/tests/projects.test.mjs` | 项目权限和项目保存测试 |
| `scripts/apiConfig.js` | 前端 API 地址配置 |
| `scripts/apiClient.js` | 前端 HTTP 请求封装 |
| `scripts/projectApi.js` | 前端项目接口封装 |

计划修改：

| 文件 | 责任 |
|---|---|
| `index.html` | 增加云端账号、保存、项目列表区域 |
| `style.css` | 增加云端区域样式 |
| `scripts/app.js` | 接入登录、保存、项目列表、打开项目 |
| `README.md` | 增加阿里云后端运行、部署、文件用途说明 |

---

### Task 1: 搭建后端项目骨架

**Files:**
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\package.json`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\.env.example`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\src\config.js`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\src\app.js`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\src\server.js`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\tests\health.test.mjs`

- [ ] **Step 1: 创建 `server/package.json`**

```json
{
  "name": "hjyxpjzs-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "test": "node --test tests/*.test.mjs"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.13.1"
  },
  "devDependencies": {
    "supertest": "^7.0.0"
  }
}
```

- [ ] **Step 2: 安装后端依赖**

Run:

```powershell
npm install
```

Working directory:

```text
C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server
```

Expected:

```text
added ... packages
```

- [ ] **Step 3: 创建 `server/.env.example`**

```text
PORT=3001
DATABASE_URL=postgres://hjyxpjzs_user:change_this_password@127.0.0.1:5432/hjyxpjzs
JWT_SECRET=change_this_to_a_long_random_string
CORS_ORIGIN=http://127.0.0.1:8788
```

- [ ] **Step 4: 创建 `server/src/config.js`**

```javascript
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
```

- [ ] **Step 5: 创建 `server/src/app.js`**

```javascript
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
```

- [ ] **Step 6: 创建 `server/src/server.js`**

```javascript
import { createApp } from "./app.js";
import { assertRuntimeConfig, config } from "./config.js";

assertRuntimeConfig();

const app = createApp();

app.listen(config.port, () => {
  console.log(`HJYXPJZS API listening on http://127.0.0.1:${config.port}`);
});
```

- [ ] **Step 7: 创建健康检查测试 `server/tests/health.test.mjs`**

```javascript
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
```

- [ ] **Step 8: 运行后端测试**

Run:

```powershell
npm test
```

Working directory:

```text
C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server
```

Expected:

```text
pass 1
fail 0
```

- [ ] **Step 9: 提交后端骨架**

Run:

```powershell
git add server/package.json server/package-lock.json server/.env.example server/src/config.js server/src/app.js server/src/server.js server/tests/health.test.mjs
git commit -m "Add Aliyun backend server scaffold"
```

Expected: 生成提交。

---

### Task 2: 增加 PostgreSQL 建表 SQL

**Files:**
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\sql\001_init.sql`

- [ ] **Step 1: 创建 `server/sql/001_init.sql`**

```sql
create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_name text not null,
  category_id text not null default 'pig-farming',
  form_data jsonb not null default '{}'::jsonb,
  assessment jsonb not null default '{}'::jsonb,
  drafts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create index if not exists projects_user_id_updated_at_idx
on public.projects (user_id, updated_at desc);
```

- [ ] **Step 2: 检查 SQL 不包含真实密钥**

Run:

```powershell
Select-String -Path server\sql\001_init.sql -Pattern 'password=|JWT_SECRET|AK|SK|service_role'
```

Expected: 无输出。

- [ ] **Step 3: 提交 SQL**

Run:

```powershell
git add server/sql/001_init.sql
git commit -m "Add Aliyun PostgreSQL schema"
```

Expected: 生成提交。

---

### Task 3: 增加数据库连接和仓库层

**Files:**
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\src\db.js`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\src\repositories\userRepository.js`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\src\repositories\projectRepository.js`

- [ ] **Step 1: 创建 `server/src/db.js`**

```javascript
import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

export function createPool() {
  return new Pool({
    connectionString: config.databaseUrl
  });
}
```

- [ ] **Step 2: 创建 `server/src/repositories/userRepository.js`**

```javascript
export function createUserRepository(pool) {
  return {
    async createUser({ email, passwordHash }) {
      const result = await pool.query(
        `insert into public.users (email, password_hash)
         values ($1, $2)
         returning id, email, created_at`,
        [email, passwordHash]
      );
      return result.rows[0];
    },

    async findByEmail(email) {
      const result = await pool.query(
        `select id, email, password_hash, created_at
         from public.users
         where email = $1`,
        [email]
      );
      return result.rows[0] ?? null;
    },

    async findById(id) {
      const result = await pool.query(
        `select id, email, created_at
         from public.users
         where id = $1`,
        [id]
      );
      return result.rows[0] ?? null;
    }
  };
}
```

- [ ] **Step 3: 创建 `server/src/repositories/projectRepository.js`**

```javascript
export function createProjectRepository(pool) {
  return {
    async listByUser(userId) {
      const result = await pool.query(
        `select id, project_name, category_id, created_at, updated_at
         from public.projects
         where user_id = $1
         order by updated_at desc`,
        [userId]
      );
      return result.rows;
    },

    async createProject({ userId, projectName, categoryId, formData, assessment, drafts }) {
      const result = await pool.query(
        `insert into public.projects (user_id, project_name, category_id, form_data, assessment, drafts)
         values ($1, $2, $3, $4, $5, $6)
         returning *`,
        [userId, projectName, categoryId, formData, assessment, drafts]
      );
      return result.rows[0];
    },

    async findByIdForUser({ projectId, userId }) {
      const result = await pool.query(
        `select *
         from public.projects
         where id = $1 and user_id = $2`,
        [projectId, userId]
      );
      return result.rows[0] ?? null;
    },

    async updateProject({ projectId, userId, projectName, categoryId, formData, assessment, drafts }) {
      const result = await pool.query(
        `update public.projects
         set project_name = $3,
             category_id = $4,
             form_data = $5,
             assessment = $6,
             drafts = $7
         where id = $1 and user_id = $2
         returning *`,
        [projectId, userId, projectName, categoryId, formData, assessment, drafts]
      );
      return result.rows[0] ?? null;
    }
  };
}
```

- [ ] **Step 4: 运行后端测试**

Run:

```powershell
npm test
```

Working directory:

```text
C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server
```

Expected: PASS。

- [ ] **Step 5: 提交数据库连接和仓库层**

Run:

```powershell
git add server/src/db.js server/src/repositories/userRepository.js server/src/repositories/projectRepository.js
git commit -m "Add backend database repositories"
```

Expected: 生成提交。

---

### Task 4: 增加认证模块和认证接口

**Files:**
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\src\auth.js`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\src\routes\authRoutes.js`
- Modify: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\src\app.js`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\tests\auth.test.mjs`

- [ ] **Step 1: 创建认证测试 `server/tests/auth.test.mjs`**

```javascript
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
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm test
```

Working directory:

```text
C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server
```

Expected: FAIL，原因是 `/api/auth/register`、`/api/auth/login`、`/api/auth/me` 尚未挂载。

- [ ] **Step 3: 创建 `server/src/auth.js`**

```javascript
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
```

- [ ] **Step 4: 创建 `server/src/routes/authRoutes.js`**

```javascript
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
```

- [ ] **Step 5: 修改 `server/src/app.js`**

```javascript
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
```

- [ ] **Step 6: 运行后端测试确认通过**

Run:

```powershell
npm test
```

Working directory:

```text
C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server
```

Expected: PASS。

- [ ] **Step 7: 提交认证功能**

Run:

```powershell
git add server/src/auth.js server/src/routes/authRoutes.js server/src/app.js server/tests/auth.test.mjs
git commit -m "Add backend email auth"
```

Expected: 生成提交。

---

### Task 5: 增加项目接口和权限测试

**Files:**
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\src\routes\projectRoutes.js`
- Modify: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\src\app.js`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server\tests\projects.test.mjs`

- [ ] **Step 1: 创建项目接口测试 `server/tests/projects.test.mjs`**

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.js";

function createMemoryRepositories() {
  const users = [];
  const projects = [];
  return {
    userRepository: {
      async createUser({ email, passwordHash }) {
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
    projectRepository: {
      async listByUser(userId) {
        return projects.filter((project) => project.user_id === userId);
      },
      async createProject({ userId, projectName, categoryId, formData, assessment, drafts }) {
        const now = new Date().toISOString();
        const project = {
          id: `project-${projects.length + 1}`,
          user_id: userId,
          project_name: projectName,
          category_id: categoryId,
          form_data: formData,
          assessment,
          drafts,
          created_at: now,
          updated_at: now
        };
        projects.push(project);
        return project;
      },
      async findByIdForUser({ projectId, userId }) {
        return projects.find((project) => project.id === projectId && project.user_id === userId) ?? null;
      },
      async updateProject({ projectId, userId, projectName, categoryId, formData, assessment, drafts }) {
        const project = projects.find((item) => item.id === projectId && item.user_id === userId);
        if (!project) {
          return null;
        }
        project.project_name = projectName;
        project.category_id = categoryId;
        project.form_data = formData;
        project.assessment = assessment;
        project.drafts = drafts;
        project.updated_at = new Date().toISOString();
        return project;
      }
    }
  };
}

async function register(app, email) {
  const response = await request(app)
    .post("/api/auth/register")
    .send({ email, password: "123456" })
    .expect(201);
  return response.body.token;
}

test("未登录不能访问项目接口", async () => {
  const app = createApp({
    repositories: createMemoryRepositories(),
    jwtSecret: "test-secret"
  });

  await request(app).get("/api/projects").expect(401);
});

test("用户可以保存、列出、打开并更新自己的项目", async () => {
  const app = createApp({
    repositories: createMemoryRepositories(),
    jwtSecret: "test-secret"
  });
  const token = await register(app, "teacher@example.com");

  const createResponse = await request(app)
    .post("/api/projects")
    .set("Authorization", `Bearer ${token}`)
    .send({
      projectName: "某生猪养殖项目",
      categoryId: "pig-farming",
      formData: { projectName: "某生猪养殖项目", annualOutput: "6000" },
      assessment: { level: "报告书关注" },
      drafts: { "basic-info": "章节草稿" }
    })
    .expect(201);

  assert.equal(createResponse.body.project.project_name, "某生猪养殖项目");

  const listResponse = await request(app)
    .get("/api/projects")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(listResponse.body.projects.length, 1);

  const projectId = createResponse.body.project.id;
  const openResponse = await request(app)
    .get(`/api/projects/${projectId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  assert.equal(openResponse.body.project.form_data.annualOutput, "6000");

  const updateResponse = await request(app)
    .put(`/api/projects/${projectId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      projectName: "更新后的生猪养殖项目",
      categoryId: "pig-farming",
      formData: { projectName: "更新后的生猪养殖项目", annualOutput: "8000" },
      assessment: { level: "报告书关注" },
      drafts: { "basic-info": "更新草稿" }
    })
    .expect(200);

  assert.equal(updateResponse.body.project.project_name, "更新后的生猪养殖项目");
});

test("用户不能打开其他用户的项目", async () => {
  const app = createApp({
    repositories: createMemoryRepositories(),
    jwtSecret: "test-secret"
  });
  const ownerToken = await register(app, "owner@example.com");
  const otherToken = await register(app, "other@example.com");

  const createResponse = await request(app)
    .post("/api/projects")
    .set("Authorization", `Bearer ${ownerToken}`)
    .send({
      projectName: "业主项目",
      categoryId: "pig-farming",
      formData: {},
      assessment: {},
      drafts: {}
    })
    .expect(201);

  await request(app)
    .get(`/api/projects/${createResponse.body.project.id}`)
    .set("Authorization", `Bearer ${otherToken}`)
    .expect(404);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm test
```

Expected: FAIL，原因是项目路由尚未创建。

- [ ] **Step 3: 创建 `server/src/routes/projectRoutes.js`**

```javascript
import express from "express";
import { requireAuth } from "../auth.js";

export function createProjectRouter({ userRepository, projectRepository, jwtSecret }) {
  const router = express.Router();
  const authRequired = requireAuth({ userRepository, jwtSecret });

  router.use(authRequired);

  router.get("/", async (request, response, next) => {
    try {
      const projects = await projectRepository.listByUser(request.user.id);
      response.json({ projects });
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (request, response, next) => {
    try {
      const payload = normalizeProjectPayload(request.body);
      const project = await projectRepository.createProject({
        userId: request.user.id,
        ...payload
      });
      response.status(201).json({ project });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (request, response, next) => {
    try {
      const project = await projectRepository.findByIdForUser({
        projectId: request.params.id,
        userId: request.user.id
      });

      if (!project) {
        response.status(404).json({ error: "项目不存在或无权访问。" });
        return;
      }

      response.json({ project });
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", async (request, response, next) => {
    try {
      const payload = normalizeProjectPayload(request.body);
      const project = await projectRepository.updateProject({
        projectId: request.params.id,
        userId: request.user.id,
        ...payload
      });

      if (!project) {
        response.status(404).json({ error: "项目不存在或无权访问。" });
        return;
      }

      response.json({ project });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function normalizeProjectPayload(body) {
  return {
    projectName: String(body.projectName ?? "").trim() || "未命名环评项目",
    categoryId: String(body.categoryId ?? "pig-farming").trim() || "pig-farming",
    formData: body.formData && typeof body.formData === "object" ? body.formData : {},
    assessment: body.assessment && typeof body.assessment === "object" ? body.assessment : {},
    drafts: body.drafts && typeof body.drafts === "object" ? body.drafts : {}
  };
}
```

- [ ] **Step 4: 修改 `server/src/app.js` 挂载项目路由**

```javascript
import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { createPool } from "./db.js";
import { createUserRepository } from "./repositories/userRepository.js";
import { createProjectRepository } from "./repositories/projectRepository.js";
import { createAuthRouter } from "./routes/authRoutes.js";
import { createProjectRouter } from "./routes/projectRoutes.js";

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

  app.use("/api/projects", createProjectRouter({
    userRepository: repositories.userRepository,
    projectRepository: repositories.projectRepository,
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
```

- [ ] **Step 5: 运行后端测试确认通过**

Run:

```powershell
npm test
```

Expected: PASS。

- [ ] **Step 6: 提交项目接口**

Run:

```powershell
git add server/src/routes/projectRoutes.js server/src/app.js server/tests/projects.test.mjs
git commit -m "Add authenticated project API"
```

Expected: 生成提交。

---

### Task 6: 增加前端 API 客户端

**Files:**
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\scripts\apiConfig.js`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\scripts\apiClient.js`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\scripts\projectApi.js`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\tests\apiClient.test.mjs`
- Modify: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\package.json`

- [ ] **Step 1: 修改根目录 `package.json` 测试命令**

```json
{
  "name": "hjyxpjzs",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.mjs"
  }
}
```

- [ ] **Step 2: 创建 `scripts/apiConfig.js`**

```javascript
export const apiConfig = {
  baseUrl: "http://127.0.0.1:3001"
};
```

- [ ] **Step 3: 创建 `tests/apiClient.test.mjs`**

```javascript
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
```

- [ ] **Step 4: 运行根目录测试确认失败**

Run:

```powershell
npm test
```

Working directory:

```text
C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS
```

Expected: FAIL，原因是 `scripts/apiClient.js` 尚未创建。

- [ ] **Step 5: 创建 `scripts/apiClient.js`**

```javascript
import { apiConfig } from "./apiConfig.js";

export function createApiClient(options = {}) {
  const baseUrl = options.baseUrl ?? apiConfig.baseUrl;
  const getToken = options.getToken ?? (() => localStorage.getItem("hjyxpjzs_token"));
  const fetchImpl = options.fetchImpl ?? fetch;

  async function request(path, requestOptions = {}) {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(requestOptions.headers ?? {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...requestOptions,
      headers
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "请求失败。");
    }

    return data;
  }

  return {
    get(path) {
      return request(path);
    },
    post(path, body) {
      return request(path, {
        method: "POST",
        body: JSON.stringify(body)
      });
    },
    put(path, body) {
      return request(path, {
        method: "PUT",
        body: JSON.stringify(body)
      });
    }
  };
}

export const apiClient = createApiClient();
```

- [ ] **Step 6: 创建 `scripts/projectApi.js`**

```javascript
import { apiClient } from "./apiClient.js";

export async function register(email, password) {
  return apiClient.post("/api/auth/register", { email, password });
}

export async function login(email, password) {
  return apiClient.post("/api/auth/login", { email, password });
}

export async function getMe() {
  return apiClient.get("/api/auth/me");
}

export async function listProjects() {
  return apiClient.get("/api/projects");
}

export async function createProject(payload) {
  return apiClient.post("/api/projects", payload);
}

export async function loadProject(projectId) {
  return apiClient.get(`/api/projects/${projectId}`);
}

export async function updateProject(projectId, payload) {
  return apiClient.put(`/api/projects/${projectId}`, payload);
}
```

- [ ] **Step 7: 运行根目录测试确认通过**

Run:

```powershell
npm test
```

Expected: PASS。

- [ ] **Step 8: 提交前端 API 客户端**

Run:

```powershell
git add package.json scripts/apiConfig.js scripts/apiClient.js scripts/projectApi.js tests/apiClient.test.mjs
git commit -m "Add frontend API client"
```

Expected: 生成提交。

---

### Task 7: 接入前端云端项目 UI

**Files:**
- Modify: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\index.html`
- Modify: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\style.css`
- Modify: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\scripts\app.js`

- [ ] **Step 1: 在 `index.html` hero 面板后增加云端区域**

Insert after `</section>` of `<section class="panel hero-panel">`:

```html
        <section class="panel cloud-panel">
          <div class="section-heading">
            <h3>云端账号与项目</h3>
            <span id="cloudStatus">未登录</span>
          </div>
          <div class="cloud-grid">
            <label class="field">
              <span>邮箱</span>
              <input id="authEmail" type="email" placeholder="用于登录和保存项目" />
            </label>
            <label class="field">
              <span>密码</span>
              <input id="authPassword" type="password" placeholder="至少 6 位" />
            </label>
          </div>
          <div class="cloud-actions">
            <button id="signInButton" type="button">登录</button>
            <button id="signUpButton" type="button">注册</button>
            <button id="signOutButton" type="button">退出</button>
            <button id="saveProjectButton" type="button">保存当前项目</button>
          </div>
          <p id="cloudMessage" class="cloud-message">启动后端后，可以注册账号并保存项目。</p>
          <div id="projectList" class="project-list"></div>
        </section>
```

- [ ] **Step 2: 在 `style.css` 末尾追加云端样式**

```css
.cloud-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.cloud-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.cloud-actions button {
  border: 0;
  border-radius: 6px;
  background: var(--accent);
  color: #ffffff;
  cursor: pointer;
  padding: 10px 14px;
  font-weight: 700;
}

.cloud-actions button:disabled {
  background: #c9d6cd;
  cursor: not-allowed;
}

.cloud-message {
  margin: 14px 0 0;
}

.project-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.project-list button {
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fbfdfb;
  color: var(--text);
  cursor: pointer;
  padding: 10px 12px;
  text-align: left;
}

@media (max-width: 900px) {
  .cloud-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: 修改 `scripts/app.js` 导入 API**

Add:

```javascript
import {
  createProject,
  getMe,
  listProjects,
  loadProject,
  login,
  register,
  updateProject
} from "./projectApi.js";
```

- [ ] **Step 4: 修改 `scripts/app.js` 状态和 DOM**

Add to state:

```javascript
  projectId: null,
  currentUser: null,
  drafts: {}
```

Add DOM selectors:

```javascript
const cloudStatus = document.querySelector("#cloudStatus");
const authEmail = document.querySelector("#authEmail");
const authPassword = document.querySelector("#authPassword");
const signInButton = document.querySelector("#signInButton");
const signUpButton = document.querySelector("#signUpButton");
const signOutButton = document.querySelector("#signOutButton");
const saveProjectButton = document.querySelector("#saveProjectButton");
const cloudMessage = document.querySelector("#cloudMessage");
const projectList = document.querySelector("#projectList");
```

- [ ] **Step 5: 在 `render();` 后初始化云端功能**

```javascript
render();
initializeCloud();
```

- [ ] **Step 6: 在生成章节时保存草稿到状态**

Replace:

```javascript
draftOutput.textContent = generateSectionDraft(sectionId, state.formData);
```

With:

```javascript
const draft = generateSectionDraft(sectionId, state.formData);
state.drafts[sectionId] = draft;
draftOutput.textContent = draft;
```

- [ ] **Step 7: 在 `scripts/app.js` 末尾增加云端函数**

```javascript
async function initializeCloud() {
  bindCloudEvents();

  if (!localStorage.getItem("hjyxpjzs_token")) {
    renderCloudState("未登录", "启动后端后，可以注册账号并保存项目。");
    return;
  }

  await runCloudAction(async () => {
    const result = await getMe();
    state.currentUser = result.user;
    await refreshProjectList();
    renderCloudState();
  });
}

function bindCloudEvents() {
  signUpButton.addEventListener("click", async () => {
    await runCloudAction(async () => {
      const result = await register(authEmail.value, authPassword.value);
      localStorage.setItem("hjyxpjzs_token", result.token);
      state.currentUser = result.user;
      await refreshProjectList();
      renderCloudState("注册成功", `当前账号：${state.currentUser.email}`);
    });
  });

  signInButton.addEventListener("click", async () => {
    await runCloudAction(async () => {
      const result = await login(authEmail.value, authPassword.value);
      localStorage.setItem("hjyxpjzs_token", result.token);
      state.currentUser = result.user;
      await refreshProjectList();
      renderCloudState("登录成功", `当前账号：${state.currentUser.email}`);
    });
  });

  signOutButton.addEventListener("click", () => {
    localStorage.removeItem("hjyxpjzs_token");
    state.currentUser = null;
    state.projectId = null;
    projectList.innerHTML = "";
    renderCloudState("已退出", "当前为未登录状态。");
  });

  saveProjectButton.addEventListener("click", async () => {
    await runCloudAction(async () => {
      if (!state.currentUser) {
        renderCloudState("请先登录", "登录后才能保存项目到云端。");
        return;
      }

      const payload = {
        projectName: state.formData.projectName,
        categoryId: state.selectedItemId,
        formData: state.formData,
        assessment: assessPigFarmCategory(state.formData),
        drafts: state.drafts
      };
      const result = state.projectId
        ? await updateProject(state.projectId, payload)
        : await createProject(payload);

      state.projectId = result.project.id;
      await refreshProjectList();
      renderCloudState("保存成功", `项目已保存：${result.project.project_name}`);
    });
  });
}

async function runCloudAction(action) {
  try {
    await action();
  } catch (error) {
    renderCloudState("操作失败", error.message);
  }
}

function renderCloudState(status = null, message = null) {
  cloudStatus.textContent = status ?? (state.currentUser ? `已登录：${state.currentUser.email}` : "未登录");
  cloudMessage.textContent = message ?? (state.currentUser ? "可以保存和读取你的云端项目。" : "请登录后保存项目。");
  signOutButton.disabled = !state.currentUser;
  saveProjectButton.disabled = !state.currentUser;
  signInButton.disabled = Boolean(state.currentUser);
  signUpButton.disabled = Boolean(state.currentUser);
}

async function refreshProjectList() {
  const result = await listProjects();
  projectList.innerHTML = result.projects.length
    ? result.projects.map(renderProjectListItem).join("")
    : `<p class="cloud-message">还没有云端项目。</p>`;

  projectList.querySelectorAll("[data-project-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      await runCloudAction(async () => {
        const result = await loadProject(button.dataset.projectId);
        const project = result.project;
        state.projectId = project.id;
        state.selectedItemId = project.category_id;
        state.formData = project.form_data ?? {};
        state.drafts = project.drafts ?? {};
        render();
        renderCloudState("项目已打开", `正在编辑：${project.project_name}`);
      });
    });
  });
}

function renderProjectListItem(project) {
  return `
    <button type="button" data-project-id="${project.id}">
      ${escapeHtml(project.project_name)}
      <br />
      <small>${new Date(project.updated_at).toLocaleString()}</small>
    </button>
  `;
}
```

- [ ] **Step 8: 运行根目录测试**

Run:

```powershell
npm test
```

Expected: PASS。

- [ ] **Step 9: 提交前端云端 UI**

Run:

```powershell
git add index.html style.css scripts/app.js
git commit -m "Connect frontend to Aliyun backend API"
```

Expected: 生成提交。

---

### Task 8: 本地端到端验证

**Files:**
- No file changes required.

- [ ] **Step 1: 准备本地 PostgreSQL 或临时跳过真实数据库验证**

If local PostgreSQL is available, create database and run:

```powershell
psql "$env:DATABASE_URL" -f server/sql/001_init.sql
```

If local PostgreSQL is not available, skip database-backed manual verification and keep automated API tests as current local verification. Record this limitation in final report.

- [ ] **Step 2: 设置本地后端环境变量**

Run in PowerShell:

```powershell
$env:PORT="3001"
$env:DATABASE_URL="postgres://hjyxpjzs_user:change_this_password@127.0.0.1:5432/hjyxpjzs"
$env:JWT_SECRET="local_development_secret_at_least_32_chars"
$env:CORS_ORIGIN="http://127.0.0.1:8788"
```

- [ ] **Step 3: 启动后端**

Run:

```powershell
npm start
```

Working directory:

```text
C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server
```

Expected:

```text
HJYXPJZS API listening on http://127.0.0.1:3001
```

- [ ] **Step 4: 启动前端**

Run in another terminal:

```powershell
python -m http.server 8788
```

Working directory:

```text
C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS
```

Open:

```text
http://127.0.0.1:8788/
```

- [ ] **Step 5: 手动验证**

Expected:

```text
注册账号成功
登录状态显示当前邮箱
填写生猪养殖项目成功
生成章节草稿成功
保存当前项目成功
刷新页面后登录仍可读取项目列表
点击项目后表单恢复
```

---

### Task 9: 更新 README 和阿里云部署说明

**Files:**
- Modify: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\README.md`

- [ ] **Step 1: 在 README 增加 V1 阿里云后端说明**

Add:

```markdown
## V1 阿里云真实后台

V1 后端采用：

```text
前端页面 -> Node.js/Express 后端 API -> 阿里云 RDS PostgreSQL
```

本地开发时需要两个服务：

```text
前端：http://127.0.0.1:8788/
后端：http://127.0.0.1:3001/
```

后端环境变量示例：

```text
server/.env.example
```

数据库建表脚本：

```text
server/sql/001_init.sql
```

注意：真实的 `DATABASE_URL`、`JWT_SECRET`、数据库密码、云平台 AK/SK 不能提交到 GitHub。
```

- [ ] **Step 2: 更新 README 文件用途表**

Add rows:

```markdown
| `server/package.json` | 后端项目配置 | 定义 Express 后端依赖和测试命令 |
| `server/src/app.js` | 后端应用入口 | 创建 Express 应用并挂载 API 路由 |
| `server/src/server.js` | 后端启动入口 | 本地或 SAE 启动 HTTP 服务 |
| `server/src/config.js` | 后端配置读取 | 从环境变量读取端口、数据库地址、JWT 密钥 |
| `server/src/db.js` | 数据库连接 | 创建 PostgreSQL 连接池 |
| `server/src/auth.js` | 后端认证模块 | 负责密码哈希、JWT 签发、登录校验 |
| `server/src/routes/authRoutes.js` | 账号 API | 注册、登录、获取当前用户 |
| `server/src/routes/projectRoutes.js` | 项目 API | 保存项目、读取列表、打开项目、更新项目 |
| `server/sql/001_init.sql` | 数据库建表 SQL | 创建用户表和项目表 |
| `scripts/apiConfig.js` | 前端 API 配置 | 保存后端 API 基础地址 |
| `scripts/apiClient.js` | 前端请求客户端 | 统一处理 JSON 请求和 token |
| `scripts/projectApi.js` | 前端项目 API | 封装注册、登录、项目保存和读取 |
```

- [ ] **Step 3: 运行测试**

Run:

```powershell
npm test
npm test
```

First working directory:

```text
C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS
```

Second working directory:

```text
C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server
```

Expected: 两边 PASS。

- [ ] **Step 4: 提交 README**

Run:

```powershell
git add README.md
git commit -m "Document Aliyun backend V1"
```

Expected: 生成提交。

---

### Task 10: 最终自检和推送

**Files:**
- No file changes required unless verification finds a problem.

- [ ] **Step 1: 运行最终测试**

Run:

```powershell
npm test
```

Working directory:

```text
C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS
```

Run:

```powershell
npm test
```

Working directory:

```text
C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\server
```

Expected: 两边 PASS。

- [ ] **Step 2: 检查敏感信息**

Run:

```powershell
Select-String -Path .\* -Pattern 'service_role|AKIA|aliyun_secret|JWT_SECRET=.*[A-Za-z0-9]{20,}|password=' -Recurse
```

Expected: 不出现真实密钥。`server/.env.example` 中的示例值可以出现。

- [ ] **Step 3: 检查 Git 状态**

Run:

```powershell
git status --short --branch
```

Expected: 工作区干净。

- [ ] **Step 4: 推送分支**

Run:

```powershell
git push -u origin v1-aliyun-backend
```

Expected: 推送成功。

---

## 自检结果

- Spec coverage：覆盖阿里云 SAE + RDS 路线、后端 API、登录、JWT、项目保存、项目隔离、前端接入、README 和部署说明。
- Scope check：不做组织、管理员后台、智能体、向量库、Word/PDF、支付、备案域名，符合 V1 范围。
- Secret check：计划只写 `.env.example`，真实 `DATABASE_URL`、`JWT_SECRET`、数据库密码、云平台 AK/SK 不提交。
- Type consistency：后端使用 `project_name`、`category_id`、`form_data`、`assessment`、`drafts`；前端 payload 使用 `projectName`、`categoryId`、`formData`，由路由层转换。
