---
name: my-growth-os-prd
version: 0.1.0
date: 2026-05-22
status: draft
---

# 个人成长操作系统 — 产品需求文档

## 一句话定义

一个半公开的个人网站，AI 陪伴你认识自己、建立原则、把想法变成行动。

## 背景 & 动机

- 想要一个**活的自我操作系统**，不是传统作品集/博客
- 核心诉求：不断发现认识自己 → 给出原则规律辅助决策 → 尝试新事物提高执行力 → 提高精神世界 → 抵抗孤独
- 现状：有一些散乱的笔记但不成体系，"知道该做什么但找不到切入点"，"做了但容易放弃"

## 产品定位

- **主要是给自己用的工具**，不是给别人用的 SaaS
- 公开部分成为"个人说明书"，让同频的人找到你
- AI 不是冷冰冰的工具，需要**人格感和陪伴感**

---

## 核心模块（V1）

### 模块 1：原则库（公开）

**做什么：** 结构化展示你的决策原则、生活规律、价值观。

**页面结构：**
- 原则列表页 — 分类展示（工作原则 / 生活原则 / 决策框架）
- 原则详情页 — 每条原则包含：标题、描述、来源（从哪学来的）、应用场景、真实案例
- 原则不是静态的，可以在自我探索中被修正和补充

**参考风格：** Ray Dalio《Principles》的结构化呈现

### 模块 2：自我探索（私密）

**做什么：** AI 引导的反思对话、情绪记录、价值观梳理。

**核心功能：**
- AI 对话界面 — 像跟一个懂你的教练/朋友聊天
- 对话不是闲聊，AI 会围绕"认识自己"主题提问引导
- 关键洞察可以一键提取到原则库
- 情绪追踪 — 简单记录每天的状态（1-5 分 + 一句话）
- 历史回顾 — 看到自己的变化轨迹

**AI 对话的引导方向：**
- 你最近在纠结什么？
- 你上次做这个决定时是怎么想的？
- 你说 X 很重要，但你的行为是 Y，为什么？
- 回顾你这周的感受，有什么规律？

### 模块 3：行动实验（公开）

**做什么：** AI 帮你把大目标拆成最小可行动作，推荐每周小实验，跟踪执行。

**核心功能：**
- AI 每周推荐 1 个小实验（基于你的原则库 + 当前状态）
- 实验量级：比如"这周跟一个陌生人聊天"、"花 30 分钟画一幅画"
- 打卡机制：做了/没做 + 一句话感受
- **没做也不评判**，AI 会问"是什么挡住了你"
- 实验归档：做过什么、学到了什么、失败的经验也记录

**解决的两个核心问题：**
1. **"知道该做什么但找不到切入点"** → AI 把大目标拆成最小第一步
2. **"做了但容易放弃"** → 每周只推一个小实验 + 无压力打卡 + AI 跟进

---

## AI 三层互动模式

| 模式 | 频率 | 交互方式 | 场景 |
|---|---|---|---|
| **轻量打卡** | 每天 | 简单表单：今天做了什么？一句话感受？情绪 1-5 分 | 状态差时也要能完成 |
| **深度对话** | 想聊就聊 | 聊天界面，AI 像教练引导反思 | 状态好时深聊，凌晨两点也没人接住你 |
| **定期复盘** | 每周/月 | AI 汇总分析你的打卡数据、对话模式，推荐下一步 | 发现行为模式，校准方向 |

---

## 内容可见性

| 内容类型 | 可见性 | 理由 |
|---|---|---|
| 原则库 | **公开** | 个人说明书，让同频的人认识你 |
| 行动实验 | **公开** | 展示真实成长过程，不怕暴露失败 |
| 自我探索对话 | **私密** | 需要安全空间才能真实表达 |
| 情绪记录 | **私密** | 原始情绪数据不公开 |
| 定期复盘总结 | **可选公开** | 提炼后的洞察可以分享 |
| 精神花园（V2） | **半公开** | 读书笔记公开，私人感悟私密 |

---

## 技术方案

### 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 前端 + 后端 | **Nuxt 3** | Vue 生态（用户熟悉），前后端一体，SSR/SSG 支持 |
| UI 框架 | **Nuxt UI** 或 **Tailwind CSS** | 快速开发，不需要从零写样式 |
| AI 模型 | **GLM 5.1 / GLM 4.7** | 通过 ccswitch 接入 |
| AI 后端 | Nuxt Server Routes → GLM API | 不需要单独后端服务 |
| 内容存储（原则/笔记） | **Markdown 文件** | 可 git 管理，可迁移 |
| 数据存储（打卡/对话/情绪） | **SQLite**（via better-sqlite3） | 轻量，个人使用足够 |
| 部署 | 轻量云服务器 **Docker** | 简单 |
| 开发工具 | Claude Code + ccswitch + GLM | 快速开发 |

### 目录结构（规划）

