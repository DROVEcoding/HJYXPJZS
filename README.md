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

在项目目录运行：

```powershell
python -m http.server 8788
```

然后打开：

```text
http://127.0.0.1:8788/
```

## 线上访问

配置 GitHub Pages 后，线上地址预计是：

```text
https://drovecoding.github.io/HJYXPJZS/
```

如果这个地址暂时打不开，通常是 GitHub Actions 还在部署，或者仓库的 Pages 设置还没有启用。

## 运行测试

```powershell
npm test
```

或直接运行：

```powershell
node --test tests/logic.test.mjs
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
| `tests/logic.test.mjs` | 自动测试 | 用命令检查核心业务逻辑是否正确 |
| `docs/demo-design.md` | 设计文档 | 说明为什么这样做、做哪些功能、不做哪些功能 |
| `docs/superpowers/plans/2026-06-19-minimum-demo.md` | 实现计划 | 把 demo 拆成可以逐步执行和验证的小任务 |

## 当前 demo 不做什么

- 不做真实登录。
- 不做数据库保存。
- 不接真实大模型。
- 不导出 Word 或 PDF 报告。
- 不把完整 PDF 或 JSONL 语料提交到仓库。

这些能力会在后续版本逐步加入。
