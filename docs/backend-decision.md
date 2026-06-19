# 后端技术决策：国内用户优先

## 当前结论

“环境影响评价助手”从现在开始按真实可落地 SaaS 产品推进，不再按纯教学 demo 推进。

因为未来主要用户是国内环评老师，后端优先选择国内云基础设施。推荐路线是：

```text
国内云 PostgreSQL / Supabase 兼容后端
```

第一优先级：

```text
阿里云 RDS Supabase 或阿里云 PostgreSQL + 后端服务
```

## 为什么不优先用海外 Supabase

Supabase 官方可选区域里，APAC 常规区域包括 Singapore，但不是中国大陆区域。

对国内用户来说，新加坡区可以用于早期验证，但不适合作为长期主后端：

- 网络延迟和稳定性不可控。
- 客户资料、项目资料、报告草稿跨境访问会带来合规和信任问题。
- 后续如果接入国内模型、对象存储、备案域名，海外后端会增加系统复杂度。

## 为什么不优先用 Vercel / Netlify 做主后端

Vercel 官方说明大陆访问可能出现性能或连接问题。

这类平台适合快速部署前端或海外用户产品，但本项目面向国内环评老师，长期主后端不建议依赖海外 Serverless 平台。

## 推荐分阶段路线

### V1：项目数据云端保存

目标：

- 用户可以保存一个生猪养殖环评项目。
- 用户可以读取自己的项目列表。
- 每个项目保存表单资料、辅助判断结果、章节草稿。
- 数据按用户隔离。

暂不做：

- 组织协作。
- 多角色权限。
- 正式智能体。
- 向量库。
- Word / PDF 导出。

### V2：账号与权限

目标：

- 用户注册、登录、退出。
- 每个用户只能看到自己的项目。
- 数据库层做权限隔离，不能只靠前端隐藏按钮。

### V3：项目版本和章节草稿

目标：

- 保存多个章节草稿。
- 支持继续编辑。
- 支持记录生成时间和来源。

### V4：语料检索服务

目标：

- 把 32 份生猪养殖环评语料导入后端检索服务。
- 先做关键词检索。
- 后续再做向量检索。
- 检索结果必须保留案例编号和页码来源。

### V5：智能体生成

目标：

- 接入国内可用大模型 API。
- 生成章节草稿时引用检索结果。
- 不直接复制报告原文。
- 输出必须提示人工审核。

### V6：正式交付能力

目标：

- Word / PDF 导出。
- 域名、备案、国内云部署。
- 日志、备份、监控、权限审计。

## V1 最小数据模型

V1 先围绕 `projects` 表，不急着做完整组织系统。

建议字段：

| 字段 | 含义 |
|---|---|
| `id` | 项目 ID |
| `user_id` | 所属用户 |
| `project_name` | 项目名称 |
| `category_id` | 分类 ID，例如 `pig-farming` |
| `form_data` | 用户填写的项目资料，JSON |
| `assessment` | 环评类别辅助判断结果，JSON |
| `drafts` | 章节草稿，JSON |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

## 安全和合规边界

- 不把客户项目资料写进前端静态文件。
- 不把数据库 service key 放到浏览器。
- 不把完整 PDF 语料直接提交到公开 GitHub 仓库。
- 用户项目数据必须有权限隔离。
- 生成内容必须标注“辅助草稿，需要人工审核”。

## 当前推荐下一步

先确认使用哪种国内后端底座：

1. 阿里云 RDS Supabase。
2. 阿里云 PostgreSQL + 自己写 API。
3. 其他国内云 PostgreSQL + 自己写 API。

如果优先追求落地速度，选择阿里云 RDS Supabase。

如果优先追求长期可控性，选择阿里云 PostgreSQL + 自己写 API。

本项目当前建议先从“阿里云 RDS Supabase”调研和验证开始。

## 参考来源

- Supabase 官方区域文档：`https://supabase.com/docs/guides/platform/regions`
- Vercel 中国大陆访问说明：`https://vercel.com/kb/guide/accessing-vercel-hosted-sites-from-mainland-china`
- 阿里云 Supabase 文档：`https://help.aliyun.com/zh/analyticdb/analyticdb-for-postgresql/supabase/`
