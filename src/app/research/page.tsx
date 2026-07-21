"use client";

import { useState, useEffect, useCallback } from "react";

/* ========== 类型定义 ========== */
interface ResearchProject {
  id: string;
  name: string;
  deadline: string;
  estimatedDays: number;
  importance: "high" | "medium" | "low";
}

type Quadrant = "q1" | "q2" | "q3" | "q4";

interface QuadrantConfig {
  key: Quadrant;
  title: string;
  subtitle: string;
  borderColor: string;
  bg: string;
  badgeBg: string;
  dotColor: string;
}

/* ========== 常量 ========== */
const STORAGE_KEY = "research_projects";
const URGENT_DAYS = 7;

const quadrants: QuadrantConfig[] = [
  {
    key: "q1",
    title: "紧急且重要",
    subtitle: "立即处理",
    borderColor: "#e8c9c0",
    bg: "#fdf5f3",
    badgeBg: "#d4958a",
    dotColor: "#d4958a",
  },
  {
    key: "q2",
    title: "重要不紧急",
    subtitle: "计划安排",
    borderColor: "#e8dcc8",
    bg: "#fdf9f2",
    badgeBg: "#d4b87a",
    dotColor: "#d4b87a",
  },
  {
    key: "q3",
    title: "紧急不重要",
    subtitle: "委派/简化",
    borderColor: "#c8d8e8",
    bg: "#f4f7fa",
    badgeBg: "#8aaccc",
    dotColor: "#8aaccc",
  },
  {
    key: "q4",
    title: "不紧急不重要",
    subtitle: "暂缓/舍弃",
    borderColor: "#dddbd8",
    bg: "#f8f7f5",
    badgeBg: "#b0ada8",
    dotColor: "#b0ada8",
  },
];

const importanceLabels: Record<string, string> = {
  high: "高", medium: "中", low: "低",
};

const importanceStyles: Record<string, { bg: string; text: string }> = {
  high: { bg: "#fde8e8", text: "#c0392b" },
  medium: { bg: "#fdf3e0", text: "#b8860b" },
  low: { bg: "#f0f0f0", text: "#888" },
};

/* ========== 工具函数 ========== */
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadProjects(): ResearchProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ResearchProject[]) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: ResearchProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function daysUntilDeadline(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);
  return Math.ceil((dl.getTime() - today.getTime()) / 86400000);
}

function isUrgent(deadline: string): boolean {
  return daysUntilDeadline(deadline) <= URGENT_DAYS;
}

function isImportant(importance: string): boolean {
  return importance === "high";
}

function classifyProject(p: ResearchProject): Quadrant {
  const urgent = isUrgent(p.deadline);
  const important = isImportant(p.importance);
  if (urgent && important) return "q1";
  if (important && !urgent) return "q2";
  if (urgent && !important) return "q3";
  return "q4";
}

function deadlineLabel(dateStr: string): string {
  const days = daysUntilDeadline(dateStr);
  if (days < 0) return `已逾期 ${Math.abs(days)} 天`;
  if (days === 0) return "今天截止";
  if (days === 1) return "明天截止";
  return `还剩 ${days} 天`;
}

function deadlineStyle(dateStr: string): { color: string; weight: string } {
  const days = daysUntilDeadline(dateStr);
  if (days < 0) return { color: "#c0392b", weight: "600" };
  if (days <= 2) return { color: "#d4958a", weight: "500" };
  if (days <= 5) return { color: "#d4a574", weight: "500" };
  return { color: "#b8a088", weight: "400" };
}

