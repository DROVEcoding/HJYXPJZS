import { categories, corpusSummary, projectFields, reportSections } from "./data.js";
import {
  createProject,
  getMe,
  listProjects,
  loadProject,
  login,
  register,
  updateProject
} from "./projectApi.js";
import {
  assessPigFarmCategory,
  canGenerateSection,
  generateSectionDraft,
  getFieldLabel,
  getMissingFields,
  normalizeProjectInput
} from "./logic.js";

const state = {
  selectedItemId: "pig-farming",
  formData: {},
  projectId: null,
  currentUser: null,
  drafts: {}
};

const categoryNav = document.querySelector("#categoryNav");
const workspaceTitle = document.querySelector("#workspaceTitle");
const workspaceIntro = document.querySelector("#workspaceIntro");
const noticePanel = document.querySelector("#noticePanel");
const projectForm = document.querySelector("#projectForm");
const assessmentResult = document.querySelector("#assessmentResult");
const sectionList = document.querySelector("#sectionList");
const draftOutput = document.querySelector("#draftOutput");
const draftStatus = document.querySelector("#draftStatus");
const cloudStatus = document.querySelector("#cloudStatus");
const authEmail = document.querySelector("#authEmail");
const authPassword = document.querySelector("#authPassword");
const signInButton = document.querySelector("#signInButton");
const signUpButton = document.querySelector("#signUpButton");
const signOutButton = document.querySelector("#signOutButton");
const saveProjectButton = document.querySelector("#saveProjectButton");
const cloudMessage = document.querySelector("#cloudMessage");
const projectList = document.querySelector("#projectList");

render();
initializeCloud();

function render() {
  renderCategories();
  renderWorkspace();
  renderForm();
  renderAssessment();
  renderSections();
}

function renderCategories() {
  categoryNav.innerHTML = categories
    .map((category) => {
      const items = category.items
        .map((item) => {
          const activeClass = item.id === state.selectedItemId ? " active" : "";
          const disabled = item.available ? "" : " disabled";
          return `<button class="category-item${activeClass}" data-item-id="${item.id}"${disabled}>${item.name}</button>`;
        })
        .join("");

      return `<section class="category-group"><h2 class="category-title">${category.name}</h2>${items}</section>`;
    })
    .join("");

  categoryNav.querySelectorAll(".category-item").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedItemId = button.dataset.itemId;
      state.projectId = null;
      state.drafts = {};
      draftOutput.textContent = "选择可生成章节并补齐资料后，草稿会显示在这里。";
      draftStatus.textContent = "等待生成";
      render();
    });
  });
}

function renderWorkspace() {
  const selected = findSelectedItem();
  workspaceTitle.textContent = selected?.name ?? "请选择左侧分项";

  if (selected?.id === "pig-farming") {
    workspaceIntro.textContent = "当前开放分项：畜牧业 -> 生猪养殖。请填写项目信息，系统会提示缺少资料并生成章节草稿。";
    noticePanel.innerHTML = `
      <strong>语料摘要：</strong>${corpusSummary.sourceName}，包含 ${corpusSummary.caseCount} 个案例、${corpusSummary.chunkCount} 个文本块。
      常见污染因子包括：${corpusSummary.commonPollutants.slice(0, 6).join("、")}。
      常见处理工艺包括：${corpusSummary.commonProcesses.slice(0, 6).join("、")}。
      <br />提示：本 demo 使用规则模板和语料摘要生成章节草稿，只用于流程演示，不替代正式环评文件。
    `;
    return;
  }

  workspaceIntro.textContent = "该分项暂未开放。";
  noticePanel.textContent = "请选择“畜牧业 -> 生猪养殖”体验完整 demo。";
}

function renderForm() {
  projectForm.innerHTML = projectFields.map(renderField).join("");

  projectForm.querySelectorAll("input, select").forEach((field) => {
    field.addEventListener("input", () => {
      state.formData[field.name] = field.value;
      renderAssessment();
      renderSections();
    });
  });
}

function renderField(field) {
  const value = state.formData[field.id] ?? "";

  if (field.type === "select") {
    return `
      <div class="field">
        <label for="${field.id}">${field.label}</label>
        <select id="${field.id}" name="${field.id}">
          <option value="">请选择</option>
          <option value="no"${value === "no" ? " selected" : ""}>否</option>
          <option value="yes"${value === "yes" ? " selected" : ""}>是</option>
        </select>
      </div>
    `;
  }

  return `
    <div class="field">
      <label for="${field.id}">${field.label}</label>
      <input id="${field.id}" name="${field.id}" type="${field.type ?? "text"}" value="${escapeHtml(value)}" placeholder="${field.placeholder ?? ""}" />
    </div>
  `;
}

function renderAssessment() {
  const assessment = assessPigFarmCategory(state.formData);
  assessmentResult.innerHTML = `
    <p class="assessment-level">${assessment.level}</p>
    <p>${assessment.reason}</p>
    <p class="legal-notice">${assessment.legalNotice}</p>
  `;
}

function renderSections() {
  const input = normalizeProjectInput(state.formData);
  sectionList.innerHTML = reportSections
    .map((section) => {
      const missing = getMissingFields(section, input);
      const isReady = section.canGenerate && canGenerateSection(section.id, input);
      const status = section.canGenerate
        ? isReady
          ? "可以生成"
          : "资料不完整"
        : "后续开放";
      const missingHtml = missing.length
        ? `<ul class="missing-list">${missing.map((fieldId) => `<li>${getFieldLabel(fieldId)}</li>`).join("")}</ul>`
        : `<p class="missing-list">资料已补齐。</p>`;

      return `
        <article class="report-section">
          <header>
            <h4>${section.title}</h4>
            <span class="status-pill${isReady ? "" : " blocked"}">${status}</span>
          </header>
          ${missingHtml}
          <button class="generate-button" data-section-id="${section.id}"${isReady ? "" : " disabled"}>生成本章节</button>
        </article>
      `;
    })
    .join("");

  sectionList.querySelectorAll(".generate-button").forEach((button) => {
    button.addEventListener("click", () => {
      const sectionId = button.dataset.sectionId;
      const section = reportSections.find((item) => item.id === sectionId);
      const draft = generateSectionDraft(sectionId, state.formData);
      state.drafts[sectionId] = draft;
      draftStatus.textContent = section?.title ?? "章节草稿";
      draftOutput.textContent = draft;
    });
  });
}

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

function findSelectedItem() {
  return categories.flatMap((category) => category.items).find((item) => item.id === state.selectedItemId);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
