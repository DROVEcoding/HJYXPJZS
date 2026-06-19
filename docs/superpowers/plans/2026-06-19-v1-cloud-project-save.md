# V1 Cloud Project Save Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 接入 Supabase 兼容后端，让用户可以登录、保存当前生猪养殖环评项目、读取自己的项目列表，并打开已保存项目继续编辑。

**Architecture:** 使用 Supabase Auth 做用户身份，使用 `eia_projects` 表保存项目数据，使用 RLS 保证用户只能访问自己的项目。前端继续保持静态站点，新增后端配置、客户端、认证、项目保存模块，`scripts/app.js` 只负责把 UI 和这些模块接起来。

**Tech Stack:** HTML、CSS、原生 JavaScript ES modules、Supabase JS CDN、PostgreSQL/RLS、Node.js `node:test`。

---

## 前置条件

在执行涉及云端的任务前，用户必须提供：

```text
Project URL
publishable key / anon key
```

用户还必须能在 Supabase 兼容控制台的 SQL Editor 中执行：

```text
docs/v1-cloud-project-save-schema.sql
```

不能使用或提交：

```text
service_role key
数据库密码
阿里云 AK / SK
模型 API secret key
```

---

## 文件结构

项目根目录：

```text
C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS
```

计划新增或修改：

| 文件 | 责任 |
|---|---|
| `docs/v1-cloud-project-save-schema.sql` | 创建 `eia_projects` 表、RLS、策略、更新时间触发器 |
| `scripts/backendConfig.js` | 保存 Supabase URL 和 publishable / anon key，占位为空时显示配置提示 |
| `scripts/backendClient.js` | 加载 Supabase JS CDN 并创建客户端 |
| `scripts/auth.js` | 注册、登录、退出、读取当前用户 |
| `scripts/projectStore.js` | 组装项目 payload，保存项目，读取项目列表，读取单个项目 |
| `tests/projectStore.test.mjs` | 测试项目 payload 字段和数据恢复逻辑 |
| `index.html` | 增加登录区、保存区、项目列表容器 |
| `style.css` | 增加云端功能区域样式 |
| `scripts/app.js` | 接入云端登录、保存、项目列表、打开项目 |
| `README.md` | 更新云端配置、SQL 执行和文件用途说明 |

---

### Task 1: 编写数据库 SQL

**Files:**
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\docs\v1-cloud-project-save-schema.sql`

- [ ] **Step 1: 创建 SQL 文件**

Create `docs/v1-cloud-project-save-schema.sql`:

```sql
create extension if not exists "pgcrypto";

create table if not exists public.eia_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_name text not null,
  category_id text not null default 'pig-farming',
  form_data jsonb not null default '{}'::jsonb,
  assessment jsonb not null default '{}'::jsonb,
  drafts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.eia_projects enable row level security;

drop policy if exists "Users can read own eia projects" on public.eia_projects;
create policy "Users can read own eia projects"
on public.eia_projects
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own eia projects" on public.eia_projects;
create policy "Users can insert own eia projects"
on public.eia_projects
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own eia projects" on public.eia_projects;
create policy "Users can update own eia projects"
on public.eia_projects
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own eia projects" on public.eia_projects;
create policy "Users can delete own eia projects"
on public.eia_projects
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_eia_projects_updated_at on public.eia_projects;
create trigger set_eia_projects_updated_at
before update on public.eia_projects
for each row
execute function public.set_updated_at();

create index if not exists eia_projects_user_id_updated_at_idx
on public.eia_projects (user_id, updated_at desc);
```

- [ ] **Step 2: 自检 SQL 不包含密钥**

Run:

```powershell
Select-String -Path docs/v1-cloud-project-save-schema.sql -Pattern 'service_role|password|secret|AK|SK'
```

Expected: 无输出。

- [ ] **Step 3: 提交 SQL 文件**

Run:

```powershell
git add docs/v1-cloud-project-save-schema.sql
git commit -m "Add V1 cloud project schema"
```

Expected: 生成提交。

---

### Task 2: 创建配置和 Supabase 客户端模块

**Files:**
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\scripts\backendConfig.js`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\scripts\backendClient.js`

- [ ] **Step 1: 创建后端配置文件**

Create `scripts/backendConfig.js`:

```javascript
export const backendConfig = {
  supabaseUrl: "",
  supabaseAnonKey: ""
};

