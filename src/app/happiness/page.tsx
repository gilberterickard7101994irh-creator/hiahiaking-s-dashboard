"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

/* ================================================================
   类型定义
   ================================================================ */
interface HappinessEntry {
  date: string;
  mood: string;
  things: [string, string, string];
}

/* ================================================================
   常量 / 工具函数
   ================================================================ */
const STORAGE_KEY = "happiness_entries";

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

/* ================================================================
   胶带颜色配置 (三种风格: 粉色爱心 / 蓝色波点 / 黄色条纹)
   ================================================================ */
const tapeStyles = [
  {
    bg: "#f9c5d1",
    pattern: "❤️",
    rotation: -3,
    x: -8,
    shadow: "rgba(249, 197, 209, 0.5)",
  },
  {
    bg: "#a8d8ea",
    pattern: "🔵",
    rotation: 2,
    x: 6,
    shadow: "rgba(168, 216, 234, 0.5)",
  },
  {
    bg: "#fce4a8",
    pattern: "⭐",
    rotation: -2,
    x: -4,
    shadow: "rgba(252, 228, 168, 0.5)",
  },
];

/* ================================================================
   记录官 IP 类型 (预留三种 IP 角色)
   ================================================================ */
type IPCharacter = "spongebob" | "patrick" | "popmart";

/* ================================================================
   Confetti 粒子生成器
   ================================================================ */
interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
  shape: "circle" | "square" | "star";
}

function generateConfetti(count: number): ConfettiParticle[] {
  const colors = [
    "#f9c5d1", "#a8d8ea", "#fce4a8", "#c5e0c2",
    "#d4a574", "#f5a0b5", "#b8cce4", "#f9d89c",
    "#e8b4d8", "#ffd700", "#ff9a9e", "#a0c4ff",
  ];
  const shapes: ("circle" | "square" | "star")[] = ["circle", "square", "star"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    y: -(Math.random() * 250 + 50),
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 10 + 5,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.3,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
  }));
}

/* ================================================================
   主页面组件
   ================================================================ */
