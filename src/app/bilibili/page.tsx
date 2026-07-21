"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ================================================================
   类型定义
   ================================================================ */
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

interface ChatMessage {
  id: string;
  role: "user" | "laok";
  content: string;
  timestamp: number;
}

const STORAGE_KEY = "laok_chat_history";

/* ================================================================
   老K 题库 (用于 /出题)
   ================================================================ */
const questionBank = [
  {
    type: "抄作业",
    prompt: "最近小红书上有个'AI 穿搭助手'小程序爆了。如果把这个模式照搬到我们现在的业务里，你觉得该怎么改？列出 3 个适配点，并说明为什么。",
  },
  {
    type: "吐槽局",
    prompt: "今天你用过的 App 里，挑一个最让你抓狂的功能，用产品经理的视角分析：① 为什么你觉得它烂，② 如果给你 3 天时间，你会怎么低成本优化？",
  },
  {
    type: "定指标",
    prompt: "假设你负责一个内容社区 App 的'收藏'功能。请设定 3 个健康度指标，并说明：① 每个指标的定义，② 为什么这三个指标能反映功能健康度，③ 每个指标的合理阈值。",
  },
  {
    type: "抄作业",
    prompt: "拼多多'砍一刀'的病毒传播逻辑，如果移植到一个 B 端 SaaS 产品中，你觉得有哪些可以借鉴的地方？又有哪些绝对不能碰的雷区？",
  },
  {
    type: "吐槽局",
    prompt: "打开你的微信，找到最近一周让你最烦的一个群聊或朋友圈功能体验问题。用一句话描述痛点，然后给出一个不超过 3 天的低成本优化方案。",
  },
  {
    type: "定指标",
    prompt: "一个电商 App 的搜索功能，你作为 PM 会关注哪 3 个核心指标？请说明每个指标的定义、计算方式，以及为什么它们比'搜索量'更重要。",
  },
  {
    type: "抄作业",
    prompt: "Notion 的 block 编辑器设计哲学很火。如果把这种'万物皆 Block'的思路引入到钉钉/飞书这样的企业协作工具里，你觉得最大的价值点在哪？最大的坑在哪？",
  },
  {
    type: "吐槽局",
    prompt: "回忆你最近一次在 App 上'下单到支付完成'的流程。有没有哪个步骤让你想放弃？如果有，请写出你的优化方案，包括：改动点、预期效果、开发成本估算。",
  },
  {
    type: "定指标",
    prompt: "一个短视频 App 的'推荐算法'，你不能直接看后台数据，只能从用户行为推断。你会设计哪 3 个前端可观测的指标来判断推荐质量？",
  },
];

/* ================================================================
   工具函数
   ================================================================ */
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(msgs: ChatMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-50)));
}

function formatPlayCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
  return String(count);
}

/* ================================================================
   老K 响应生成器
   ================================================================ */
function generateMorningBriefing(videos: BilibiliVideo[]): string {
  if (videos.length === 0) {
    return `你好，我是老K。\n\n今天B站暂时没抓到什么值得看的内容，先放你一马。\n\n不过别闲着，去把昨天的作业补了。`;
  }

  const top3 = videos.slice(0, 3);
  const lines: string[] = [
    "你好，我是老K。这是今天的【高阶PM早报】：",
    "",
  ];

  top3.forEach((v, i) => {
    const icon = ["🎯", "🧠", "🔥"][i];
    const analysis = [
      "核心迭代：这个视频讲的是产品落地的实操方法，建议关注UP主对'用户场景拆解'的框架，比那些讲概念的有用十倍。",
      "深度拆解：视频里提到的'增长飞轮'模型值得细看。核心逻辑是：用供给撬动需求，再用需求倒逼供给。把这张图背下来，以后做方案用得上。",
      "热点洞察：这个选题踩中了当前'AI+产品'的风口。但别光看热闹——想想背后的用户心理：焦虑驱动型学习。做产品要理解这种情绪，但不能利用它。",
    ][i];

    lines.push(`${icon} **${v.title.replace(/\*\*/g, "")}**`);
    lines.push(`> UP主: ${v.author} | ${formatPlayCount(v.playCount)}播放 | ${v.duration}`);
    lines.push(`> ${analysis}`);
    lines.push(`> 📺 ${v.url}`);
    lines.push("");
  });

  lines.push("---");
  lines.push("想让我就某个话题深挖，直接输入你的问题。想做题，输入 `/出题`。");
  return lines.join("\n");
}

