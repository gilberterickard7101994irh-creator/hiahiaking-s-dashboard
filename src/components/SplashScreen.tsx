"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "splash_seen";
const MAX_COVER_TIME = 5;

export default function SplashScreen() {
  const [phase, setPhase] = useState<"full" | "fading" | "dimmed" | "skip">("full");
  const [videoError, setVideoError] = useState(false);
  const [shouldShow, setShouldShow] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* 首次加载时检查 localStorage */
  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen === "true") {
      // 已经看过封面，直接跳过
      setShouldShow(false);
    } else {
      // 首次访问，显示封面并标记
      setShouldShow(true);
      localStorage.setItem(STORAGE_KEY, "true");
    }
  }, []);

  /* 跳过封面 */
  const skipCover = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setPhase("skip");
  };

  useEffect(() => {
    if (!shouldShow) return;

    // 兜底：N 秒后强制进入
    const forceTimer = setTimeout(() => setPhase("skip"), MAX_COVER_TIME * 1000);
    const t1 = setTimeout(() => setPhase("fading"), 3000);
    const t2 = setTimeout(() => setPhase("dimmed"), 4500);

    return () => {
      clearTimeout(forceTimer);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [shouldShow]);

  /* 还没读取完 localStorage，不渲染任何东西 */
  if (shouldShow === null) return null;

  /* 已看过或跳过，不渲染封面 */
  if (!shouldShow || videoError || phase === "skip") {
    return null;
  }

  return (
    <AnimatePresence>
      {phase !== "dimmed" ? (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          initial={{ opacity: 1 }}
          animate={phase === "fading" ? { opacity: 0.15 } : { opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          <video
            ref={videoRef}
            src="/封面交互.mp4"
            autoPlay
            muted
            playsInline
            loop
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover"
          />

          <button
            onClick={skipCover}
            className="
              absolute bottom-8 right-8 z-10
              bg-white/20 backdrop-blur-sm border-2 border-white/40
              rounded-wobbly px-5 py-2
              text-white text-sm font-hand
              hover:bg-white/30 transition-all duration-200
            "
          >
            跳过 →
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="dimmed"
          className="fixed inset-0 z-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.08 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          <video
            src="/封面交互.mp4"
            autoPlay
            muted
            playsInline
            loop
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}