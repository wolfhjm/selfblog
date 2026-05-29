# 开发规范

这个项目虽然目前主要是个人使用，但仍按小型产品维护：每次改动都应该能说明目的、验证方式和回滚边界。

## 分支

- `main` 保持可运行。
- 功能开发使用 `codex/<topic>` 分支，例如 `codex/structured-exploration`。
- 一个分支尽量只做一类事情；如果同时改产品和文档，文档应直接服务于这次产品变更。

## 提交

- 提交信息使用简短英文祈使句，例如 `Add structured exploration mode`。
- 提交前至少运行 `pnpm typecheck`。
- 涉及页面交互时，打开本地页面做一次浏览器冒烟。
- 涉及 API 返回结构时，用登录态请求验证状态码和关键字段。

## 代码约定

- 优先沿用 Nuxt 3、Nuxt UI、SQLite 和现有工具函数。
- 高增长列表 API 返回分页对象：`items`, `total`, `page`, `pageSize`, `pageCount`, `hasPrev`, `hasNext`。
- 用户输入必须用 `zod` 校验。
- 数据库迁移通过 `server/utils/db.ts` 的 `ensureColumn` 或显式建表完成，不手动要求用户改库。
- 新增日期逻辑使用应用时区工具，避免 `toISOString().slice(0, 10)` 造成跨时区日期错误。
- AI 调用失败要返回可恢复错误，不要让用户已经输入的内容静默丢失。

## 产品约定

- 核心目标是帮助用户把经历、感受、洞察和行动串起来，而不是堆功能。
- 洞察必须尽量有客观环境、事件、感受、解释和证据。
- AI 可以建议，但重要入库动作默认由用户确认。
- 页面应保持工作台风格，优先信息密度、可扫读性和稳定交互。

## 验证清单

每次功能提交前按影响范围选择验证：

- `pnpm typecheck`
- 首页 `/`
- 探索 `/explore`
- 候选收件箱 `/inbox`
- 认知地图 `/map`
- 原则 `/principles`
- 实验 `/experiments`
- 公开页 `/public`

## 发布前检查

- `.env` 里不要提交真实密钥。
- `data/growth.db` 不提交。
- 确认 `main` 已经包含最新远端提交。
- 推送后确认 GitHub 分支和提交哈希正确。
