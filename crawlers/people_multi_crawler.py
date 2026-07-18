#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
人民网多栏目新闻爬虫（Ai_Daily_Paper 模板格式）
================================================
支持同时抓取多个栏目，每个栏目独立输出 JSON。

Usage:
    python crawlers/people_multi_crawler.py
    python crawlers/people_multi_crawler.py --categories 人工智能 科技数码 体育赛事 --max-per-category 25
    python crawlers/people_multi_crawler.py --all --max-per-category 25 --delay 1.0
"""

import argparse
import hashlib
import json
import os
import random
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urljoin, urlparse

# Fix Windows console encoding for Chinese/emoji output
try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

import requests
from bs4 import BeautifulSoup


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DEFAULT_MEMBER_NAME = "your-name"          # 替换为你的姓名或爬虫脚本名
DEFAULT_SOURCE_TYPE = "website"
DEFAULT_SOURCE_NAME = "人民网"
DEFAULT_SOURCE_HOMEPAGE = "http://www.people.com.cn/"

DEFAULT_TIME_RANGE = "24h"
DEFAULT_TIMEZONE = "Asia/Shanghai"
DEFAULT_OUTPUT_DIR = "data/raw"
DEFAULT_MAX_PER_CATEGORY = 25
DEFAULT_DELAY = 0.8                        # 请求间隔（秒），避免被封

REQUEST_TIMEOUT = 30
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.0 (KHTML, like Gecko) "
    "Chrome/126.0.0.0 Safari/537.0"
)

# 栏目配置：名称 -> {category, keyword, base_url, source_homepage}
CATEGORY_CONFIG: dict[str, dict[str, str]] = {
    "人工智能": {
        "category_label": "人工智能",
        "keyword": "人工智能",
        "base_url": "http://scitech.people.com.cn/GB/index.html",
        "source_homepage": "http://scitech.people.com.cn/",
        "filter_keywords": ["人工智能", "AI", "大模型", "智能体"],
    },
    "科技数码": {
        "category_label": "科技数码",
        "keyword": "科技",
        "base_url": "http://scitech.people.com.cn/GB/index.html",
        "source_homepage": "http://scitech.people.com.cn/",
    },
    "商业财经": {
        "category_label": "商业财经",
        "keyword": "商业",
        "base_url": "http://finance.people.com.cn/GB/index.html",
        "source_homepage": "http://finance.people.com.cn/",
    },
    "学术科研": {
        "category_label": "校园生活",
        "keyword": "教育",
        "base_url": "http://edu.people.com.cn/GB/index.html",
        "source_homepage": "http://edu.people.com.cn/",
        # edu 频道只有一页，不过滤以获取更多条数
    },
    "体育赛事": {
        "category_label": "体育赛事",
        "keyword": "体育",
        "base_url": "http://sports.people.com.cn/GB/index.html",
        "source_homepage": "http://sports.people.com.cn/",
    },
    "健康生活": {
        "category_label": "健康生活",
        "keyword": "健康",
        "base_url": "http://health.people.com.cn/GB/index.html",
        "source_homepage": "http://health.people.com.cn/",
    },
    "电影娱乐": {
        "category_label": "电影娱乐",
        "keyword": "娱乐",
        "base_url": "http://ent.people.com.cn/GB/index.html",
        "source_homepage": "http://ent.people.com.cn/",
    },
    "政治时政": {
        "category_label": "政治时政",
        "keyword": "时政",
        "base_url": "http://cpc.people.com.cn/GB/index.html",
        "source_homepage": "http://cpc.people.com.cn/",
    },
}


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
    """Convert Chinese date strings to ISO 8601 +08:00."""
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


def normalize_url(href: str, base_url: str) -> str:
    """Normalize relative URLs to absolute."""
    href = clean_text(href)
    if not href:
        return ""
    if href.startswith("//"):
        return "http:" + href
    if href.startswith("http"):
        return href
    return urljoin(base_url, href)


def extract_listings_li(html: str, base_url: str) -> list[dict[str, str]]:
    """Extract articles from <li> list structure (scitech, sports)."""
    soup = BeautifulSoup(html, "html.parser")
    results: list[dict[str, str]] = []

    for li in soup.find_all("li"):
        a = li.find("a", href=True)
        em = li.find("em")
        if not a:
            continue

        title = clean_text(a.get_text())
        href = normalize_url(a["href"], base_url)
        date_text = clean_text(em.get_text()) if em else ""

        if not title or not href or "/n1/" not in href:
            continue

        results.append({"title": title, "url": href, "date": date_text})

    return _dedupe(results)


def extract_listings_marquee(html: str, base_url: str) -> list[dict[str, str]]:
    """Extract articles from marquee structure (ent, health)."""
    soup = BeautifulSoup(html, "html.parser")
    results: list[dict[str, str]] = []

    # Find all links inside marquee or main content area
    for a in soup.find_all("a", href=True):
        href = normalize_url(a["href"], base_url)
        title = clean_text(a.get_text())

        if not title or not href or "/n1/" not in href:
            continue

        # Try to find a nearby date
        date_text = ""
        parent = a.find_parent(["li", "div", "p"])
        if parent:
            date_match = re.search(r"(\d{4}-\d{2}-\d{2})", parent.get_text())
            if date_match:
                date_text = date_match.group(1)

        results.append({"title": title, "url": href, "date": date_text})

    return _dedupe(results)


def extract_listings_cpc(html: str, base_url: str) -> list[dict[str, str]]:
    """Extract articles from cpc.people.com.cn structure."""
    soup = BeautifulSoup(html, "html.parser")
    results: list[dict[str, str]] = []

    # Multiple possible structures: list_16, swiper, etc.
    for a in soup.find_all("a", href=True):
        href = normalize_url(a["href"], base_url)
        title = clean_text(a.get_text())

        if not title or not href or "/n1/" not in href:
            continue

        # Filter out navigation/footer links by requiring reasonable title length
        if len(title) < 8 or len(title) > 100:
            continue

        # Try to find date from URL: /n1/2026/0718/c...
        date_text = ""
        url_match = re.search(r"/n1/(\d{4})/(\d{2})(\d{2})/", href)
        if url_match:
            date_text = f"{url_match.group(1)}-{url_match.group(2)}-{url_match.group(3)}"

        results.append({"title": title, "url": href, "date": date_text})

    return _dedupe(results)


def _dedupe(items: list[dict[str, str]]) -> list[dict[str, str]]:
    """Deduplicate listings by URL while preserving order."""
    seen = set()
    unique = []
    for item in items:
        if item["url"] and item["url"] not in seen:
            seen.add(item["url"])
            unique.append(item)
    return unique


def extract_article(html: str, url: str, listing_date: str) -> dict[str, Any] | None:
    """Parse an article page and extract fields."""
    soup = BeautifulSoup(html, "html.parser")

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

    desc_meta = soup.find("meta", attrs={"name": "description"})
    description = clean_text(desc_meta.get("content", "")) if desc_meta else ""

    publish_date = ""
    publish_meta = soup.find("meta", attrs={"name": "publishdate"})
    if publish_meta:
        publish_date = clean_text(publish_meta.get("content", ""))
    if not publish_date:
        newstime = soup.find("b", id="newstime")
        if newstime:
            publish_date = clean_text(newstime.get_text())
    if not publish_date:
        url_match = re.search(r"/n1/(\d{4})/(\d{2})(\d{2})/", url)
        if url_match:
            publish_date = f"{url_match.group(1)}-{url_match.group(2)}-{url_match.group(3)}"
    if not publish_date:
        publish_date = listing_date

    published_at = parse_chinese_date(publish_date)

    source = DEFAULT_SOURCE_NAME
    source_meta = soup.find("meta", attrs={"name": "source"})
    if source_meta:
        raw_source = clean_text(source_meta.get("content", ""))
        if raw_source and "来源：" in raw_source:
            raw_source = raw_source.replace("来源：", "").strip()
        if raw_source:
            source = raw_source

    content_parts: list[str] = []
    content_div = soup.find("div", id="rm_txt_zw")
    if content_div:
        for p in content_div.find_all("p"):
            text = clean_text(p.get_text())
            if text and len(text) > 10:
                content_parts.append(text)

    content = "\n".join(content_parts)
    if not description and content_parts:
        description = content_parts[0][:220]

    image_url = ""
    if content_div:
        img = content_div.find("img", src=True)
        if img:
            image_url = normalize_url(img["src"], url)

    return {
        "title": title,
        "description": description,
        "content": content,
        "source": source,
        "publishedAt": published_at,
        "imageUrl": image_url,
    }


def generate_id(url: str, index: int, prefix: str = "people") -> str:
    """Generate stable article id."""
    date_part = datetime.now().strftime("%Y%m%d")
    url_hash = hashlib.md5(url.encode("utf-8")).hexdigest()[:6]
    return f"{prefix}-{date_part}-{index:03d}-{url_hash}"


def build_keywords(title: str, category: str, keyword: str,
                   extra_keywords: list[str] | None = None) -> list[str]:
    """Build keyword list."""
    keywords = [keyword, category]
    if extra_keywords:
        for kw in extra_keywords:
            if kw in title and kw not in keywords:
                keywords.append(kw)

    hot_words = ["人工智能", "AI", "大模型", "机器人", "游戏", "电竞", "学术", "科研",
                 "体育", "健康", "电影", "娱乐", "时政"]
    for kw in hot_words:
        if kw in title and kw not in keywords:
            keywords.append(kw)

    seen = set()
    return [k for k in keywords if not (k in seen or seen.add(k))]


def build_output(
    articles: list[dict[str, Any]],
    member_name: str,
    category: str,
    keyword: str,
    source_homepage: str,
    source_type: str = DEFAULT_SOURCE_TYPE,
    time_range: str = DEFAULT_TIME_RANGE,
) -> dict[str, Any]:
    """Build top-level JSON object for one category."""
    crawled_at = now_iso()
    batch_date = datetime.now().strftime("%Y-%m-%d")
    prefix = re.sub(r"[^a-zA-Z0-9一-龥]", "", category)[:10]
    batch_id = f"news-batch-{batch_date}-{prefix}-{len(articles):03d}"

    return {
        "schemaVersion": "1.0.0",
        "batchId": batch_id,
        "provider": {
            "name": member_name,
            "sourceType": source_type,
            "sourceName": DEFAULT_SOURCE_NAME,
            "sourceHomepage": source_homepage,
        },
        "crawl": {
            "keyword": keyword,
            "category": category,
            "timeRange": time_range,
            "crawledAt": crawled_at,
            "timezone": DEFAULT_TIMEZONE,
            "totalFetched": len(articles),
            "notes": f"Fetched from {source_homepage} via website scraping.",
        },
        "articles": articles,
    }


def save_json(data: dict[str, Any], output_path: str) -> None:
    """Save formatted JSON to disk."""
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def slugify(text: str) -> str:
    """Convert Chinese category to safe filename slug."""
    text = text.replace("·", "-")
    return re.sub(r"[^\w\-]", "", text)


def crawl_category(
    cat_key: str,
    config: dict[str, str],
    member_name: str,
    max_articles: int,
    delay: float,
    output_dir: str,
) -> tuple[str, dict[str, Any]]:
    """Crawl one category and return (output_path, output_data)."""
    category_label = config["category_label"]
    keyword = config["keyword"]
    base_url = config["base_url"]
    source_homepage = config["source_homepage"]
    filter_keywords = config.get("filter_keywords", [])

    print(f"\n=== 开始抓取：{cat_key} ({category_label}) ===")

    listings: list[dict[str, str]] = []
    page_num = 1
    parsed_base = urlparse(base_url)
    base_dir = os.path.dirname(base_url)

    while len(listings) < max_articles * 3:  # 多抓一些，过滤后保留 25 条
        if page_num == 1:
            page_url = base_url
        else:
            page_url = f"{base_dir}/index{page_num}.html"

        try:
            print(f"  获取列表页 {page_url}")
            html = fetch_html(page_url)
        except requests.RequestException as e:
            print(f"  列表页获取失败: {e}")
            break

        # Try different extraction strategies
        page_listings = extract_listings_li(html, base_url)
        if not page_listings:
            page_listings = extract_listings_marquee(html, base_url)
        if not page_listings:
            page_listings = extract_listings_cpc(html, base_url)

        if not page_listings:
            print(f"  第 {page_num} 页未解析到文章，停止分页")
            break

        listings.extend(page_listings)
        print(f"  第 {page_num} 页解析到 {len(page_listings)} 条，累计 {len(listings)} 条")

        page_num += 1
        time.sleep(delay)

        # Safety: don't paginate too much
        if page_num > 30:
            break

    # Apply keyword filter if configured
    if filter_keywords:
        filtered = []
        for item in listings:
            title = item["title"]
            if any(kw in title for kw in filter_keywords):
                filtered.append(item)
        print(f"  关键词过滤后：{len(filtered)} / {len(listings)}")
        listings = filtered

    # Limit to max_articles
    listings = listings[:max_articles]

    articles: list[dict[str, Any]] = []
    for idx, item in enumerate(listings, start=1):
        print(f"  [{idx}/{len(listings)}] {item['title'][:40]}...")
        try:
            article_html = fetch_html(item["url"])
            article_data = extract_article(article_html, item["url"], item["date"])
        except requests.RequestException as e:
            print(f"    文章获取失败: {e}")
            continue

        if not article_data:
            continue

        article_id = generate_id(item["url"], idx, prefix=slugify(cat_key)[:10] or "people")
        keywords = build_keywords(article_data["title"], category_label, keyword, filter_keywords)

        article: dict[str, Any] = {
            "id": article_id,
            "title": article_data["title"],
            "description": article_data["description"],
            "source": article_data["source"],
            "sourceUrl": item["url"],
            "publishedAt": article_data["publishedAt"],
            "category": category_label,
            "keywords": keywords,
            "raw": {
                "originalTitle": article_data["title"],
                "language": "zh-CN",
                "listingDate": item["date"],
            },
        }

        if article_data.get("content"):
            article["content"] = article_data["content"]
        if article_data.get("imageUrl"):
            article["imageUrl"] = article_data["imageUrl"]

        articles.append(article)
        time.sleep(delay)

    output_data = build_output(
        articles=articles,
        member_name=member_name,
        category=category_label,
        keyword=keyword,
        source_homepage=source_homepage,
    )

    date_str = datetime.now().strftime("%Y-%m-%d")
    filename = f"news-people-{slugify(cat_key)}-{date_str}.json"
    output_path = os.path.join(output_dir, filename)
    save_json(output_data, output_path)

    print(f"  [OK] 保存 {len(articles)} 篇文章到 {output_path}")
    return output_path, output_data


def main() -> int:
    parser = argparse.ArgumentParser(description="Crawl 人民网多栏目新闻")
    parser.add_argument(
        "--categories",
        nargs="+",
        default=list(CATEGORY_CONFIG.keys()),
        help=f"选择栏目，可选：{', '.join(CATEGORY_CONFIG.keys())}",
    )
    parser.add_argument("--all", action="store_true", help="抓取所有栏目")
    parser.add_argument("--member", default=DEFAULT_MEMBER_NAME, help="成员名")
    parser.add_argument("--max-per-category", type=int, default=DEFAULT_MAX_PER_CATEGORY,
                        help="每个栏目抓取条数")
    parser.add_argument("--delay", type=float, default=DEFAULT_DELAY, help="请求间隔秒数")
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR, help="输出目录")
    args = parser.parse_args()

    categories = list(CATEGORY_CONFIG.keys()) if args.all else args.categories

    # Validate categories
    invalid = [c for c in categories if c not in CATEGORY_CONFIG]
    if invalid:
        print(f"错误：不支持的栏目 {invalid}", file=sys.stderr)
        print(f"支持的栏目：{', '.join(CATEGORY_CONFIG.keys())}", file=sys.stderr)
        return 1

    print(f"即将抓取 {len(categories)} 个栏目，每个栏目最多 {args.max_per_category} 条")

    results: list[tuple[str, dict[str, Any]]] = []
    for cat_key in categories:
        config = CATEGORY_CONFIG[cat_key]
        try:
            path, data = crawl_category(
                cat_key=cat_key,
                config=config,
                member_name=args.member,
                max_articles=args.max_per_category,
                delay=args.delay,
                output_dir=args.output_dir,
            )
            results.append((path, data))
        except Exception as e:
            print(f"抓取 {cat_key} 时出错: {e}", file=sys.stderr)

    print(f"\n=== 完成，共生成 {len(results)} 个 JSON 文件 ===")
    for path, data in results:
        print(f"  {path}: {len(data['articles'])} 篇文章")

    return 0


if __name__ == "__main__":
    sys.exit(main())
