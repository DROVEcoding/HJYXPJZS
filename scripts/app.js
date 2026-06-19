import { categories, corpusSummary, projectFields, reportSections } from "./data.js";
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
  formData: {}
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

render();

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
      draftStatus.textContent = section?.title ?? "章节草稿";
      draftOutput.textContent = generateSectionDraft(sectionId, state.formData);
    });
  });
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
