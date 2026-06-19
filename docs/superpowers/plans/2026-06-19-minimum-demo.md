# 环境影响评价助手最小 Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个静态前端最小 demo：左侧保留环评分类骨架，右侧实现“畜牧业 -> 生猪养殖”的资料缺失检查、环评类别辅助判断和章节草稿生成。

**Architecture:** 第一版不做真实后端、登录、数据库和大模型。业务规则拆到 `scripts/data.js` 和 `scripts/logic.js`，页面事件放在 `scripts/app.js`，这样后续接后端智能体时可以替换生成逻辑而不重写页面。

**Tech Stack:** HTML、CSS、原生 JavaScript ES modules、Node.js 内置 `node:test`、Python `http.server` 本地预览。

---

## 文件结构

项目根目录：

`C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS`

计划创建这些文件：

| 文件 | 责任 |
|---|---|
| `index.html` | 页面结构：左侧分类、右侧工作区、表单、章节列表 |
| `style.css` | 页面视觉、表格、卡片、移动端适配 |
| `scripts/data.js` | 环评分类骨架、字段配置、报告章节配置 |
| `scripts/logic.js` | 可测试的纯逻辑：类别辅助判断、缺失资料、章节生成 |
| `scripts/app.js` | 浏览器交互：渲染分类、读取表单、绑定按钮、更新页面 |
| `tests/logic.test.mjs` | Node 测试：验证业务逻辑不靠浏览器也能跑 |
| `README.md` | 中文说明、运行方式、英文文件中文用途表 |

---

### Task 1: 创建分类和章节数据

**Files:**
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\scripts\data.js`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\tests\logic.test.mjs`

- [ ] **Step 1: 创建目录**

Run:

```powershell
New-Item -ItemType Directory -Force -Path scripts, tests
```

Expected: 创建 `scripts` 和 `tests` 目录。

- [ ] **Step 2: 写入分类和章节数据**

Create `scripts/data.js`:

```javascript
export const categories = [
  {
    id: "agriculture-forestry",
    name: "农业、林业",
    items: [{ id: "future-agriculture", name: "后续开放", available: false }]
  },
  {
    id: "animal-husbandry",
    name: "畜牧业",
    items: [{ id: "pig-farming", name: "生猪养殖", available: true }]
  },
  {
    id: "fishery",
    name: "渔业",
    items: [{ id: "future-fishery", name: "后续开放", available: false }]
  },
  {
    id: "mining",
    name: "采矿业",
    items: [{ id: "future-mining", name: "后续开放", available: false }]
  },
  {
    id: "manufacturing",
    name: "制造业",
    items: [{ id: "future-manufacturing", name: "后续开放", available: false }]
  },
  {
    id: "utilities",
    name: "电力、热力、燃气及水生产供应",
    items: [{ id: "future-utilities", name: "后续开放", available: false }]
  },
  {
    id: "transport",
    name: "交通运输、仓储、邮政",
    items: [{ id: "future-transport", name: "后续开放", available: false }]
  },
  {
    id: "social-services",
    name: "社会事业与服务业",
    items: [{ id: "future-social-services", name: "后续开放", available: false }]
  },
  {
    id: "marine-engineering",
    name: "海洋工程",
    items: [{ id: "future-marine", name: "后续开放", available: false }]
  },
  {
    id: "nuclear-radiation",
    name: "核与辐射",
    items: [{ id: "future-nuclear", name: "后续开放", available: false }]
  }
];

export const projectFields = [
  { id: "projectName", label: "项目名称", placeholder: "例：某某年出栏6000头生猪养殖项目" },
  { id: "location", label: "建设地点", placeholder: "例：某省某市某县某村" },
  { id: "annualOutput", label: "年出栏生猪数量", type: "number", placeholder: "例：6000" },
  { id: "stock", label: "存栏生猪数量", type: "number", placeholder: "例：2800" },
  { id: "sensitiveArea", label: "是否涉及环境敏感区", type: "select" },
  { id: "manureTreatment", label: "粪污处理方式", placeholder: "例：干清粪、堆肥发酵、还田利用" },
  { id: "wastewaterTreatment", label: "废水处理方式", placeholder: "例：厌氧发酵、沉淀、农田消纳" },
  { id: "odorControl", label: "恶臭控制措施", placeholder: "例：加强通风、喷淋除臭、绿化隔离" }
];

export const reportSections = [
  {
    id: "basic-info",
    title: "建设项目基本情况",
    requiredFields: ["projectName", "location", "annualOutput", "stock"],
    canGenerate: true
  },
  {
    id: "engineering-analysis",
    title: "建设内容与工程分析",
    requiredFields: ["projectName", "annualOutput", "stock", "manureTreatment"],
    canGenerate: true
  },
  {
    id: "environment-status",
    title: "区域环境质量现状",
    requiredFields: ["location"],
    canGenerate: false
  },
  {
    id: "impact-measures",
    title: "主要环境影响和保护措施",
    requiredFields: ["manureTreatment", "wastewaterTreatment", "odorControl"],
    canGenerate: true
  },
  {
    id: "inspection-list",
    title: "环境保护措施监督检查清单",
    requiredFields: ["manureTreatment", "wastewaterTreatment", "odorControl"],
    canGenerate: false
  },
  {
    id: "conclusion",
    title: "结论",
    requiredFields: ["projectName"],
    canGenerate: false
  }
];
```

