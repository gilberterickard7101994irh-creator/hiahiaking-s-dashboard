"use client";

import { useState, useMemo, useCallback } from "react";

/* ================================================================
   数据定义
   ================================================================ */
interface TermItem {
  abbr: string;
  full: string;
  desc: string;
}

interface TermCategory {
  key: string;
  label: string;
  icon: string;
  terms: TermItem[];
}

const categories: TermCategory[] = [
  {
    key: "traffic",
    label: "流量曝光",
    icon: "📈",
    terms: [
      { abbr: "UV", full: "Unique Visitor", desc: "独立访客，一台设备算 1 个 UV" },
      { abbr: "PV", full: "Page View", desc: "页面浏览量，用户每打开一次页面计 1 次 PV" },
      { abbr: "DAU", full: "Daily Active User", desc: "日活跃用户数" },
      { abbr: "MAU", full: "Monthly Active User", desc: "月活跃用户数" },
      { abbr: "CTR", full: "Click Through Rate", desc: "点击率 = 点击量 ÷ 曝光量" },
      { abbr: "CPM", full: "Cost Per Mille", desc: "千次曝光成本，投放 1000 次展示的费用" },
      { abbr: "CPC", full: "Cost Per Click", desc: "单次点击成本，用户点一次广告扣费" },
      { abbr: "CPD", full: "Cost Per Day", desc: "按天计费（软文/首页展位常用）" },
      { abbr: "CPT", full: "Cost Per Time", desc: "按时长投放（短视频/直播档期）" },
    ],
  },
  {
    key: "revenue",
    label: "转化&营收",
    icon: "💰",
    terms: [
      { abbr: "CVR", full: "Conversion Rate", desc: "转化率，完成目标行为用户 ÷ 总访客" },
      { abbr: "CAC", full: "Customer Acquisition Cost", desc: "用户获客成本，拉来 1 个客户花费" },
      { abbr: "LTV", full: "Life Time Value", desc: "用户生命周期总价值，客户全程消费总额" },
      { abbr: "ROI", full: "Return on Investment", desc: "投入产出比，营收 ÷ 投放成本" },
      { abbr: "GMV", full: "Gross Merchandise Volume", desc: "商品交易总额（含退款、未付款订单）" },
      { abbr: "ARPU", full: "Average Revenue Per User", desc: "每用户平均收入" },
      { abbr: "ASP", full: "Average Selling Price", desc: "客单价，平均每单成交金额" },
      { abbr: "CPS", full: "Cost Per Sale", desc: "按成交佣金付费，卖出商品才扣费" },
    ],
  },
  {
    key: "retention",
    label: "用户留存",
    icon: "👥",
    terms: [
      { abbr: "D1 留存", full: "次日留存", desc: "今日注册，次日仍打开 APP 的用户占比" },
      { abbr: "D7 留存", full: "7 日留存", desc: "注册后第 7 天仍回访的用户比例" },
      { abbr: "D30 留存", full: "30 日留存", desc: "注册后第 30 天仍回访的用户比例" },
      { abbr: "Bounce", full: "Bounce Rate 跳出率", desc: "用户仅打开页面立刻退出，无任何操作" },
      { abbr: "Session", full: "Session Duration", desc: "会话时长，用户单次停留页面总时长" },
      { abbr: "ARR", full: "Annual Recurring Revenue", desc: "年度经常性收入（会员/订阅业务）" },
    ],
  },
  {
    key: "product",
    label: "产品运营",
    icon: "⚙️",
    terms: [
      { abbr: "A/B Test", full: "对照实验", desc: "两套页面/文案分发测试，择优上线" },
      { abbr: "SOP", full: "Standard Operating Procedure", desc: "标准化执行流程" },
      { abbr: "SKU", full: "Stock Keeping Unit", desc: "单品规格（衣服不同颜色尺码算不同 SKU）" },
      { abbr: "CRM", full: "Customer Relationship Management", desc: "用户客户管理系统" },
      { abbr: "私域", full: "Private Owned Channel", desc: "企业可反复免费触达用户（企业微信/社群）" },
      { abbr: "UGC", full: "User Generated Content", desc: "用户原创内容（用户发帖、买家秀）" },
      { abbr: "PGC", full: "Professionally Generated Content", desc: "专业创作者产出内容" },
      { abbr: "KOL", full: "Key Opinion Leader", desc: "行业头部博主、大网红" },
      { abbr: "KOC", full: "Key Opinion Consumer", desc: "素人种草博主、普通真实用户" },
    ],
  },
  {
    key: "career",
    label: "职场简历",
    icon: "💼",
    terms: [
      { abbr: "STAR", full: "情景-任务-行动-结果", desc: "简历项目描述法则，面试回答结构化框架" },
      { abbr: "OKR", full: "Objectives and Key Results", desc: "目标与关键成果，团队目标管理工具" },
      { abbr: "KPI", full: "Key Performance Indicator", desc: "关键业绩指标，工作考核标准" },
      { abbr: "NPS", full: "Net Promoter Score", desc: "净推荐值，用户愿意推荐产品的意愿分数" },
    ],
  },
  {
    key: "mnemonic",
    label: "速记区分",
    icon: "🧠",
    terms: [
      { abbr: "花钱投放", full: "CPM → CPC → CPS", desc: "CPM 买曝光 → CPC 买点击 → CPS 买成交，越往后越精准、越贵" },
      { abbr: "用户规模", full: "DAU → MAU → UV", desc: "DAU 日活（最常用） → MAU 月活（看大盘） → UV 独立访客（Web 端）" },
      { abbr: "收益衡量", full: "GMV → ROI → LTV", desc: "GMV 看规模 → ROI 看效率 → LTV 看长期价值，三者缺一不可" },
      { abbr: "KOL vs KOC", full: "头部 vs 素人", desc: "KOL 大网红（曝光大、贵） → KOC 素人（真实、便宜、转化率高）" },
      { abbr: "UGC vs PGC", full: "用户 vs 专业", desc: "UGC 用户自发内容（免费、量大） → PGC 专业制作（精品、成本高）" },
      { abbr: "CPC vs CPM vs CPS", full: "三种计费", desc: "CPC 按点击（效果广告） → CPM 按曝光（品牌广告） → CPS 按成交（电商带货）" },
    ],
  },
];

