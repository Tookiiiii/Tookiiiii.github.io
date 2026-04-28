from __future__ import annotations

import html
import json
import re
from pathlib import Path

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
SITE_URL = "https://tookiiiii.github.io"
CUSTOM_CSS = '<link rel="stylesheet" href="/css/custom.css?v=20260428-bochi">'
CUSTOM_JS = '<script src="/js/custom.js?v=20260428-bochi"></script>'


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="")


def ensure_custom_assets(content: str) -> str:
    if "/css/custom.css" not in content:
        content = content.replace("</head>", f"{CUSTOM_CSS}</head>", 1)
    if "/js/custom.js" not in content:
        content = content.replace("</body>", f"{CUSTOM_JS}</body>", 1)
    return content


def common_cleanups(content: str) -> str:
    content = content.replace("https://github.com/xxxxxx", "https://github.com/tookiiiii")
    content = content.replace(
        '<div class="announcement_content">This is my Blog</div>',
        '<div class="announcement_content">记录博客搭建、CTF 学习和开发折腾。</div>',
    )
    content = content.replace("&copy;&nbsp;2025 By Tooki", "&copy;&nbsp;2025 - 2026 By Tooki")
    return content


def home_panel() -> str:
    return """
<section class="tooki-home-panel tooki-section" id="tooki-home-panel">
  <div class="tooki-kicker">Study Mode Online</div>
  <h2>欢迎来到 Tooki 的学习现场</h2>
  <p>这里目前记录博客搭建、Hexo 使用和学习笔记。首页保留文章流，同时增加常用入口和站点状态。</p>
  <div class="tooki-action-row">
    <a class="tooki-btn" href="/archives/"><i class="fa-fw fas fa-archive"></i>查看归档</a>
    <a class="tooki-btn" href="/music/"><i class="fa-fw fas fa-music"></i>打开歌单</a>
    <a class="tooki-btn" href="/link/"><i class="fa-fw fas fa-link"></i>友情链接</a>
  </div>
  <div class="tooki-stat-grid">
    <div class="tooki-stat"><strong>2</strong><span>已发布文章</span></div>
    <div class="tooki-stat"><strong>Hexo</strong><span>静态博客框架</span></div>
    <div class="tooki-stat"><strong>Butterfly</strong><span>当前主题</span></div>
  </div>
</section>
"""


def enhance_home(content: str) -> str:
    if 'id="tooki-home-panel"' in content:
        return content
    return content.replace('<div class="recent-post-items">', f"{home_panel()}<div class=\"recent-post-items\">", 1)


def link_cards() -> str:
    data = json.loads(read_text(ROOT / "link.json"))
    sections: list[str] = []
    for group in data:
        items: list[str] = []
        for item in group["link_list"]:
            name = html.escape(item["name"])
            link = html.escape(item["link"])
            avatar = html.escape(item["avatar"])
            descr = html.escape(item["descr"])
            items.append(
                f"""
        <div class="flink-list-item">
          <a href="{link}" title="{name}" target="_blank" rel="noopener">
            <span class="flink-item-icon"><img src="{avatar}" onerror="this.onerror=null;this.src='/img/friend_404.gif'" alt="{name}"></span>
            <span class="flink-item-name">{name}</span>
            <span class="flink-item-desc">{descr}</span>
          </a>
        </div>"""
            )
        sections.append(
            f"""
    <div class="flink">
      <h2 class="flink-name">{html.escape(group["class_name"])}</h2>
      <p>{html.escape(group["class_desc"])}</p>
      <div class="flink-list">{''.join(items)}
      </div>
    </div>"""
        )

    return f"""
<div id="page" class="container tooki-page">
  <h1 class="page-title">友情链接</h1>
  <div class="tooki-callout">友链页已经接入 <code>link.json</code> 数据。后续新增朋友时，只需要按同样结构补充名称、链接、头像和描述。</div>
  {''.join(sections)}
  <section class="tooki-section">
    <div class="tooki-kicker">Link Exchange</div>
    <h2>友链申请格式</h2>
    <p>名称：Tooki Blog<br>地址：https://tookiiiii.github.io/<br>头像：https://tookiiiii.github.io/img/zipai.png<br>描述：So Futuristic Player!</p>
  </section>
</div>
"""