- [ ] **Step 3: 写第一组数据测试**

Create `tests/logic.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { categories, reportSections } from "../scripts/data.js";

test("分类骨架包含可用的生猪养殖分项", () => {
  const animalHusbandry = categories.find((category) => category.id === "animal-husbandry");
  assert.ok(animalHusbandry);
  assert.equal(animalHusbandry.name, "畜牧业");
  assert.deepEqual(animalHusbandry.items[0], {
    id: "pig-farming",
    name: "生猪养殖",
    available: true
  });
});

test("报告大纲包含六个章节，且三个章节可生成", () => {
  assert.equal(reportSections.length, 6);
  const generatable = reportSections.filter((section) => section.canGenerate);
  assert.deepEqual(
    generatable.map((section) => section.id),
    ["basic-info", "engineering-analysis", "impact-measures"]
  );
});
```

- [ ] **Step 4: 运行测试确认数据结构正确**

Run:

```powershell
node --test tests/logic.test.mjs
```

Expected: PASS，显示 2 个测试通过。

- [ ] **Step 5: 提交数据骨架**

Run:

```powershell
git add scripts/data.js tests/logic.test.mjs
git commit -m "Add demo data model"
```

Expected: 生成一个提交。

---

### Task 2: 实现可测试的业务逻辑

**Files:**
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\scripts\logic.js`
- Modify: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\tests\logic.test.mjs`

- [ ] **Step 1: 追加业务逻辑测试**

Append to `tests/logic.test.mjs`:

```javascript
import {
  assessPigFarmCategory,
  getMissingFields,
  generateSectionDraft
} from "../scripts/logic.js";

test("年出栏5000头及以上时提示关注报告书", () => {
  const result = assessPigFarmCategory({
    annualOutput: "6000",
    stock: "",
    sensitiveArea: "no"
  });

  assert.equal(result.level, "报告书关注");
  assert.match(result.reason, /年出栏生猪数量达到或超过5000头/);
  assert.equal(result.legalNotice.includes("辅助判断"), true);
});

test("缺失资料能按章节 requiredFields 计算", () => {
  const section = reportSections.find((item) => item.id === "impact-measures");
  const missing = getMissingFields(section, {
    manureTreatment: "堆肥发酵",
    wastewaterTreatment: "",
    odorControl: ""
  });

  assert.deepEqual(missing, ["wastewaterTreatment", "odorControl"]);
});

test("资料完整时可以生成主要环境影响和保护措施草稿", () => {
  const text = generateSectionDraft("impact-measures", {
    projectName: "某生猪养殖项目",
    manureTreatment: "干清粪后堆肥发酵并还田利用",
    wastewaterTreatment: "厌氧发酵后用于周边农田消纳",
    odorControl: "猪舍通风、喷淋除臭和场界绿化隔离"
  });

  assert.match(text, /某生猪养殖项目/);
  assert.match(text, /干清粪后堆肥发酵并还田利用/);
  assert.match(text, /厌氧发酵后用于周边农田消纳/);
  assert.match(text, /猪舍通风、喷淋除臭和场界绿化隔离/);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
node --test tests/logic.test.mjs
```

Expected: FAIL，原因是 `scripts/logic.js` 还不存在。

- [ ] **Step 3: 写最小业务逻辑**

Create `scripts/logic.js`:

