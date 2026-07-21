/* ================================================================
   每日批量抓取接口
   GET /api/cron-daily → 自动抓取所有 RSS 源 → AI 提炼 → 写入 Notion
   ================================================================ */

import { NextResponse } from "next/server";
import { DEFAULT_SOURCES, MAX_ARTICLES_PER_SOURCE } from "@/lib/sources";
import { fetchRssUrls, fetchAndProcessAll } from "@/lib/crawler";

export const dynamic = "force-dynamic";

export async function GET() {
  console.log("[Cron-Daily] 开始每日批量抓取...");

  const allUrls: string[] = [];

  // 第1步：从所有 RSS 源提取文章链接（去重）
  for (const source of DEFAULT_SOURCES) {
    try {
      if (source.type === "rss") {
        const urls = await fetchRssUrls(source.url, MAX_ARTICLES_PER_SOURCE);
        allUrls.push(...urls);
        console.log(`[Cron-Daily] ${source.name}: ${urls.length} 篇`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Cron-Daily] ${source.name} RSS 获取失败: ${msg}`);
    }
  }

  // 去重
  const uniqueUrls = [...new Set(allUrls)];
  console.log(`[Cron-Daily] 共 ${allUrls.length} 个链接，去重后 ${uniqueUrls.length} 个`);

  if (uniqueUrls.length === 0) {
    return NextResponse.json({
      success: false,
      error: "未获取到任何文章链接，请检查 RSS 源是否可访问",
      sources: DEFAULT_SOURCES.map((s) => s.name),
    });
  }

  // 第2步：逐个抓取 → AI 提炼 → 写入 Notion
  const result = await fetchAndProcessAll(uniqueUrls);

  return NextResponse.json({
    success: true,
    message: `批量抓取完成: ${result.succeeded} 成功 / ${result.failed} 失败`,
    ...result,
  });
}