/* ========== 页面组件 ========== */
export default function ResearchPage() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formDays, setFormDays] = useState("");
  const [formImportance, setFormImportance] = useState<"high" | "medium" | "low">("medium");

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  const grouped: Record<Quadrant, ResearchProject[]> = { q1: [], q2: [], q3: [], q4: [] };
  projects.forEach((p) => { grouped[classifyProject(p)].push(p); });
  for (const q of Object.keys(grouped) as Quadrant[]) {
    grouped[q].sort((a, b) => a.deadline.localeCompare(b.deadline));
  }

  const resetForm = useCallback(() => {
    setFormName(""); setFormDeadline(""); setFormDays("");
    setFormImportance("medium"); setEditingId(null); setShowForm(false);
  }, []);

  const openAddForm = () => { resetForm(); setShowForm(true); };
  const openEditForm = (p: ResearchProject) => {
    setFormName(p.name); setFormDeadline(p.deadline);
    setFormDays(String(p.estimatedDays)); setFormImportance(p.importance);
    setEditingId(p.id); setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formDeadline || !formDays) { alert("请填写完整信息"); return; }
    if (editingId) {
      setProjects((prev) => {
        const updated = prev.map((p) =>
          p.id === editingId ? { ...p, name: formName.trim(), deadline: formDeadline, estimatedDays: Number(formDays), importance: formImportance } : p
        );
        saveProjects(updated); return updated;
      });
    } else {
      const newProject: ResearchProject = {
        id: uid(), name: formName.trim(), deadline: formDeadline, estimatedDays: Number(formDays), importance: formImportance,
      };
      setProjects((prev) => { const updated = [...prev, newProject]; saveProjects(updated); return updated; });
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    setProjects((prev) => { const updated = prev.filter((p) => p.id !== id); saveProjects(updated); return updated; });
  };

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData("text/plain", projectId); e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };

  const handleDrop = (e: React.DragEvent, targetQuadrant: Quadrant) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData("text/plain");
    if (!projectId) return;
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    let newImportance: "high" | "medium" | "low" = project.importance;
    let newDeadline = project.deadline;
    const today = new Date();
    const nearDate = new Date(today); nearDate.setDate(today.getDate() + 3);
    const nearStr = nearDate.toISOString().slice(0, 10);
    const farDate = new Date(today); farDate.setDate(today.getDate() + 30);
    const farStr = farDate.toISOString().slice(0, 10);

    switch (targetQuadrant) {
      case "q1": newImportance = "high"; if (!isUrgent(newDeadline)) newDeadline = nearStr; break;
      case "q2": newImportance = "high"; if (isUrgent(newDeadline)) newDeadline = farStr; break;
      case "q3": newImportance = "medium"; if (!isUrgent(newDeadline)) newDeadline = nearStr; break;
      case "q4": newImportance = "low"; if (isUrgent(newDeadline)) newDeadline = farStr; break;
    }

    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === projectId ? { ...p, importance: newImportance, deadline: newDeadline } : p
      );
      saveProjects(updated); return updated;
    });
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "14px",
    border: "1px solid #ede4d8",
    backgroundColor: "#fdfaf5",
    fontSize: "14px",
    color: "#4a4a4a",
    outline: "none",
    transition: "all 0.25s ease",
  };

  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "#d4a574";
    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,165,116,0.1)";
    e.currentTarget.style.backgroundColor = "#fdf8f0";
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = "#ede4d8";
    e.currentTarget.style.boxShadow = "none";
    e.currentTarget.style.backgroundColor = "#fdfaf5";
  };

  return (
    <div className="animate-fade-in">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#4a4a4a" }}>科研项目优先级</h2>
          <p className="text-sm mt-1.5" style={{ color: "#b8a088" }}>
            艾森豪威尔四象限 · 拖拽卡片可切换象限
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="btn-bounce px-5 py-2.5 rounded-wobbly text-sm font-medium text-white flex items-center gap-1.5 transition-all"
          style={{ backgroundColor: "#8b7d6b", boxShadow: "0 4px 12px rgba(100,85,65,0.15)" }}
        >
          <span className="text-lg">+</span> 添加项目
        </button>
      </div>

      {/* 表单弹窗 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.25)" }}>
          <div className="bg-white rounded-wobbly shadow-xl p-7 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-5" style={{ color: "#4a4a4a" }}>
              {editingId ? "编辑项目" : "添加科研项目"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#8c8c8c" }}>项目/论文名称</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如：Transformer 论文复现" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#8c8c8c" }}>截止日期</label>
                <input type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)}
                  style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#8c8c8c" }}>预计耗时（天）</label>
                <input type="number" min={1} value={formDays} onChange={(e) => setFormDays(e.target.value)}
                  placeholder="例如：7" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#8c8c8c" }}>重要程度</label>
                <div className="flex gap-2">
                  {(["high", "medium", "low"] as const).map((level) => {
                    const is = formImportance === level;
                    const s = importanceStyles[level];
                    return (
                      <button key={level} type="button" onClick={() => setFormImportance(level)}
                        className="btn-bounce flex-1 py-2.5 rounded-wobbly text-sm font-medium transition-all"
                        style={is ? { backgroundColor: s.bg, color: s.text, border: `2px solid ${s.text}` } : { backgroundColor: "#f5f2ed", color: "#b8a088", border: "2px solid transparent" }}
                      >{importanceLabels[level]}</button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={resetForm}
                className="flex-1 py-2.5 rounded-wobbly text-sm transition-colors"
                style={{ backgroundColor: "#f5f2ed", color: "#8c8c8c" }}
              >取消</button>
              <button onClick={handleSubmit}
                className="btn-bounce flex-1 py-2.5 rounded-wobbly text-sm font-medium text-white transition-all"
                style={{ backgroundColor: "#8b7d6b", boxShadow: "0 4px 12px rgba(100,85,65,0.15)" }}
              >{editingId ? "保存修改" : "添加"}</button>
            </div>
          </div>
        </div>
      )}

      {/* 四象限 Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {quadrants.map((q) => {
          const items = grouped[q.key];
          return (
            <div key={q.key} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, q.key)}
              className="rounded-wobbly p-4 min-h-[200px] flex flex-col transition-all"
              style={{ backgroundColor: q.bg, border: `2px solid ${q.borderColor}` }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: q.dotColor }} />
                <div>
                  <h4 className="text-sm font-semibold" style={{ color: "#4a4a4a" }}>{q.title}</h4>
                  <p className="text-xs" style={{ color: "#b8a088" }}>{q.subtitle}</p>
                </div>
                <span className="ml-auto text-xs text-white px-2.5 py-0.5 rounded-full" style={{ backgroundColor: q.badgeBg }}>
                  {items.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {items.length === 0 && (
                  <p className="text-xs text-center py-8" style={{ color: "#c8bda8" }}>拖拽项目到此处</p>
                )}
                {items.map((p) => {
                  const ds = deadlineStyle(p.deadline);
                  const is = importanceStyles[p.importance];
                  return (
                    <div key={p.id} draggable onDragStart={(e) => handleDragStart(e, p.id)}
                      className="card-hover bg-white rounded-wobbly p-3.5 cursor-grab active:cursor-grabbing group"
                      style={{ border: "1px solid #ede4d8" }}
                    >
                      <p className="text-sm font-medium mb-2.5 line-clamp-2" style={{ color: "#4a4a4a" }}>{p.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-lg" style={{ backgroundColor: is.bg, color: is.text }}>
                          {importanceLabels[p.importance]}
                        </span>
                        <span className="text-xs" style={{ color: ds.color, fontWeight: ds.weight as React.CSSProperties["fontWeight"] }}>
                          {deadlineLabel(p.deadline)}
                        </span>
                        <span className="text-xs" style={{ color: "#b8a088" }}>{p.estimatedDays}天</span>
                      </div>
                      <div className="flex gap-1 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); openEditForm(p); }}
                          className="text-xs px-1 hover:underline" style={{ color: "#8b7d6b" }}>编辑</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                          className="text-xs px-1 hover:underline" style={{ color: "#b8a088" }}
                          onMouseEnter={(e2) => { (e2.currentTarget as HTMLElement).style.color = "#c0392b"; }}
                          onMouseLeave={(e2) => { (e2.currentTarget as HTMLElement).style.color = "#b8a088"; }}
                        >删除</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}