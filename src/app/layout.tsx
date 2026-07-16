import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "个人效率仪表盘",
  description: "个人效率管理工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="text-[#4a4a4a]" style={{ backgroundColor: "#faf7f2" }}>
        <div className="flex">
          <Sidebar />
          <main className="ml-60 flex-1 min-h-screen px-8 py-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}