```javascript
import { projectFields, reportSections } from "./data.js";

export function normalizeProjectInput(rawInput) {
  return Object.fromEntries(
    projectFields.map((field) => [field.id, String(rawInput[field.id] ?? "").trim()])
  );
}

export function assessPigFarmCategory(rawInput) {
  const input = normalizeProjectInput(rawInput);
  const annualOutput = Number(input.annualOutput || 0);
  const stock = Number(input.stock || 0);
  const sensitiveArea = input.sensitiveArea === "yes";

  if (annualOutput >= 5000) {
    return createAssessment(
      "报告书关注",
      "年出栏生猪数量达到或超过5000头，应重点关注环境影响报告书要求。"
    );
  }

  if (!annualOutput && stock >= 2500) {
    return createAssessment(
      "报告书关注",
      "未填写明确出栏量且存栏生猪数量达到或超过2500头，应重点关注环境影响报告书要求。"
    );
  }

  if (sensitiveArea) {
    return createAssessment(
      "敏感区审慎判断",
      "项目涉及环境敏感区，应结合正式名录、地方规定和专业判断提高审慎等级。"
    );
  }

  return createAssessment(
    "报告表或登记表关注",
    "当前输入未触发本 demo 的报告书关注条件，可能涉及报告表或登记表，仍需结合正式名录和地方规定判断。"
  );
}

export function getMissingFields(section, rawInput) {
  const input = normalizeProjectInput(rawInput);
  return section.requiredFields.filter((fieldId) => !input[fieldId]);
}

export function getFieldLabel(fieldId) {
  return projectFields.find((field) => field.id === fieldId)?.label ?? fieldId;
}

export function canGenerateSection(sectionId, rawInput) {
  const section = reportSections.find((item) => item.id === sectionId);
  if (!section || !section.canGenerate) {
    return false;
  }

  return getMissingFields(section, rawInput).length === 0;
}

export function generateSectionDraft(sectionId, rawInput) {
  const input = normalizeProjectInput(rawInput);

  if (sectionId === "basic-info") {
    return `《${input.projectName}》位于${input.location}。项目拟建设生猪养殖设施，年出栏规模为${input.annualOutput || "未填写"}头，存栏规模为${input.stock || "未填写"}头。本章节为根据用户输入生成的项目基本情况草稿，后续应补充用地、建设内容、周边环境敏感目标等资料。`;
  }

  if (sectionId === "engineering-analysis") {
    return `《${input.projectName}》以生猪养殖为主体工程，养殖规模为年出栏${input.annualOutput || "未填写"}头、存栏${input.stock || "未填写"}头。项目运营期主要产污环节包括猪舍冲洗废水、养殖粪污、恶臭气体和一般固体废物。粪污处理方式拟采用：${input.manureTreatment}。本章节为工程分析草稿，需进一步补充平面布置、工艺流程、物料平衡和污染源强核算。`;
  }

  if (sectionId === "impact-measures") {
    return `《${input.projectName || "本项目"}》运营期应重点关注粪污、废水和恶臭影响。粪污处理措施为：${input.manureTreatment}。废水处理措施为：${input.wastewaterTreatment}。恶臭控制措施为：${input.odorControl}。以上内容为章节草稿，实际报告需结合监测数据、排放标准、周边敏感目标和地方管理要求完善。`;
  }

  return "该章节在最小 demo 中暂未开放生成。";
}

function createAssessment(level, reason) {
  return {
    level,
    reason,
    legalNotice: "本结果仅为 demo 辅助判断，不替代环评工程师专业判断，也不作为法律最终结论。"
  };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:

```powershell
node --test tests/logic.test.mjs
```

Expected: PASS，所有测试通过。

- [ ] **Step 5: 提交业务逻辑**

Run:

```powershell
git add scripts/logic.js tests/logic.test.mjs
git commit -m "Add pig farming demo logic"
```

Expected: 生成一个提交。

---

### Task 3: 创建页面结构和样式

**Files:**
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\index.html`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\style.css`

- [ ] **Step 1: 创建页面结构**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>环境影响评价助手</title>
    <link rel="stylesheet" href="./style.css" />
  </head>
  <body>
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <p class="eyebrow">EIA Demo</p>
          <h1>环境影响评价助手</h1>
          <p>基于分类名录的生猪养殖环评资料梳理 demo</p>
        </div>
        <nav id="categoryNav" class="category-nav" aria-label="环评分类"></nav>
      </aside>

      <main class="workspace">
        <section class="panel hero-panel">
          <p class="eyebrow">最小可演示流程</p>
          <h2 id="workspaceTitle">请选择左侧分项</h2>
          <p id="workspaceIntro">当前 demo 前端保留完整分类骨架，已开放“畜牧业 -> 生猪养殖”。</p>
        </section>

        <section id="noticePanel" class="notice-panel"></section>

        <section class="panel form-panel">
          <div class="section-heading">
            <h3>项目信息</h3>
            <span>资料越完整，章节草稿越可用</span>
          </div>
          <form id="projectForm" class="project-form"></form>
        </section>

        <section class="panel assessment-panel">
          <div class="section-heading">
            <h3>环评类别辅助判断</h3>
            <span>仅作 demo 辅助判断</span>
          </div>
          <div id="assessmentResult" class="assessment-result"></div>
        </section>

        <section class="panel outline-panel">
          <div class="section-heading">
            <h3>报告大纲与缺失资料</h3>
            <span>补齐资料后生成章节草稿</span>
          </div>
          <div id="sectionList" class="section-list"></div>
        </section>

        <section class="panel draft-panel">
          <div class="section-heading">
            <h3>章节草稿</h3>
            <span id="draftStatus">等待生成</span>
          </div>
          <article id="draftOutput" class="draft-output">选择可生成章节并补齐资料后，草稿会显示在这里。</article>
        </section>
      </main>
    </div>

    <script type="module" src="./scripts/app.js"></script>
  </body>
</html>
```