export function isBackendConfigured() {
  return Boolean(backendConfig.supabaseUrl && backendConfig.supabaseAnonKey);
}
```

- [ ] **Step 2: 创建 Supabase 客户端模块**

Create `scripts/backendClient.js`:

```javascript
import { backendConfig, isBackendConfigured } from "./backendConfig.js";

let cachedClient = null;
let loadingPromise = null;

export async function getBackendClient() {
  if (!isBackendConfigured()) {
    return null;
  }

  if (cachedClient) {
    return cachedClient;
  }

  const supabase = await loadSupabaseSdk();
  cachedClient = supabase.createClient(backendConfig.supabaseUrl, backendConfig.supabaseAnonKey);
  return cachedClient;
}

function loadSupabaseSdk() {
  if (window.supabase) {
    return Promise.resolve(window.supabase);
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.async = true;
    script.onload = () => resolve(window.supabase);
    script.onerror = () => reject(new Error("Supabase SDK 加载失败，请检查网络或 CDN 访问。"));
    document.head.appendChild(script);
  });

  return loadingPromise;
}
```

- [ ] **Step 3: 本地测试仍通过**

Run:

```powershell
npm test
```

Expected: PASS。

- [ ] **Step 4: 提交配置模块**

Run:

```powershell
git add scripts/backendConfig.js scripts/backendClient.js
git commit -m "Add backend client configuration"
```

Expected: 生成提交。

---

### Task 3: 编写认证模块

**Files:**
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\scripts\auth.js`

- [ ] **Step 1: 创建认证模块**

Create `scripts/auth.js`:

```javascript
import { getBackendClient } from "./backendClient.js";

export async function getCurrentUser() {
  const client = await getBackendClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client.auth.getUser();
  if (error) {
    throw error;
  }

  return data.user ?? null;
}

export async function signUpWithEmail(email, password) {
  const client = await requireBackendClient();
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) {
    throw error;
  }
  return data.user;
}

export async function signInWithEmail(email, password) {
  const client = await requireBackendClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
  return data.user;
}

export async function signOut() {
  const client = await requireBackendClient();
  const { error } = await client.auth.signOut();
  if (error) {
    throw error;
  }
}

async function requireBackendClient() {
  const client = await getBackendClient();
  if (!client) {
    throw new Error("云端后端尚未配置，请先填写 Supabase URL 和 publishable key。");
  }
  return client;
}
```

- [ ] **Step 2: 本地测试仍通过**

Run:

```powershell
npm test
```

Expected: PASS。

- [ ] **Step 3: 提交认证模块**

Run:

```powershell
git add scripts/auth.js
git commit -m "Add cloud auth module"
```

Expected: 生成提交。

---

### Task 4: 编写项目保存模块和测试

**Files:**
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\scripts\projectStore.js`
- Create: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\tests\projectStore.test.mjs`
- Modify: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\package.json`

- [ ] **Step 1: 更新测试命令**

Modify `package.json`:

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

- [ ] **Step 2: 写项目保存测试**

Create `tests/projectStore.test.mjs`:

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { buildProjectPayload, restoreProjectState } from "../scripts/projectStore.js";

test("buildProjectPayload 将当前状态转换为 eia_projects 可保存字段", () => {
  const payload = buildProjectPayload({
    userId: "user-001",
    formData: {
      projectName: "某生猪养殖项目",
      annualOutput: "6000"
    },
    assessment: {
      level: "报告书关注"
    },
    drafts: {
      "impact-measures": "章节草稿"
    }
  });

  assert.equal(payload.user_id, "user-001");
  assert.equal(payload.project_name, "某生猪养殖项目");
  assert.equal(payload.category_id, "pig-farming");
  assert.deepEqual(payload.form_data, {
    projectName: "某生猪养殖项目",
    annualOutput: "6000"
  });
  assert.deepEqual(payload.assessment, {
    level: "报告书关注"
  });
  assert.deepEqual(payload.drafts, {
    "impact-measures": "章节草稿"
  });
});

test("restoreProjectState 将数据库记录转换回前端状态", () => {
  const state = restoreProjectState({
    id: "project-001",
    project_name: "某生猪养殖项目",
    category_id: "pig-farming",
    form_data: { projectName: "某生猪养殖项目" },
    assessment: { level: "报告书关注" },
    drafts: { "basic-info": "基本情况草稿" }
  });

  assert.equal(state.projectId, "project-001");
  assert.equal(state.selectedItemId, "pig-farming");
  assert.deepEqual(state.formData, { projectName: "某生猪养殖项目" });
  assert.deepEqual(state.assessment, { level: "报告书关注" });
  assert.deepEqual(state.drafts, { "basic-info": "基本情况草稿" });
});
```

