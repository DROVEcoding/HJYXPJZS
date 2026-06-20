# 环境影响评价助手

这是一个面向环境影响评价老师的 SaaS 网页产品最小 demo。

当前 demo 保留完整的环评分类骨架，但只开放一个真实流程：

```text
畜牧业 -> 生猪养殖
```

用户填写项目信息后，系统会：

- 辅助判断项目所属环评类别。
- 展示报告章节大纲。
- 标出每个章节还缺少哪些资料。
- 在资料补齐后生成章节草稿。
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

然后运行：

```powershell
cd server
npm start
```

注意：真实的 `DATABASE_URL`、`JWT_SECRET`、数据库密码、云平台 AK/SK 不能提交到 GitHub。

## 阿里云数据库

本项目 V1 已在阿里云 RDS AI / Supabase 托管实例中初始化业务表：

| 配置项 | 当前值 | 说明 |
| --- | --- | --- |
| RDS 实例 | `pgm-uf63zev13vbtpw3s` | 阿里云 RDS PostgreSQL 17 实例 |
| 业务数据库 | `supabase_db` | 当前后端应连接这个数据库 |
| 业务 schema | `public` | 已创建 `users`、`projects` 表 |
| 内网地址 | `pgm-uf63zev13vbtpw3s.pg.rds.aliyuncs.com` | 后端部署到阿里云同区域时优先使用内网 |
| 端口 | `5432` | PostgreSQL 默认端口 |

部署到阿里云服务端时，`DATABASE_URL` 应使用 `supabase_db` 作为数据库名。数据库用户名和密码在阿里云控制台或部署环境变量中填写，不写入仓库。

## 阿里云 SAE 部署

当前后端已经准备成可容器化部署形态：

```text
server/Dockerfile
server/.dockerignore
.github/workflows/server-image.yml
```

部署思路是：

```text
GitHub 代码 -> GitHub Actions 构建 Docker 镜像 -> 镜像仓库 -> 阿里云 SAE 运行容器 -> 连接阿里云 RDS
```

当前 GitHub Actions 会把后端镜像推送到 GitHub Container Registry：

```text
ghcr.io/drovecoding/hjyxpjzs-server:latest
```

如果后续面向国内用户正式上线，建议再升级为阿里云 ACR 镜像仓库。这样 SAE 拉取镜像更稳定，也更符合国内网络环境。

SAE 环境变量至少需要：

```text
PORT=3001
DATABASE_URL=postgres://数据库用户:数据库密码@pgm-uf63zev13vbtpw3s.pg.rds.aliyuncs.com:5432/supabase_db
JWT_SECRET=足够长的随机字符串
CORS_ORIGIN=https://drovecoding.github.io/HJYXPJZS
```

## 线上访问

前端 GitHub Pages 预计地址：

```text
https://drovecoding.github.io/HJYXPJZS/
```

后端 SAE 部署成功后，需要把 `scripts/apiConfig.js` 里的后端地址从本地：

```text
http://127.0.0.1:3001
```

改成 SAE 提供的公网 API 地址。

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
| --- | --- | --- |
| `index.html` | 页面结构 | 决定页面有哪些区域，比如左侧分类、右侧表单和章节列表 |
| `style.css` | 页面样式 | 决定颜色、布局、卡片、按钮和手机适配 |
| `package.json` | 前端项目配置 | 提供前端测试命令 |
| `scripts/data.js` | 业务数据配置 | 存放环评分类、表单字段、报告章节和语料摘要 |
| `scripts/logic.js` | 业务判断逻辑 | 负责类别辅助判断、缺失资料检查和章节草稿生成 |
| `scripts/app.js` | 页面交互逻辑 | 把数据和页面连起来，处理输入、点击和渲染 |
| `scripts/apiConfig.js` | 前端 API 配置 | 保存后端 API 基础地址 |
| `scripts/apiClient.js` | 前端请求客户端 | 统一处理 JSON 请求、token 和错误 |
| `scripts/projectApi.js` | 前端项目 API | 封装注册、登录、项目保存和读取 |
| `tests/logic.test.mjs` | 自动测试 | 用命令检查核心业务逻辑是否正确 |
| `tests/apiClient.test.mjs` | 前端 API 测试 | 检查请求是否带 JSON 头和登录 token |
| `server/package.json` | 后端项目配置 | 定义 Express 后端依赖和测试命令 |
| `server/.env.example` | 后端环境变量示例 | 展示需要哪些配置，不放真实密钥 |
| `server/Dockerfile` | 后端容器构建文件 | 告诉云平台如何把后端打包成可运行镜像 |
| `server/.dockerignore` | 容器忽略规则 | 避免把本地依赖、测试和密钥打进镜像 |
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
| `.github/workflows/pages.yml` | 前端页面部署流程 | 手动部署 GitHub Pages |
| `.github/workflows/server-image.yml` | 后端镜像构建流程 | 让 GitHub Actions 帮我们构建并推送后端 Docker 镜像 |
| `docs/demo-design.md` | 设计文档 | 说明为什么这样做、做哪些功能、不做哪些功能 |
| `docs/v1-aliyun-backend-design.md` | V1 阿里云后端设计 | 说明为什么采用阿里云真实后台路线 |
| `docs/superpowers/plans/2026-06-19-minimum-demo.md` | 实现计划 | 把 demo 拆成可以逐步执行和验证的小任务 |
| `docs/superpowers/plans/2026-06-19-v1-aliyun-backend.md` | V1 阿里云后端实施计划 | 把后端、前端、测试和部署拆成任务 |

## 当前 demo 暂不做什么

- 当前分支已实现本地后端 API，RDS 已建表，SAE 部署正在接入。
- 暂不接真实大模型。
- 暂不导出 Word 或 PDF 报告。
- 暂不把完整 PDF 或 JSONL 语料提交到仓库。

这些能力会在后续版本逐步加入。
