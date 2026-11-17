# 雑学コラム（ポケモン雑学採掘場の動画と対になる記事）を作る
#   python3 tools/build_zatsugaku.py
#   記事の中身は tools/zatsugaku/*.json に1本ずつ置く
import json, os, glob, html

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, "tools", "zatsugaku")
OUT = os.path.join(HERE, "zatsugaku")
SITE = "https://poketango.com"

HEAD = """<!DOCTYPE html><html lang="ja"><head><script async src="https://www.googletagmanager.com/gtag/js?id=G-2S81YX6L53"></script>
<script>try{{var q=location.search;if(q.indexOf('notrack=1')>=0)localStorage.setItem('pt_notrack','1');if(q.indexOf('notrack=0')>=0)localStorage.removeItem('pt_notrack');if(localStorage.getItem('pt_notrack'))window['ga-disable-G-2S81YX6L53']=true;}}catch(e){{}}window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','G-2S81YX6L53');</script><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title><meta name="description" content="{desc}">
<link rel="canonical" href="{url}"><link rel="icon" type="image/png" sizes="48x48" href="../favicon-48.png"><link rel="icon" type="image/png" sizes="96x96" href="../favicon-96.png"><link rel="icon" type="image/png" sizes="192x192" href="../favicon-192.png">
<meta property="og:type" content="article"><meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:image" content="{ogimg}"><meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="../theme.css"><meta name="google-adsense-account" content="ca-pub-4829093383068106">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4829093383068106" crossorigin="anonymous"></script><script defer src="/adslots.js?v=20261118"></script>
{ld}
<style>.zt-body h2{{margin-top:28px}}.zt-body p{{line-height:1.9}}.zt-video{{position:relative;padding-top:56.25%;border-radius:14px;overflow:hidden;margin:12px 0}}.zt-video iframe{{position:absolute;inset:0;width:100%;height:100%;border:0}}.zt-mons{{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0}}.zt-mons a{{display:flex;align-items:center;gap:6px;padding:6px 12px 6px 6px;border-radius:999px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.08);color:var(--ink);text-decoration:none;font-weight:700}}.zt-meta{{opacity:.75;font-size:14px}}.zt-src li{{margin:6px 0;word-break:break-all}}.zt-list a{{display:block;padding:14px 16px;margin:10px 0;border-radius:14px;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.08);color:var(--ink);text-decoration:none}}.zt-list b{{font-size:18px}}</style>
</head>
<body class="pkpage "><nav class="topnav"><a class="brand" href="../index.html"><img class="brand-logo" src="../logo.svg" alt="もんすぺ！" width="124" height="28"></a><div class="tn-links"><a href="index.html">雑学コラム</a><a href="../p/index.html">英語名一覧</a><a href="../practice.html">クイズ</a></div></nav>
"""
TAIL = """</main>
<script src="../ads.js?v=20261114b"></script><script src="../site-footer.js"></script></body></html>
"""
E = html.escape


def mons(lst):
    out = []
    for slug, jp, en in lst:
        out.append(f'<a href="../p/{slug}.html"><img src="../pokemon_sprites/{slug}.png" alt="" width="40" height="40" loading="lazy">{E(jp)}<span lang="en" class="zt-meta">{E(en)}</span></a>')
    return '<div class="zt-mons">' + "".join(out) + "</div>"