- [ ] **Step 3: 运行测试确认失败**

Run:

```powershell
npm test
```

Expected: FAIL，原因是 `scripts/projectStore.js` 还不存在。

- [ ] **Step 4: 创建项目保存模块**

Create `scripts/projectStore.js`:

```javascript
import { getBackendClient } from "./backendClient.js";

export function buildProjectPayload({ userId, formData, assessment, drafts }) {
  const projectName = String(formData.projectName ?? "").trim() || "未命名环评项目";

  return {
    user_id: userId,
    project_name: projectName,
    category_id: "pig-farming",
    form_data: formData,
    assessment,
    drafts
  };
}

export function restoreProjectState(record) {
  return {
    projectId: record.id,
    selectedItemId: record.category_id,
    formData: record.form_data ?? {},
    assessment: record.assessment ?? {},
    drafts: record.drafts ?? {}
  };
}

export async function saveProject({ projectId, userId, formData, assessment, drafts }) {
  const client = await requireBackendClient();
  const payload = buildProjectPayload({ userId, formData, assessment, drafts });

  if (projectId) {
    const { data, error } = await client
      .from("eia_projects")
      .update(payload)
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  }

  const { data, error } = await client
    .from("eia_projects")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function listProjects() {
  const client = await requireBackendClient();
  const { data, error } = await client
    .from("eia_projects")
    .select("id, project_name, category_id, updated_at, created_at")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data;
}

export async function loadProject(projectId) {
  const client = await requireBackendClient();
  const { data, error } = await client
    .from("eia_projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    throw error;
  }
  return data;
}

async function requireBackendClient() {
  const client = await getBackendClient();
  if (!client) {
    throw new Error("云端后端尚未配置，请先填写 Supabase URL 和 publishable key。");
  }
  return client;
}
```

- [ ] **Step 5: 运行测试确认通过**

Run:

```powershell
npm test
```

Expected: PASS。

- [ ] **Step 6: 提交项目保存模块**

Run:

```powershell
git add package.json scripts/projectStore.js tests/projectStore.test.mjs
git commit -m "Add cloud project store"
```

Expected: 生成提交。

---

### Task 5: 改造页面结构和样式

**Files:**
- Modify: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\index.html`
- Modify: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\style.css`

- [ ] **Step 1: 在页面中增加云端区域**

Modify `index.html` so `<main class="workspace">` begins with this section after the hero panel:

```html
        <section class="panel cloud-panel">
          <div class="section-heading">
            <h3>云端账号与项目</h3>
            <span id="cloudStatus">等待配置</span>
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
          <p id="cloudMessage" class="cloud-message">未配置云端时，页面仍可作为本地 demo 使用。</p>
          <div id="projectList" class="project-list"></div>
        </section>
```

- [ ] **Step 2: 增加样式**

Append to `style.css`:

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

- [ ] **Step 3: 运行测试**

Run:

```powershell
npm test
```

Expected: PASS。

- [ ] **Step 4: 提交页面结构样式**

Run:

```powershell
git add index.html style.css
git commit -m "Add cloud project UI shell"
```

Expected: 生成提交。

---

### Task 6: 接入 app.js 云端交互

**Files:**
- Modify: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\scripts\app.js`

- [ ] **Step 1: 导入模块**

At the top of `scripts/app.js`, add:

```javascript
import { isBackendConfigured } from "./backendConfig.js";
import { getCurrentUser, signInWithEmail, signOut, signUpWithEmail } from "./auth.js";
import { listProjects, loadProject, restoreProjectState, saveProject } from "./projectStore.js";
```

- [ ] **Step 2: 扩展状态和 DOM**

Add to `state`:

```javascript
  projectId: null,
  currentUser: null,
  drafts: {},
  savedAssessment: null
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

- [ ] **Step 3: 初始化云端状态**

After `render();`, add:

```javascript
initializeCloud();
```

Add functions:

