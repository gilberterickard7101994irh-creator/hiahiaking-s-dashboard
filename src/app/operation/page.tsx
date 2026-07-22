"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ================================================================
   运营思维导图数据
   ================================================================ */

interface LeafItem {
  title: string;
  desc?: string;
  children?: string[];
}

interface BranchSection {
  title: string;
  items: LeafItem[];
}

interface MindMapBranch {
  title: string;
  subtitle: string;
  metaphor: string;
  icon: string;
  color: string;
  bgLight: string;
  bgCard: string;
  borderColor: string;
  textColor: string;
  sections: BranchSection[];
}

const branches: MindMapBranch[] = [
  {
    title: "用户运营",
    subtitle: "洞察与定位",
    metaphor: "谁有病？",
    icon: "🎯",
    color: "#8B5CF6",
    bgLight: "#F3EEFF",
    bgCard: "#FAF7FF",
    borderColor: "#8B5CF6",
    textColor: "#6D28D9",
    sections: [
      {
        title: "用户画像",
        items: [
          {
            title: "人口学",
            children: ["年龄", "性别", "地域", "收入"],
          },
          {
            title: "行为",
            children: ["浏览习惯", "购买时间", "活跃频次"],
          },
          {
            title: "心理",
            children: ["价值观", "兴趣偏好", "消费心理"],
          },
        ],
      },
      {
        title: "用户分层",
        items: [
          {
            title: "RFM模型",
            children: ["消费时间", "频次", "金额"],
          },
          {
            title: "生命周期",
            children: ["新手", "成长", "成熟", "衰退", "流失"],
          },
        ],
      },
      {
        title: "痛点验证",
        items: [
          { title: "用户访谈", desc: "听用户说" },
          { title: "行为数据", desc: "看用户做" },
          { title: "AB测试", desc: "测用户选" },
        ],
      },
    ],
  },
  {
    title: "产品运营",
    subtitle: "价值验证 + 引导路径 + 迭代优化",
    metaphor: "我有药！",
    icon: "💊",
    color: "#F472B6",
    bgLight: "#FFF0F7",
    bgCard: "#FFF8FB",
    borderColor: "#F472B6",
    textColor: "#BE185D",
    sections: [
      {
        title: "价值验证",
        items: [
          { title: "Aha时刻", desc: "让用户顿悟产品价值的瞬间" },
          { title: "MVP", desc: "最小可行性产品测试" },
        ],
      },
      {
        title: "引导路径",
        items: [
          { title: "摩擦", desc: "降低操作阻力" },
          { title: "价值", desc: "不断提示好处" },
          { title: "进度", desc: "展示进度缓解焦虑" },
        ],
      },
      {
        title: "迭代优化",
        items: [
          { title: "留存率", desc: "来了走不走" },
          { title: "转化率", desc: "看了买不买" },
          { title: "核心功能使用率", desc: "主打功能用不用" },
        ],
      },
    ],
  },
  {
    title: "内容运营",
    subtitle: "内容矩阵 + 说服路径 + 信任构建",
    metaphor: "药很好！",
    icon: "📢",
    color: "#FBBF24",
    bgLight: "#FFFBEB",
    bgCard: "#FEFCE8",
    borderColor: "#F59E0B",
    textColor: "#B45309",
    sections: [
      {
        title: "内容矩阵",
        items: [
          { title: "策略", desc: "人设与调性" },
          { title: "内容生产", desc: "高质量图文/视频" },
          { title: "渠道", desc: "多平台分发" },
        ],
      },
      {
        title: "说服路径",
        items: [
          { title: "共鸣", desc: "共情用户痛点" },
          { title: "逻辑", desc: "讲清解决方案" },
          { title: "顾虑", desc: "提前打消担忧" },
        ],
      },
      {
        title: "信任构建",
        items: [
          { title: "背书/证明", desc: "权威机构/大V站台" },
          { title: "展示", desc: "买家秀/真实案例" },
          { title: "推荐", desc: "老客口碑" },
        ],
      },
    ],
  },
  {
    title: "活动运营",
    subtitle: "目标 + 机制 + 转化路径 + 二次传播",
    metaphor: "快来买！",
    icon: "🔥",
    color: "#34D399",
    bgLight: "#ECFDF5",
    bgCard: "#F0FDF4",
    borderColor: "#10B981",
    textColor: "#047857",
    sections: [
      {
        title: "目标",
        items: [
          { title: "拉新", desc: "获取新客" },
          { title: "转化", desc: "促成首单" },
          { title: "裂变", desc: "老带新" },
        ],
      },
      {
        title: "机制",
        items: [
          { title: "触发", desc: "参与的理由/噱头" },
          { title: "门槛", desc: "降低参与难度" },
          { title: "激励", desc: "奖品/优惠诱惑" },
        ],
      },
      {
        title: "转化路径",
        items: [
          { title: "看到", desc: "活动曝光" },
          { title: "规则", desc: "简单易懂" },
          { title: "动力", desc: "参与欲望" },
        ],
      },
      {
        title: "二次传播",
        items: [
          { title: "利益", desc: "帮用户赚钱/省钱" },
          { title: "社交", desc: "帮用户提供社交货币/面子" },
        ],
      },
    ],
  },
];

/* ================================================================
   子组件
   ================================================================ */

