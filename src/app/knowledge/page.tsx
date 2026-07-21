"use client";

import { useState, useEffect, useCallback } from "react";
import KnowledgeCard, { ExpandedCardModal } from "@/components/KnowledgeCard";

/* ================================================================
   类型定义
   ================================================================ */
interface KnowledgeCardItem {
  id: string;
  title: string;
  tags: string[];
  summary: string;
  businessValue: string;
  sourceName: string;
  sourceUrl: string;
  createdAt: string;
}

/* ================================================================
   骨架屏 — Playful Geometric 风格
   ================================================================ */
function SkeletonCard() {
  return (
    <div className="bg-white border-[3px] border-pencil rounded-wobblyMd shadow-hard p-8 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="w-14 h-7 rounded-wobbly bg-pink-100" />
        <div className="w-16 h-7 rounded-wobbly bg-green-100" />
      </div>
      <div className="w-3/4 h-6 rounded-wobbly bg-slate-100 mb-2.5" />
      <div className="w-full h-4 rounded-wobbly bg-slate-100 mb-1.5" />
      <div className="w-2/3 h-4 rounded-wobbly bg-slate-100 mb-3" />
      <div className="h-20 rounded-wobblyMd bg-slate-100 mb-3" />
      <div className="w-24 h-3 rounded-wobbly bg-slate-100" />
    </div>
  );
}

/* ================================================================
   主页面
   ================================================================ */