```javascript
async function initializeCloud() {
  bindCloudEvents();

  if (!isBackendConfigured()) {
    renderCloudState("云端未配置", "请先在 scripts/backendConfig.js 填写 Supabase URL 和 publishable key。");
    return;
  }

  try {
    state.currentUser = await getCurrentUser();
    renderCloudState();
    if (state.currentUser) {
      await refreshProjectList();
    }
  } catch (error) {
    renderCloudState("云端连接失败", error.message);
  }
}

function bindCloudEvents() {
  signInButton.addEventListener("click", async () => {
    await runCloudAction(async () => {
      state.currentUser = await signInWithEmail(authEmail.value, authPassword.value);
      await refreshProjectList();
      renderCloudState("已登录", `当前账号：${state.currentUser.email}`);
    });
  });

  signUpButton.addEventListener("click", async () => {
    await runCloudAction(async () => {
      state.currentUser = await signUpWithEmail(authEmail.value, authPassword.value);
      renderCloudState("注册请求已提交", "如果后端要求邮箱确认，请先完成邮箱确认后再登录。");
    });
  });

  signOutButton.addEventListener("click", async () => {
    await runCloudAction(async () => {
      await signOut();
      state.currentUser = null;
      state.projectId = null;
      projectList.innerHTML = "";
      renderCloudState("已退出", "当前为未登录状态。");
    });
  });

  saveProjectButton.addEventListener("click", async () => {
    await runCloudAction(async () => {
      if (!state.currentUser) {
        renderCloudState("请先登录", "登录后才能保存项目到云端。");
        return;
      }

      const saved = await saveProject({
        projectId: state.projectId,
        userId: state.currentUser.id,
        formData: state.formData,
        assessment: assessPigFarmCategory(state.formData),
        drafts: state.drafts
      });
      state.projectId = saved.id;
      await refreshProjectList();
      renderCloudState("保存成功", `项目已保存：${saved.project_name}`);
    });
  });
}
```

- [ ] **Step 4: 增加云端辅助函数**

Append:

```javascript
async function runCloudAction(action) {
  try {
    await action();
  } catch (error) {
    renderCloudState("操作失败", error.message);
  }
}

function renderCloudState(status = null, message = null) {
  if (!isBackendConfigured()) {
    cloudStatus.textContent = "云端未配置";
    cloudMessage.textContent = message ?? "请先在 scripts/backendConfig.js 填写 Supabase URL 和 publishable key。";
    setCloudButtonsDisabled(true);
    return;
  }

  cloudStatus.textContent = status ?? (state.currentUser ? `已登录：${state.currentUser.email}` : "未登录");
  cloudMessage.textContent = message ?? (state.currentUser ? "可以保存和读取你的云端项目。" : "请登录后保存项目。");
  signOutButton.disabled = !state.currentUser;
  saveProjectButton.disabled = !state.currentUser;
  signInButton.disabled = Boolean(state.currentUser);
  signUpButton.disabled = Boolean(state.currentUser);
}

function setCloudButtonsDisabled(disabled) {
  signInButton.disabled = disabled;
  signUpButton.disabled = disabled;
  signOutButton.disabled = disabled;
  saveProjectButton.disabled = disabled;
}

async function refreshProjectList() {
  const projects = await listProjects();
  projectList.innerHTML = projects.length
    ? projects.map((project) => `<button type="button" data-project-id="${project.id}">${project.project_name}<br /><small>${new Date(project.updated_at).toLocaleString()}</small></button>`).join("")
    : "<p class=\"cloud-message\">还没有云端项目。</p>";

  projectList.querySelectorAll("[data-project-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      await runCloudAction(async () => {
        const record = await loadProject(button.dataset.projectId);
        const restored = restoreProjectState(record);
        state.projectId = restored.projectId;
        state.selectedItemId = restored.selectedItemId;
        state.formData = restored.formData;
        state.drafts = restored.drafts;
        render();
        renderCloudState("项目已打开", `正在编辑：${record.project_name}`);
      });
    });
  });
}
```

- [ ] **Step 5: 保存生成的草稿**

Inside the generate button click handler, replace:

```javascript
draftOutput.textContent = generateSectionDraft(sectionId, state.formData);
```

with:

```javascript
const draft = generateSectionDraft(sectionId, state.formData);
state.drafts[sectionId] = draft;
draftOutput.textContent = draft;
```

- [ ] **Step 6: 加载项目后恢复已有草稿**

After `renderSections();` in `render()`, optionally keep the current draft output as-is. Do not auto-pick a draft in V1; user can regenerate or save again.

- [ ] **Step 7: 运行测试**

Run:

```powershell
npm test
```

Expected: PASS。

- [ ] **Step 8: 手动检查未配置状态**

Run local server:

```powershell
python -m http.server 8788
```

Open:

```text
http://127.0.0.1:8788/
```