```
my-growth-os/
├── nuxt.config.ts
├── package.json
│
├── content/                    # Markdown 内容（原则库）
│   └── principles/
│       ├── work/
│       ├── life/
│       └── decisions/
│
├── server/                     # Nuxt Server Routes
│   ├── api/
│   │   ├── chat.post.ts        # AI 对话接口
│   │   ├── checkin.post.ts     # 打卡接口
│   │   ├── mood.get.ts         # 情绪数据
│   │   ├── experiment.get.ts   # 实验推荐
│   │   └── principles/         # 原则 CRUD
│   └── utils/
│       ├── db.ts               # SQLite 初始化
│       └── glm.ts              # GLM API 封装
│
├── pages/                      # 页面路由
│   ├── index.vue               # 首页（个人简介 + 导航）
│   ├── principles/             # 原则库
│   │   ├── index.vue           # 列表
│   │   └── [slug].vue          # 详情
│   ├── explore.vue             # 自我探索（AI 对话）
│   ├── experiments/            # 行动实验
│   │   ├── index.vue           # 实验列表 + 打卡
│   │   └── [id].vue            # 实验详情 + 复盘
│   └── checkin.vue             # 每日打卡
│
├── components/                 # 组件
│   ├── ChatWindow.vue          # AI 对话窗口
│   ├── CheckInForm.vue         # 打卡表单
│   ├── MoodTracker.vue         # 情绪追踪
│   ├── PrincipleCard.vue       # 原则卡片
│   ├── ExperimentCard.vue      # 实验卡片
│   └── NavBar.vue              # 导航栏
│
├── composables/                # Vue composables
│   ├── useChat.ts              # AI 对话逻辑
│   ├── useAuth.ts              # 简单鉴权（私密内容）
│   └── useMood.ts              # 情绪数据
│
├── stores/                     # Pinia 状态管理
│   └── user.ts                 # 用户状态
│
├── assets/                     # 静态资源
│   └── css/
│       └── main.css
│
└── data/                       # SQLite 数据库文件
    └── growth.db
```

### 数据库表设计（SQLite）

```sql
-- 每日打卡
CREATE TABLE checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  done_text TEXT,           -- 今天做了什么
  feeling_text TEXT,        -- 一句话感受
  mood INTEGER CHECK(mood BETWEEN 1 AND 5),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI 对话记录
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  type TEXT DEFAULT 'explore',  -- explore / review
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER REFERENCES conversations(id),
  role TEXT NOT NULL,            -- user / assistant
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 行动实验
CREATE TABLE experiments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',  -- active / done / skipped
  week_number TEXT,              -- 推荐的周次
  done_at DATETIME,
  reflection TEXT,               -- 做完后的复盘
  barrier TEXT,                  -- 没做时的障碍分析
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 情绪追踪（独立于打卡，更轻量）
CREATE TABLE moods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  score INTEGER CHECK(score BETWEEN 1 AND 5),
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 从对话中提取的洞察
CREATE TABLE insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  source_conversation_id INTEGER REFERENCES conversations(id),
  linked_principle TEXT,         -- 关联的原则 slug
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### GLM API 接入方案

```typescript
// server/utils/glm.ts
interface GLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function chatWithGLM(messages: GLMMessage[]) {
  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GLM_API_KEY}`
    },
    body: JSON.stringify({
      model: 'glm-4-plus',  // 或 glm-5.1
      messages,
      temperature: 0.7,
      max_tokens: 2000
    })
  })
  return response.json()
}
```

---

## AI System Prompt 设计要点

### 自我探索模式的 System Prompt 核心原则

```
你是一个陪伴型的个人成长教练。你的用户正在通过这个网站认识自己、建立原则、尝试新事物。

你的角色不是：
- 心理医生（不做诊断、不开药）
- 命令者（不说"你必须做 X"）
- 评判者（不说"你怎么又没做"）

你的角色是：
- 像一个真正关心你的朋友，问对的问题
- 帮用户发现他们自己没注意到的模式和矛盾
- 在用户说"我不知道"的时候，提供具体的选项而不是抽象的建议
- 把大目标拆成最小可行动作
- 记住用户之前说过的话，在合适的时候引用回来

对话风格：
- 温暖但直接，不绕弯子
- 用中文交流
- 每次回复不要太长，像一个真人在聊天
- 适当地追问，不轻易放过模糊的回答
```

### 行动实验推荐逻辑

```
基于用户的原则库 + 最近的情绪状态 + 上次实验的完成情况，
推荐一个本周可以尝试的小实验。

实验要求：
- 必须是一个具体的、30 分钟内可以完成的动作
- 不能是"坚持做 X"这种持续性任务，而是一次性体验
- 要有趣、有新鲜感，连接用户平时不会接触的领域
- 如果用户上次没完成实验，先帮分析障碍，再推荐新的
```

---

## V2 规划（不急着做）

| 模块 | 说明 |
|---|---|
| **决策日志** | 重要决策的记录 + 事后复盘 |
| **精神花园** | 读书笔记、思想碎片、审美收藏 |
| **连接** | 让同频的人找到你 |
| **数据可视化** | 情绪曲线、成长轨迹、实验完成率 |
| **移动端适配** | PWA 支持，像 App 一样用 |

---

## 开发步骤建议

1. **初始化 Nuxt 3 项目** — `npx nuxi@latest init my-growth-os`
2. **搭骨架** — 布局、导航、路由、基础样式
3. **先做原则库**（纯 Markdown + 前端渲染，不需要后端）
4. **接入 GLM API**（server route + 环境变量）
5. **做自我探索对话界面**
6. **做打卡 + 行动实验**
7. **SQLite 持久化**
8. **部署到云服务器**

---

## 灵感来源

- Ray Dalio《Principles》— 原则结构化
- Matt Pocock `/grill-me` skill — 追问式需求澄清
- Open Design — AI 驱动的设计生成
- Julia Galef《The Scout Mindset》— 真实看到世界
- Ryan Holiday / 斯多葛哲学 — 行动导向的哲学实践