function generateChallenge(): string {
  const q = questionBank[Math.floor(Math.random() * questionBank.length)];
  return `老K：\n\n"别光看不练。今天的问题来了——\n\n**【${q.type}】** ${q.prompt}\n\n字数低于100字或者敷衍了事，明天早报取消。"`;
}

function generateMentorReview(userInput: string): string {
  const len = userInput.length;
  let score: number;
  let roast: string;
  let upgrade: string;
  let homework: string;

  if (len < 30) {
    score = 0;
    roast =
      "就这？你这字数连产品需求文档的一句话都写不满。我怀疑你是不是在打字的时候睡着了。重写，立刻。";
    upgrade =
      "换作是我，先搞清楚你面对的是谁（用户画像），再想清楚你要解决什么问题（痛点定义），最后才是方案。你这三步跳了至少两步。";
    homework = "去看一遍《微信背后的产品观》，下次回答前先想清楚：你做的这个功能，到底有没有人会用？";
  } else if (len < 80) {
    score = 4;
    roast =
      "勉强及格。但你的分析太浅了，就像在说'这个功能应该好用'——废话，谁不知道？我要的是'为什么'和'怎么做'。";
    upgrade =
      "给你一个框架：用'用户-场景-需求-方案'四步法重新组织你的思考。每一步都要有具体的数据或观察支撑。";
    homework = "把你刚才说的那个功能，画出它的用户旅程地图。明天发给我。";
  } else if (len < 200) {
    score = 6;
    roast =
      "还行，至少你有在认真想。但你的逻辑链条断了——从用户痛点到你的方案之间，缺少论证。为什么你的方案是最优解？竞品怎么做的？你调查过吗？";
    upgrade =
      "你缺的是'商业视角'。做产品不是做慈善，每个功能背后都有成本。把你的方案加上一个 ROI 估算，看看值不值得做。";
    homework = "找三个竞品，对比你刚才提到的功能，写出差异分析表。";
  } else {
    score = 7;
    roast =
      "不错，有模有样了。但别飘——你考虑过技术实现成本吗？你的方案前端要改几处？后端要加几个接口？测试要覆盖多少用例？PM 如果不考虑落地，就是纸上谈兵。";
    upgrade =
      "你的思考框架已经有了，下一步要修炼的是'节奏感'。不是所有功能都要一起上，想清楚 MVP 是什么，第二期做什么，第三期做什么。";
    homework = "把你刚才的方案拆成三个迭代版本，每个版本只包含一个核心功能点。";
  }

  return [
    `📊 **老K的评分**：${score}/10`,
    "",
    `🔪 **一针见血的吐槽**：`,
    roast,
    "",
    `🚀 **高阶升维（教你一招）**：`,
    upgrade,
    "",
    `💡 **课后思考**：`,
    homework,
  ].join("\n");
}

/* ================================================================
   格式化老K消息 (Markdown 简单渲染)
   ================================================================ */
function renderMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    // 分隔线
    if (line === "---") return <hr key={i} className="my-2 border-gray-200" />;
    // 空行
    if (line.trim() === "") return <br key={i} />;
    // 引用
    if (line.startsWith("> ")) {
      return (
        <p
          key={i}
          className="text-sm pl-3 border-l-2 my-1"
          style={{ color: "#8c8c8c", borderColor: "#d4a574" }}
        >
          <SimpleMarkdown text={line.slice(2)} />
        </p>
      );
    }
    // 标题
    if (line.startsWith("📊") || line.startsWith("🔪") || line.startsWith("🚀") || line.startsWith("💡")) {
      return (
        <p key={i} className="text-sm font-bold mt-3 mb-1" style={{ color: "#4a4a4a" }}>
          <SimpleMarkdown text={line} />
        </p>
      );
    }
    return (
      <p key={i} className="text-sm leading-relaxed" style={{ color: "#4a4a4a" }}>
        <SimpleMarkdown text={line} />
      </p>
    );
  });
}