PAGES = {
    "about": {
        "title": "About",
        "description": "关于 Tooki、博客方向和联系方式。",
        "content": """
<div id="page" class="container tooki-page">
  <h1 class="page-title">About Tooki</h1>
  <section class="tooki-section tooki-hero">
    <img src="/img/zipai.png" alt="Tooki avatar" onerror="this.onerror=null;this.src='/img/friend_404.gif'">
    <div>
      <div class="tooki-kicker">Profile</div>
      <h2>Tooki</h2>
      <p>So Futuristic Player! 这个博客现在是一个学习记录站：先把博客搭建踩坑整理清楚，后续逐步放 CTF、开发和工具链笔记。</p>
      <div class="tooki-chip-list">
        <span class="tooki-chip">Hexo</span>
        <span class="tooki-chip">Butterfly</span>
        <span class="tooki-chip">CTF</span>
        <span class="tooki-chip">Blogging</span>
      </div>
    </div>
  </section>
  <section class="tooki-section">
    <div class="tooki-kicker">Roadmap</div>
    <h2>博客计划</h2>
    <ul class="tooki-timeline">
      <li><strong>博客搭建</strong><span>整理 Hexo、GitHub Pages、主题配置和部署问题。</span></li>
      <li><strong>CTF 学习</strong><span>把题目复盘成可检索的思路、命令和修复建议。</span></li>
      <li><strong>页面增强</strong><span>补齐音乐、友链、观影、标签和分类等导航页面。</span></li>
    </ul>
  </section>
  <section class="tooki-section">
    <div class="tooki-kicker">Contact</div>
    <h2>联系方式</h2>
    <div class="tooki-action-row">
      <a class="tooki-btn" href="https://github.com/tookiiiii" target="_blank" rel="noopener"><i class="fab fa-github"></i>GitHub</a>
      <a class="tooki-btn" href="mailto:3323198776@qq.com"><i class="fas fa-envelope"></i>Email</a>
    </div>
  </section>
</div>
""",
    },
    "music": {
        "title": "Music",
        "description": "博客内置的学习氛围音乐播放器。",
        "content": """
<div id="page" class="container tooki-page">
  <h1 class="page-title">Music</h1>
  <section class="tooki-section">
    <div class="tooki-kicker">Ambient Player</div>
    <h2>学习氛围歌单</h2>
    <p>全站左下角已经加入浮动音乐播放器。浏览器通常禁止自动播放，所以需要手动点击播放；音量和曲目会保存在本地。</p>
  </section>
  <div class="tooki-grid">
    <div class="tooki-card tooki-track-card" data-tooki-track="0">
      <div class="tooki-kicker">Track 01</div>
      <h3>Cyber Rain</h3>
      <p>适合夜间写博客和整理资料的轻合成器循环。</p>
      <button class="tooki-track-btn" type="button"><i class="fas fa-play"></i>播放这一首</button>
    </div>
    <div class="tooki-card tooki-track-card" data-tooki-track="1">
      <div class="tooki-kicker">Track 02</div>
      <h3>Study Pulse</h3>
      <p>带一点节拍感，适合写题解和调试代码。</p>
      <button class="tooki-track-btn" type="button"><i class="fas fa-play"></i>播放这一首</button>
    </div>
    <div class="tooki-card tooki-track-card" data-tooki-track="2">
      <div class="tooki-kicker">Track 03</div>
      <h3>Night Drive</h3>
      <p>更低频、更稳定，适合长时间阅读文章。</p>
      <button class="tooki-track-btn" type="button"><i class="fas fa-play"></i>播放这一首</button>
    </div>
  </div>
</div>
""",
    },
    "movies": {
        "title": "Movie",
        "description": "观影清单和内容推荐页面。",
        "content": """
<div id="page" class="container tooki-page">
  <h1 class="page-title">Movie</h1>
  <section class="tooki-section">
    <div class="tooki-kicker">Watch List</div>
    <h2>观影和资料清单</h2>
    <p>这里先放一个可扩展的清单页面，后续可以记录电影、纪录片、技术视频和观后笔记。</p>
  </section>
  <div class="tooki-movie-list">
    <div class="tooki-card"><div class="tooki-kicker">Sci-Fi</div><h3>科幻 / 赛博朋克</h3><p>适合补充博客整体视觉气质，也适合写观后感。</p></div>
    <div class="tooki-card"><div class="tooki-kicker">Security</div><h3>安全 / 黑客题材</h3><p>记录和 CTF、攻防、工程伦理相关的影视资料。</p></div>
    <div class="tooki-card"><div class="tooki-kicker">Documentary</div><h3>纪录片</h3><p>整理计算机史、互联网、安全事件和人物纪录片。</p></div>
    <div class="tooki-card"><div class="tooki-kicker">Notes</div><h3>观后笔记</h3><p>后续可以按标题、年份、关键词追加短评。</p></div>
  </div>
</div>
""",
    },
    "categories": {
        "title": "Categories",
        "description": "博客分类导航。",
        "content": """
<div id="page" class="container tooki-page">
  <h1 class="page-title">Categories</h1>
  <section class="tooki-section">
    <div class="tooki-kicker">Content Map</div>
    <h2>分类规划</h2>
    <p>当前文章还没有写入 Hexo 分类元数据，所以侧边栏仍显示 0。这里先补一个人工导航，方便后续按方向整理。</p>
  </section>
  <div class="category-lists">
    <div class="category-title">当前可用分类</div>
    <ul class="category-list">
      <li class="category-list-item"><a class="category-list-link" href="/archives/">博客搭建</a><span class="category-list-count">1</span></li>
      <li class="category-list-item"><a class="category-list-link" href="/archives/">Hexo 入门</a><span class="category-list-count">2</span></li>
      <li class="category-list-item"><a class="category-list-link" href="/archives/">学习记录</a><span class="category-list-count">规划中</span></li>
    </ul>
  </div>
</div>
""",
    },
    "tags": {
        "title": "Tags",
        "description": "博客标签云。",
        "content": """
<div id="page" class="container tooki-page">
  <h1 class="page-title">Tags</h1>
  <section class="tooki-section">
    <div class="tooki-kicker">Tag Cloud</div>
    <h2>标签云</h2>
    <p>当前是静态增强版标签页；后续在 Markdown Front Matter 中加入 tags 后，可以让 Hexo 自动生成真实标签统计。</p>
  </section>
  <div class="tag-cloud-list">
    <a href="/archives/" style="font-size: 1.45em; color: #49b1f5">Hexo</a>
    <a href="/archives/" style="font-size: 1.2em; color: #ff7242">Butterfly</a>
    <a href="/archives/" style="font-size: 1.1em; color: #7c4dff">GitHub Pages</a>
    <a href="/archives/" style="font-size: 1.3em; color: #00c4b6">博客搭建</a>
    <a href="/archives/" style="font-size: 1.05em; color: #f39c12">学习记录</a>
    <a href="/archives/" style="font-size: 1.18em; color: #e84393">CTF</a>
  </div>
</div>
""",
    },
    "link": {
        "title": "Link",
        "description": "友情链接和常用站点。",
        "content": "",
    },
}


