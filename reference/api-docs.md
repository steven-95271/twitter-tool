# API 文档摘要

## KIMI API

**文档地址**: https://platform.moonshot.cn/docs/intro

### 认证

```bash
Authorization: Bearer ${KIMI_API_KEY}
```

### 基础 URL

```
https://api.moonshot.cn/v1
```

### 支持的模型

| 模型 | 上下文 | 特点 |
|------|--------|------|
| `moonshot-v1-8k` | 8K | 快速、便宜 |
| `moonshot-v1-32k` | 32K | 长文本 |
| `moonshot-v1-8k-vision-preview` | 8K | 支持图片分析 |
| `moonshot-v1-32k-vision-preview` | 32K | 支持图片分析 |

### 图片分析示例

```typescript
const response = await openai.chat.completions.create({
  model: 'moonshot-v1-8k-vision-preview',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: '描述这张图片的内容' },
        {
          type: 'image_url',
          image_url: {
            url: 'data:image/jpeg;base64,/9j/4AAQ...'
          }
        }
      ]
    }
  ]
});
```

### 限制

- 图片大小：最大 20MB
- 图片格式：JPEG, PNG, GIF, WebP
- 并发：默认 5 req/s

## MiniMax API

**文档地址**: https://www.minimaxi.com/document/guides/chat-model/chat

### 认证

```bash
Authorization: Bearer ${MINIMAX_API_KEY}
```

### 基础 URL

```
https://api.minimaxi.com/v1
```

### 支持的模型

| 模型 | 上下文 | 说明 |
|------|--------|------|
| `MiniMax-M2.7` | 8K | 主模型 |
| `abab6.5s-chat` | 8K | 标准版 |

### 注意事项

- ❌ M2.7 不支持图片输入
- ✅ 需要使用 image-01 模型才能分析图片
- image-01 需要特殊套餐权限

## OpenAI SDK 通用格式

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.xxx.com/v1',
});

// 文本对话
const response = await client.chat.completions.create({
  model: 'model-name',
  messages: [
    { role: 'system', content: 'system prompt' },
    { role: 'user', content: 'user message' }
  ],
  temperature: 0.8,
  max_tokens: 2000,
});

// 获取结果
const content = response.choices[0].message.content;
```

## PDF 提取服务

当前使用 `pdf-parse` 库在服务端提取 PDF 文本。

```typescript
import pdf from 'pdf-parse';

const data = await pdf(buffer);
console.log(data.text); // PDF 文本内容
```

## 链接抓取服务

使用 `link-preview-js` 抓取链接的标题、描述和图片。

```typescript
import { getLinkPreview } from 'link-preview-js';

const data = await getLinkPreview(url);
// 返回：{ title, description, image, url }
```

## 错误码参考

| 状态码 | 含义 | 处理建议 |
|--------|------|----------|
| 200 | 成功 | - |
| 400 | 请求参数错误 | 检查请求格式 |
| 401 | 认证失败 | 检查 API Key |
| 429 | 请求过于频繁 | 降低请求频率 |
| 500 | 服务端错误 | 稍后重试 |
| 503 | 服务不可用 | 稍后重试 |
