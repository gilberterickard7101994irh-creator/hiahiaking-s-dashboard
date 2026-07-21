/* ================================================================
   AI 提炼服务 — 使用 OpenAI SDK 调用大模型 API
   兼容 DeepSeek / 智谱 / Kimi 等所有 OpenAI 兼容接口
   ================================================================ */

import OpenAI from "openai";

/* ================================================================
   客户端初始化
   baseURL 直接使用环境变量，不做后缀拼接
   ================================================================ */
const baseURL = process.env.AI_BASE_URL || "https://api.deepseek.com/v1";

const client = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL,
});

/* ================================================================
   类型定义
   ================================================================ */
export interface AIExtractedResult {
  title: string;
  tags: string[];
  summary: string;
  businessValue: string;
}

/* ================================================================
   System Prompt
   要求严格提炼商业价值，过滤广告噪音
   ================================================================ */
const SYSTEM_PROMPT = `你是一个顶尖互联网产品总监，曾在BAT核心部门任职，经历过千团大战、微信生态孵化，做过多个亿级DAU产品。你极度厌恶"赋能""抓手""闭环"等假大空的黑话，只讲人话、讲干货、讲可落地的洞察。

你的任务：阅读以下网页内容，过滤掉广告和导航栏噪音，提炼出极高密度的结构化信息。

## 输出格式（严格 JSON）

{
  "title": "25字以内的核心标题",
  "summary": "1句核心结论 + 3个关键事实要点（用换行符\\n分隔，每条不超过40字）",
  "businessValue": "按照以下4个维度输出，每个维度一行，用换行符\\n分隔：\\n🤯 反共识洞察：[一句话说明这篇文章违背常理的核心发现]\\n🎯 痛点切口：[目标人群 + 他们最痛的极端场景]\\n⚙️ 破局机制：[核心增长飞轮或关键交互设计]\\n🧰 行动指南：[我能立刻抄的作业，1-2条具体可执行的动作]",
  "tags": ["标签1", "标签2", "标签3"]
}

## summary 要求
- 第1句：一句话说清楚这篇文章的核心结论（不超过30字）
- 第2-4句：3个关键事实要点，每条不超过40字，用"① ② ③"编号
- 禁止废话、禁止"本文介绍了""文章提到"等套话

## businessValue 要求
- 必须从产品经理的实战视角出发
- 反共识洞察：找出违背常理、反直觉的发现，不要老生常谈
- 痛点切口：精确到具体人群和场景，不要泛泛而谈"用户有需求"
- 破局机制：说清楚增长飞轮或核心交互，要有因果链条
- 行动指南：必须是立刻能执行的具体动作，不要"建议关注""值得思考"这种废话

## tags 要求
从以下标签库中选择2-3个最合适的：
[AI, 电商, 出海, SaaS, 增长, 产品经理, 方法论, 抖音, 微信, 小红书, 拼多多, 定价, 策略, 商业化, 用户研究, 用户增长, 内容策略, 平台生态, 战略, 效率工具, 短视频, 大数据, 安全, 社交, 本地生活, 银发经济, Z世代, AIGC, 自动驾驶, 硬件]

只输出 JSON，不要任何 Markdown 代码块标记，不要任何解释文字。`;

/* ================================================================
   解析 AI 返回的 JSON
   ================================================================ */
function parseAIResponse(raw: string): AIExtractedResult | null {
  let result: AIExtractedResult | null = null;
  try {
    result = JSON.parse(raw) as AIExtractedResult;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      result = JSON.parse(match[0]) as AIExtractedResult;
    } catch {
      return null;
    }
  }

  if (!result) return null;

  /* 智谱等模型可能将 businessValue 返回为 JSON 对象，强制转为字符串 */
  if (typeof result.businessValue === "object" && result.businessValue !== null) {
    result.businessValue = Object.entries(result.businessValue as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
  }
  if (typeof result.businessValue !== "string") {
    result.businessValue = String(result.businessValue ?? "");
  }

  /* 确保 summary 也是字符串 */
  if (typeof result.summary !== "string") {
    result.summary = String(result.summary ?? "");
  }

  return result;
}

/* ================================================================
   公开 API：分析网页内容，提炼结构化信息
   ================================================================ */
export async function analyzeArticle(htmlContent: string): Promise<AIExtractedResult | null> {
  // 截断过长内容，避免超出 token 限制
  const content = htmlContent.slice(0, 6000);

  try {
    const response = await client.chat.completions.create({
      model: "glm-4-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `请分析以下网页内容：\n\n${content}` },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      console.error("[AI] 返回内容为空");
      return null;
    }

    const result = parseAIResponse(raw);
    if (!result) {
      console.error("[AI] JSON 解析失败，原始返回:", raw.slice(0, 300));
      return null;
    }

    if (!Array.isArray(result.tags)) result.tags = [];

    console.log(`[AI] 提炼成功: ${result.title} | 标签: ${result.tags.join(", ")}`);
    return result;
  } catch (err) {
    console.error("【AI 调用详细报错】:", err);
    throw err;
  }
}