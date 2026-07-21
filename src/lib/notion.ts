/* ================================================================
   Notion API 数据层 — 直接调用 HTTP API（读 + 写）
   字段映射: 标题(title) / 标签(multi_select) / 信息总结(rich_text) /
            信息价值(rich_text) / 信息来源(rich_text) / 原文链接(url)
   ================================================================ */

const NOTION_TOKEN = process.env.NOTION_TOKEN!;
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

/* 启动时打印配置状态 */
console.log("[Notion] 初始化: Token 存在 =", !!NOTION_TOKEN, "| Database ID =", DATABASE_ID ? DATABASE_ID.slice(0, 8) + "..." : "未配置");

/* ================================================================
   类型定义（与页面组件共享）
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
   Notion API 请求封装
   ================================================================ */
async function notionFetch(path: string, body?: Record<string, unknown>, retries = 3): Promise<unknown> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`https://api.notion.com/v1${path}`, {
        method: body ? "POST" : "GET",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        ...(body && { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Notion API 错误 ${res.status}: ${text}`);
      }

      return res.json();
    } catch (err) {
      if (attempt < retries) {
        console.warn(`[Notion] 请求失败 (第${attempt}次)，1秒后重试...`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      throw err;
    }
  }
}

/* ================================================================
   辅助提取函数
   ================================================================ */
function extractTitle(prop: Record<string, unknown>): string {
  const title = prop?.title as Array<{ plain_text?: string }> | undefined;
  return title?.map((t) => t.plain_text ?? "").join("") ?? "";
}

function extractMultiSelect(prop: Record<string, unknown>): string[] {
  const ms = prop?.multi_select as Array<{ name?: string }> | undefined;
  return ms?.map((s) => s.name ?? "").filter(Boolean) ?? [];
}

function extractRichText(prop: Record<string, unknown>): string {
  const rt = prop?.rich_text as Array<{ plain_text?: string }> | undefined;
  return rt?.map((t) => t.plain_text ?? "").join("") ?? "";
}

function extractUrl(prop: Record<string, unknown>): string {
  return (prop?.url as string) ?? "";
}

/* ================================================================
   将单条 Notion Page 映射为 KnowledgeCardItem
   ================================================================ */
function mapPageToCard(page: Record<string, unknown>): KnowledgeCardItem | null {
  try {
    const props = (page.properties ?? {}) as Record<string, Record<string, unknown>>;
    const title = extractTitle(props["标题"] ?? {}) || "（无标题）";

    /* "信息总结" 在 Notion 中可能是 multi_select 或 rich_text 类型，兼容两种 */
    const summaryRaw = props["信息总结"] ?? {};
    const summary =
      summaryRaw.type === "multi_select"
        ? extractMultiSelect(summaryRaw).join("、")
        : extractRichText(summaryRaw);

    return {
      id: page.id as string,
      title,
      tags: extractMultiSelect(props["标签"] ?? {}),
      summary,
      businessValue: extractRichText(props["信息价值"] ?? {}),
      sourceName: extractRichText(props["信息来源"] ?? {}),
      sourceUrl: extractUrl(props["原文链接"] ?? {}),
      createdAt: page.created_time as string,
    };
  } catch {
    return null;
  }
}

/* ================================================================
   公开 API：创建一条新记录
   ================================================================ */
export interface CreatePageInput {
  title: string;
  tags: string[];
  summary: string;
  businessValue: string;
  sourceName: string;
  sourceUrl: string;
}

export async function createPage(input: CreatePageInput): Promise<{ id: string }> {
  const body = {
    parent: { database_id: DATABASE_ID },
    properties: {
      "标题": {
        title: [{ text: { content: input.title } }],
      },
      "标签": {
        multi_select: input.tags.map((name) => ({ name })),
      },
      "信息总结": {
        multi_select: input.summary
          ? [{ name: input.summary.slice(0, 100) }]
          : [],
      },
      "信息价值": {
        rich_text: [{ text: { content: String(input.businessValue).slice(0, 2000) } }],
      },
      "信息来源": {
        rich_text: [{ text: { content: String(input.sourceName).slice(0, 2000) } }],
      },
      "原文链接": {
        url: input.sourceUrl,
      },
    },
  };

  const data = await notionFetch("/pages", body);
  console.log(`[Notion] 创建成功: ${input.title} (${data.id})`);
  return { id: data.id as string };
}
/* ================================================================
   公开 API：查询数据库全部记录
   ================================================================ */
export async function queryDatabase(): Promise<KnowledgeCardItem[]> {
  console.log("[Notion] 正在查询数据库...");
  const data = await notionFetch(`/databases/${DATABASE_ID}/query`, {
    sorts: [{ timestamp: "created_time", direction: "descending" }],
  });

  const results = data.results as Array<Record<string, unknown>> | undefined;
  console.log(`[Notion] 查询成功: 共 ${results?.length ?? 0} 条记录`);
  if (!results) return [];

  /* 打印第一条记录的原始 properties，用于排查字段映射问题 */
  if (results.length > 0) {
    console.log("[Notion] 第一条记录原始 properties:");
    console.log(JSON.stringify(results[0].properties, null, 2));
  }

  const cards = results
    .map(mapPageToCard)
    .filter((item): item is KnowledgeCardItem => item !== null);

  console.log(`[Notion] 映射后有效卡片: ${cards.length} 条`);
  return cards;
}