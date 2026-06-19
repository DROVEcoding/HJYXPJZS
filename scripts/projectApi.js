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
