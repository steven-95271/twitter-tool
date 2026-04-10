# Twitter 内容生成器 - 架构文档

## 技术栈选择

| 层级 | 技术 | 选择理由 |
|------|------|----------|
| 框架 | Next.js 16 (App Router) | 全栈能力、TypeScript 原生支持、Vercel 一键部署 |
| 语言 | TypeScript 5 | 类型安全、更好的 IDE 支持 |
| 样式 | Tailwind CSS 4 | 原子化 CSS、快速开发 |
| 数据库 | SQLite (better-sqlite3) | 轻量、无需额外服务、适合本地/小型部署 |
| AI SDK | OpenAI SDK | 兼容多家 LLM API（MiniMax、KIMI 等） |
| 部署 | Vercel + Railway | Vercel 前端托管，Railway 后端 + 数据库 |

## 目录结构

```
twitter-content-tool/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # 根布局（深色主题配置）
│   ├── globals.css              # 全局样式
│   ├── (main)/                  # 路由组 - 主应用区域
│   │   ├── layout.tsx           # 主布局（左侧导航栏）
│   │   ├── page.tsx             # 首页 /（跳转至灵感库）
│   │   ├── inspirations/
│   │   │   └── page.tsx         # 灵感收集页 /inspirations
│   │   ├── personas/
│   │   │   ├── page.tsx         # 人设列表页 /personas
│   │   │   └── [id]/
│   │   │       └── page.tsx     # 人设编辑页 /personas/:id
│   │   └── generate/
│   │       └── page.tsx         # 推文生成页 /generate
│   └── api/                     # API 路由
│       ├── inspirations/
│       │   └── route.ts         # 灵感 CRUD API
│       ├── personas/
│       │   └── route.ts         # 人设 CRUD API
│       ├── generate/
│       │   └── route.ts         # LLM 推文生成 API
│       └── extract-pdf/
│           └── route.ts         # PDF 内容提取 API
├── components/                  # React 组件
│   ├── Layout.tsx               # 页面布局（含侧边栏导航）
│   ├── InspirationCard.tsx      # 灵感卡片组件
│   ├── PersonaCard.tsx          # 人设卡片组件
│   └── TweetPreview.tsx         # 推文预览组件
├── lib/                         # 工具库
│   ├── db.ts                    # SQLite 数据库操作
│   ├── llm.ts                   # LLM API 调用封装
│   ├── prompt-builder.ts        # System Prompt 拼装
│   └── link-fetcher.ts          # 链接内容抓取
├── data/                        # 数据文件
│   └── twitter-tool.db          # SQLite 数据库（运行时生成）
├── personas/                    # 预置人设配置
│   └── steven-ai-notes.json     # 示例人设
├── public/                      # 静态资源
└── reference/                   # 开发参考文档
    └── api/                     # API 文档摘要
```

## 数据模型

### 灵感 (inspirations)

```typescript
interface Inspiration {
  id: number;                    // 自增主键
  content: string;               // 文字内容
  attachments: {                 // 附件（JSON）
    images?: string[];           // base64 图片数组
    links?: string[];            // 链接数组
    pdf?: string;                // PDF base64
  };
  extracted_text: string;        // AI 提取的关键内容
  tags: string[];                // 标签数组
  source: string;                // 来源描述
  created_at: string;            // ISO 时间戳
  used_count: number;            // 使用次数
}
```

### 人设 (personas)

```typescript
interface Persona {
  id: number;                    // 自增主键
  name: string;                  // 人设名称
  handle: string;                // Twitter handle
  background: string;            // 背景描述
  tone: string;                  // 语气描述
  style_rules: string[];         // 写作规则（do/don't）
  banned_words: string[];        // 禁用词
  reference_authors: {           // 参考博主
    name: string;
    style_notes: string;
    sample_tweets: string[];
  }[];
  system_prompt: string;         // 拼装好的 system prompt
  created_at: string;
  updated_at: string;
}
```

## 数据流

```
用户输入（文字+附件）
    ↓
前端验证（大小、格式）
    ↓
API 路由接收请求
    ↓
附件处理（并行）
    ├─ 图片 → base64（限制 12MB）
    ├─ 链接 → 抓取内容
    └─ PDF → 提取文本
    ↓
LLM 分析（KIMI API）
    ├─ 提取关键观点
    └─ 自动打标签
    ↓
存储到 SQLite
    ↓
返回前端展示
```

## API 设计

### 灵感相关

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/inspirations` | 获取所有灵感列表 |
| POST | `/api/inspirations` | 创建新灵感 |
| PUT | `/api/inspirations/:id` | 更新灵感 |
| DELETE | `/api/inspirations/:id` | 删除灵感 |

### 人设相关

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/personas` | 获取所有人设 |
| POST | `/api/personas` | 创建人设 |
| PUT | `/api/personas/:id` | 更新人设 |
| DELETE | `/api/personas/:id` | 删除人设 |

### 生成相关

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/generate` | 生成推文 |
| POST | `/api/extract-pdf` | 提取 PDF 文本 |

## LLM 调用策略

### 图片分析（当前使用 KIMI）

```typescript
// API 配置
const kimiClient = new OpenAI({
  apiKey: process.env.KIMI_API_KEY,
  baseURL: 'https://api.moonshot.cn/v1',
});

// 调用示例
const response = await kimiClient.chat.completions.create({
  model: 'moonshot-v1-8k-vision-preview',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: '提取图片关键内容...' },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
      ]
    }
  ]
});
```

### 推文生成

- System Prompt：从人设配置动态拼装
- User Prompt：选中灵感 + 补充说明
- 输出：3 个版本的推文，用 `---` 分隔

## 环境变量

```bash
# LLM API Keys
KIMI_API_KEY=sk-xxx           # KIMI API（图片分析）
MINIMAX_API_KEY=xxx           # MiniMax API（备用）

# 可选：部署配置
NEXT_PUBLIC_APP_URL=xxx       # 应用 URL
```

## 部署架构

### Vercel（前端 + API）

- 自动从 GitHub 部署
- Serverless Functions 运行 API
- 环境变量在 Vercel Dashboard 配置

### Railway（备用）

- 当 Vercel 部署问题时使用
- URL: https://twitter-tool-production-5672.up.railway.app

## 安全考虑

1. **API Key 保护**：所有 LLM API Key 存储在环境变量，不暴露到前端
2. **文件上传限制**：图片限制 12MB，前端 + 后端双重校验
3. **SQL 注入防护**：使用 better-sqlite3 的参数化查询
4. **错误信息**：生产环境不暴露敏感错误细节

## 待优化项

1. 数据库持久化：SQLite 在 Vercel Serverless 环境会重置，需迁移到 PostgreSQL 或 Neon
2. 图片存储：base64 存储在 SQLite 会导致数据库膨胀，需迁移到对象存储
3. 用户系统：目前无用户隔离，多用户场景需要添加简单的 token 或密码保护
