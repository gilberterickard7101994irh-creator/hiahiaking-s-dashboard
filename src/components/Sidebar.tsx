"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { href: "/bilibili", label: "B站学习库", icon: "📺" },
  { href: "/happiness", label: "幸福三件事", icon: "😊" },
  { href: "/research", label: "科研项目优先级", icon: "🔬" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-60 h-screen flex flex-col fixed left-0 top-0"
      style={{ backgroundColor: "#4A3F35" }}
    >
      {/* Logo 区域 */}
      <div
        className="px-6 py-7 border-b"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <h1 className="text-lg font-bold tracking-wider text-white/90">
          效率仪表盘
        </h1>
        <p className="text-xs mt-1.5 text-white/35 tracking-wide">
          记录 · 规划 · 成长
        </p>
      </div>

      {/* 导航 */}
      <nav className="flex-1 py-5">
        <ul className="space-y-0.5 px-3">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200
                    ${isActive
                      ? "text-white font-medium"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                    }`}
                  style={
                    isActive
                      ? { backgroundColor: "rgba(255,255,255,0.12)" }
                      : undefined
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "#d4a574" }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 底部 */}
      <div
        className="px-6 py-5 border-t text-xs text-white/25"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        用心生活，高效工作
      </div>
    </aside>
  );
}