import type { ReactNode } from "react";

export const metadata = {
  title: "TodayPaper API",
  description: "TodayPaper backend API"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
