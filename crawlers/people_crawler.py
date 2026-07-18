#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
人民网科技新闻爬虫（Ai_Daily_Paper 模板格式）
=============================================
抓取人民网科技频道（http://scitech.people.com.cn/）列表页及文章详情，
输出符合 data/templates/news-data-template.json 的 JSON 文件。

Usage:
    python crawlers/people_crawler.py
    python crawlers/people_crawler.py --max-articles 10 --output data/raw/news-people-tech-2026-07-18.json
"""

import argparse
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


# ---------------------------------------------------------------------------
# Default configuration
# ---------------------------------------------------------------------------
DEFAULT_MEMBER_NAME = "your-name"          # 替换为你的姓名或爬虫脚本名
DEFAULT_SOURCE_TYPE = "website"            # 这里用 website 爬取（非 RSS）
DEFAULT_SOURCE_NAME = "人民网"
DEFAULT_SOURCE_HOMEPAGE = "http://scitech.people.com.cn/"

DEFAULT_KEYWORD = "人工智能"
DEFAULT_CATEGORY = "科技数码"              # 人工智能 | 科技数码 | 商业财经 | ...
DEFAULT_TIME_RANGE = "24h"                 # 24h | 7d | 30d | custom
DEFAULT_TIMEZONE = "Asia/Shanghai"

# 人民网科技频道列表页
LISTING_URL = "http://scitech.people.com.cn/GB/index.html"

DEFAULT_OUTPUT_DIR = "data/raw"
DEFAULT_OUTPUT_FILENAME = "news-people-tech-{date}.json"

REQUEST_TIMEOUT = 30
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.0 (KHTML, like Gecko) "
    "Chrome/126.0.0.0 Safari/537.0"
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_iso() -> str:
    """Return current Asia/Shanghai time as ISO 8601 string."""
    tz = timezone(timedelta(hours=8))
    return datetime.now(tz).strftime("%Y-%m-%dT%H:%M:%S+08:00")


def clean_text(text: str | None) -> str:
    """Remove extra whitespace and invisible characters from text."""
    if not text:
        return ""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    text = text.replace("​", "").replace("﻿", "")
    return text


def parse_chinese_date(date_str: str | None) -> str:
    """
    Convert Chinese date strings to ISO 8601 +08:00.
    Supports:
      - 2026年07月17日16:55
      - 2026-07-17
    """
    if not date_str:
        return now_iso()

    date_str = clean_text(date_str)

    # 2026年07月17日16:55
    m = re.search(r"(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{2}):(\d{2})", date_str)
    if m:
        year, month, day, hour, minute = m.groups()
        dt = datetime(int(year), int(month), int(day), int(hour), int(minute), 0,
                      tzinfo=timezone(timedelta(hours=8)))
        return dt.strftime("%Y-%m-%dT%H:%M:%S+08:00")

    # 2026-07-17
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", date_str)
    if m:
        year, month, day = m.groups()
        dt = datetime(int(year), int(month), int(day), 0, 0, 0,
                      tzinfo=timezone(timedelta(hours=8)))
        return dt.strftime("%Y-%m-%dT%H:%M:%S+08:00")

    return now_iso()


def fetch_html(url: str) -> str:
    """Fetch HTML text from a URL."""
    headers = {"User-Agent": USER_AGENT}
    resp = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
    resp.encoding = resp.apparent_encoding or "utf-8"
    resp.raise_for_status()
    return resp.text


def extract_listings(html: str) -> list[dict[str, str]]:
    """
    Parse the listing page and return article metadata.
    Each item: {"title": str, "url": str, "date": str}
    """
    soup = BeautifulSoup(html, "html.parser")
    results: list[dict[str, str]] = []

    # Listing items are <li> tags containing <a> and <em>
    for li in soup.find_all("li"):
        a = li.find("a", href=True)
        em = li.find("em")
        if not a:
            continue

        title = clean_text(a.get_text())
        href = clean_text(a["href"])
        date_text = clean_text(em.get_text()) if em else ""

        if not title or not href:
            continue

        # Only keep links that look like People article URLs
        if "/n1/" not in href:
            continue

        # Normalize URL
        if href.startswith("//"):
            href = "http:" + href
        elif href.startswith("/"):
            href = urljoin("http://scitech.people.com.cn/", href)
        elif not href.startswith("http"):
            href = urljoin(LISTING_URL, href)

        results.append({
            "title": title,
            "url": href,
            "date": date_text,
        })

    # Deduplicate by URL while preserving order
    seen = set()
    unique = []
    for item in results:
        if item["url"] not in seen:
            seen.add(item["url"])
            unique.append(item)
    return unique


def extract_article(html: str, url: str, listing_date: str) -> dict[str, Any] | None:
    """
    Parse an article page and extract fields matching the template.
    Returns None if the page does not look like an article.
    """
    soup = BeautifulSoup(html, "html.parser")

    # Title: prefer <h1>, fallback to <title> meta
    title = ""
    h1 = soup.find("h1")
    if h1:
        title = clean_text(h1.get_text())
    if not title:
        title_tag = soup.find("title")
        if title_tag:
            title = clean_text(title_tag.get_text().split("--")[0])

    if not title:
        return None

    # Description from meta
    desc_meta = soup.find("meta", attrs={"name": "description"})
    description = clean_text(desc_meta.get("content", "")) if desc_meta else ""

    # Publish time
    publish_date = ""
    publish_meta = soup.find("meta", attrs={"name": "publishdate"})
    if publish_meta:
        publish_date = clean_text(publish_meta.get("content", ""))

    if not publish_date:
        newstime = soup.find("b", id="newstime")
        if newstime:
            publish_date = clean_text(newstime.get_text())

    # If still no date, use listing date
    if not publish_date:
        publish_date = listing_date

    published_at = parse_chinese_date(publish_date)

    # Source
    source_meta = soup.find("meta", attrs={"name": "source"})
    source = DEFAULT_SOURCE_NAME
    if source_meta:
        raw_source = clean_text(source_meta.get("content", ""))
        if raw_source and "来源：" in raw_source:
            raw_source = raw_source.replace("来源：", "").strip()
        if raw_source:
            source = raw_source

    # Content: paragraphs inside <div id="rm_txt_zw">
    content_parts: list[str] = []
    content_div = soup.find("div", id="rm_txt_zw")
    if content_div:
        for p in content_div.find_all("p"):
            text = clean_text(p.get_text())
            if text and len(text) > 10:
                content_parts.append(text)

    content = "\n".join(content_parts)

    # If no meta description, use first paragraph as description
    if not description and content_parts:
        description = content_parts[0][:200]

    # Image: first img in article content
    image_url = ""
    if content_div:
        img = content_div.find("img", src=True)
        if img:
            image_url = clean_text(img["src"])
            if image_url.startswith("//"):
                image_url = "http:" + image_url
            elif image_url.startswith("/"):
                image_url = urljoin(url, image_url)

    return {
        "title": title,
        "description": description,
        "content": content,
        "source": source,
        "publishedAt": published_at,
        "imageUrl": image_url,
    }


def generate_id(url: str, index: int) -> str:
    """Generate a stable article id like 'people-20260718-001-abc123'."""
    date_part = datetime.now().strftime("%Y%m%d")
    url_hash = hashlib.md5(url.encode("utf-8")).hexdigest()[:6]
    return f"people-{date_part}-{index:03d}-{url_hash}"


def build_keywords(title: str, category: str, keyword: str) -> list[str]:
    """Build keyword list from category, keyword, and title entities."""
    keywords = [keyword, category]

    # Add AI-related keywords if title mentions them
    if "人工智能" in title or "AI" in title:
        if "人工智能" not in keywords:
            keywords.append("人工智能")
    if "大模型" in title and "大模型" not in keywords:
        keywords.append("大模型")
    if "机器人" in title and "机器人" not in keywords:
        keywords.append("机器人")

    seen = set()
    unique = [k for k in keywords if not (k in seen or seen.add(k))]
    return unique


def build_output(
    articles: list[dict[str, Any]],
    member_name: str,
    source_type: str,
    source_name: str,
    source_homepage: str,
    keyword: str,
    category: str,
    time_range: str,
    timezone_name: str,
) -> dict[str, Any]:
    """Build the top-level JSON object matching the project template."""
    crawled_at = now_iso()
    batch_date = datetime.now().strftime("%Y-%m-%d")
    batch_id = f"news-batch-{batch_date}-people-tech-{len(articles):03d}"

    return {
        "schemaVersion": "1.0.0",
        "batchId": batch_id,
        "provider": {
            "name": member_name,
            "sourceType": source_type,
            "sourceName": source_name,
            "sourceHomepage": source_homepage,
        },
        "crawl": {
            "keyword": keyword,
            "category": category,
            "timeRange": time_range,
            "crawledAt": crawled_at,
            "timezone": timezone_name,
            "totalFetched": len(articles),
            "notes": f"Fetched from {LISTING_URL} via website scraping.",
        },
        "articles": articles,
    }


def save_json(data: dict[str, Any], output_path: str) -> None:
    """Save formatted JSON to disk."""
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Crawl 人民网科技新闻 and output Ai_Daily_Paper JSON.")
    parser.add_argument("--member", default=DEFAULT_MEMBER_NAME,
                        help="Your name or crawler identifier.")
    parser.add_argument("--category", default=DEFAULT_CATEGORY,
                        help="Category for the batch and articles.")
    parser.add_argument("--keyword", default=DEFAULT_KEYWORD,
                        help="Search/keyword for this crawl.")
    parser.add_argument("--time-range", default=DEFAULT_TIME_RANGE,
                        choices=["24h", "7d", "30d", "custom"],
                        help="Time range label for this crawl.")
    parser.add_argument("--output", default=None,
                        help="Output JSON file path (default: auto-generated in data/raw).")
    parser.add_argument("--max-articles", type=int, default=0,
                        help="Limit number of articles (0 = no limit).")
    parser.add_argument("--no-content", action="store_true",
                        help="Skip fetching article content (faster).")
    args = parser.parse_args()

    print(f"Fetching listing page: {LISTING_URL}")
    try:
        listing_html = fetch_html(LISTING_URL)
    except requests.RequestException as e:
        print(f"ERROR: Failed to fetch listing page: {e}", file=sys.stderr)
        return 1

    listings = extract_listings(listing_html)
    print(f"Found {len(listings)} articles in listing")

    if args.max_articles > 0:
        listings = listings[:args.max_articles]

    articles: list[dict[str, Any]] = []
    for idx, item in enumerate(listings, start=1):
        print(f"[{idx}/{len(listings)}] {item['title']}")

        if args.no_content:
            article_data = {
                "title": item["title"],
                "description": "",
                "content": "",
                "source": DEFAULT_SOURCE_NAME,
                "publishedAt": parse_chinese_date(item["date"]),
                "imageUrl": "",
            }
        else:
            try:
                article_html = fetch_html(item["url"])
                article_data = extract_article(article_html, item["url"], item["date"])
            except requests.RequestException as e:
                print(f"  Warning: failed to fetch article {item['url']}: {e}", file=sys.stderr)
                continue

        if not article_data:
            continue

        article_id = generate_id(item["url"], idx)
        keywords = build_keywords(article_data["title"], args.category, args.keyword)

        article: dict[str, Any] = {
            "id": article_id,
            "title": article_data["title"],
            "description": article_data["description"],
            "content": article_data["content"],
            "source": article_data["source"],
            "sourceUrl": item["url"],
            "publishedAt": article_data["publishedAt"],
            "category": args.category,
            "keywords": keywords,
            "raw": {
                "originalTitle": article_data["title"],
                "language": "zh-CN",
                "listingDate": item["date"],
            },
        }

        if article_data.get("imageUrl"):
            article["imageUrl"] = article_data["imageUrl"]

        # Remove empty optional fields
        if not article_data.get("content"):
            del article["content"]

        articles.append(article)

    output_data = build_output(
        articles=articles,
        member_name=args.member,
        source_type=DEFAULT_SOURCE_TYPE,
        source_name=DEFAULT_SOURCE_NAME,
        source_homepage=DEFAULT_SOURCE_HOMEPAGE,
        keyword=args.keyword,
        category=args.category,
        time_range=args.time_range,
        timezone_name=DEFAULT_TIMEZONE,
    )

    if args.output:
        output_path = args.output
    else:
        date_str = datetime.now().strftime("%Y-%m-%d")
        filename = DEFAULT_OUTPUT_FILENAME.format(date=date_str)
        output_path = os.path.join(DEFAULT_OUTPUT_DIR, filename)

    save_json(output_data, output_path)
    print(f"Saved {len(articles)} articles to {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
