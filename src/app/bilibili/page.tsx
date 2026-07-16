"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

/* ========== 类型 ========== */
interface BilibiliVideo {
  bvid: string;
  title: string;
  author: string;
  duration: string;
  durationSeconds: number;
  playCount: number;
  cover: string;
  url: string;
}

interface DayPlan {
  day: number;
  videos: BilibiliVideo[];
  totalMinutes: number;
}

const DAILY_LIMIT_SECONDS = 45 * 60;
const STORAGE_KEY = "bilibili_completed";
const SCHEDULE_KEY = "bilibili_schedule";

/* ========== 工具函数 ========== */
function loadCompleted(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? new Set(JSON.parse(raw)) : new Set(); } catch { return new Set(); }
}
function saveCompleted(set: Set<string>) { localStorage.setItem(STORAGE_KEY, JSON.stringify([...set])); }
function loadSchedule(): DayPlan[] | null {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(SCHEDULE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function saveSchedule(plans: DayPlan[]) { localStorage.setItem(SCHEDULE_KEY, JSON.stringify(plans)); }
function formatPlayCount(count: number): string { if (count >= 10000) return `${(count / 10000).toFixed(1)}万`; return String(count); }

function generateSchedule(videos: BilibiliVideo[]): DayPlan[] {
  const pool = [...videos].sort((a, b) => b.playCount - a.playCount);
  const plans: DayPlan[] = [];
  let dayIndex = 1;
  while (pool.length > 0) {
    let remaining = DAILY_LIMIT_SECONDS;
    const dayVideos: BilibiliVideo[] = [];
    for (let i = pool.length - 1; i >= 0; i--) {
      if (pool[i].durationSeconds <= remaining) { remaining -= pool[i].durationSeconds; dayVideos.push(pool[i]); pool.splice(i, 1); }
    }
    if (dayVideos.length === 0 && pool.length > 0) { dayVideos.push(pool.pop()!); }
    if (dayVideos.length > 0) {
      const totalSeconds = dayVideos.reduce((sum, v) => sum + v.durationSeconds, 0);
      plans.push({ day: dayIndex, videos: dayVideos, totalMinutes: Math.round(totalSeconds / 60) });
      dayIndex++;
    } else break;
  }
  return plans;
}

/* ========== 页面组件 ========== */
export default function BilibiliPage() {
  const [videos, setVideos] = useState<BilibiliVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [schedule, setSchedule] = useState<DayPlan[]>([]);
  const [activeTab, setActiveTab] = useState<"schedule" | "all">("schedule");

  useEffect(() => { setCompleted(loadCompleted()); const saved = loadSchedule(); if (saved) setSchedule(saved); }, []);

  const handleSearch = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/bilibili-search"); const data = await res.json();
      if (data.success) { setVideos(data.videos); const plans = generateSchedule(data.videos); setSchedule(plans); saveSchedule(plans); }
      else setError(data.error || "搜索失败");
    } catch { setError("网络请求失败，请确认开发服务器已启动"); }
    finally { setLoading(false); }
  }, []);

  const handleRegenerate = useCallback(() => { if (videos.length === 0) return; const plans = generateSchedule(videos); setSchedule(plans); saveSchedule(plans); }, [videos]);

  const toggleComplete = useCallback((bvid: string) => {
    setCompleted((prev) => { const next = new Set(prev); if (next.has(bvid)) next.delete(bvid); else next.add(bvid); saveCompleted(next); return next; });
  }, []);

  const completeDay = useCallback((dayVideos: BilibiliVideo[]) => {
    setCompleted((prev) => { const next = new Set(prev); dayVideos.forEach((v) => next.add(v.bvid)); saveCompleted(next); return next; });
  }, []);

  const totalVideos = videos.length;
  const completedCount = useMemo(() => videos.filter((v) => completed.has(v.bvid)).length, [videos, completed]);

  const renderVideoCard = (video: BilibiliVideo) => {
    const isDone = completed.has(video.bvid);
    return (
      <div key={video.bvid}
        className="card-hover bg-white rounded-2xl p-3 group"
        style={{ border: `1px solid ${isDone ? "#c8e6c9" : "#ede4d8"}`, opacity: isDone ? 0.75 : 1 }}
      >
        <div className="flex gap-3">
          <a href={video.url} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 w-28 h-[79px] rounded-xl overflow-hidden relative">
            <img src={video.cover} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
            <span className="absolute bottom-1.5 right-1.5 text-white text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "rgba(0,0,0,0.65)" }}>
              {video.duration}
            </span>
          </a>
          <div className="flex-1 min-w-0">
            <a href={video.url} target="_blank" rel="noopener noreferrer"
              className="text-sm font-medium line-clamp-2 transition-colors hover:underline"
              style={{ color: "#4a4a4a" }}>
              {video.title}
            </a>
            <div className="flex items-center gap-2 mt-1.5 text-xs" style={{ color: "#b8a088" }}>
              <span>{video.author}</span><span>·</span><span>{formatPlayCount(video.playCount)} 播放</span>
            </div>
            <button onClick={() => toggleComplete(video.bvid)}
              className="btn-bounce mt-2 text-xs px-2.5 py-1 rounded-xl transition-all"
              style={isDone
                ? { backgroundColor: "#e8f5e9", color: "#66bb6a" }
                : { backgroundColor: "#f5f2ed", color: "#b8a088" }}
              onMouseEnter={(e) => { if (!isDone) { e.currentTarget.style.backgroundColor = "#e8f5e9"; e.currentTarget.style.color = "#66bb6a"; } }}
              onMouseLeave={(e) => { if (!isDone) { e.currentTarget.style.backgroundColor = "#f5f2ed"; e.currentTarget.style.color = "#b8a088"; } }}
            >
              {isDone ? "✓ 已完成" : "标记完成"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#4a4a4a" }}>B站学习库</h2>
          <p className="text-sm mt-1.5" style={{ color: "#b8a088" }}>
            产品经理 / 产品运营 视频学习排期 · 每天 45 分钟
          </p>
        </div>
        <div className="flex items-center gap-2">
          {videos.length > 0 && (
            <button onClick={handleRegenerate}
              className="btn-bounce px-4 py-2.5 rounded-2xl text-sm transition-colors"
              style={{ backgroundColor: "#f5f2ed", color: "#8c8c8c" }}
            >重新排期</button>
          )}
          <button onClick={handleSearch} disabled={loading}
            className="btn-bounce px-5 py-2.5 rounded-2xl text-sm font-medium text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
            style={{ backgroundColor: "#8b7d6b", boxShadow: "0 4px 12px rgba(100,85,65,0.15)" }}
          >
            {loading ? <><span className="animate-spin">⏳</span> 搜索中...</> : <><span className="text-lg">🔍</span> 获取视频</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3.5 rounded-2xl text-sm" style={{ backgroundColor: "#fde8e8", color: "#c0392b", border: "1px solid #f5c6c6" }}>
          {error}
        </div>
      )}

      {/* 统计栏 */}
      {videos.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { label: "视频总数", value: totalVideos, color: "#4a4a4a" },
            { label: "排期天数", value: `${schedule.length} 天`, color: "#4a4a4a" },
            { label: "已完成", value: `${completedCount} / ${totalVideos}`, color: "#66bb6a" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl px-4 py-2.5 text-sm"
              style={{ border: "1px solid #ede4d8" }}>
              <span style={{ color: "#b8a088" }}>{s.label}</span>{" "}
              <span className="font-semibold" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
          <div className="flex-1 min-w-[120px] bg-white rounded-2xl px-4 py-2.5 flex items-center gap-3"
            style={{ border: "1px solid #ede4d8" }}>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#f0ebe0" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: "#a5c9a0", width: `${totalVideos > 0 ? (completedCount / totalVideos) * 100 : 0}%` }} />
            </div>
            <span className="text-xs" style={{ color: "#b8a088" }}>
              {totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0}%
            </span>
          </div>
        </div>
      )}

      {/* 初始引导 */}
      {!loading && videos.length === 0 && !error && (
        <div className="text-center py-20">
          <p className="text-5xl mb-5">📺</p>
          <p className="text-lg mb-2" style={{ color: "#8c8c8c" }}>还没有获取视频</p>
          <p className="text-sm" style={{ color: "#c8bda8" }}>点击上方"获取视频"按钮，从B站搜索产品经理和产品运营相关教程</p>
        </div>
      )}

      {loading && videos.length === 0 && (
        <div className="text-center py-20">
          <p className="text-3xl mb-4 animate-bounce">🔍</p>
          <p style={{ color: "#b8a088" }}>正在从B站搜索视频...</p>
        </div>
      )}

      {/* Tab 切换 */}
      {videos.length > 0 && (
        <>
          <div className="flex gap-1 mb-5 rounded-2xl p-1 w-fit" style={{ backgroundColor: "#f0ebe0" }}>
            {(["schedule", "all"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-5 py-2 text-sm rounded-xl transition-all"
                style={activeTab === tab
                  ? { backgroundColor: "#fff", color: "#4a4a4a", fontWeight: 500, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }
                  : { color: "#b8a088" }}
              >{tab === "schedule" ? "每日排期" : "全部视频"}</button>
            ))}
          </div>

          {activeTab === "all" && <div className="space-y-2.5">{videos.map((v) => renderVideoCard(v))}</div>}

          {activeTab === "schedule" && (
            <div className="space-y-5">
              {schedule.map((day) => {
                const dayDone = day.videos.every((v) => completed.has(v.bvid));
                const dayPartial = day.videos.some((v) => completed.has(v.bvid));
                const borderColor = dayDone ? "#c8e6c9" : dayPartial ? "#c8d8e8" : "#ede4d8";
                const headerBg = dayDone ? "#f1f8f1" : dayPartial ? "#f4f7fa" : "#fdfaf5";
                return (
                  <div key={day.day} className="rounded-2xl overflow-hidden transition-all"
                    style={{ border: `2px solid ${borderColor}` }}>
                    <div className="flex items-center justify-between px-5 py-3.5" style={{ backgroundColor: headerBg }}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold" style={{ color: dayDone ? "#66bb6a" : dayPartial ? "#6a9cc4" : "#6b5b4e" }}>
                          Day {day.day}
                        </span>
                        <span className="text-xs" style={{ color: "#b8a088" }}>
                          {day.videos.length} 个视频 · 约 {day.totalMinutes} 分钟
                        </span>
                        {dayDone && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "#c8e6c9", color: "#388e3c" }}>
                            全部完成
                          </span>
                        )}
                      </div>
                      {!dayDone && (
                        <button onClick={() => completeDay(day.videos)}
                          className="btn-bounce text-xs px-3 py-1 rounded-xl"
                          style={{ color: "#8b7d6b" }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f5f2ed"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                        >一键完成本天</button>
                      )}
                    </div>
                    <div className="p-3 space-y-2.5 bg-white">{day.videos.map((v) => renderVideoCard(v))}</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}