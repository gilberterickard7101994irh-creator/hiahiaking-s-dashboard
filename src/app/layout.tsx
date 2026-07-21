import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import SplashScreen from "@/components/SplashScreen";

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
      <body className="font-sans antialiased">
        <SplashScreen />
        <div className="flex relative z-10">
          <Sidebar />
          <main className="lg:ml-60 flex-1 min-h-screen px-4 py-6 lg:px-8 lg:py-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}