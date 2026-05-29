# 个人成长 OS

一个自用优先的 Nuxt 3 + SQLite 个人成长操作系统。V1 包含登录、每日打卡、自我探索 AI 对话、原则库、行动实验、公开个人说明书和多供应商 AI 配置。

## 本地启动

```bash
pnpm install
cp .env.example .env
pnpm dev
```

默认开发账号来自 `.env.example`：

- 邮箱：`you@example.com`
- 密码：`change-me-now`

上线前请修改 `ADMIN_EMAIL`、`ADMIN_PASSWORD` 和 `SESSION_SECRET`。

## 日常开发

```bash
pnpm typecheck
pnpm test:ai
```

- `main` 保持可运行，功能开发使用 `codex/<topic>` 分支。
- 高增长列表接口使用统一分页返回结构。
- 涉及页面交互的改动，提交前打开本地页面做一次冒烟。
- 更完整的约定见 [开发规范](docs/DEVELOPMENT.md)。

## AI 配置

默认兼容 GLM 官方接口，也支持 sub2 或其他 OpenAI-compatible 中转。

```env
AI_PROVIDER=glm
AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4
AI_API_KEY=your-key
AI_MODEL=glm-4-plus
AI_WIRE_API=chat_completions
```

`AI_WIRE_API` 支持：

- `chat_completions`：OpenAI/GLM 兼容的 `/chat/completions`。
- `responses`：OpenAI Responses 兼容的 `/responses`，适合部分 sub2/ccswitch 风格中转。

如果中转地址已经包含 `/chat/completions` 或 `/responses`，系统会直接使用；否则会自动拼接对应路径。

## 数据

SQLite 数据库位于 `data/growth.db`。首次启动时会自动创建表、初始化单用户账号，并从 PRD 提炼 seed 原则和实验。
