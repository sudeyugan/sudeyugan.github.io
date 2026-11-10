import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "苏的鱼干 · 保持温柔，持续好奇",
  description: "你好，我是苏的鱼干。写代码，也关心代码之外的事。这里有我的作品、一点想法，还有认识彼此的可能。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
