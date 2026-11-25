# -*- coding: utf-8 -*-
"""
AdSense「有用性の低いコンテンツ」対策（2026-11-25）

ポケモン1匹ずつの自動生成ページのうち、公式図鑑の文章と共通の型しかないページは
検索の対象から外し（noindex）、広告も出さない。独自の中身があるページだけを残す。

  日本語 p/<name>.html  : 「豆知識」か「雑学コラム」の欄があるページだけ残す
  英語   en/p/<name>.html: 名前の意味の解説（What does ... mean?）があるページだけ残す

最後に sitemap.xml から noindex のページを取り除く。
何度実行しても同じ結果になる。ページを作り直したら必ず最後にこれを実行する。
  python3 tools/apply_index_policy.py
"""
import glob
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
META = '<meta name="robots" content="noindex,follow">'
RX = re.compile(r'<meta name="robots"[^>]*>\s*')
ADSRX = re.compile(r'<script[^>]*adsbygoogle\.js[^>]*></script>\s*')


def has_value(path, s):
    rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
    if rel.startswith("en/p/"):
        return "What does" in s
    return ('の豆知識' in s) or ('id="zatsugaku"' in s)


def set_noindex(path, on):
    s = open(path, encoding="utf-8").read()
    t = RX.sub("", s)
    if on:
        t = t.replace("<head>", "<head>" + META, 1)
        # 自動広告も出ないよう、AdSense の読み込みコードも外す
        t = ADSRX.sub("", t)
    if t != s:
        open(path, "w", encoding="utf-8").write(t)


def main():
    noidx = set()
    for d in ("p", "en/p"):
        for f in glob.glob(os.path.join(ROOT, d, "*.html")):
            s = open(f, encoding="utf-8").read()
            # ポケモン個別ページの型を持つページだけを対象にする（一覧・読みものページは残す）
            if 'pk-hero' not in s and 'kana by kana' not in s:
                set_noindex(f, False)
                continue
            off = not has_value(f, s)
            set_noindex(f, off)
            if off:
                noidx.add(os.path.relpath(f, ROOT).replace(os.sep, "/"))
    # 転送だけのページ
    for extra in ("home.html", "oauth.html"):
        p = os.path.join(ROOT, extra)
        if os.path.exists(p):
            set_noindex(p, True)
            noidx.add(extra)

    sm = os.path.join(ROOT, "sitemap.xml")
    s = open(sm, encoding="utf-8").read()
    kept = []
    for m in re.finditer(r"\s*<url>.*?</url>", s, flags=re.S):
        loc = re.search(r"<loc>https://poketango\.com/(.*?)</loc>", m.group(0))
        if loc and loc.group(1) in noidx:
            continue
        kept.append(m.group(0))
    head = s[: s.index("<urlset")]
    urlset = re.search(r"<urlset[^>]*>", s).group(0)
    open(sm, "w", encoding="utf-8").write(head + urlset + "".join(kept) + "\n</urlset>\n")
    print("noindex:", len(noidx), "/ sitemap:", len(kept))


if __name__ == "__main__":
    main()
