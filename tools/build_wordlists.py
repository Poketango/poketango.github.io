# 学年別の英単語一覧ページ（p/words*.html）を作る
import json, re, glob, html, collections
ROOT = '/home/claude/gh/'
D = json.load(open(ROOT + 'tools/vocab_dict.json', encoding='utf-8'))
need = json.load(open(ROOT + 'tools/vocab_need.json'))['page']
JN = json.load(open(ROOT + 'pokemon_names_jp.json', encoding='utf-8'))
POS = {'名': '名詞', '動': '動詞', '形': '形容詞', '副': '副詞', '前': '前置詞', '接': '接続詞', '代': '代名詞'}
LV = [('中1', 'chu1', '中学1年'), ('中2', 'chu2', '中学2年'), ('中3', 'chu3', '中学3年'), ('高', 'kou', '高校'), ('大', 'dai', '大学・難関')]
E = lambda x: html.escape(x, quote=False)
texts = {}
for k in need:
    s = open(ROOT + 'p/' + k + '.html', encoding='utf-8').read()
    m = re.search(r'<blockquote class="pk-text" lang="en">(.*?)</blockquote>', s, re.S)
    texts[k] = html.unescape(m.group(1)).replace('’', "'")
by = collections.defaultdict(dict)  # level -> word -> (key, sentence)
for k, ws in need.items():
    for w in ws:
        if w not in D or D[w][0] == '-': continue
        if w in by[D[w][2]]: continue
        sent = next((x for x in re.split(r'(?<=[.!?])\s+', texts[k]) if re.search(r'\b' + re.escape(w) + r'\b', x, re.I)), texts[k])
        by[D[w][2]][w] = (k, sent)
HEAD = open(ROOT + 'p/gen1.html', encoding='utf-8').read().split('<body')[0]
def page(fn, title, desc, body):
    h = HEAD
    h = re.sub(r'<title>.*?</title>', f'<title>{E(title)}</title>', h)
    h = re.sub(r'(<meta name="description" content=")[^"]*', r'\g<1>' + E(desc).replace('\\', ''), h)
    h = re.sub(r'(<meta property="og:title" content=")[^"]*', r'\g<1>' + E(title), h)
    h = re.sub(r'(<meta property="og:description" content=")[^"]*', r'\g<1>' + E(desc), h)
    h = re.sub(r'(<link rel="canonical" href=")[^"]*', r'\g<1>https://poketango.com/p/' + fn, h)
    h = re.sub(r'(<meta property="og:url" content=")[^"]*', r'\g<1>https://poketango.com/p/' + fn, h)
    nav = '<body class="pkpage"><nav class="topnav"><a class="brand" href="../index.html">📕 ポケモン英語図鑑</a><div class="tn-links"><a href="index.html">英語名一覧</a><a href="words.html">英単語</a><a href="scary.html">怖い図鑑</a><a href="../practice.html">クイズ</a></div></nav>\n'
    foot = '<script src="../ads.js?v=20261114a"></script><script src="../site-footer.js"></script></body></html>'
    open(ROOT + 'p/' + fn, 'w', encoding='utf-8').write(h + nav + '<main class="pkwrap">' + body + '</main>\n' + foot)
lvnav = '<p class="lvtabs">' + ''.join(f'<a href="words-{slug}.html">{name}</a>' for _, slug, name in LV) + '</p>'
css = '<style>.lvtabs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 8px}.lvtabs a{padding:6px 12px;border-radius:99px;background:#eef2ff;color:#4338ca;font-weight:700;text-decoration:none}.az{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.az a{min-width:28px;text-align:center;padding:2px 6px;border-radius:6px;background:#f1f5f9;text-decoration:none;font-weight:700}.wl dt{font-weight:800;font-size:18px;margin-top:14px}.wl dt small{font-weight:400;color:#6b7280;font-size:13px;margin-left:6px}.wl dd{margin:2px 0 0;line-height:1.7}.wl .ex{color:#374151;font-size:14px}.wl .ex b{color:#b91c1c}</style>'
counts = {}
for lv, slug, name in LV:
    items = sorted(by[lv].items())
    counts[slug] = len(items)
    letters = sorted({w[0].upper() for w, _ in items})
    body = css + f'<section class="list-hero"><h1>ポケモン図鑑で覚える{name}レベルの英単語</h1><p>全{len(items)}語・ポケモンの英語版図鑑から例文つき</p></section>'
    body += f'<section class="card">{lvnav}<p>英語版のポケモン図鑑に出てくる単語のうち、{name}レベルのものを集めました。例文はすべて実際の図鑑の文章です。ポケモンの名前を押すと、図鑑文の全文と日本語訳が見られます。</p><p class="az">' + ''.join(f'<a href="#{c}">{c}</a>' for c in letters) + '</p></section>'
    body += '<section class="card"><dl class="wl">'
    cur = ''
    for w, (k, sent) in items:
        c = w[0].upper()
        anchor = f' id="{c}"' if c != cur else ''
        cur = c
        m, pos, _ = D[w]
        ex = E(sent)
        ex = re.sub(r'\b(' + re.escape(w) + r')\b', r'<b>\1</b>', ex, count=1, flags=re.I)
        body += f'<dt{anchor} lang="en">{E(w)}<small>{POS[pos]}</small></dt><dd>{E(m)}<br><span class="ex" lang="en">{ex}</span> <a href="{k}.html">→ {E(JN.get(k, k))}</a></dd>'
    body += '</dl></section>'
    body += f'<section class="card"><h2>ほかのレベルの単語</h2>{lvnav}<p><a href="print.html">🖨️ この単語で無料プリントを作る →</a></p><p><a href="../practice.html">✏️ 穴埋めクイズで覚えた単語を試す →</a></p></section>'
    page(f'words-{slug}.html', f'ポケモンで覚える{name}レベルの英単語一覧（{len(items)}語・例文つき）', f'英語版ポケモン図鑑に出てくる{name}レベルの英単語{len(items)}語を、意味・品詞・実際の図鑑の例文つきでまとめました。ポケモンが好きな子の英語学習に。', body)
out = {slug: [[w, D[w][0], POS[D[w][1]], k, sent, JN.get(k, k)] for w, (k, sent) in sorted(by[lv].items())] for lv, slug, _ in LV}
json.dump(out, open(ROOT + 'p/wordlist.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
total = sum(counts.values())
body = css + f'<section class="list-hero"><h1>ポケモン図鑑で覚える英単語</h1><p>英語版図鑑に出てくる{total}語をレベル別に</p></section><section class="card"><p>英語版のポケモン図鑑には、中学で習う単語から大学レベルの単語まで、たくさんの英単語が出てきます。好きなポケモンの図鑑文で覚えれば、例文ごと頭に残ります。</p><ul>' + ''.join(f'<li><a href="words-{slug}.html">{name}レベル</a>（{counts[slug]}語）</li>' for _, slug, name in LV) + '</ul><p><a href="print.html">🖨️ 無料の英単語プリントを作る →</a></p><p><a href="../practice.html">✏️ 穴埋めクイズに挑戦 →</a></p></section>'
page('words.html', f'ポケモン図鑑で覚える英単語一覧｜中学〜大学レベル別{total}語', f'英語版ポケモン図鑑に出てくる英単語{total}語を、中1・中2・中3・高校・大学のレベル別に例文つきでまとめました。', body)
print(counts, total)