Expected:

- 页面显示“云端未配置”。
- 登录、注册、退出、保存按钮禁用。
- 现有 demo 仍可填写表单并生成章节。

- [ ] **Step 9: 提交 app.js 改造**

Run:

```powershell
git add scripts/app.js
git commit -m "Connect app to cloud project state"
```

Expected: 生成提交。

---

### Task 7: 配置真实后端并手动验证

**Files:**
- Modify: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\scripts\backendConfig.js`

- [ ] **Step 1: 用户执行 SQL**

用户在 Supabase 兼容控制台 SQL Editor 执行：

```text
docs/v1-cloud-project-save-schema.sql
```

Expected:

- `eia_projects` 表创建成功。
- RLS 策略创建成功。

- [ ] **Step 2: 填写前端公开配置**

Modify `scripts/backendConfig.js`:

```javascript
export const backendConfig = {
  supabaseUrl: "用户提供的 Project URL",
  supabaseAnonKey: "用户提供的 publishable 或 anon key"
};

export function isBackendConfigured() {
  return Boolean(backendConfig.supabaseUrl && backendConfig.supabaseAnonKey);
}
```

Do not use service role key.

- [ ] **Step 3: 手动验证云端功能**

Run:

```powershell
npm test
python -m http.server 8788
```

Open:

```text
http://127.0.0.1:8788/
```

Expected:

1. 注册账号。
2. 登录账号。
3. 填写生猪养殖项目。
4. 生成章节草稿。
5. 点击“保存当前项目”。
6. 刷新页面。
7. 登录后项目列表能看到刚才项目。
8. 点击项目后表单恢复。

- [ ] **Step 4: 提交配置**

Only commit `scripts/backendConfig.js` if it contains public URL and publishable / anon key, not secret.

Run:

```powershell
git add scripts/backendConfig.js
git commit -m "Configure cloud backend"
```

Expected: 生成提交。

---

### Task 8: 更新 README 并最终推送

**Files:**
- Modify: `C:\Users\24308\Documents\Codex\2026-06-09\github\work\HJYXPJZS\README.md`

- [ ] **Step 1: 更新 README**

Add sections:

```markdown
## V1 云端项目保存

V1 接入 Supabase 兼容后端，用于保存用户的环评项目。

云端功能包括：

- 用户注册、登录、退出；
- 保存当前项目；
- 读取我的项目列表；
- 打开已保存项目继续编辑。

执行 SQL：

```text
docs/v1-cloud-project-save-schema.sql
```

前端公开配置：

```text
scripts/backendConfig.js
```

注意：只能填写 Project URL 和 publishable / anon key。不要填写 service role key、数据库密码、云平台 AK / SK。
```

Update file table to include:

```markdown
| `scripts/backendConfig.js` | 后端公开配置 | 保存 Supabase URL 和 publishable/anon key，不放 secret |
| `scripts/backendClient.js` | 后端客户端 | 加载 Supabase SDK，并创建浏览器可用的客户端 |
| `scripts/auth.js` | 云端账号模块 | 负责注册、登录、退出和读取当前用户 |
| `scripts/projectStore.js` | 云端项目模块 | 负责保存项目、读取项目列表和打开项目 |
| `docs/v1-cloud-project-save-schema.sql` | V1 数据库 SQL | 创建项目表、RLS 权限和更新时间触发器 |
| `docs/v1-cloud-project-save-design.md` | V1 设计文档 | 说明云端项目保存的范围、数据表和权限 |
```

- [ ] **Step 2: 最终测试**

Run:

```powershell
npm test
git status --short --branch
```

Expected:

- PASS。
- 只看到 README 未提交，或工作区干净。

- [ ] **Step 3: 提交 README**

Run:

```powershell
git add README.md
git commit -m "Document V1 cloud project save"
```

Expected: 生成提交。

- [ ] **Step 4: 推送 GitHub**

Run:

```powershell
git push
```

Expected: 推送成功。

---

## 自检结果

- Spec coverage：覆盖 V1 设计中的 SQL、认证、项目保存、项目列表、打开项目、权限边界、README、测试和手动验证。
- Scope check：不做组织、多角色、智能体、向量库、报告导出、支付系统，符合 V1 范围。
- Secret check：计划明确禁止提交 service role key、数据库密码、云平台 AK / SK、模型 API secret key。
- Type consistency：`project_name`、`category_id`、`form_data`、`assessment`、`drafts` 与设计文档一致。
