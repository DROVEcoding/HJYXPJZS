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
