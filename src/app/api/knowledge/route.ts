import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/notion";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await queryDatabase();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Notion API 查询失败:", error);
    return NextResponse.json(
      { success: false, error: `Notion 查询失败: ${msg}` },
      { status: 500 }
    );
  }
}