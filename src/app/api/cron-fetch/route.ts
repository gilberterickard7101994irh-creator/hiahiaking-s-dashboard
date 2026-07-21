/* ================================================================
   Cron Job API — 传入 URL 自动抓取 → AI 提炼 → 写入 Notion
   GET /api/cron-fetch?url=https://example.com/article
   ================================================================ */

import { NextResponse } from "next/server";
import { fetchAndProcessUrl } from "@/lib/crawler";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      {
        success: false,
        error: "缺少参数 ?url= 待抓取的网页地址",
        usage: "GET /api/cron-fetch?url=https://example.com/article",
      },
      { status: 400 }
    );
  }

  console.log(`[Cron] 开始处理: ${url}`);

  try {
    const result = await fetchAndProcessUrl(url);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "抓取-提炼-同步完成",
        url: result.url,
        title: result.title,
        notionId: result.notionId,
      });
    }

    return NextResponse.json(
      { success: false, url: result.url, error: result.error },
      { status: 500 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}