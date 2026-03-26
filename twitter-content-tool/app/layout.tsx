import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Twitter 内容工具",
  description: "灵感收集器 + 人设管理 + 推文生成",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-gray-950 text-gray-100">{children}</body>
    </html>
  );
}