def article(a):
    url = f"{SITE}/zatsugaku/{a['slug']}.html"
    ld = {"@context": "https://schema.org", "@type": "Article", "headline": a["title"], "description": a["desc"],
          "datePublished": a["date"], "dateModified": a["date"], "inLanguage": "ja", "mainEntityOfPage": url,
          "author": {"@type": "Organization", "name": "ポケモン雑学採掘場"},
          "publisher": {"@type": "Organization", "name": "もんすぺ！", "logo": {"@type": "ImageObject", "url": SITE + "/favicon-512.png"}},
          "image": f"https://i.ytimg.com/vi/{a['video']}/hqdefault.jpg"}
    h = HEAD.format(title=E(a["title"]), desc=E(a["desc"]), url=url, ogimg=f"https://i.ytimg.com/vi/{a['video']}/hqdefault.jpg",
                    ld='<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + "</script>")
    b = [f'<main class="pkwrap"><section class="list-hero"><h1>{E(a["h1"])}</h1><p>{E(a["sub"])}</p></section>']
    b.append('<section class="card zt-body">')
    b.append(f'<p class="zt-meta">ポケモン雑学採掘場 第{a["no"]:03d}回の動画をもとにした記事です（{E(a["date"])}）</p>')
    b.append(f'<p><b>{E(a["lead"])}</b></p>')
    b.append(f'<div class="zt-video"><iframe src="https://www.youtube-nocookie.com/embed/{a["video"]}" title="{E(a["title"])}" loading="lazy" allowfullscreen></iframe></div>')
    for sec in a["sections"]:
        b.append(f'<h2>{E(sec["h"])}</h2>')
        for p in sec["p"]:
            b.append(f"<p>{p}</p>")  # p は信頼できる手書きのHTML（強調やリンク）
        if sec.get("mons"):
            b.append(mons(sec["mons"]))
    b.append('<h2>この記事に出てきたポケモンの英語版図鑑</h2><p>名前を押すと、英語版図鑑の説明文と日本語訳、英語名の由来が読めます。</p>')
    b.append(mons(a["mons"]))
    b.append('<h2>出典</h2><ul class="zt-src">' + "".join(f'<li><a href="{E(u)}" rel="nofollow noopener" target="_blank">{E(t)}</a></li>' for t, u in a["sources"]) + "</ul>")
    b.append('<p><a href="index.html">雑学コラムの一覧へ</a></p></section>')
    return h + "".join(b) + TAIL


def index(arts):
    url = f"{SITE}/zatsugaku/"
    title = "ポケモン雑学コラム｜深いところに埋まった雑学を掘り出す"
    desc = "論文や当時の記録までさかのぼって調べた、ポケモンの深い雑学のまとめ記事です。YouTube「ポケモン雑学採掘場」の動画とセットで読めます。"
    h = HEAD.format(title=E(title), desc=E(desc), url=url, ogimg=SITE + "/ogp.png", ld="")
    b = ['<main class="pkwrap"><section class="list-hero"><h1>ポケモン雑学コラム</h1><p>YouTube「ポケモン雑学採掘場」の動画とセットで読める記事</p></section><section class="card zt-list">',
         '<p>ポケモン好きでも知らない、深いところに埋まった雑学を、論文や当時の記録までさかのぼって調べた記事です。</p>']
    for a in sorted(arts, key=lambda x: x["date"], reverse=True):
        b.append(f'<a href="{a["slug"]}.html"><b>{E(a["title"])}</b><br><span class="zt-meta">{E(a["date"])}　{E(a["desc"])}</span></a>')
    b.append("</section>")
    return h + "".join(b) + TAIL


def main():
    os.makedirs(OUT, exist_ok=True)
    arts = [json.load(open(p, encoding="utf-8")) for p in sorted(glob.glob(os.path.join(SRC, "*.json")))]
    for a in arts:
        open(os.path.join(OUT, a["slug"] + ".html"), "w", encoding="utf-8").write(article(a))
    open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(index(arts))
    # サイトマップに足す
    sm = os.path.join(HERE, "sitemap.xml")
    s = open(sm, encoding="utf-8").read()
    urls = [(f"{SITE}/zatsugaku/", max(a["date"] for a in arts))] + [(f"{SITE}/zatsugaku/{a['slug']}.html", a["date"]) for a in arts]
    for u, d in urls:
        if f"<loc>{u}</loc>" not in s:
            s = s.replace("</urlset>", f"  <url><loc>{u}</loc><lastmod>{d}</lastmod></url>\n</urlset>")
    open(sm, "w", encoding="utf-8").write(s)
    print(len(arts), "本の記事を作りました")


if __name__ == "__main__":
    main()


# 個別ページ（p/英語名.html）に「このポケモンが出てくる雑学コラム」の欄を入れる
def link_pokemon_pages():
    import re
    arts = [json.load(open(p, encoding="utf-8")) for p in sorted(glob.glob(os.path.join(SRC, "*.json")))]
    by = {}
    for a in arts:
        for slug, _, _ in a["mons"]:
            by.setdefault(slug, []).append(a)
    for slug, lst in by.items():
        path = os.path.join(HERE, "p", slug + ".html")
        if not os.path.exists(path):
            continue
        s = open(path, encoding="utf-8").read()
        s = re.sub(r'<section class="card" id="zatsugaku">.*?</section>', "", s, flags=re.S)
        items = "".join(f'<li><a href="../zatsugaku/{a["slug"]}.html">{E(a["title"])}</a></li>' for a in lst)
        block = f'<section class="card" id="zatsugaku"><h2><img class="hi" src="/home_icons/items/explorer-kit.png" alt="" width="28" height="28">このポケモンが出てくる雑学コラム</h2><ul>{items}</ul></section>'
        anchor = '<section class="card" id="faq">'
        s = s.replace(anchor, block + anchor, 1) if anchor in s else s.replace("</main>", block + "</main>", 1)
        open(path, "w", encoding="utf-8").write(s)


link_pokemon_pages()