- [ ] **Step 2: 创建样式**

Create `style.css`:

```css
:root {
  color-scheme: light;
  --bg: #f4f7f4;
  --surface: #ffffff;
  --surface-soft: #eef5ef;
  --text: #172019;
  --muted: #637067;
  --line: #d7e2d9;
  --accent: #1d7a57;
  --accent-dark: #12583d;
  --warning: #a65f00;
  --danger: #9b2c2c;
  --shadow: 0 14px 40px rgba(23, 32, 25, 0.08);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

.app-shell {
  display: grid;
  grid-template-columns: 320px 1fr;
  min-height: 100vh;
}

.sidebar {
  background: #10251d;
  color: #f5fff8;
  padding: 28px 20px;
  overflow-y: auto;
}

.brand h1,
.workspace h2,
.section-heading h3 {
  margin: 0;
  letter-spacing: 0;
}

.brand p {
  color: #b7c8bd;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--accent);
  font-size: 13px;
  font-weight: 700;
}

.category-nav {
  display: grid;
  gap: 14px;
  margin-top: 28px;
}

.category-group {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 12px;
}

.category-title {
  margin: 0 0 8px;
  color: #d9eadf;
  font-size: 15px;
}

.category-item {
  width: 100%;
  border: 0;
  border-radius: 6px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.08);
  color: #f5fff8;
  text-align: left;
  cursor: pointer;
}

.category-item[disabled] {
  color: #9dafaa;
  cursor: not-allowed;
}

.category-item.active {
  background: #dff5e8;
  color: #10251d;
}

.workspace {
  display: grid;
  gap: 18px;
  align-content: start;
  padding: 28px;
}

.panel,
.notice-panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface);
  box-shadow: var(--shadow);
  padding: 22px;
}

.notice-panel:empty {
  display: none;
}

.section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-heading span,
.workspace p,
.missing-list,
.legal-notice {
  color: var(--muted);
}

.project-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  display: grid;
  gap: 8px;
}

.field label {
  font-weight: 700;
}

.field input,
.field select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 11px 12px;
  background: #fbfdfb;
}

.assessment-result {
  border-left: 4px solid var(--accent);
  background: var(--surface-soft);
  padding: 14px 16px;
}

.assessment-level {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 800;
}

.section-list {
  display: grid;
  gap: 12px;
}

.report-section {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
}

.report-section header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.status-pill {
  border-radius: 999px;
  padding: 5px 10px;
  background: var(--surface-soft);
  color: var(--accent-dark);
  font-size: 13px;
  font-weight: 700;
}

.status-pill.blocked {
  background: #fff4dd;
  color: var(--warning);
}

.missing-list {
  margin: 12px 0 0;
  padding-left: 20px;
}

.generate-button {
  margin-top: 14px;
  border: 0;
  border-radius: 6px;
  padding: 10px 14px;
  background: var(--accent);
  color: #ffffff;
  cursor: pointer;
  font-weight: 700;
}

.generate-button:disabled {
  background: #c9d6cd;
  cursor: not-allowed;
}

.draft-output {
  min-height: 120px;
  white-space: pre-wrap;
  line-height: 1.75;
}

@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    max-height: none;
  }

  .project-form {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: 提交页面结构和样式**

Run:

```powershell
git add index.html style.css
git commit -m "Add demo page shell"
```

Expected: 生成一个提交。

---

### Task 4: 实现浏览器交互

**Files:**
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\scripts\app.js`

