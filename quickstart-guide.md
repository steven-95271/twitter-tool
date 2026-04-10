# 代码小白操作手册 — 一步步喂给 OpenCode

## 你需要提前准备的

1. 注册 MiniMax 开放平台账号：https://platform.minimaxi.com
2. 在平台上获取 API Key
3. 确保电脑已安装 Node.js（去 https://nodejs.org 下载安装即可）

## 喂给 OpenCode 的顺序

### 第一步：创建项目

把下面这段话直接复制粘贴给 OpenCode：

```
帮我创建一个 Next.js 项目，项目名叫 twitter-content-tool。
使用 TypeScript + Tailwind CSS + App Router。
然后安装这些依赖：openai, better-sqlite3, @types/better-sqlite3

命令是：
npx create-next-app@latest twitter-content-tool --typescript --tailwind --app
cd twitter-content-tool
npm install openai better-sqlite3 @types/better-sqlite3
```

### 第二步：喂入需求文档

把 `twitter-tool-prd.md` 文件的全部内容复制，然后对 OpenCode 说：

```
这是我的产品需求文档，请仔细阅读。
我们按照文档底部的"开发顺序建议"一步步来。
先从第1步开始：搭建项目骨架和数据库初始化。
请帮我创建项目结构、初始化 SQLite 数据库、搭建侧边栏布局。
```

### 第三步：逐步开发

每完成一个模块后，对 OpenCode 说：

```
第1步已经完成了。现在开始第2步：做灵感收集器。
请参考需求文档中"模块1：灵感收集器"的描述来实现。
```

以此类推，直到 4 个步骤全部完成。

### 第四步：导入预置人设

项目跑通后，把 `steven-ai-notes-persona.json` 放进项目的 `personas/` 文件夹。
然后对 OpenCode 说：

```
请帮我实现人设配置的导入功能。
用户可以在人设管理页面点击"导入人设"按钮，
选择一个 JSON 文件，自动解析并创建对应的人设。
personas/ 文件夹下已经有一个示例文件 steven-ai-notes-persona.json。
```

### 第五步：配置 API Key

对 OpenCode 说：

```
请帮我创建 .env.local 文件，内容是：
MINIMAX_API_KEY=我的API密钥

然后确保 llm.ts 中的 OpenAI client 配置正确指向 MiniMax。
```

## 遇到报错怎么办

直接把报错信息完整复制粘贴给 OpenCode，加一句"请帮我修复这个错误"即可。

## 启动项目

```
cd twitter-content-tool
npm run dev
```

然后打开浏览器访问 http://localhost:3000

## 后续进化

- 每当你发现新的喜欢的博主 → 在人设编辑页面的"参考博主"里加上他的样本推文
- 每当生成的推文哪里不对 → 回去调 style_rules，加新的 do/don't 规则
- 想开新的 Twitter 账号 → 复制 persona JSON，改配置，导入即可
