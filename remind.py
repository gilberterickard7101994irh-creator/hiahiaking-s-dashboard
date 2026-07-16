"""
每日幸福提醒脚本
支持两种推送方式：
  1. Server酱 (推荐，微信推送，无需翻墙)
  2. Telegram Bot

使用方法：
  python remind.py --method serverchan --key YOUR_SENDKEY
  python remind.py --method telegram --token BOT_TOKEN --chat-id CHAT_ID --url http://localhost:3000/happiness

配合系统定时任务使用：
  - Windows 任务计划程序：每天 20:00 执行
  - Linux/macOS crontab：0 20 * * * python /path/to/remind.py --method serverchan --key xxx
"""

import argparse
import json
import urllib.request
from datetime import datetime


def send_serverchan(sendkey: str, title: str, content: str) -> bool:
    """通过 Server酱 发送消息"""
    url = f"https://sctapi.ftqq.com/{sendkey}.send"
    data = json.dumps({"title": title, "desp": content}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read())
            if result.get("code") == 0:
                print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] Server酱推送成功")
                return True
            else:
                print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] Server酱推送失败: {result}")
                return False
    except Exception as e:
        print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] Server酱请求异常: {e}")
        return False


def send_telegram(token: str, chat_id: str, text: str) -> bool:
    """通过 Telegram Bot 发送消息"""
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = json.dumps({"chat_id": chat_id, "text": text}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read())
            if result.get("ok"):
                print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] Telegram 推送成功")
                return True
            else:
                print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] Telegram 推送失败: {result}")
                return False
    except Exception as e:
        print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] Telegram 请求异常: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="每日幸福记录提醒")
    parser.add_argument(
        "--method",
        choices=["serverchan", "telegram"],
        default="serverchan",
        help="推送方式: serverchan (默认) 或 telegram",
    )
    parser.add_argument("--key", help="Server酱 SendKey")
    parser.add_argument("--token", help="Telegram Bot Token")
    parser.add_argument("--chat-id", help="Telegram Chat ID")
    parser.add_argument(
        "--url",
        default="http://localhost:3000/happiness",
        help="本地网站链接 (默认: http://localhost:3000/happiness)",
    )
    args = parser.parse_args()

    title = "今天过得怎么样？"
    content = (
        f"快去记录你的幸福三件事吧！\n\n"
        f"点击链接开始记录：{args.url}\n\n"
        f"---\n"
        f"发送时间：{datetime.now():%Y-%m-%d %H:%M}"
    )

    if args.method == "serverchan":
        if not args.key:
            print("错误: 使用 Server酱 需要提供 --key 参数")
            print("获取 SendKey: https://sct.ftqq.com/")
            return
        send_serverchan(args.key, title, content)
    elif args.method == "telegram":
        if not args.token or not args.chat_id:
            print("错误: 使用 Telegram 需要提供 --token 和 --chat-id 参数")
            return
        send_telegram(args.token, args.chat_id, f"{title}\n\n{content}")


if __name__ == "__main__":
    main()