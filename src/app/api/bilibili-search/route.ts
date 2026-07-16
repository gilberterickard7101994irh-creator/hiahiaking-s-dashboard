import { NextResponse } from "next/server";
import axios from "axios";

interface BilibiliVideo {
  bvid: string;
  title: string;
  author: string;
  duration: string;     // "mm:ss"
  durationSeconds: number;
  playCount: number;
  cover: string;
  url: string;
}

const SEARCH_KEYWORDS = ["产品经理 实战", "产品运营 教程"];

const apiClient = axios.create({
  timeout: 15000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    Referer: "https://www.bilibili.com/",
    Accept: "application/json",
  },
});

function parseDurationToSeconds(duration: string): number {
  const parts = duration.split(":").map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

function formatPlayCount(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`;
  }
  return String(count);
}

async function searchBilibili(keyword: string): Promise<BilibiliVideo[]> {
  const url = "https://api.bilibili.com/x/web-interface/search/type";
  const params = {
    search_type: "video",
    keyword,
    page: 1,
    page_size: 10,
    order: "totalrank", // 综合排序
  };

  const { data } = await apiClient.get(url, { params });

  if (data.code !== 0) {
    console.error(`B站搜索失败: ${data.message}`);
    return [];
  }

  const results: BilibiliVideo[] = (data.data?.result || []).map(
    (item: Record<string, unknown>) => {
      const duration = (item.duration as string) || "00:00";
      return {
        bvid: item.bvid as string,
        title: (item.title as string)?.replace(/<em[^>]*>/g, "").replace(/<\/em>/g, "") || "",
        author: (item.author as string) || "未知UP主",
        duration,
        durationSeconds: parseDurationToSeconds(duration),
        playCount: (item.play as number) || 0,
        cover: (item.pic as string) || "",
        url: `https://www.bilibili.com/video/${item.bvid}`,
      };
    }
  );

  return results;
}

export async function GET() {
  try {
    const allResults: BilibiliVideo[] = [];

    for (const keyword of SEARCH_KEYWORDS) {
      const videos = await searchBilibili(keyword);
      allResults.push(...videos);
    }

    // 去重（按 bvid）
    const seen = new Set<string>();
    const unique = allResults.filter((v) => {
      if (seen.has(v.bvid)) return false;
      seen.add(v.bvid);
      return true;
    });

    // 按播放量降序排列
    unique.sort((a, b) => b.playCount - a.playCount);

    return NextResponse.json({
      success: true,
      total: unique.length,
      videos: unique,
    });
  } catch (error) {
    console.error("B站搜索异常:", error);
    return NextResponse.json(
      {
        success: false,
        error: "搜索失败，请稍后重试",
        videos: [],
      },
      { status: 500 }
    );
  }
}