export default function HappinessPage() {
  /* ---------- 数据状态 ---------- */
  const [entries, setEntries] = useState<HappinessEntry[]>([]);
  const [mood, setMood] = useState("😊");
  const [things, setThings] = useState<[string, string, string]>(["", "", ""]);

  /* ---------- 动画状态 ---------- */
  const [animPhase, setAnimPhase] = useState<
    "idle" | "flying" | "done"
  >("idle");
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [boxLidOpen, setBoxLidOpen] = useState(false);
  const [ipReaction, setIpReaction] = useState<"idle" | "cheer">("idle");

  /*
     ================================================================
     【IP 角色切换】—— 在这里修改你想要的记录官角色:
       'spongebob'   → 海绵宝宝 (吹气球 🎈)
       'patrick'     → 派大星 (疯狂点赞 👍)
       'popmart'     → 泡泡玛特小野 (撒小花 🌸)
     ================================================================
  */
  const [currentIP] = useState<IPCharacter>("spongebob");

  const flyControls = useAnimation();
  const cardRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ---------- 初始化 ---------- */
  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const today = todayStr();
  const todayEntry = entries.find((e) => e.date === today);

  useEffect(() => {
    if (todayEntry) {
      setMood(todayEntry.mood);
      setThings(todayEntry.things);
    }
  }, [todayEntry]);

  /* ---------- 保存逻辑 (含完整动画流程) ---------- */
  const handleSave = useCallback(async () => {
    const trimmed = things.map((t) => t.trim()) as [string, string, string];
    if (trimmed.some((t) => !t)) {
      alert("请填写完整的三件事哦～");
      return;
    }

    // 1. 保存数据
    const updated = entries.filter((e) => e.date !== today);
    const newEntry: HappinessEntry = { date: today, mood, things: trimmed };
    const result = [newEntry, ...updated].sort(
      (a, b) => b.date.localeCompare(a.date)
    );
    setEntries(result);
    saveEntries(result);

    // 2. 开始动画序列
    setAnimPhase("flying");

    // 步骤A: 纸板缩小翻转 → 金色卡片出现
    await flyControls.start({
      scale: 0.3,
      rotateY: 180,
      opacity: 0,
      transition: { duration: 0.5, ease: "easeInOut" },
    });

    // 步骤B: 金色卡片飞向箱子 (抛物线)
    await flyControls.start({
      x: 0,
      y: 0,
      scale: 0.15,
      rotateY: 0,
      opacity: 1,
      background: "linear-gradient(135deg, #ffd700, #ffb347)",
      borderRadius: "12px",
      transition: { duration: 0.1 },
    });

    // 获取箱子位置
    const boxEl = boxRef.current;
    if (boxEl) {
      const boxRect = boxEl.getBoundingClientRect();
      const cardEl = cardRef.current;
      const cardRect = cardEl?.getBoundingClientRect();
      const targetX =
        boxRect.left +
        boxRect.width / 2 -
        (cardRect ? cardRect.left + cardRect.width / 2 : window.innerWidth / 2);
      const targetY =
        boxRect.top +
        boxRect.height / 2 -
        (cardRect ? cardRect.top + cardRect.height / 2 : window.innerHeight / 2);

      await flyControls.start({
        x: targetX + 40,
        y: targetY - 30,
        rotate: 360,
        scale: 0.08,
        transition: {
          duration: 0.8,
          ease: [0.25, 0.46, 0.45, 0.94], // 缓出抛物线
        },
      });
    }

    // 步骤C: 箱子开盖 → 卡片进入 → 关盖
    setBoxLidOpen(true);
    await new Promise((r) => setTimeout(r, 300));

    // 卡片消失(进入箱子)
    await flyControls.start({
      opacity: 0,
      scale: 0,
      transition: { duration: 0.2 },
    });

    // 关盖
    await new Promise((r) => setTimeout(r, 200));
    setBoxLidOpen(false);

    // 步骤D: 撒花 + IP 反应
    setConfetti(generateConfetti(35));
    setShowConfetti(true);
    setIpReaction("cheer");

    // 音效 (默认静音，取消注释即可启用)
    // if (audioRef.current) {
    //   audioRef.current.currentTime = 0;
    //   audioRef.current.play().catch(() => {});
    // }

    // 重置动画
    setTimeout(() => {
      setShowConfetti(false);
      setIpReaction("idle");

      // 重置纸板
      flyControls.start({
        x: 0,
        y: 0,
        scale: 1,
        rotateY: 0,
        opacity: 1,
        background: "transparent",
        borderRadius: "0px",
        transition: { duration: 0.4 },
      });

      setAnimPhase("done");
      setTimeout(() => setAnimPhase("idle"), 2000);
    }, 2500);
  }, [today, mood, things, entries, flyControls]);

  /* ---------- 删除 ---------- */
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

  /* ================================================================
     子组件: 胶带装饰
     ================================================================ */
  const TapeStrip = ({
    index,
    top = false,
  }: {
    index: number;
    top?: boolean;
  }) => {
    const s = tapeStyles[index];
    return (
      <div
        className="absolute z-10 h-7 w-16 opacity-80"
        style={{
          backgroundColor: s.bg,
          top: top ? -12 : undefined,
          bottom: top ? undefined : -12,
          left: "50%",
          transform: `translateX(-50%) rotate(${s.rotation}deg)`,
          borderRadius: "3px",
          boxShadow: `0 1px 3px ${s.shadow}`,
          // 手绘胶带纹理: 用 repeating 背景模拟波点/条纹
          backgroundImage: `radial-gradient(circle at 5px 5px, rgba(255,255,255,0.4) 1.5px, transparent 1.5px)`,
          backgroundSize: "10px 10px",
        }}
      >
        <span className="absolute inset-0 flex items-center justify-center text-[10px]">
          {s.pattern}
        </span>
      </div>
    );
  };

  /* ================================================================
     子组件: 记录官 IP Slot
     ================================================================ */
  const RecordKeeperSlot = () => {
    const ipConfig: Record<
      IPCharacter,
      {
        image: React.ReactNode;
        name: string;
        reaction: string;
        color: string;
      }
    > = {
      spongebob: {
        image: (
          <img
            src="/spongebob.gif"
            className="w-full h-full object-cover"
            alt="海绵宝宝"
          />
        ),
        name: "海绵宝宝记录官",
        reaction: "🎈🎈🎈",
        color: "#f9e530",
      },
      patrick: {
        image: (
          <img
            src="/patrick.gif"
            className="w-full h-full object-cover"
            alt="派大星"
          />
        ),
        name: "派大星记录官",
        reaction: "👍👍👍",
        color: "#f5a0b5",
      },
      popmart: {
        image: (
          <img
            src="/popmart-ono.png"
            className="w-full h-full object-cover"
            alt="小野"
          />
        ),
        name: "小野记录官",
        reaction: "🌸✨🌸",
        color: "#a0c4ff",
      },
    };

    const ip = ipConfig[currentIP];

    return (
      <motion.div
        className="absolute top-4 right-4 z-20 flex flex-col items-center"
        animate={
          ipReaction === "cheer"
            ? {
                scale: [1, 1.3, 1, 1.2, 1],
                rotate: [0, -10, 10, -5, 0],
              }
            : {}
        }
        transition={{ duration: 0.6, repeat: ipReaction === "cheer" ? 3 : 0 }}
      >
        {/* 对话框 */}
        <AnimatePresence>
          {ipReaction === "cheer" && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="bg-white rounded-2xl px-3 py-2 shadow-lg mb-2 text-center"
              style={{ border: `2px solid ${ip.color}` }}
            >
              <p className="text-xs font-bold" style={{ color: ip.color }}>
                {ip.reaction}
              </p>
              <p className="text-[10px] text-gray-400">记录成功!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* IP 角色容器 */}
        <motion.div
          className="w-16 h-16 rounded-full overflow-hidden shadow-lg cursor-pointer flex-shrink-0"
          style={{
            backgroundColor: ip.color + "30",
            border: `3px solid ${ip.color}`,
          }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          title={ip.name}
        >
          {ip.image}
        </motion.div>
        <span className="text-[10px] mt-1 text-gray-400">{ip.name}</span>
      </motion.div>
    );
  };

  /* ================================================================
     子组件: 记忆箱子 (Memory Box)
     ================================================================ */
  const MemoryBox = () => {
    return (
      <div ref={boxRef} className="relative w-24 h-20">
        {/* 箱盖 */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-8 origin-bottom z-10"
          animate={
            boxLidOpen
              ? { rotateX: -60, y: -8, opacity: 0.9 }
              : { rotateX: 0, y: 0, opacity: 1 }
          }
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{
            background: "linear-gradient(180deg, #c4956a, #b07d4b)",
            borderRadius: "8px 8px 0 0",
            borderBottom: "3px solid #8b5e3c",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {/* 箱盖把手 */}
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full"
            style={{ backgroundColor: "#8b5e3c" }}
          />
        </motion.div>

        {/* 箱体 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-14 rounded-b-xl"
          style={{
            background: "linear-gradient(180deg, #d4a574, #c4956a)",
            boxShadow: "inset 0 2px 6px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.15)",
            border: "2px solid #8b5e3c",
            borderTop: "none",
          }}
        >
          {/* 木质纹理 */}
          <div
            className="absolute inset-0 rounded-b-xl"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(139,94,60,0.08) 6px, rgba(139,94,60,0.08) 7px)",
            }}
          />
          {/* 锁扣 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5">
            <div
              className="w-4 h-4 rounded-full mx-auto"
              style={{
                backgroundColor: "#ffd700",
                border: "2px solid #8b5e3c",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </div>
          {/* 标签 */}
          <div className="absolute bottom-1.5 left-2 text-[8px] text-white/70">
            记忆箱子
          </div>
        </div>

        {/* 入场计数 */}
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md"
          style={{ backgroundColor: "#f5a0b5" }}
          key={entries.length}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {entries.length}
        </motion.div>
      </div>
    );
  };

  /* ================================================================
     子组件: 撒花 Confetti
     ================================================================ */
  const ConfettiBurst = () => {
    if (!showConfetti) return null;
    return (
      <div className="absolute top-0 left-1/2 pointer-events-none z-50">
        {confetti.map((p) => (
          <motion.div
            key={p.id}
            className="absolute"
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1,
              rotate: 0,
            }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: [1, 1, 0],
              scale: [1, 1.2, 0],
              rotate: p.rotation,
            }}
            transition={{
              duration: 1.5 + Math.random() * 1,
              delay: p.delay,
              ease: "easeOut",
            }}
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.shape !== "star" ? p.color : "transparent",
              borderRadius: p.shape === "circle" ? "50%" : p.shape === "square" ? "2px" : "0",
              clipPath: p.shape === "star" ? "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" : undefined,
            }}
          />
        ))}
      </div>
    );
  };

  /* ================================================================
     渲染
     ================================================================ */
  return (
    <div className="relative min-h-[calc(100vh-80px)]">
      {/* ================================================================
          音效元素 (默认静音)
          将 success.mp3 放入 public/ 目录，取消下方注释即可启用
          ================================================================ */}
      {/* <audio ref={audioRef} src="/success.mp3" preload="auto" /> */}

      <div className="flex gap-8 flex-col lg:flex-row">
        {/* ========== 左侧主区域 ========== */}
        <div className="flex-1 min-w-0 relative">
          {/* ================================================================
              手绘纸板 (Hand-drawn Paper Board)
              参考 image_10.png 的手绘卡片和胶带风格
              ================================================================ */}
          <motion.div
            ref={cardRef}
            animate={flyControls}
            className="relative rounded-[2rem] p-8 overflow-visible"
            style={{
              /*
                 【仿麻布纹理背景】
                 使用多个渐变叠加模拟亚麻布/手绘纸的温暖质感
              */
              background: `
                linear-gradient(135deg, #fef9f0 0%, #fdf5e8 30%, #fef7ed 60%, #fdf4e6 100%),
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(180, 150, 120, 0.03) 2px,
                  rgba(180, 150, 120, 0.03) 3px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 2px,
                  rgba(180, 150, 120, 0.03) 2px,
                  rgba(180, 150, 120, 0.03) 3px
                )
              `,
              border: "3px solid #e8d5c0",
              /*
                 【手绘不规则边框】
                 使用 box-shadow 模拟手绘线条的双重描边
              */
              boxShadow: `
                inset 0 0 0 1px rgba(200, 170, 140, 0.3),
                0 8px 32px rgba(180, 150, 120, 0.15),
                2px 4px 0 rgba(200, 170, 140, 0.2)
              `,
              transform: "rotate(-0.5deg)",
            }}
          >
            {/* 手绘横线 (笔记本风格) */}
            <div
              className="absolute inset-8 pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(180,150,120,0.12) 31px, rgba(180,150,120,0.12) 32px)",
              }}
            />

            {/* 左上角图钉 */}
            <div className="absolute -top-2 -left-1 w-6 h-6 rounded-full shadow-md z-10"
              style={{
                background: "radial-gradient(circle at 40% 35%, #f5c6d0, #d4958a)",
                border: "2px solid #c08070",
              }}
            />
            <div className="absolute -top-2 -right-1 w-6 h-6 rounded-full shadow-md z-10"
              style={{
                background: "radial-gradient(circle at 40% 35%, #f5c6d0, #d4958a)",
                border: "2px solid #c08070",
              }}
            />

            {/* ================================================================
                记录官 IP Slot
                ================================================================ */}
            <RecordKeeperSlot />

            {/* 日期 (海绵宝宝风格艺术字) */}
            <div className="text-center mb-6">
              <h2
                className="text-2xl font-black tracking-widest"
                style={{
                  color: "#6b5b4e",
                  textShadow: "2px 2px 0 #f5e6d3, 3px 3px 0 rgba(180,150,120,0.2)",
                  fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive, sans-serif',
                  transform: "rotate(-1deg)",
                }}
              >
                {formatDate(today)}
              </h2>
              <p className="text-xs mt-1" style={{ color: "#c0a88a" }}>
                📝 今天的小确幸记录 📝
              </p>
            </div>

            {/* 今日心情选择 */}
            <div className="mb-6">
              <p
                className="text-sm font-bold mb-3"
                style={{
                  color: "#8b7d6b",
                  fontFamily: '"Comic Sans MS", cursive, sans-serif',
                  transform: "rotate(-0.5deg)",
                }}
              >
                💭 今日心情
              </p>
              <div className="flex flex-wrap gap-2">
                {moodOptions.map((opt) => {
                  const active = mood === opt.emoji;
                  return (
                    <motion.button
                      key={opt.emoji}
                      type="button"
                      onClick={() => setMood(opt.emoji)}
                      title={opt.label}
                      className="text-xl w-11 h-11 rounded-2xl flex items-center justify-center"
                      style={{
                        backgroundColor: active ? "#fef3e0" : "#faf7f2",
                        border: active
                          ? "2px solid #e8b88a"
                          : "2px solid transparent",
                        transform: active ? "scale(1.1)" : "scale(1)",
                      }}
                      whileHover={{ scale: 1.15, rotate: [-2, 2, 0] }}
                      whileTap={{ scale: 0.9 }}
                      animate={
                        active
                          ? {
                              scale: [1.1, 1.18, 1.1],
                              transition: { repeat: Infinity, duration: 2 },
                            }
                          : {}
                      }
                    >
                      {opt.emoji}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* ================================================================
                三张手绘输入卡片 (带胶带装饰)
                ================================================================ */}
            <div className="space-y-5 mb-6">
              <p
                className="text-sm font-bold"
                style={{
                  color: "#8b7d6b",
                  fontFamily: '"Comic Sans MS", cursive, sans-serif',
                  transform: "rotate(-0.5deg)",
                }}
              >
                ✨ 今天发生的三件幸福小事
              </p>

              {(["①", "②", "③"] as const).map((num, i) => {
                const tape = tapeStyles[i];
                return (
                  <motion.div
                    key={i}
                    className="relative bg-white rounded-2xl"
                    style={{
                      /*
                         【手绘不规则边框】
                         box-shadow 多重偏移模拟手绘线条的粗糙感
                      */
                      boxShadow: `
                        1px 2px 0 ${tape.bg}40,
                        2px 3px 0 ${tape.bg}30,
                        0 4px 12px rgba(0,0,0,0.04)
                      `,
                      border: `2px solid ${tape.bg}80`,
                      // 每个卡片有略微不同的旋转角度
                      transform: `rotate(${(i - 1) * 0.6}deg)`,
                    }}
                    whileHover={{
                      rotate: 0,
                      scale: 1.01,
                      transition: { duration: 0.2 },
                    }}
                  >
                    {/* 顶部胶带 */}
                    <TapeStrip index={i} top />

                    {/* 编号 + 输入框 */}
                    <div className="relative p-4 pt-5">
                      <span
                        className="absolute left-4 top-4 text-sm font-black"
                        style={{
                          color: tape.bg,
                          fontFamily: '"Comic Sans MS", cursive, sans-serif',
                        }}
                      >
                        {num}
                      </span>
                      <textarea
                        value={things[i]}
                        onChange={(e) => updateThing(i, e.target.value)}
                        placeholder={`第${i + 1}件幸福小事...`}
                        rows={2}
                        className="w-full pl-8 pr-4 py-2 text-sm resize-none bg-transparent"
                        style={{
                          border: "none",
                          outline: "none",
                          color: "#4a4a4a",
                          // 手绘横线
                          backgroundImage:
                            "repeating-linear-gradient(0deg, transparent, transparent 25px, rgba(180,150,120,0.08) 25px, rgba(180,150,120,0.08) 26px)",
                          lineHeight: "26px",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.backgroundColor = "#fffdf8";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      />
                    </div>

                    {/* 底部胶带 */}
                    <TapeStrip index={i} />
                  </motion.div>
                );
              })}
            </div>

            {/* 保存按钮 */}
            <motion.button
              onClick={handleSave}
              disabled={animPhase === "flying"}
              className="w-full py-3.5 rounded-2xl font-bold text-base tracking-wider"
              style={{
                background:
                  animPhase === "done"
                    ? "linear-gradient(135deg, #a5c9a0, #81b97a)"
                    : "linear-gradient(135deg, #f5c6d0, #f0a0b0)",
                color: "#fff",
                boxShadow: "0 4px 16px rgba(240, 160, 176, 0.35)",
                fontFamily: '"Comic Sans MS", cursive, sans-serif',
                opacity: animPhase === "flying" ? 0.6 : 1,
              }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              {animPhase === "flying"
                ? "存放中..."
                : animPhase === "done"
                  ? "已存入记忆箱子 ✨"
                  : todayEntry
                    ? "更新记录 🎀"
                    : "存入记忆箱子 📦"}
            </motion.button>
          </motion.div>
        </div>

        {/* ========== 右侧: 历史记录 + 记忆箱子 ========== */}
        <div className="lg:w-80 flex-shrink-0 flex flex-col gap-5">
          {/* 记忆箱子 */}
          <motion.div
            className="bg-white rounded-2xl p-5 flex flex-col items-center"
            style={{
              border: "2px solid #e8d5c0",
              boxShadow: "0 4px 16px rgba(180,150,120,0.1)",
            }}
          >
            <p
              className="text-sm font-bold mb-3"
              style={{
                color: "#8b7d6b",
                fontFamily: '"Comic Sans MS", cursive, sans-serif',
              }}
            >
              📦 记忆箱子
            </p>

            {/* 箱子 + 撒花区域 */}
            <div className="relative">
              <MemoryBox />
              <ConfettiBurst />
            </div>

            <p className="text-xs mt-3" style={{ color: "#c0a88a" }}>
              已收集 {entries.length} 份幸福记忆
            </p>
          </motion.div>

          {/* 历史记录 */}
          <div
            className="bg-white rounded-2xl p-5 flex-1"
            style={{
              border: "2px solid #e8d5c0",
              boxShadow: "0 4px 16px rgba(180,150,120,0.1)",
            }}
          >
            <h3
              className="text-sm font-bold mb-4 flex items-center gap-2"
              style={{
                color: "#8b7d6b",
                fontFamily: '"Comic Sans MS", cursive, sans-serif',
              }}
            >
              <span>📋</span> 历史记录
            </h3>

            {entries.length === 0 ? (
              <p className="text-sm text-center py-10" style={{ color: "#c0a88a" }}>
                还没有记录，快来写下今天的幸福小事吧～
              </p>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {entries.map((entry) => (
                  <motion.div
                    key={entry.date}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-3.5 relative group"
                    style={{
                      backgroundColor: "#fdfaf5",
                      border: "1px solid #ede4d8",
                      transform: `rotate(${Math.random() * 1 - 0.5}deg)`,
                    }}
                    whileHover={{ rotate: 0, scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs" style={{ color: "#c0a88a" }}>
                        {formatDate(entry.date)}
                      </span>
                      <span className="text-lg">{entry.mood}</span>
                    </div>
                    <ul className="space-y-1">
                      {entry.things.map((thing, i) => (
                        <li
                          key={i}
                          className="text-xs flex items-start gap-1.5"
                          style={{ color: "#6b5b4e" }}
                        >
                          <span
                            className="mt-0.5 flex-shrink-0"
                            style={{ color: tapeStyles[i].bg }}
                          >
                            {["①", "②", "③"][i]}
                          </span>
                          <span className="leading-relaxed">{thing}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleDelete(entry.date)}
                      className="absolute top-2 right-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "#c0a08a" }}
                      title="删除"
                    >
                      ✕
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}