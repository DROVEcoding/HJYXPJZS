# V1：云端项目保存设计

## 1. 版本目标

V1 的目标是把当前静态 demo 推进到真实 SaaS 的第一步：

```text
用户登录 -> 创建/保存环评项目 -> 云端读取自己的项目列表 -> 打开项目继续编辑
```

V1 不追求功能多，而是先让“用户数据真实保存到云端，并且只能看到自己的数据”这件事成立。

## 2. 后端路线

本项目面向国内环评老师，后端优先使用国内云。

V1 推荐后端底座：

```text
阿里云 RDS Supabase
```

如果阿里云 RDS Supabase 在账号、区域、费用或功能上暂时不可用，备用路线是：

```text
阿里云 PostgreSQL + 自写 API
```

本设计先按 Supabase 兼容后端来写，因为它可以同时覆盖：

- 用户认证。
- PostgreSQL 数据库。
- 前端可调用的公开 API。
- RLS 行级权限。

## 3. V1 做什么

V1 做这些能力：

- 用户可以注册、登录、退出。
- 用户可以保存当前生猪养殖项目。
- 用户可以读取自己的项目列表。
- 用户可以打开已保存项目继续编辑。
- 项目保存字段包括：
  - 表单资料。
  - 环评类别辅助判断结果。
  - 章节草稿。

## 4. V1 暂不做什么

V1 暂不做：

- 组织 / 团队。
- 多人协作。
- 管理员后台。
- 正式智能体。
- 向量库。
- Word / PDF 导出。
- 付费系统。
- 复杂项目版本管理。

这些不是不重要，而是不能和 V1 混在一起做。V1 的验收目标只有一个：真实用户数据可以安全保存和读取。

## 5. 数据表设计

V1 先创建一张核心表：

```text
eia_projects
```

建议字段：

| 字段 | 类型 | 含义 |
|---|---|---|
| `id` | `uuid` | 项目 ID |
| `user_id` | `uuid` | 所属用户，来自登录用户 |
| `project_name` | `text` | 项目名称 |
| `category_id` | `text` | 分类 ID，例如 `pig-farming` |
| `form_data` | `jsonb` | 用户填写的项目资料 |
| `assessment` | `jsonb` | 环评类别辅助判断结果 |
| `drafts` | `jsonb` | 章节草稿 |
| `created_at` | `timestamptz` | 创建时间 |
| `updated_at` | `timestamptz` | 更新时间 |

## 6. 权限设计

必须开启 RLS 行级权限。

V1 权限规则：

```text
用户只能读取自己的项目。
用户只能新增自己的项目。
用户只能修改自己的项目。
用户只能删除自己的项目。
```

数据库层必须检查：

```sql
auth.uid() = user_id
```

不能只靠前端隐藏按钮。前端隐藏按钮只是体验，数据库权限才是真安全边界。

## 7. 前端模块设计

V1 会在现有静态前端上新增这些模块：

| 文件 | 责任 |
|---|---|
| `scripts/backendConfig.js` | 保存 Supabase URL 和 publishable / anon key |
| `scripts/backendClient.js` | 创建 Supabase 客户端 |
| `scripts/auth.js` | 登录、注册、退出、读取当前用户 |
| `scripts/projectStore.js` | 保存项目、读取项目列表、读取单个项目 |
| `scripts/app.js` | 接入登录状态、保存按钮、项目列表、打开项目 |

注意：

- `publishable key` / `anon key` 可以放前端。
- `service_role key` / `secret key` 绝对不能放前端，也不能提交 GitHub。

## 8. 前端交互变化

V1 会在页面上新增：

- 登录区：
  - 邮箱。
  - 密码。
  - 登录。
  - 注册。
  - 退出。
- 项目操作区：
  - 保存当前项目。
  - 我的项目列表。
  - 打开项目。

用户未登录时：

- 可以继续体验当前 demo。
- 不能保存到云端。
- 保存按钮提示“请先登录”。

用户登录后：

- 可以保存当前项目。
- 可以看到自己的项目列表。
- 可以打开自己的项目继续编辑。

## 9. 需要用户提供的信息

在接入前端前，需要从阿里云 RDS Supabase 或 Supabase 兼容控制台拿到：

```text
Project URL
publishable key / anon key
```

还需要用户在 SQL Editor 中执行 V1 SQL 文件。

如果控制台要求确认费用、开通服务、选择地域、开通实例，这些必须由用户自己确认。Codex 不应擅自创建可能产生费用的资源。

## 10. SQL 文件

V1 会新增：

```text
docs/v1-cloud-project-save-schema.sql
```

它负责：

- 创建 `eia_projects` 表。
- 开启 RLS。
- 创建 select / insert / update / delete 策略。
- 创建 `updated_at` 自动更新时间触发器。

## 11. 测试计划

自动测试：

- `npm test` 继续验证现有业务逻辑。
- 新增 `projectStore` 的数据转换测试，避免保存字段错名。

手动测试：

1. 打开本地页面。
2. 注册新账号。
3. 登录账号。
4. 填写一个生猪养殖项目。
5. 保存项目到云端。
6. 刷新页面。
7. 登录后项目列表仍能看到刚才保存的项目。
8. 打开项目后，表单资料、辅助判断、章节草稿能恢复。
9. 换另一个账号登录，看不到前一个账号的项目。

## 12. 线上部署注意事项

当前 GitHub Pages 是公开静态站点。

可以放前端的内容：

- Supabase URL。
- publishable / anon key。

不能放前端的内容：

- service role key。
- 数据库密码。
- 云平台 AK / SK。
- 模型 API secret key。

如果后续接入正式智能体和模型 API，必须走后端服务，不能让浏览器直接拿模型密钥。

## 13. 验收标准

V1 完成时应满足：

- 用户能注册和登录。
- 用户能保存当前项目。
- 用户能读取自己的项目列表。
- 用户能打开已保存项目。
- 不同用户之间项目隔离。
- `npm test` 通过。
- README 文件用途表更新。
- GitHub 上有 SQL 文件和中文说明。

## 14. 下一步

用户确认本设计后，下一步写实现计划：

```text
docs/superpowers/plans/2026-06-19-v1-cloud-project-save.md
```

实现计划应拆成：

1. 写 SQL schema。
2. 写 Supabase 配置和客户端模块。
3. 写认证模块。
4. 写项目保存模块。
5. 改造页面交互。
6. 更新 README。
7. 本地和线上验证。
