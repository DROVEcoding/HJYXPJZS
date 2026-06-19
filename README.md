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
- 在资料补齐后生成章节草稿；
- 展示 32 份生猪养殖环评语料的轻量摘要。

## 重要说明

本 demo 只做辅助判断和章节草稿生成，不替代环评工程师的专业判断，也不作为法律最终结论。

## 生猪养殖语料

本项目当前参考一套本地生猪养殖环评语料包：

```text
C:\Users\24308\Documents\Codex\2026-06-19\w-w\outputs\valid_32_pig_eia_manifest.csv
C:\Users\24308\Documents\Codex\2026-06-19\w-w\outputs\valid_32_pig_eia_chunks.jsonl
```

当前前端只使用语料摘要，不把完整 PDF 或 JSONL 文本块提交到仓库。后续如果接入智能体，可以把 JSONL 导入向量库，用于案例检索、章节写法参考和页码来源追踪。

## 本地运行

### 前端

在项目目录运行：

```powershell
python -m http.server 8788
```

然后打开：

```text
http://127.0.0.1:8788/
```

### 后端

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

启动后端前，需要准备 PostgreSQL 数据库，并设置：

```powershell
$env:PORT="3001"
$env:DATABASE_URL="postgres://数据库用户:数据库密码@数据库地址:5432/数据库名"
$env:JWT_SECRET="替换成足够长的随机字符串"
$env:CORS_ORIGIN="http://127.0.0.1:8788"
```

然后在后端目录运行：

```powershell
cd server
npm start
```

注意：真实的 `DATABASE_URL`、`JWT_SECRET`、数据库密码、云平台 AK/SK 不能提交到 GitHub。

## 线上访问

当前仓库是私有仓库。GitHub 返回的信息显示：当前账号计划不支持给这个私有仓库开启 GitHub Pages。

如果后续把仓库改成公开，或者换成支持私有 Pages 的 GitHub 计划，可以手动运行 `.github/workflows/pages.yml` 部署。线上地址预计是：

```text
https://drovecoding.github.io/HJYXPJZS/
```

如果暂时不想公开仓库，可以继续用本地预览地址，或后续改用 Vercel、Netlify、Cloudflare Pages 等部署方式。

## 运行测试

前端测试：

```powershell
npm test
```

后端测试：

```powershell
cd server
npm test
```

## 文件 / 模块中文用途表

| 文件 / 模块 | 中文用途 | 新手理解 |
|---|---|---|
| `index.html` | 页面结构 | 决定页面有哪些区域，比如左侧分类、右侧表单和章节列表 |
| `style.css` | 页面样式 | 决定页面颜色、布局、卡片、按钮和手机适配 |
| `package.json` | Node 项目配置 | 告诉 Node 使用 ES modules，并提供 `npm test` 测试命令 |
| `scripts/data.js` | 业务数据配置 | 存放环评分类、表单字段、报告章节和语料摘要 |
| `scripts/logic.js` | 业务判断逻辑 | 负责环评类别辅助判断、缺失资料检查和章节草稿生成 |
| `scripts/app.js` | 页面交互逻辑 | 把数据和页面连起来，处理输入、点击和渲染 |
| `scripts/apiConfig.js` | 前端 API 配置 | 保存后端 API 基础地址 |
| `scripts/apiClient.js` | 前端请求客户端 | 统一处理 JSON 请求、token 和错误 |
| `scripts/projectApi.js` | 前端项目 API | 封装注册、登录、项目保存和读取 |
| `tests/logic.test.mjs` | 自动测试 | 用命令检查核心业务逻辑是否正确 |
| `tests/apiClient.test.mjs` | 前端 API 测试 | 检查请求是否带 JSON 头和登录 token |
| `server/package.json` | 后端项目配置 | 定义 Express 后端依赖和测试命令 |
| `server/.env.example` | 后端环境变量示例 | 展示需要哪些配置，不放真实密钥 |
| `server/src/app.js` | 后端应用入口 | 创建 Express 应用并挂载 API 路由 |
| `server/src/server.js` | 后端启动入口 | 本地或 SAE 启动 HTTP 服务 |
| `server/src/config.js` | 后端配置读取 | 从环境变量读取端口、数据库地址、JWT 密钥 |
| `server/src/db.js` | 数据库连接 | 创建 PostgreSQL 连接池 |
| `server/src/auth.js` | 后端认证模块 | 负责密码哈希、JWT 签发、登录校验 |
| `server/src/repositories/userRepository.js` | 用户数据仓库 | 负责用户表的新增和查询 |
| `server/src/repositories/projectRepository.js` | 项目数据仓库 | 负责项目表的保存、列表、打开和更新 |
| `server/src/routes/authRoutes.js` | 账号 API | 注册、登录、获取当前用户 |
| `server/src/routes/projectRoutes.js` | 项目 API | 保存项目、读取列表、打开项目、更新项目 |
| `server/sql/001_init.sql` | 数据库建表 SQL | 创建用户表、项目表和更新时间触发器 |
| `server/tests/health.test.mjs` | 后端健康检查测试 | 检查 `/api/health` 是否可用 |
| `server/tests/auth.test.mjs` | 后端认证测试 | 检查注册、登录、token 和密码哈希 |
| `server/tests/projects.test.mjs` | 后端项目测试 | 检查项目保存和用户隔离 |
| `docs/demo-design.md` | 设计文档 | 说明为什么这样做、做哪些功能、不做哪些功能 |
| `docs/v1-aliyun-backend-design.md` | V1 阿里云后端设计 | 说明为什么采用阿里云真实后台路线 |
| `docs/superpowers/plans/2026-06-19-minimum-demo.md` | 实现计划 | 把 demo 拆成可以逐步执行和验证的小任务 |
| `docs/superpowers/plans/2026-06-19-v1-aliyun-backend.md` | V1 阿里云后端实施计划 | 把后端、前端、测试和部署拆成任务 |

## 当前 demo 不做什么

- 当前分支已实现本地后端 API，但正式阿里云 RDS 和 SAE 部署还需要在阿里云控制台完成。
- 不接真实大模型。
- 不导出 Word 或 PDF 报告。
- 不把完整 PDF 或 JSONL 语料提交到仓库。

这些能力会在后续版本逐步加入。