/* ================================================================
   配色
   ================================================================ */
const TAG_COLORS = ["bg-pink-200", "bg-green-200", "bg-purple-200", "bg-blue-200", "bg-yellow-200", "bg-orange-200"];

/* ================================================================
   卡片组件
   ================================================================ */
function TermCard({ item }: { item: TermItem }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="cursor-pointer min-h-[140px] lg:min-h-[180px] group"
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* ===== 正面 ===== */}
        <div className="absolute inset-0 [backface-visibility:hidden] bg-white border-2 border-gray-800 rounded-xl shadow-[4px_4px_0px_0px_#1e293b] flex flex-col items-center justify-center p-4 lg:p-6 text-center">
          <span className="text-3xl lg:text-4xl font-bold text-gray-800 mb-1 lg:mb-2">
            {item.abbr}
          </span>
          <span className="text-xs lg:text-sm text-gray-500">{item.full}</span>
          <span className="mt-2 lg:mt-3 text-xs text-gray-400 animate-bounce">
            💡 点击翻转
          </span>
        </div>

        {/* ===== 背面 ===== */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-yellow-50 border-2 border-gray-800 rounded-xl shadow-[4px_4px_0px_0px_#1e293b] flex flex-col items-center justify-center p-4 lg:p-6 text-center no-scrollbar overflow-y-auto">
          <span className="text-xs font-bold text-gray-400 mb-1">
            {item.abbr}
          </span>
          <p className="text-sm leading-relaxed text-gray-700">
            {item.desc}
          </p>
          <span className="mt-2 lg:mt-3 text-xs text-gray-400">点击翻回</span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   小测验
   ================================================================ */
interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
}

const allTerms = categories.flatMap((c) => c.terms);

function generateQuiz(): QuizQuestion[] {
  const pool = [...allTerms].sort(() => Math.random() - 0.5).slice(0, 5);
  return pool.map((term) => {
    const wrongs = allTerms
      .filter((t) => t.abbr !== term.abbr)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((t) => t.full);
    const options = [...wrongs, term.full].sort(() => Math.random() - 0.5);
    return {
      question: `${term.abbr} 的全称是什么？`,
      options,
      answer: options.indexOf(term.full),
    };
  });
}

function QuizMode() {
  const [quiz, setQuiz] = useState<QuizQuestion[]>(() => generateQuiz());
  const [selected, setSelected] = useState<number[]>(new Array(5).fill(-1));
  const [submitted, setSubmitted] = useState(false);

  const score = submitted ? selected.filter((s, i) => s === quiz[i].answer).length : 0;

  const handleSelect = (qIdx: number, oIdx: number) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = [...prev];
      next[qIdx] = oIdx;
      return next;
    });
  };

  const handleRetry = () => {
    setQuiz(generateQuiz());
    setSelected(new Array(5).fill(-1));
    setSubmitted(false);
  };

  return (
    <div className="mt-8 lg:mt-12">
      <div className="flex items-center justify-between mb-4 lg:mb-6">
        <h3 className="font-bold text-xl lg:text-2xl text-gray-800 -rotate-1 inline-block">
          📝 小测验
        </h3>
        {submitted && (
          <span className={`font-bold text-lg lg:text-xl ${score >= 4 ? "text-green-600" : score >= 2 ? "text-yellow-600" : "text-red-500"}`}>
            {score} / 5 分
          </span>
        )}
      </div>

      <div className="space-y-4">
        {quiz.map((q, qi) => (
          <div
            key={qi}
            className="bg-white border-2 border-gray-800 rounded-xl shadow-[4px_4px_0px_0px_#1e293b] p-4 lg:p-5"
          >
            <p className="text-base lg:text-lg text-gray-800 mb-3">
              {qi + 1}. {q.question}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt, oi) => {
                const isSelected = selected[qi] === oi;
                const isCorrect = submitted && oi === q.answer;
                const isWrong = submitted && isSelected && oi !== q.answer;

                return (
                  <button
                    key={oi}
                    onClick={() => handleSelect(qi, oi)}
                    className={`px-3 py-2 rounded-lg border-2 border-gray-800 text-sm transition-all duration-200 text-left
                      ${isCorrect ? "bg-green-200 font-bold" : ""}
                      ${isWrong ? "bg-red-200 line-through" : ""}
                      ${isSelected && !submitted ? "bg-yellow-100 font-bold -translate-y-0.5" : ""}
                      ${!isSelected && !submitted ? "hover:bg-gray-50" : ""}
                    `}
                  >
                    {String.fromCharCode(65 + oi)}. {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-6">
        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={selected.some((s) => s === -1)}
            className="bg-red-500 text-white border-2 border-gray-800 rounded-lg shadow-[4px_4px_0px_0px_#1e293b] font-bold px-5 py-2 lg:px-6 lg:py-2.5 transition-all duration-200 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[2px_2px_0px_0px_#1e293b] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            提交答案
          </button>
        ) : (
          <button
            onClick={handleRetry}
            className="bg-blue-700 text-white border-2 border-gray-800 rounded-lg shadow-[4px_4px_0px_0px_#1e293b] font-bold px-5 py-2 lg:px-6 lg:py-2.5 transition-all duration-200 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[2px_2px_0px_0px_#1e293b]"
          >
            🔄 再来一轮
          </button>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   搜索
   ================================================================ */
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="🔍 搜索术语..."
        className="w-full px-4 py-2.5 lg:px-5 lg:py-3 bg-white border-2 border-gray-800 rounded-lg text-base lg:text-lg text-gray-800 placeholder:text-gray-400 outline-none focus:bg-yellow-50/50 transition-colors"
      />
    </div>
  );
}

/* ================================================================
   主页面
   ================================================================ */
export default function TermsPage() {
  const [activeCat, setActiveCat] = useState("traffic");
  const [search, setSearch] = useState("");
  const [showQuiz, setShowQuiz] = useState(false);

  const activeCategory = categories.find((c) => c.key === activeCat)!;

  const filteredTerms = useMemo(() => {
    if (!search.trim()) return activeCategory.terms;
    const q = search.toLowerCase();
    return allTerms.filter(
      (t) =>
        t.abbr.toLowerCase().includes(q) ||
        t.full.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q)
    );
  }, [search, activeCategory]);

  return (
    <div className="pt-14 lg:pt-0 p-4 lg:p-8 animate-fade-in">
      {/* ===== 头部 ===== */}
      <div className="mb-6 lg:mb-8">
        <h2 className="font-bold text-2xl lg:text-4xl text-gray-800 -rotate-1 inline-block">
          互联网运营术语手册
        </h2>
        <div className="h-1 w-16 bg-gray-800 rounded-full mt-1" />
        <p className="text-gray-500 mt-2 text-sm">
          面试高频缩写 · 卡片翻转记忆 · 速记对照 · 小测验
        </p>
      </div>

      {/* ===== 搜索栏 ===== */}
      <div className="mb-4 lg:mb-6">
        <SearchBar value={search} onChange={setSearch} />
        {search.trim() && (
          <p className="mt-2 text-xs text-gray-400">
            搜索 "{search}"：找到 {filteredTerms.length} 个结果
          </p>
        )}
      </div>

      {/* ===== 分类切换标签 ===== */}
      {!search.trim() && (
        <div className="flex flex-wrap gap-2 mb-6 lg:mb-8">
          {categories.map((cat, i) => (
            <button
              key={cat.key}
              onClick={() => { setActiveCat(cat.key); setShowQuiz(false); }}
              className={`px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg border-2 border-gray-800 text-sm transition-all duration-200
                ${activeCat === cat.key
                  ? `${TAG_COLORS[i % TAG_COLORS.length]} font-bold -translate-y-0.5`
                  : "bg-white hover:bg-gray-50"
                }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
          <button
            onClick={() => setShowQuiz(true)}
            className={`px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg border-2 border-gray-800 text-sm transition-all duration-200
              ${showQuiz ? "bg-red-500 text-white font-bold -translate-y-0.5" : "bg-white text-red-500 hover:bg-red-50"}`}
          >
            🎯 小测验
          </button>
        </div>
      )}

      {/* ===== 卡片网格 或 测验 ===== */}
      {showQuiz ? (
        <QuizMode />
      ) : (
        <>
          {filteredTerms.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4 opacity-30">🔍</p>
              <p className="text-gray-500">没有找到匹配的术语</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {filteredTerms.map((term) => (
                <TermCard key={term.abbr} item={term} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}