export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [crawling, setCrawling] = useState(false);
  const [crawlMsg, setCrawlMsg] = useState("");
  const [jellyCrawl, setJellyCrawl] = useState(false);
  const [jellyRefresh, setJellyRefresh] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/knowledge");

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const data = await res.json();
      if (data.success) {
        setItems(data.items ?? []);
      } else {
        setError(data.error || "获取数据失败");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`请求失败: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* 每日批量抓取 */
  const handleDailyCrawl = async () => {
    setJellyCrawl(true);
    setTimeout(() => setJellyCrawl(false), 500);
    setCrawling(true);
    setCrawlMsg("");
    try {
      const res = await fetch("/api/cron-daily");
      const data = await res.json();
      if (data.success) {
        setCrawlMsg(`抓取完成: ${data.succeeded}/${data.total} 成功`);
        setTimeout(() => fetchData(), 1000);
      } else {
        setCrawlMsg(`失败: ${data.error}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setCrawlMsg(`请求失败: ${msg}`);
    } finally {
      setCrawling(false);
    }
  };

  const handleRefresh = () => {
    setJellyRefresh(true);
    setTimeout(() => setJellyRefresh(false), 500);
    fetchData();
  };

  /* 聚合所有标签 */
  const allTags = Array.from(new Set(items.flatMap((c) => c.tags))).sort();

  /* 筛选 */
  const filtered = activeTag
    ? items.filter((c) => c.tags.includes(activeTag))
    : items;

  /* ===== 标签筛选按钮背景色 ===== */
  const FILTER_BG = ["bg-secondary", "bg-tertiary", "bg-quaternary", "bg-accent"];

  return (
    <div className="animate-fade-in p-10">
      {/* ========== 头部 — Candy Button 风格 ========== */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-marker font-extrabold text-4xl text-pencil">
            知识库看板
          </h2>
          <p className="font-hand text-sm mt-1.5 text-pencil/50">
            Notion 数据源 · 精选行业洞察 · 商业拆解
          </p>
        </div>

        {/* Candy Button */}
        <div className="flex items-center gap-3">
          {/* 每日抓取按钮 */}
          <button
            onClick={handleDailyCrawl}
            disabled={crawling}
            className={`
              bg-secondary text-white
              border-2 border-pencil rounded-wobbly
              shadow-hard
              font-hand font-bold px-6 py-2
              transition-all duration-200
              hover:-translate-y-1 hover:-translate-x-1 hover:shadow-hard-pink
              active:translate-y-0 active:translate-x-0 active:shadow-hard
              disabled:opacity-40 disabled:cursor-not-allowed
              disabled:hover:translate-y-0 disabled:hover:translate-x-0
              ${jellyCrawl ? "animate-jelly" : ""}
            `}
          >
            {crawling ? "抓取中..." : "每日抓取"}
          </button>

          {/* 刷新按钮 */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`
              bg-accent text-white
              border-2 border-pencil rounded-wobbly
              shadow-hard
              font-hand font-bold px-6 py-2
              transition-all duration-200
              hover:-translate-y-1 hover:-translate-x-1 hover:shadow-hard-hover
              active:translate-y-0 active:translate-x-0 active:shadow-hard
              disabled:opacity-40 disabled:cursor-not-allowed
              disabled:hover:translate-y-0 disabled:hover:translate-x-0
              ${jellyRefresh ? "animate-jelly" : ""}
            `}
          >
            {loading ? "加载中..." : "↻ 刷新"}
          </button>
        </div>
      </div>

      {/* ========== 错误提示 — 红色醒目 ========== */}
      {error && (
        <div className="mb-6 p-4 rounded-wobblyMd border-2 border-red-500 bg-red-50 text-red-700 text-sm font-hand">
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">🚨</span>
            <div>
              <p className="font-bold mb-1">数据加载失败</p>
              <p className="whitespace-pre-wrap break-all">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========== 抓取状态提示 — 绿色醒目 ========== */}
      {crawlMsg && (
        <div className="mb-6 p-4 rounded-wobblyMd border-2 border-quaternary bg-quaternary/10 text-pencil text-sm font-hand">
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">
              {crawlMsg.includes("失败") ? "⚠️" : "✅"}
            </span>
            <div>
              <p className="font-bold mb-1">每日抓取</p>
              <p className="whitespace-pre-wrap break-all">{crawlMsg}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========== 标签筛选栏 ========== */}
      {!loading && items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTag(null)}
            className={`
              text-xs font-bold px-3.5 py-2 rounded-wobbly border-2 border-pencil
              transition-all duration-200 font-hand
              ${activeTag === null
                ? "bg-pencil text-white"
                : "bg-white text-pencil hover:bg-slate-100"
              }
            `}
          >
            全部 ({items.length})
          </button>
          {allTags.map((tag, i) => {
            const count = items.filter((c) => c.tags.includes(tag)).length;
            const isActive = activeTag === tag;
            const bg = FILTER_BG[i % FILTER_BG.length];
            return (
              <button
                key={tag}
                onClick={() => setActiveTag(isActive ? null : tag)}
                className={`
                  text-xs font-bold px-3.5 py-2 rounded-wobbly border-2 border-pencil
                  transition-all duration-200 font-hand
                  ${isActive ? bg : "bg-white text-pencil hover:bg-slate-100"}
                `}
              >
                {tag} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ========== 卡片网格 — gap-8 ========== */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4 opacity-30">📭</p>
          <p className="font-hand text-pencil/50">
            {activeTag ? "该标签下暂无内容" : "Notion 数据库中暂无数据"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filtered.map((item, idx) => (
            <KnowledgeCard
              key={item.id}
              item={item}
              items={filtered}
              index={idx}
              onExpand={setExpandedIndex}
            />
          ))}
        </div>
      )}

      {/* ========== 放大弹窗 — 前后切换 ========== */}
      {expandedIndex !== null && (
        <ExpandedCardModal
          items={filtered}
          currentIndex={expandedIndex}
          onClose={() => setExpandedIndex(null)}
          onPrev={() => setExpandedIndex((prev) => (prev !== null ? Math.max(0, prev - 1) : null))}
          onNext={() =>
            setExpandedIndex((prev) =>
              prev !== null ? Math.min(filtered.length - 1, prev + 1) : null
            )
          }
        />
      )}
    </div>
  );
}