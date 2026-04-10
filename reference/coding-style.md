# 代码风格规范

## 文件组织

- **组件**: `components/[ComponentName].tsx` - 使用 PascalCase
- **页面**: `app/[route]/page.tsx` - 使用小写
- **API 路由**: `app/api/[name]/route.ts` - 使用小写
- **工具函数**: `lib/[name].ts` - 使用 camelCase
- **类型定义**: `types/[name].ts` - 使用 camelCase

## 命名规范

### 变量命名

```typescript
// ✅ 常量：全大写 + 下划线
const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12MB

// ✅ 组件：PascalCase
function InspirationCard() { }

// ✅ 函数：camelCase
function extractTextFromImage() { }

// ✅ 类型：PascalCase + 语义化
interface InspirationData { }
type PersonaConfig = { };

// ✅ 布尔值：使用 is/has/should 前缀
const isLoading = true;
const hasError = false;
```

## 代码结构

### 组件结构（单文件不超过 300 行）

```typescript
// 1. 导入
import { useState } from 'react';

// 2. 类型定义
interface Props { }

// 3. 常量定义
const MAX_ITEMS = 100;

// 4. 主组件
export default function Component({ }: Props) {
  // 状态
  const [data, setData] = useState();
  
  // 副作用
  useEffect(() => { }, []);
  
  // 事件处理
  const handleClick = () => { };
  
  // 渲染
  return <div />;
}

// 5. 辅助函数（组件外）
function helperFn() { }
```

### API 路由结构

```typescript
import { NextRequest } from 'next/server';

// GET 处理
export async function GET(request: NextRequest) {
  try {
    // 参数验证
    // 业务逻辑
    // 返回响应
    return Response.json({ data });
  } catch (error) {
    // 错误处理
    return Response.json(
      { error: '错误消息' },
      { status: 500 }
    );
  }
}
```

## 错误处理规范

```typescript
// ✅ 使用 try-catch 包裹异步操作
try {
  const result = await fetchData();
} catch (error) {
  console.error('获取数据失败:', error);
  // 返回用户友好的错误信息
  throw new Error('无法获取数据，请稍后重试');
}

// ✅ 自定义错误类
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

## 注释规范

```typescript
// ✅ 单行注释：解释"为什么"
// 限制文件大小防止内存溢出
const MAX_SIZE = 12 * 1024 * 1024;

// ✅ 函数注释
/**
 * 从图片提取文本内容
 * @param base64Image - base64 编码的图片
 * @returns 提取的文本内容
 * @throws 当图片解析失败时抛出错误
 */
async function extractText(base64Image: string): Promise<string> {
  // ...
}
```

## Tailwind 使用规范

```typescript
// ✅ 按逻辑分组
className="
  flex items-center gap-4
  px-4 py-2
  bg-slate-800 rounded-lg
  text-white text-sm
  hover:bg-slate-700
  transition-colors
"

// ✅ 复杂样式使用 cn() 工具函数
import { cn } from '@/lib/utils';

className={cn(
  "flex items-center",
  isActive && "bg-blue-600",
  isDisabled && "opacity-50 cursor-not-allowed"
)}
```

## 类型安全规范

```typescript
// ✅ 避免使用 any
// ❌ bad
function process(data: any) { }

// ✅ good
function process(data: Inspiration) { }

// ✅ 使用 unknown 需要时进行类型收窄
function process(data: unknown) {
  if (typeof data === 'string') {
    // data 被收窄为 string
  }
}
```