def render_page(slug: str, page: dict[str, str], base_content: str) -> None:
    soup = BeautifulSoup(base_content, "html.parser")
    title = page["title"]
    content = link_cards() if slug == "link" else page["content"]

    if soup.title:
        soup.title.string = f"{title} | Tooki"

    page_title = soup.select_one("#page-site-info #site-title")
    if page_title:
        page_title.string = title

    canonical = soup.select_one('link[rel="canonical"]')
    if canonical:
        canonical["href"] = f"{SITE_URL}/{slug}/"

    description = soup.select_one('meta[name="description"]')
    if description:
        description["content"] = page["description"]

    for selector in ['meta[property="og:title"]', 'meta[name="twitter:title"]']:
        meta = soup.select_one(selector)
        if meta:
            meta["content"] = f"{title} | Tooki"

    for selector in ['meta[property="og:url"]', 'meta[name="twitter:url"]']:
        meta = soup.select_one(selector)
        if meta:
            meta["content"] = f"{SITE_URL}/{slug}/"

    old_main = soup.select_one("main#content-inner > div:first-child")
    fragment = BeautifulSoup(content, "html.parser").find()
    if old_main and fragment:
        old_main.replace_with(fragment)

    output = str(soup)
    output = re.sub(r"title: 'Archives'", f"title: '{title}'", output)
    output = ensure_custom_assets(common_cleanups(output))
    if not output.lstrip().startswith("<!DOCTYPE html>"):
        output = "<!DOCTYPE html>\n" + output

    write_text(ROOT / slug / "index.html", output)


def enhance_existing_pages() -> None:
    for path in ROOT.rglob("*.html"):
        if ".git" in path.parts:
            continue
        content = read_text(path)
        content = ensure_custom_assets(common_cleanups(content))
        if path == ROOT / "index.html":
            content = enhance_home(content)
        write_text(path, content)


def main() -> None:
    enhance_existing_pages()
    base_content = ensure_custom_assets(common_cleanups(read_text(ROOT / "archives" / "index.html")))
    for slug, page in PAGES.items():
        render_page(slug, page, base_content)


if __name__ == "__main__":
    main()
