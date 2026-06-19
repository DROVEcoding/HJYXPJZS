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
