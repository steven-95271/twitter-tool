# UI 设计参考

## 整体风格

- **主题**: 深色模式（Dark Mode）
- **参考应用**: Notion、Linear
- **核心感觉**: 专业、简洁、沉浸

## 配色方案

### 主色调

```css
--background: #0f172a;        /* slate-900 */
--foreground: #f8fafc;        /* slate-50 */
--primary: #3b82f6;           /* blue-500 */
--primary-hover: #2563eb;     /* blue-600 */
```

### 辅助色

```css
--muted: #64748b;             /* slate-500 */
--border: #334155;            /* slate-700 */
--card: #1e293b;              /* slate-800 */
--card-hover: #334155;        /* slate-700 */
```

### 功能色

```css
--success: #22c55e;           /* green-500 */
--warning: #eab308;           /* yellow-500 */
--error: #ef4444;             /* red-500 */
--info: #06b6d4;              /* cyan-500 */
```

## 字体规范

- **主字体**: `ui-sans-serif, system-ui, sans-serif`
- **标题**: 字号大、字重 600-700
- **正文**: 字号小、行高 1.6-1.7

## 间距系统

```
xs: 4px   (1)
sm: 8px   (2)
md: 16px  (4)
lg: 24px  (6)
xl: 32px  (8)
2xl: 48px (12)
```

## 圆角规范

```
sm: 4px   - 小按钮、标签
md: 8px   - 输入框、卡片
default: 12px - 卡片、模态框
lg: 16px  - 大卡片、页面容器
full: 9999px - 圆形按钮、头像
```

## 阴影规范

```css
/* 卡片阴影 */
shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);

/* 悬浮阴影 */
shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* 模态框阴影 */
shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

## 组件示例

### 按钮

```
主按钮:
- bg-blue-500 hover:bg-blue-600
- text-white font-medium
- px-4 py-2 rounded-lg
- transition-colors

次按钮:
- bg-slate-700 hover:bg-slate-600
- text-slate-100
- px-4 py-2 rounded-lg

危险按钮:
- bg-red-500 hover:bg-red-600
- text-white
```

### 卡片

```
- bg-slate-800
- border border-slate-700
- rounded-xl
- p-6
- hover:border-slate-600
- transition-colors
```

### 输入框

```
- bg-slate-900
- border border-slate-700
- rounded-lg
- px-4 py-3
- text-slate-100
- placeholder:text-slate-500
- focus:border-blue-500 focus:ring-1 focus:ring-blue-500
```

### 标签

```
- bg-slate-700
- text-slate-300
- text-sm
- px-2 py-1
- rounded-full
```

## 响应式断点

```
sm: 640px   - 手机横屏
md: 768px   - 平板
lg: 1024px  - 小型桌面
xl: 1280px  - 标准桌面
2xl: 1536px - 大屏
```

## 布局原则

1. **左侧固定导航**: 宽度 240px，固定在左侧
2. **主内容区**: 自适应宽度，max-width 1200px
3. **移动端**: 导航变为顶部汉堡菜单
