export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center animate-fade-in">
      <p className="text-5xl mb-6">🌿</p>
      <h2 className="text-2xl font-bold mb-3" style={{ color: "#4a4a4a" }}>
        欢迎使用个人效率仪表盘
      </h2>
      <p className="text-lg mb-8" style={{ color: "#b8a088" }}>
        记录 · 规划 · 成长
      </p>
      <div className="flex gap-3">
        <span className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: "#f5e6d3", color: "#8b7d6b" }}>
          每天进步一点点
        </span>
        <span className="text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: "#e8f5e9", color: "#66bb6a" }}>
          用心生活，高效工作
        </span>
      </div>
    </div>
  );
}