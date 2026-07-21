/* ================================================================
   网页抓取 + AI 提炼 + Notion 写入（一站式服务）
   ================================================================ */

import * as cheerio from "cheerio";
import { analyzeArticle } from "./ai";
import { createPage } from "./notion";

/* ================================================================
   类型定义
   ================================================================ */
export interface CrawlResult {
  url: string;
  success: boolean;
  title?: string;
  notionId?: string;
  error?: string;
}

/* ================================================================
   抓取网页 HTML，返回 cheerio 实例和纯文本
   ================================================================ */
async function fetchPage(url: string): Promise<{ $: cheerio.CheerioAPI; text: string }> {
  console.log(`[Crawler] 正在抓取: ${url}`);

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`抓取失败: HTTP ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // 移除噪音标签
  $("script, style, nav, footer, header, iframe, noscript, .sidebar, .ad, .advertisement, .nav, .menu, .footer, .header, .comment, .comments").remove();

  // 提取 body 文本
  const bodyText = $("body").text();

  // 清理多余空白
  const cleaned = bodyText
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();

  console.log(`[Crawler] 提取文本长度: ${cleaned.length} 字符`);
  return { $, text: cleaned };
}

/* ================================================================
   AI 不可用时，用 cheerio 从 HTML 中提取基本信息
   ================================================================ */
function extractBasicInfo($: cheerio.CheerioAPI, url: string): {
  title: string;
  summary: string;
  businessValue: string;
  tags: string[];
} {
  // 提取页面标题
  const rawTitle = $("title").text().trim() || $("h1").first().text().trim() || "无标题";

  // 提取前几段正文作为摘要
  const paragraphs = $("p, article p, .article p, .content p")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 30)
    .slice(0, 3);

  const summary = paragraphs.join("\n\n").slice(0, 500) || "（无法提取正文摘要）";

  return {
    title: rawTitle.slice(0, 60),
    summary,
    businessValue: "（AI 提炼暂不可用，请充值 DeepSeek API Key 后重试）",
    tags: [],
  };
}

/* ================================================================
   抓取 → 提炼 → 写入 Notion
   ================================================================ */
export async function fetchAndProcessUrl(url: string): Promise<CrawlResult> {
  try {
    // 第1步：抓取网页内容
    const { $, text: content } = await fetchPage(url);

    if (!content || content.length < 50) {
      return { url, success: false, error: "网页内容过短，可能为纯 JS 渲染页面" };
    }

    // 第2步：尝试 AI 提炼，失败则降级为 cheerio 直接提取
    let title: string;
    let summary: string;
    let businessValue: string;
    let tags: string[];
    let aiUsed = false;

    try {
      const extracted = await analyzeArticle(content);
      if (extracted) {
        title = extracted.title;
        summary = extracted.summary;
        businessValue = extracted.businessValue;
        tags = extracted.tags;
        aiUsed = true;
        console.log(`[Crawler] AI 提炼成功: ${title}`);
      } else {
        throw new Error("AI 返回为空");
      }
    } catch (aiErr) {
      const aiMsg = aiErr instanceof Error ? aiErr.message : String(aiErr);
      console.warn(`[Crawler] AI 不可用 (${aiMsg})，降级为 cheerio 提取`);
      const basic = extractBasicInfo($, url);
      title = basic.title;
      summary = basic.summary;
      businessValue = basic.businessValue;
      tags = basic.tags;
    }

    // 第3步：写入 Notion
    const sourceName = new URL(url).hostname;
    const { id } = await createPage({
      title,
      tags,
      summary,
      businessValue,
      sourceName,
      sourceUrl: url,
    });

    const modeLabel = aiUsed ? "AI 提炼" : "降级提取";
    console.log(`[Crawler] 完成 (${modeLabel}): ${title} → Notion (${id})`);
    return { url, success: true, title, notionId: id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Crawler] 失败: ${msg}`);
    return { url, success: false, error: msg };
  }
}

/* ================================================================
   解析 RSS 订阅源，提取文章链接列表
   ================================================================ */
export async function fetchRssUrls(feedUrl: string, maxArticles = 3): Promise<string[]> {
  console.log(`[RSS] 正在获取: ${feedUrl}`);

  const res = await fetch(feedUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`RSS 获取失败: HTTP ${res.status}`);
  }

  const xml = await res.text();
  const $ = cheerio.load(xml, { xmlMode: true });

  // RSS 2.0: <item><link>...</link></item>
  // Atom: <entry><link href="..." /></entry>
  const links: string[] = [];

  $("item").each((_, el) => {
    const link = $(el).find("link").text().trim();
    if (link) links.push(link);
  });

  // 如果 RSS 2.0 没找到，尝试 Atom 格式
  if (links.length === 0) {
    $("entry").each((_, el) => {
      const link = $(el).find('link[href]').attr("href");
      if (link) links.push(link);
    });
  }

  const result = links.slice(0, maxArticles);
  console.log(`[RSS] 提取到 ${result.length} 篇文章`);
  return result;
}

/* ================================================================
   批量处理结果
   ================================================================ */
export interface BatchResult {
  total: number;
  succeeded: number;
  failed: number;
  details: Array<{ url: string; title?: string; error?: string }>;
}

/* ================================================================
   批量抓取 + 提炼 + 写入 Notion（并发处理，每批 3 个）
   ================================================================ */
export async function fetchAndProcessAll(urls: string[]): Promise<BatchResult> {
  const details: BatchResult["details"] = [];
  let succeeded = 0;
  let failed = 0;

  // 去重
  const unique = [...new Set(urls)];
  console.log(`[Crawler] 批量开始: ${unique.length} 个唯一 URL (原始 ${urls.length})`);

  const CONCURRENCY = 3;

  // 分批并发处理
  for (let i = 0; i < unique.length; i += CONCURRENCY) {
    const batch = unique.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(
      batch.map((url) => fetchAndProcessUrl(url))
    );

    for (const r of batchResults) {
      if (r.status === "fulfilled" && r.value.success) {
        succeeded++;
        details.push({ url: r.value.url, title: r.value.title });
      } else {
        failed++;
        const err =
          r.status === "fulfilled"
            ? r.value.error
            : (r.reason instanceof Error ? r.reason.message : String(r.reason));
        const url =
          r.status === "fulfilled" ? r.value.url : "未知";
        details.push({ url, error: err });
      }
    }

    // 批间短暂间隔
    if (i + CONCURRENCY < unique.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`[Crawler] 批量完成: ${succeeded} 成功 / ${failed} 失败 / ${unique.length} 总计`);
  return { total: unique.length, succeeded, failed, details };
}