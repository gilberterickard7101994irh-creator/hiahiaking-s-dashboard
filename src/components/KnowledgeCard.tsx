"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

/* ================================================================
   类型
   ================================================================ */
export interface KnowledgeCardItem {
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
   卡通人物配置 — 根据卡片 ID 确定性选取
   ================================================================ */
const IP_CHARACTERS = [
  { src: "/spongebob.gif", alt: "海绵宝宝", label: "海绵宝宝已阅" },
  { src: "/patrick.gif", alt: "派大星", label: "派大星点赞" },
  { src: "/popmart-ono.png", alt: "小野", label: "小野认证" },
];

function pickCharacter(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return IP_CHARACTERS[Math.abs(hash) % IP_CHARACTERS.length];
}

/* ================================================================
   荧光笔标签背景色（低饱和度 pastel）
   ================================================================ */
const TAG_BG_CLASSES = [
  "bg-pink-200",
  "bg-green-200",
  "bg-purple-200",
  "bg-blue-200",
];

function getTagBgClass(index: number): string {
  return TAG_BG_CLASSES[index % TAG_BG_CLASSES.length];
}

/* ================================================================
   macOS 风格圆点按钮
   ================================================================ */
function MacDots({
  onClose,
  onMinimize,
  onExpand,
}: {
  onClose: () => void;
  onMinimize: () => void;
  onExpand: () => void;
}) {
  return (
    <div className="absolute top-3 left-4 flex items-center gap-2 z-20">
      {/* 关闭 — 红色 */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="w-3.5 h-3.5 rounded-full bg-red-400 hover:bg-red-500 transition-colors duration-150 shadow-sm"
        title="关闭"
      />
      {/* 最小化 — 黄色 */}
      <button
        onClick={(e) => { e.stopPropagation(); onMinimize(); }}
        className="w-3.5 h-3.5 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors duration-150 shadow-sm"
        title="最小化"
      />
      {/* 放大 — 绿色 */}
      <button
        onClick={(e) => { e.stopPropagation(); onExpand(); }}
        className="w-3.5 h-3.5 rounded-full bg-green-400 hover:bg-green-500 transition-colors duration-150 shadow-sm"
        title="放大"
      />
    </div>
  );
}

/* ================================================================
   KnowledgeCard 组件 — 素描本手绘风 Flashcard
   ================================================================ */
export default function KnowledgeCard({
  item,
  items,
  index,
  onExpand,
}: {
  item: KnowledgeCardItem;
  items?: KnowledgeCardItem[];
  index?: number;
  onExpand?: (idx: number) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [popping, setPopping] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [minimized, setMinimized] = useState(false);

  /* 安全取值 */
  const tags = item?.tags ?? [];
  const title = item?.title ?? "（无标题）";
  const summary = item?.summary ?? "";
  const businessValue = item?.businessValue ?? "";
  const sourceName = item?.sourceName ?? "";
  const sourceUrl = item?.sourceUrl ?? "";
  const createdAt = item?.createdAt ?? "";

  let dateStr = "";
  if (createdAt) {
    try {
      dateStr = new Date(createdAt).toLocaleDateString("zh-CN");
    } catch {
      dateStr = "";
    }
  }

  const character = pickCharacter(item.id);

  const handleClick = () => {
    if (minimized) return;
    setPopping(true);
    setFlipped(!flipped);
    setTimeout(() => setPopping(false), 300);
  };

  const handleExpand = () => {
    if (onExpand && index !== undefined) {
      onExpand(index);
    }
  };

  /* 关闭状态 — 卡片消失 */
  if (hidden) {
    return null;
  }

  /* 最小化状态 — 只显示标题栏 */
  if (minimized) {
    return (
      <div
        className="
          bg-white border-[3px] border-pencil rounded-wobblyMd
          shadow-hard px-4 py-2
          transition-all duration-300
          hover:translate-x-[2px] hover:translate-y-[2px]
        "
      >
        <div className="flex items-center gap-2">
          <MacDots
            onClose={() => setHidden(true)}
            onMinimize={() => setMinimized(false)}
            onExpand={handleExpand}
          />
          <span className="font-hand text-sm text-pencil/70 truncate ml-14">
            {title}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`
        perspective-[1000px] min-h-[320px] cursor-pointer select-none
        transition-all duration-300
        hover:translate-x-[2px] hover:translate-y-[2px]
        hover:shadow-hardHover
        ${popping ? "scale-95" : "scale-100"}
      `}
    >
      {/* ===== 翻转控制层 ===== */}
      <div
        className={`
          relative w-full h-full
          transition-transform duration-500
          [transform-style:preserve-3d]
          ${flipped ? "[transform:rotateY(180deg)]" : ""}
        `}
      >
        {/* ==================== 正面 ==================== */}
        <div
          className="
            absolute inset-0
            [backface-visibility:hidden]
            bg-white border-[3px] border-pencil rounded-wobblyMd
            shadow-hard
            p-8 pt-10 flex flex-col
            overflow-hidden
          "
        >
          {/* macOS 圆点 */}
          <MacDots
            onClose={() => setHidden(true)}
            onMinimize={() => setMinimized(true)}
            onExpand={handleExpand}
          />

          {/* 顶部装饰：手绘虚线 */}
          <div className="absolute top-9 left-4 right-4 h-[2px] border-t-2 border-dashed border-muted/60" />

          {/* 标签 — 荧光笔色 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 mt-2">
              {tags.map((tag, i) => (
                <span
                  key={tag || i}
                  className={`
                    inline-block border-2 border-[#2d2d2d] rounded-wobbly
                    px-3 py-1 text-sm font-bold text-pencil
                    transition-all duration-200
                    hover:-rotate-2 hover:scale-110
                    ${getTagBgClass(i)}
                  `}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* 标题 */}
          <div className="flex-1 flex items-center justify-center text-center px-2">
            <h3 className="font-marker text-2xl text-pencil leading-snug">
              {title}
            </h3>
          </div>

          {/* 底部：提示 + 卡通人物 */}
          <div className="mt-4 flex items-end justify-between">
            <p className="text-xs text-muted animate-bounce font-hand">
              💡 点击翻阅核心价值
            </p>
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src={character.src}
                alt={character.alt}
                width={48}
                height={48}
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* ==================== 背面 — 便签黄 ==================== */}
        <div
          className="
            absolute inset-0
            [backface-visibility:hidden]
            [transform:rotateY(180deg)]
            bg-postit border-[3px] border-pencil rounded-wobblyMd
            shadow-hard
            p-6 pt-10 flex flex-col
            overflow-y-auto no-scrollbar
          "
        >
          {/* macOS 圆点 */}
          <MacDots
            onClose={() => setHidden(true)}
            onMinimize={() => setMinimized(true)}
            onExpand={handleExpand}
          />

          {/* 印章装饰 */}
          <div className="absolute -top-2 -right-2 rotate-12 z-10">
            <span className="inline-block bg-accentRed text-white text-[10px] font-bold px-2 py-1 rounded-wobbly border-2 border-pencil shadow-hard opacity-80 font-hand">
              已阅
            </span>
          </div>

          {/* 信息总结 */}
          {summary && (
            <div className="mb-6">
              <p className="text-xs font-marker font-bold text-slate-700 mb-2 tracking-wide">
                ◆ 信息总结
              </p>
              <p className="text-sm leading-loose text-slate-700 font-hand whitespace-pre-wrap">
                {summary}
              </p>
            </div>
          )}

          {/* 虚线分割 */}
          {summary && businessValue && (
            <div className="border-t-2 border-dashed border-pencil/20 mb-6" />
          )}

          {/* 信息价值 */}
          {businessValue && (
            <div>
              <p className="text-xs font-marker font-bold text-slate-700 mb-2 tracking-wide">
                ◆ 信息价值
              </p>
              <p className="text-sm leading-loose text-slate-700 font-hand whitespace-pre-wrap">
                {businessValue}
              </p>
            </div>
          )}

          {/* 底部：来源 + 卡通小人 + 时间 */}
          <div className="mt-auto pt-4 border-t border-pencil/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-xs font-hand text-slate-500 hover:text-accentBlue transition-colors hover:underline"
                >
                  <span>↗</span>
                  <span>{sourceName || "查看原文"}</span>
                </a>
              ) : (
                <span className="text-xs text-slate-400">
                  {sourceName || ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {dateStr && (
                <span className="text-xs text-slate-400">{dateStr}</span>
              )}
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image
                  src={character.src}
                  alt={character.alt}
                  width={32}
                  height={32}
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   放大弹窗组件
   ================================================================ */
export function ExpandedCardModal({
  items,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  items: KnowledgeCardItem[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = items[currentIndex];
  if (!item) return null;

  const tags = item?.tags ?? [];
  const title = item?.title ?? "（无标题）";
  const summary = item?.summary ?? "";
  const businessValue = item?.businessValue ?? "";
  const sourceName = item?.sourceName ?? "";
  const sourceUrl = item?.sourceUrl ?? "";
  const createdAt = item?.createdAt ?? "";

  let dateStr = "";
  if (createdAt) {
    try {
      dateStr = new Date(createdAt).toLocaleDateString("zh-CN");
    } catch {
      dateStr = "";
    }
  }

  const character = pickCharacter(item.id);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        transition={{ duration: 0.25 }}
      >
        <motion.div
          className="
            relative w-[90vw] max-w-4xl max-h-[90vh]
            bg-white border-[3px] border-pencil rounded-wobblyMd
            shadow-hard
            p-8 pt-10 overflow-y-auto no-scrollbar
            flex flex-col
          "
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* macOS 圆点 */}
          <div className="absolute top-3 left-4 flex items-center gap-2 z-20">
            <button
              onClick={onClose}
              className="w-3.5 h-3.5 rounded-full bg-red-400 hover:bg-red-500 transition-colors duration-150 shadow-sm"
              title="关闭"
            />
            <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 opacity-40" />
            <div className="w-3.5 h-3.5 rounded-full bg-green-400 opacity-40" />
          </div>

          {/* 顶部虚线 */}
          <div className="absolute top-9 left-4 right-4 h-[2px] border-t-2 border-dashed border-muted/60" />

          {/* 左侧切换按钮 */}
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            disabled={currentIndex <= 0}
            className="
              absolute left-2 top-1/2 -translate-y-1/2 z-20
              w-10 h-10 rounded-full bg-white border-2 border-pencil
              flex items-center justify-center
              shadow-hard transition-all duration-200
              hover:bg-pencil hover:text-white
              disabled:opacity-20 disabled:cursor-not-allowed
            "
          >
            <span className="text-lg font-bold">◀</span>
          </button>

          {/* 右侧切换按钮 */}
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            disabled={currentIndex >= items.length - 1}
            className="
              absolute right-2 top-1/2 -translate-y-1/2 z-20
              w-10 h-10 rounded-full bg-white border-2 border-pencil
              flex items-center justify-center
              shadow-hard transition-all duration-200
              hover:bg-pencil hover:text-white
              disabled:opacity-20 disabled:cursor-not-allowed
            "
          >
            <span className="text-lg font-bold">▶</span>
          </button>

          {/* 内容区 */}
          <div className="px-8">
            {/* 标签 */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag, i) => (
                  <span
                    key={tag || i}
                    className={`
                      inline-block border-2 border-[#2d2d2d] rounded-wobbly
                      px-3 py-1 text-sm font-bold text-pencil
                      ${getTagBgClass(i)}
                    `}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* 标题 */}
            <h3 className="font-marker text-3xl text-pencil leading-snug mb-6">
              {title}
            </h3>

            {/* 信息总结 */}
            {summary && (
              <div className="mb-6 bg-[#fdfbf7] border-2 border-pencil/20 rounded-wobblyMd p-5">
                <p className="text-xs font-marker font-bold text-slate-700 mb-2 tracking-wide">
                  ◆ 信息总结
                </p>
                <p className="text-base leading-loose text-slate-700 font-hand whitespace-pre-wrap">
                  {summary}
                </p>
              </div>
            )}

            {/* 信息价值 */}
            {businessValue && (
              <div className="bg-postit/50 border-2 border-pencil/20 rounded-wobblyMd p-5 mb-6">
                <p className="text-xs font-marker font-bold text-slate-700 mb-2 tracking-wide">
                  ◆ 信息价值
                </p>
                <p className="text-base leading-loose text-slate-700 font-hand whitespace-pre-wrap">
                  {businessValue}
                </p>
              </div>
            )}

            {/* 底部 meta */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-pencil/15">
              <div className="flex items-center gap-2">
                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-hand text-slate-500 hover:text-accentBlue transition-colors hover:underline"
                  >
                    <span>↗</span>
                    <span>{sourceName || "查看原文"}</span>
                  </a>
                ) : (
                  <span className="text-sm text-slate-400">{sourceName || ""}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {dateStr && (
                  <span className="text-sm text-slate-400">{dateStr}</span>
                )}
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src={character.src}
                    alt={character.alt}
                    width={40}
                    height={40}
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 页码指示器 */}
          <div className="text-center mt-6 text-xs text-pencil/30 font-hand">
            {currentIndex + 1} / {items.length}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}