function LeafCard({ item, color }: { item: LeafItem; color: string }) {
  return (
    <div
      className="rounded-wobblyMd p-4 border-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#2d2d2d]"
      style={{
        backgroundColor: "#fff",
        borderColor: color + "40",
        boxShadow: "2px 2px 0px 0px #2d2d2d20",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="font-hand font-bold text-sm" style={{ color: "#4a4a4a" }}>
          {item.title}
        </span>
      </div>
      {item.desc && (
        <p className="text-xs ml-4 font-hand" style={{ color: "#9ca3af" }}>
          {item.desc}
        </p>
      )}
      {item.children && (
        <div className="flex flex-wrap gap-1.5 mt-2 ml-4">
          {item.children.map((child) => (
            <span
              key={child}
              className="text-xs px-2 py-0.5 rounded-wobbly font-hand"
              style={{
                backgroundColor: color + "15",
                color: color,
                border: "1px solid " + color + "30",
              }}
            >
              {child}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function BranchCard({ branch, index }: { branch: MindMapBranch; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="rounded-wobbly border-[3px] overflow-hidden"
      style={{
        borderColor: branch.borderColor,
        backgroundColor: branch.bgCard,
        boxShadow: "4px 4px 0px 0px #2d2d2d",
      }}
    >
      {/* ========== 分支头部 ========== */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 text-left transition-all duration-200 hover:brightness-105"
        style={{ backgroundColor: branch.bgLight }}
      >
        <div
          className="w-12 h-12 rounded-wobbly flex items-center justify-center text-2xl flex-shrink-0 border-2"
          style={{
            backgroundColor: "#fff",
            borderColor: branch.borderColor,
          }}
        >
          {branch.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="font-marker font-bold text-xl"
              style={{ color: branch.textColor }}
            >
              {branch.title}
            </h3>
            <span
              className="text-xs font-hand px-2 py-0.5 rounded-wobbly"
              style={{
                backgroundColor: branch.color + "20",
                color: branch.textColor,
              }}
            >
              {branch.metaphor}
            </span>
          </div>
          <p className="text-xs font-hand mt-0.5" style={{ color: "#9ca3af" }}>
            {branch.subtitle}
          </p>
        </div>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300"
          style={{
            backgroundColor: expanded ? branch.color : "#fff",
            border: "2px solid " + branch.borderColor,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <span
            className="text-xs font-bold"
            style={{ color: expanded ? "#fff" : branch.textColor }}
          >
            ▼
          </span>
        </div>
      </button>

      {/* ========== 展开内容 ========== */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-4">
              {branch.sections.map((section) => (
                <div key={section.title}>
                  {/* 分区标题 */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <div
                      className="h-px flex-1"
                      style={{ backgroundColor: branch.borderColor + "30" }}
                    />
                    <span
                      className="font-hand font-bold text-sm px-3 py-0.5 rounded-wobbly"
                      style={{
                        backgroundColor: branch.color + "15",
                        color: branch.textColor,
                      }}
                    >
                      {section.title}
                    </span>
                    <div
                      className="h-px flex-1"
                      style={{ backgroundColor: branch.borderColor + "30" }}
                    />
                  </div>
                  {/* 叶子卡片 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {section.items.map((item) => (
                      <LeafCard
                        key={item.title}
                        item={item}
                        color={branch.color}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ================================================================
   主页面
   ================================================================ */
export default function OperationPage() {
  return (
    <div className="animate-fade-in p-4 sm:p-6 lg:p-10">
      {/* ========== Hero 头部 ========== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-wobbly flex items-center justify-center text-3xl border-[3px] border-pencil"
            style={{
              backgroundColor: "#fff9c4",
              boxShadow: "4px 4px 0px 0px #2d2d2d",
            }}
          >
            🚀
          </div>
          <div>
            <h2 className="font-marker font-extrabold text-3xl sm:text-4xl text-pencil">
              运营知识地图
            </h2>
            <p className="font-hand text-sm mt-1 text-pencil/50">
              四大运营模块全景 · 从底层逻辑到落地执行
            </p>
          </div>
        </div>

        {/* 核心概念卡片 */}
        <div
          className="rounded-wobbly border-[3px] border-dashed border-pencil p-5 flex flex-col sm:flex-row items-center gap-4"
          style={{
            backgroundColor: "#fdfbf7",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="px-4 py-2 rounded-wobbly font-marker font-bold text-2xl text-white"
              style={{
                backgroundColor: "#2d2d2d",
                boxShadow: "3px 3px 0px 0px #d4a574",
              }}
            >
              运营
            </div>
            <span className="font-hand text-pencil/40 text-lg">→</span>
            <div className="font-hand text-pencil/60 text-sm">
              啥是运营？
            </div>
          </div>
          <div className="flex items-center gap-3 sm:ml-auto">
            <span className="font-hand text-pencil/40 text-lg">→</span>
            <div
              className="px-4 py-2 rounded-wobbly font-hand font-bold text-base"
              style={{
                backgroundColor: "#fff9c4",
                color: "#8b7d6b",
                border: "2px solid #d4a574",
              }}
            >
              底层逻辑：看病卖药
            </div>
          </div>
        </div>

        {/* 看病卖药流程线 */}
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          {branches.map((b, i) => (
            <div key={b.title} className="flex items-center gap-2">
              <div
                className="px-3 py-1 rounded-wobbly font-hand text-xs font-bold"
                style={{
                  backgroundColor: b.color + "20",
                  color: b.textColor,
                  border: "1.5px solid " + b.borderColor,
                }}
              >
                {b.icon} {b.metaphor}
              </div>
              {i < branches.length - 1 && (
                <span className="text-pencil/30 text-sm">→</span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ========== 四大分支 ========== */}
      <div className="space-y-5">
        {branches.map((branch, i) => (
          <BranchCard key={branch.title} branch={branch} index={i} />
        ))}
      </div>

      {/* ========== 底部说明 ========== */}
      <div className="mt-8 text-center">
        <p className="font-hand text-xs text-pencil/30">
          来源：Xmind 思维导图 · 运营知识体系
        </p>
      </div>
    </div>
  );
}