/* 简易 Markdown 内联渲染 */
function SimpleMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*|📺\s*https?:\/\/\S+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ color: "#6b5b4e" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("📺 ")) {
      const url = part.slice(3).trim();
      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline"
          style={{ color: "#8b7d6b" }}
        >
          {part.slice(0, 2)} 查看视频
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ================================================================
   主页面
   ================================================================ */
export default function BilibiliPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<BilibiliVideo[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* 初始化 */
  useEffect(() => {
    const saved = loadHistory();
    if (saved.length > 0) {
      setMessages(saved);
    } else {
      // 首次进入，显示欢迎语
      const welcome: ChatMessage = {
        id: uid(),
        role: "laok",
        content:
          "来了？我是老K。\n\n" +
          "做过千团大战，孵过微信生态，BAT 都待过。最烦假大空的黑话，只看商业本质和用户同理心。\n\n" +
          "三个指令，自己看着办：\n" +
          "`/早报` — 今天值得看的行业内容\n" +
          "`/出题` — 我给你出道实战题\n" +
          "直接输入 — 我帮你点评你的产品见解\n\n" +
          "别浪费我时间，说正事。",
        timestamp: Date.now(),
      };
      setMessages([welcome]);
      saveHistory([welcome]);
    }
  }, []);

  /* 自动滚动 */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* 添加老K消息 */
  const addLaokMessage = useCallback(
    (content: string) => {
      const msg: ChatMessage = {
        id: uid(),
        role: "laok",
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => {
        const next = [...prev, msg];
        saveHistory(next);
        return next;
      });
    },
    []
  );

  /* 处理发送 */
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    // 添加用户消息
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => {
      const next = [...prev, userMsg];
      saveHistory(next);
      return next;
    });
    setInput("");
    setLoading(true);

    // 模拟老K思考延迟
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

    if (text === "/早报") {
      // 获取B站视频
      try {
        let briefingVideos = videos;
        if (briefingVideos.length === 0) {
          const res = await fetch("/api/bilibili-search");
          const data = await res.json();
          if (data.success) {
            briefingVideos = data.videos;
            setVideos(data.videos);
          }
        }
        const briefing = generateMorningBriefing(briefingVideos);
        addLaokMessage(briefing);
      } catch {
        addLaokMessage(
          "你好，我是老K。\n\n网络出了点问题，B站数据抓不到了。先去看昨天的内容，别在这干等。"
        );
      }
    } else if (text === "/出题") {
      addLaokMessage(generateChallenge());
    } else {
      addLaokMessage(generateMentorReview(text));
    }

    setLoading(false);
  }, [input, loading, videos, addLaokMessage]);

  /* 键盘发送 */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-fade-in">
      {/* ========== 头部 ========== */}
      <div className="flex items-center gap-4 mb-4 flex-shrink-0">
        {/* 老K 头像 */}
        <div
          className="w-12 h-12 rounded-wobbly flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #4a4a4a, #2d2d2d)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <span className="text-white text-lg font-black">K</span>
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: "#4a4a4a" }}>
            老K · 产品导师
          </h2>
          <p className="text-xs" style={{ color: "#b8a088" }}>
            曾就职BAT · 千团大战亲历者 · 微信生态早期孵化
          </p>
        </div>
        <div className="ml-auto flex gap-1.5">
          <button
            onClick={() => {
              setInput("/早报");
              handleSend();
            }}
            disabled={loading}
            className="btn-bounce text-xs px-3 py-1.5 rounded-wobblyMd transition-colors"
            style={{
              backgroundColor: "#f5f2ed",
              color: "#8b7d6b",
              border: "1px solid #ede4d8",
            }}
          >
            📰 早报
          </button>
          <button
            onClick={() => {
              setInput("/出题");
              handleSend();
            }}
            disabled={loading}
            className="btn-bounce text-xs px-3 py-1.5 rounded-wobblyMd transition-colors"
            style={{
              backgroundColor: "#f5f2ed",
              color: "#8b7d6b",
              border: "1px solid #ede4d8",
            }}
          >
            ✍️ 出题
          </button>
          <button
            onClick={() => {
              setMessages([]);
              localStorage.removeItem(STORAGE_KEY);
              const welcome: ChatMessage = {
                id: uid(),
                role: "laok",
                content:
                  "来了？我是老K。\n\n" +
                  "做过千团大战，孵过微信生态，BAT 都待过。最烦假大空的黑话，只看商业本质和用户同理心。\n\n" +
                  "三个指令，自己看着办：\n" +
                  "`/早报` — 今天值得看的行业内容\n" +
                  "`/出题` — 我给你出道实战题\n" +
                  "直接输入 — 我帮你点评你的产品见解\n\n" +
                  "别浪费我时间，说正事。",
                timestamp: Date.now(),
              };
              setMessages([welcome]);
              saveHistory([welcome]);
            }}
            className="btn-bounce text-xs px-3 py-1.5 rounded-wobblyMd transition-colors"
            style={{
              backgroundColor: "#fef0f0",
              color: "#c0a08a",
              border: "1px solid #f5e0e0",
            }}
          >
            🗑 清空
          </button>
        </div>
      </div>

      {/* ========== 聊天区域 ========== */}
      <div
        className="flex-1 overflow-y-auto rounded-wobbly p-5 mb-4"
        style={{
          backgroundColor: "#fdfaf5",
          border: "1px solid #ede4d8",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 mb-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* 头像 */}
            <div
              className="w-8 h-8 rounded-wobblyMd flex items-center justify-center flex-shrink-0 text-xs font-black"
              style={
                msg.role === "laok"
                  ? {
                      background: "linear-gradient(135deg, #4a4a4a, #2d2d2d)",
                      color: "#fff",
                    }
                  : {
                      backgroundColor: "#d4a574",
                      color: "#fff",
                    }
              }
            >
              {msg.role === "laok" ? "K" : "你"}
            </div>

            {/* 气泡 */}
            <div
              className={`max-w-[75%] rounded-wobbly px-4 py-3 ${
                msg.role === "user" ? "text-right" : ""
              }`}
              style={
                msg.role === "laok"
                  ? {
                      backgroundColor: "#fff",
                      border: "1px solid #ede4d8",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    }
                  : {
                      background: "linear-gradient(135deg, #d4a574, #c9956b)",
                      color: "#fff",
                    }
              }
            >
              {msg.role === "laok" ? (
                renderMarkdown(msg.content)
              ) : (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* 加载指示器 */}
        {loading && (
          <div className="flex gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-wobblyMd flex items-center justify-center flex-shrink-0 text-xs font-black"
              style={{
                background: "linear-gradient(135deg, #4a4a4a, #2d2d2d)",
                color: "#fff",
              }}
            >
              K
            </div>
            <div
              className="rounded-wobbly px-4 py-3"
              style={{
                backgroundColor: "#fff",
                border: "1px solid #ede4d8",
              }}
            >
              <div className="flex gap-1.5">
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: "#d4a574", animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: "#d4a574", animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ backgroundColor: "#d4a574", animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ========== 输入区域 ========== */}
      <div className="flex gap-3 flex-shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='输入 "/早报" 获取情报，"/出题" 接受挑战，或直接输入你的产品见解...'
          rows={2}
          className="flex-1 px-5 py-3 rounded-wobbly text-sm resize-none"
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ede4d8",
            color: "#4a4a4a",
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#d4a574";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(212,165,116,0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#ede4d8";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="btn-bounce px-6 py-3 rounded-wobbly text-sm font-bold text-white transition-all disabled:opacity-40 flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #4a4a4a, #2d2d2d)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {loading ? "..." : "发送"}
        </button>
      </div>

      {/* 快捷提示 */}
      <p className="text-xs mt-2 text-center" style={{ color: "#c8bda8" }}>
        Shift+Enter 换行 · Enter 发送 · 聊天记录自动保存
      </p>
    </div>
  );
}