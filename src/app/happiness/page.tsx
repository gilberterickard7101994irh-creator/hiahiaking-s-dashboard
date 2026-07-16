"use client";

import { useState, useEffect, useCallback } from "react";

/* ---------- 类型 ---------- */
interface HappinessEntry {
  date: string;
  mood: string;
  things: [string, string, string];
}

/* ---------- 心情选项 ---------- */
const moodOptions = [
  { emoji: "😄", label: "开心" },
  { emoji: "😊", label: "满足" },
  { emoji: "😌", label: "平静" },
  { emoji: "🤗", label: "感恩" },
  { emoji: "🥰", label: "幸福" },
  { emoji: "😎", label: "超棒" },
  { emoji: "😐", label: "一般" },
  { emoji: "😢", label: "低落" },
  { emoji: "😤", label: "烦躁" },
  { emoji: "😴", label: "疲惫" },
];

/* ---------- 工具函数 ---------- */
const STORAGE_KEY = "happiness_entries";

function loadEntries(): HappinessEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HappinessEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: HappinessEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const week = ["日", "一", "二", "三", "四", "五", "六"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${week[d.getDay()]}`;
}

/* ---------- 页面组件 ---------- */
export default function HappinessPage() {
  const [entries, setEntries] = useState<HappinessEntry[]>([]);
  const [mood, setMood] = useState("😊");
  const [things, setThings] = useState<[string, string, string]>(["", "", ""]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const today = todayStr();
  const todayEntry = entries.find((e) => e.date === today);
  const isTodaySaved = !!todayEntry;

  useEffect(() => {
    if (todayEntry) {
      setMood(todayEntry.mood);
      setThings(todayEntry.things);
    }
  }, [todayEntry]);

  const handleSave = useCallback(() => {
    const trimmed = things.map((t) => t.trim()) as [string, string, string];
    if (trimmed.some((t) => !t)) {
      alert("请填写完整的三件事哦～");
      return;
    }
    const updated = entries.filter((e) => e.date !== today);
    const newEntry: HappinessEntry = { date: today, mood, things: trimmed };
    const result = [newEntry, ...updated].sort(
      (a, b) => b.date.localeCompare(a.date)
    );
    setEntries(result);
    saveEntries(result);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [today, mood, things, entries]);

  const handleDelete = useCallback(
    (date: string) => {
      const updated = entries.filter((e) => e.date !== date);
      setEntries(updated);
      saveEntries(updated);
      if (date === today) {
        setMood("😊");
        setThings(["", "", ""]);
      }
    },
    [entries, today]
  );

  const updateThing = (index: number, value: string) => {
    const next = [...things] as [string, string, string];
    next[index] = value;
    setThings(next);
  };

  return (
    <div className="flex gap-8 flex-col lg:flex-row animate-fade-in">
      {/* ========== 左侧：记录表单 ========== */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl shadow-sm p-8" style={{ borderColor: "#ede4d8", borderWidth: 1 }}>
          {/* 日期 */}
          <div className="text-center mb-8">
            <p className="text-sm tracking-widest" style={{ color: "#b8a088" }}>
              {formatDate(today)}
            </p>
          </div>

          {/* 今日心情 */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-4" style={{ color: "#8c8c8c" }}>
              今日心情
            </label>
            <div className="flex flex-wrap gap-2.5">
              {moodOptions.map((opt) => (
                <button
                  key={opt.emoji}
                  type="button"
                  onClick={() => setMood(opt.emoji)}
                  title={opt.label}
                  className="text-2xl w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200"
                  style={
                    mood === opt.emoji
                      ? { backgroundColor: "#f5e6d3", transform: "scale(1.12)", boxShadow: "0 2px 8px rgba(180,140,100,0.2)" }
                      : { backgroundColor: "#faf7f2" }
                  }
                  onMouseEnter={(e) => {
                    if (mood !== opt.emoji) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#f5e6d3";
                      (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (mood !== opt.emoji) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#faf7f2";
                      (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                    }
                  }}
                >
                  {opt.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 三件幸福小事 */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-4" style={{ color: "#8c8c8c" }}>
              今天发生的三件幸福小事
            </label>
            <div className="space-y-4">
              {(["①", "②", "③"] as const).map((num, i) => (
                <div key={i} className="relative">
                  <span
                    className="absolute left-4 top-4 text-sm font-bold"
                    style={{ color: "#d4a574" }}
                  >
                    {num}
                  </span>
                  <textarea
                    value={things[i]}
                    onChange={(e) => updateThing(i, e.target.value)}
                    placeholder={`写下第${i + 1}件让你感到幸福的小事...`}
                    rows={2}
                    className="input-warm w-full pl-10 pr-5 py-4 rounded-2xl text-sm resize-none transition-all"
                    style={{
                      backgroundColor: "#fdfaf5",
                      border: "1px solid #ede4d8",
                      color: "#4a4a4a",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#d4a574";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,165,116,0.1)";
                      e.currentTarget.style.backgroundColor = "#fdf8f0";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#ede4d8";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.backgroundColor = "#fdfaf5";
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            disabled={saved}
            className="btn-bounce w-full py-3.5 rounded-2xl font-medium text-sm transition-all"
            style={
              saved
                ? { backgroundColor: "#e8f5e9", color: "#66bb6a" }
                : { background: "linear-gradient(135deg, #d4a574, #c9956b)", color: "#fff", boxShadow: "0 4px 14px rgba(180,140,100,0.25)" }
            }
          >
            {saved ? "已保存 ✓" : isTodaySaved ? "更新记录" : "保存记录"}
          </button>
        </div>
      </div>

      {/* ========== 右侧：历史记录 ========== */}
      <div className="lg:w-80 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-sm p-6" style={{ borderColor: "#ede4d8", borderWidth: 1 }}>
          <h3 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: "#6b5b4e" }}>
            <span>📋</span> 历史记录
          </h3>

          {entries.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "#b8a088" }}>
              还没有记录，快来写下今天的幸福小事吧～
            </p>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {entries.map((entry) => (
                <div
                  key={entry.date}
                  className="rounded-2xl p-4 relative group card-hover"
                  style={{ backgroundColor: "#fdfaf5", border: "1px solid #ede4d8" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs" style={{ color: "#b8a088" }}>
                      {formatDate(entry.date)}
                    </span>
                    <span className="text-xl">{entry.mood}</span>
                  </div>

                  <ul className="space-y-1.5">
                    {entry.things.map((thing, i) => (
                      <li
                        key={i}
                        className="text-xs flex items-start gap-1.5"
                        style={{ color: "#6b5b4e" }}
                      >
                        <span className="mt-0.5 flex-shrink-0" style={{ color: "#d4a574" }}>
                          {["①", "②", "③"][i]}
                        </span>
                        <span className="leading-relaxed">{thing}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleDelete(entry.date)}
                    className="absolute top-3 right-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "#c0a08a" }}
                    title="删除"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#e57373"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#c0a08a"; }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}