- [ ] **Step 1: 写浏览器交互代码**

Create `scripts/app.js`:

```javascript
import { categories, projectFields, reportSections } from "./data.js";
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
    noticePanel.textContent = "提示：本 demo 使用规则模板生成章节草稿，只用于流程演示，不替代正式环评文件。";
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
```

- [ ] **Step 2: 运行逻辑测试**

Run:

```powershell
node --test tests/logic.test.mjs
```

Expected: PASS。

- [ ] **Step 3: 本地启动预览**

Run:

```powershell
python -m http.server 8788
```

Expected: 终端显示本地服务运行。浏览器打开：

```text
http://127.0.0.1:8788/
```

- [ ] **Step 4: 手动验证页面**

Expected:

- 左侧显示完整分类骨架。
- “畜牧业 -> 生猪养殖”默认可用。
- 填写 `年出栏生猪数量 = 6000` 后，环评类别辅助判断显示“报告书关注”。
- 未填写粪污、废水、恶臭措施前，“主要环境影响和保护措施”显示资料不完整。
- 补齐后，按钮可点击并生成章节草稿。

- [ ] **Step 5: 提交浏览器交互**

Run:

```powershell
git add scripts/app.js
git commit -m "Add demo browser interactions"
```

Expected: 生成一个提交。

---

### Task 5: 编写 README 和最终验证

**Files:**
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\README.md`

- [ ] **Step 1: 创建 README**

Create `README.md`:

```markdown
# 环境影响评价助手

这是一个环境影响评价 SaaS 产品的最小 demo。

当前 demo 前端保留建设项目环评分类骨架，但只开放一个真实流程：

```text
畜牧业 -> 生猪养殖
```

用户填写项目信息后，系统会：

- 给出环评类别辅助判断；
- 显示报告大纲；
- 标出每个章节缺少哪些资料；
- 在资料补齐后生成章节草稿。

## 重要说明

本 demo 只做辅助判断和章节草稿生成，不替代环评工程师的专业判断，也不作为法律最终结论。

## 本地运行

在项目目录运行：

```powershell
python -m http.server 8788
```

然后打开：

```text
http://127.0.0.1:8788/
```

## 运行测试

```powershell
node --test tests/logic.test.mjs
```

## 文件 / 模块中文用途表

| 文件 / 模块 | 中文用途 | 新手理解 |
|---|---|---|
| `index.html` | 页面结构 | 决定页面有哪些区域，比如左侧分类、右侧表单和章节列表 |
| `style.css` | 页面样式 | 决定页面颜色、布局、卡片、按钮和手机适配 |
| `scripts/data.js` | 业务数据配置 | 存放环评分类、表单字段和报告章节 |
| `scripts/logic.js` | 业务判断逻辑 | 负责环评类别辅助判断、缺失资料检查和章节草稿生成 |
| `scripts/app.js` | 页面交互逻辑 | 把数据和页面连起来，处理输入、点击和渲染 |
| `tests/logic.test.mjs` | 自动测试 | 用命令检查核心业务逻辑是否正确 |
| `docs/demo-design.md` | 设计文档 | 说明为什么这样做、做哪些功能、不做哪些功能 |
```

- [ ] **Step 2: 运行测试**

Run:

```powershell
node --test tests/logic.test.mjs
```

Expected: PASS。

- [ ] **Step 3: 检查 Git 状态**

Run:

```powershell
git status --short --branch
```

Expected: 只看到 `README.md` 未提交，或者工作区干净。

- [ ] **Step 4: 提交 README**

Run:

```powershell
git add README.md
git commit -m "Document demo usage"
```

Expected: 生成一个提交。

- [ ] **Step 5: 推送到 GitHub**

Run:

```powershell
git push
```

Expected: `main -> main` 推送成功。

---

## 自检结果

- Spec coverage：本计划覆盖设计文档中的分类骨架、生猪养殖表单、辅助判断、报告大纲、缺失资料、章节生成、README 和本地验证。
- Scope check：本计划不做登录、数据库、后端 API、真实智能体和文档导出，符合最小 demo 范围。
- Placeholder scan：本计划未保留空白待补内容。
- Type consistency：`projectName`、`location`、`annualOutput`、`stock`、`sensitiveArea`、`manureTreatment`、`wastewaterTreatment`、`odorControl` 在数据、逻辑、测试和页面中保持一致。
