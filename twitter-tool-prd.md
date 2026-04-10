# Twitter 灵感收集器 + 内容生成器 — 产品需求文档

## 项目概述

一个本地运行的 Web 工具，帮助用户收集灵感素材、管理多个 Twitter 人设、基于素材和人设生成高质量推文。

技术栈：Next.js (App Router) + TypeScript + SQLite (better-sqlite3) + MiniMax-M2.7 API（兼容 OpenAI SDK 格式）

## 核心模块

### 模块 1：灵感收集器

功能：用户可以输入文字、粘贴图片、输入链接，保存为一条"灵感卡片"。

数据结构：
```
inspiration {
  id: 自增主键
  type: "text" | "image" | "link"
  raw_content: 原始输入内容（文字/图片base64/链接URL）
  extracted_text: AI提取的关键内容（调用LLM自动提取）
  tags: 标签数组（如 "AI", "商业", "读书笔记"）
  source: 来源描述（如 "Wolfram的书", "王川推文"）
  created_at: 创建时间
  used_count: 被用于生成推文的次数
}
```

页面功能：
- 一个大的输入框，支持粘贴文字或拖入图片
- 输入后点击"保存并分析"，调用 LLM 自动提取关键观点、打标签
- 灵感列表页，支持按标签筛选、按时间排序
- 每条灵感卡片可编辑、删除

### 模块 2：人设管理器

功能：创建和管理多个 Twitter 人设配置。每个人设包含背景信息、写作风格规则、参考博主样本。

数据结构：
```
persona {
  id: 自增主键
  name: 人设名称（如 "Steven AI笔记"）
  handle: Twitter用户名（如 "@stevenotes"）
  background: 人物背景描述
  tone: 语气描述（一句话概括）
  style_rules: 写作规则数组（具体的do和don't）
  banned_words: 禁用词列表
  reference_authors: 参考博主数组，每个包含 {name, style_notes, sample_tweets[]}
  system_prompt: 根据以上信息自动拼装的完整system prompt
  created_at: 创建时间
  updated_at: 更新时间
}
```

页面功能：
- 人设列表页，展示所有已创建的人设卡片
- 新建/编辑人设页面，表单字段包括：
  - 基本信息：名称、handle、背景、语气
  - 写作规则：可动态增减的规则条目
  - 禁用词：逗号分隔输入
  - 参考博主：可添加多个博主，每个博主下可粘贴多条样本推文
- 点击"生成 System Prompt"按钮，自动将所有配置拼装成一段完整的 system prompt 并预览
- 支持导出/导入人设配置（JSON格式）

### 模块 3：推文生成器

功能：选择一个人设 + 选择一条或多条灵感素材 → 调用 LLM 生成推文。

页面功能：
- 左侧：选择人设（下拉菜单）
- 中间：从灵感库选择素材（可多选，勾选）
- 可选：补充说明框（如"结合我做亚马逊的经验来写"）
- 点击"生成推文"
- 右侧：展示 3 个不同版本的推文草稿
- 每个版本下方有"复制"和"标记为已使用"按钮
- 可以点击"重新生成"刷新某一个版本

LLM 调用逻辑：
```
system_prompt = 选中人设的 system_prompt
user_prompt = """
以下是我的灵感素材：
---
{selected_inspirations}
---
{optional_notes}

请基于以上素材，用我的人设风格生成 3 个不同角度的推文版本。
每个版本控制在 280 字以内。
直接输出推文内容，不要加任何解释。
用 --- 分隔三个版本。
"""
```

## API 对接

使用 OpenAI SDK 格式调用 MiniMax-M2.7：

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.MINIMAX_API_KEY,
  baseURL: 'https://api.minimaxi.com/v1',  // MiniMax API endpoint
});

const response = await client.chat.completions.create({
  model: 'MiniMax-M2.7',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ],
  temperature: 0.8,
  max_tokens: 2000,
});
```

环境变量文件 `.env.local`：
```
MINIMAX_API_KEY=你的API密钥
```

## UI 设计要求

- 整体风格：深色主题，简洁，参考 Notion 的排版感
- 左侧固定导航栏：灵感库 / 人设管理 / 生成推文
- 响应式设计，但主要为桌面端使用
- 使用 Tailwind CSS
- 不需要用户登录系统，纯本地使用

## 项目结构

```
twitter-content-tool/
├── app/
│   ├── page.tsx                 # 首页/仪表盘
│   ├── inspirations/
│   │   └── page.tsx             # 灵感收集页
│   ├── personas/
│   │   ├── page.tsx             # 人设列表页
│   │   └── [id]/
│   │       └── page.tsx         # 人设编辑页
│   ├── generate/
│   │   └── page.tsx             # 推文生成页
│   └── api/
│       ├── inspirations/
│       │   └── route.ts         # 灵感 CRUD API
│       ├── personas/
│       │   └── route.ts         # 人设 CRUD API
│       └── generate/
│           └── route.ts         # 调用 LLM 生成推文
├── lib/
│   ├── db.ts                    # SQLite 数据库初始化和操作
│   ├── llm.ts                   # LLM API 调用封装
│   └── prompt-builder.ts        # System Prompt 拼装逻辑
├── components/
│   ├── Layout.tsx               # 页面布局（含侧边栏）
│   ├── InspirationCard.tsx      # 灵感卡片组件
│   ├── PersonaCard.tsx          # 人设卡片组件
│   └── TweetPreview.tsx         # 推文预览组件
├── data/
│   └── twitter-tool.db          # SQLite 数据库文件
├── personas/
│   └── steven-ai-notes.json     # 预置人设配置（示例）
├── .env.local
├── package.json
└── README.md
```

## 启动步骤

```bash
npx create-next-app@latest twitter-content-tool --typescript --tailwind --app
cd twitter-content-tool
npm install openai better-sqlite3 @types/better-sqlite3
```

## 开发顺序建议

1. 先搭建项目骨架和数据库初始化
2. 做灵感收集器（最简单，先跑通 CRUD）
3. 做人设管理器（核心，System Prompt 拼装逻辑要仔细）
4. 做推文生成器（调通 API 即可）
5. 最后优化 UI 和交互细节
