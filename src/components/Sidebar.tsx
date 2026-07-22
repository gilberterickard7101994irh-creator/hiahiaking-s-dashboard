"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const menuItems = [
  { href: "/operation", label: "运营知识地图", icon: "🚀" },
  { href: "/happiness", label: "幸福三件事", icon: "😊" },
  { href: "/research", label: "科研项目优先级", icon: "🔬" },
  { href: "/knowledge", label: "知识库看板", icon: "📚" },
  { href: "/terms", label: "术语手册", icon: "📖" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  /* 路由切换时自动关闭移动端菜单 */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /* 阻止滚动穿透 */
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const NavLinks = () => (
    <ul className="space-y-2 px-4">
      {menuItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-base transition-all duration-200
                ${isActive
                  ? "text-gray-900 font-bold bg-yellow-100 border-2 border-gray-800 shadow-[2px_2px_0px_0px_#1e293b] rotate-1"
                  : "text-gray-500 hover:text-red-500 hover:-translate-y-1 hover:rotate-2 hover:pl-2"
                }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-2 h-2 rounded-full bg-gray-800" />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* ===== 移动端顶部导航栏 ===== */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[#fdfbf7] border-b-2 border-dashed border-gray-800 flex items-center justify-between px-4">
        <h1 className="font-bold text-lg text-gray-800 -rotate-1">
          hiahiaking&apos;s 成长台
        </h1>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg border-2 border-gray-800 bg-white shadow-[2px_2px_0px_0px_#1e293b] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
          aria-label="切换菜单"
        >
          {mobileOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </header>

      {/* ===== 移动端侧边栏遮罩 ===== */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ===== 侧边栏（桌面端固定 / 移动端抽屉） ===== */}
      <aside
        className={`
          fixed lg:fixed left-0 top-0 z-50
          w-60 h-screen flex flex-col
          bg-[#fdfbf7] border-r-2 border-dashed border-gray-800
          transition-transform duration-300 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo 区域 */}
        <div className="px-6 py-8 border-b border-gray-800/15">
          <h1 className="font-bold text-2xl text-gray-800 -rotate-2 inline-block">
            hiahiaking&apos;s 成长台
          </h1>
          <div className="h-1 w-12 bg-gray-800 rounded-full mt-1" />
          <p className="text-xs mt-3 text-gray-400 tracking-wide">
            记录 · 规划 · 成长
          </p>
        </div>

        {/* 导航 */}
        <nav className="flex-1 py-6 overflow-y-auto">
          <NavLinks />
        </nav>

        {/* 底部 */}
        <div className="px-6 py-5 border-t border-gray-800/10 text-xs text-gray-300">
          用心生活，高效工作
        </div>
      </aside>
    </>
  );
}
