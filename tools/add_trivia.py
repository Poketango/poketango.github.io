# -*- coding: utf-8 -*-
"""
個別ページ p/<name>.html に「豆知識」の欄を差し込む（2026-11-25）

元データは tools/trivia_ja.json（英語名のスラッグ: 本文）。
すでに豆知識の欄があるページは、このファイルにあるものだけ書きかえる。
出典は Bulbapedia の各ポケモンのページ。
差し込んだあとは tools/apply_index_policy.py を実行して、検索の対象に戻す。
  python3 tools/add_trivia.py && python3 tools/apply_index_policy.py
"""
import html
import json
import os
import re
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "tools", "trivia_ja.json")


def section(jname, text, en):
    url = "https://bulbapedia.bulbagarden.net/wiki/" + urllib.parse.quote(en + "_(Pokémon)")
    paras = "".join(f"<p>{html.escape(s)}</p>" for s in [text])
    return (f'<section class="card" id="trivia"><h2><img class="hi" src="/home_icons/items/star-piece.png" alt="" width="28" height="28">'
            f'{html.escape(jname)}の豆知識</h2>{paras}'
            f'<p class="src">出典 <a href="{url}" rel="nofollow noopener" target="_blank">Bulbapedia</a></p></section>')


def main():
    data = json.load(open(DATA, encoding="utf-8"))
    done = 0
    for slug, text in data.items():
        path = os.path.join(ROOT, "p", slug + ".html")
        if not os.path.exists(path):
            print("ページがない:", slug)
            continue
        s = open(path, encoding="utf-8").read()
        jn = re.search(r'class="pk-jn">([^<]*)の英語名', s).group(1)
        en = re.search(r'class="en-name" lang="en">([^<]+)', s).group(1)
        sec = section(jn, text, en)
        s = re.sub(r'<section class="card" id="trivia">.*?</section>', "", s, flags=re.S)
        m = re.search(r'(<section class="card" id="origin">.*?</section>)', s, flags=re.S)
        if m:
            s = s[:m.end()] + sec + s[m.end():]
        else:
            s = s.replace('<section class="card" id="stats"', sec + '<section class="card" id="stats"', 1)
        if 'href="#trivia"' not in s:
            if '<a href="#origin">由来</a>' in s:
                s = s.replace('<a href="#origin">由来</a>', '<a href="#origin">由来</a><a href="#trivia">豆知識</a>', 1)
            else:
                s = s.replace('<a href="#stats">', '<a href="#trivia">豆知識</a><a href="#stats">', 1)
        open(path, "w", encoding="utf-8").write(s)
        done += 1
    print(done, "ページに豆知識を入れました")


if __name__ == "__main__":
    main()
