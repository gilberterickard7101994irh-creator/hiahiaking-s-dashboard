/* ================================================================
   每日抓取源配置
   支持 RSS 订阅源和直接文章 URL 两种模式
   ================================================================ */

export interface FeedSource {
  /** 显示名称 */
  name: string;
  /** RSS 订阅地址或文章列表页 URL */
  url: string;
  /** 类型: rss | url */
  type: "rss" | "url";
}

/** 默认抓取源 — 产品/科技/商业 RSS */
export const DEFAULT_SOURCES: FeedSource[] = [
  {
    name: "36氪",
    url: "https://36kr.com/feed",
    type: "rss",
  },
  {
    name: "虎嗅",
    url: "https://www.huxiu.com/rss/0.xml",
    type: "rss",
  },
  {
    name: "少数派",
    url: "https://sspai.com/feed",
    type: "rss",
  },
  {
    name: "人人都是产品经理",
    url: "https://www.woshipm.com/feed",
    type: "rss",
  },
];

/** 每源最多抓取文章数 */
export const MAX_ARTICLES_PER_SOURCE = 3;