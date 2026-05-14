import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AITomato - AI 驱动的番茄钟",
  description: "用自然语言管理你的专注时间，AI 端到端交互重构番茄工作法",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
