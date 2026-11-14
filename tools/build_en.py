# 海外向け（英語）ページ：ポケモンの名前でカタカナを学ぶ  en/ 以下を作る
import re, glob, html, json, unicodedata
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
E = lambda x: html.escape(x, quote=True)
# ---------- katakana -> romaji (Hepburn, macron for ー) ----------
K = {'ア':'a','イ':'i','ウ':'u','エ':'e','オ':'o','カ':'ka','キ':'ki','ク':'ku','ケ':'ke','コ':'ko','サ':'sa','シ':'shi','ス':'su','セ':'se','ソ':'so','タ':'ta','チ':'chi','ツ':'tsu','テ':'te','ト':'to','ナ':'na','ニ':'ni','ヌ':'nu','ネ':'ne','ノ':'no','ハ':'ha','ヒ':'hi','フ':'fu','ヘ':'he','ホ':'ho','マ':'ma','ミ':'mi','ム':'mu','メ':'me','モ':'mo','ヤ':'ya','ユ':'yu','ヨ':'yo','ラ':'ra','リ':'ri','ル':'ru','レ':'re','ロ':'ro','ワ':'wa','ヲ':'wo','ン':'n','ガ':'ga','ギ':'gi','グ':'gu','ゲ':'ge','ゴ':'go','ザ':'za','ジ':'ji','ズ':'zu','ゼ':'ze','ゾ':'zo','ダ':'da','ヂ':'ji','ヅ':'zu','デ':'de','ド':'do','バ':'ba','ビ':'bi','ブ':'bu','ベ':'be','ボ':'bo','パ':'pa','ピ':'pi','プ':'pu','ペ':'pe','ポ':'po','ヴ':'vu','ァ':'a','ィ':'i','ゥ':'u','ェ':'e','ォ':'o','ャ':'ya','ュ':'yu','ョ':'yo','ヮ':'wa'}
SMALL_Y = {'ャ':'a','ュ':'u','ョ':'o'}
SMALL_V = {'ァ':'a','ィ':'i','ゥ':'u','ェ':'e','ォ':'o'}
MAC = {'a':'ā','i':'ī','u':'ū','e':'ē','o':'ō'}
def units(name):
    """split into kana units (with combos) -> list of (kana, romaji)"""
    out = []; i = 0; s = name
    while i < len(s):
        c = s[i]; nx = s[i+1] if i+1 < len(s) else ''
        if c in K and nx in SMALL_Y and c not in SMALL_Y:
            base = K[c]
            r = (base[:-1] if base.endswith('i') else base) + ('' if base in ('shi','chi','ji') else 'y') + SMALL_Y[nx] if base not in ('shi','chi','ji') else base[:-1] + SMALL_Y[nx]
            if base in ('shi','chi','ji'): r = base[:-1] + SMALL_Y[nx]
            else: r = base[:-1] + 'y' + SMALL_Y[nx]
            out.append([c+nx, r]); i += 2; continue
        if c in K and nx in SMALL_V and c not in SMALL_V:
            base = K[c]; cons = base[:-1] if len(base) > 1 else base
            if c == 'ウ': cons = 'w'
            if c == 'ヴ': cons = 'v'
            if c in ('テ','デ') and nx == 'ィ': r = ('t' if c=='テ' else 'd') + 'i'
            elif c in ('ト','ド') and nx == 'ゥ': r = ('t' if c=='ト' else 'd') + 'u'
            elif c == 'フ': r = 'f' + SMALL_V[nx]
            elif c in ('シ','ジ','チ') and nx == 'ェ': r = {'シ':'she','ジ':'je','チ':'che'}[c]
            elif c == 'ツ': r = 'ts' + SMALL_V[nx]
            else: r = cons + SMALL_V[nx]
            out.append([c+nx, r]); i += 2; continue
        if c == 'ッ':
            out.append([c, '(double)']); i += 1; continue
        if c == 'ー':
            out.append([c, '(long)']); i += 1; continue
        if c in K: out.append([c, K[c]]); i += 1; continue
        out.append([c, None]); i += 1
    return out
def romaji(name):
    us = units(name); r = ''
    for j, (k, v) in enumerate(us):
        if v == '(double)':
            nxt = us[j+1][1] if j+1 < len(us) and us[j+1][1] else ''
            r += ('t' if nxt.startswith('ch') else nxt[:1]) if nxt else ''
        elif v == '(long)':
            if r and r[-1] in MAC: r = r[:-1] + MAC[r[-1]]
        elif v is None:
            r += {'♀':' ♀','♂':' ♂','・':' ','：':': '}.get(k, k)
        else:
            if v == 'n' and False: pass
            if r.endswith('n') and v[0] in 'aiueoy' and k != 'ン' and len(us)>j and us[j-1][0]=='ン': r += "'"
            if k == 'ウ' and r and r[-1] in 'ou' and j > 0 and us[j-1][1] not in (None, '(long)', '(double)'):
                r = r[:-1] + MAC[r[-1]]; continue
            r += v
    r = unicodedata.normalize('NFKC', r)
    return r[:1].upper() + r[1:]
# ---------- read Japanese pages ----------
mons = []
for f in glob.glob(ROOT + 'p/*.html'):
    s = open(f, encoding='utf-8').read()
    m = re.search(r'<blockquote class="pk-text" lang="en">(.*?)</blockquote>', s, re.S)
    if not m or 'class="pk-hero-img"' not in s: continue
    key = f.split('/')[-1][:-5]
    no = int(re.search(r'No\.(\d+)', s).group(1))
    jn = html.unescape(re.search(r'<img src="../pokemon_sprites/[^"]+" alt="([^"]+)"', s).group(1))
    en = html.unescape(re.search(r'<span class="en-name" lang="en">(.*?)</span>', s).group(1))
    gen = re.search(r'href="gen(\d)\.html"', s).group(1)
    ja = html.unescape(re.search(r'<p class="pk-ja">(.*?)</p>', s, re.S).group(1))
    sprite = re.search(r'<img src="../pokemon_sprites/([^"]+)"', s).group(1)
    mons.append(dict(key=key, no=no, jn=jn, en=en, gen=gen, text=html.unescape(m.group(1)), ja=ja, sprite=sprite))
mons.sort(key=lambda x: (x['no'], x['key']))
for x in mons: x['ro'] = romaji(x['jn'])
X_HANDLE = ''  # 英語版のXアカウント（@なし）
GENN = {'1':'Kanto','2':'Johto','3':'Hoenn','4':'Sinnoh','5':'Unova','6':'Kalos','7':'Alola','8':'Galar','9':'Paldea'}
GA = '<script async src="https://www.googletagmanager.com/gtag/js?id=G-2S81YX6L53"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag(\'js\',new Date());gtag(\'config\',\'G-2S81YX6L53\');</script>'
ADS = '<meta name="google-adsense-account" content="ca-pub-4829093383068106">\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4829093383068106" crossorigin="anonymous"></script>'
CSS = '''<style>
.kana{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.kana .u{display:flex;flex-direction:column;align-items:center;min-width:64px;padding:10px 8px;border-radius:14px;background:#fff7ed;border:2px solid #fed7aa}
.kana .u b{font-size:34px;line-height:1.1;font-family:"Noto Sans JP",sans-serif}.kana .u span{font-size:14px;color:#9a3412;font-weight:700;margin-top:4px}
.kana .u.sp{background:#eef2ff;border-color:#c7d2fe}.kana .u.sp span{color:#4338ca}
.big-jp{font-size:44px;font-weight:900;margin:0;line-height:1.2}.ro{font-size:22px;color:#475569;margin:2px 0 0}
.note{font-size:14px;color:#475569;line-height:1.7}.ja-text{font-size:18px;line-height:1.9}
.chart{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.chart a,.chart div{display:flex;flex-direction:column;align-items:center;padding:8px 2px;border-radius:10px;background:#f8fafc;text-decoration:none;color:inherit}
.chart b{font-size:26px}.chart small{font-size:12px;color:#64748b}.chart i{font-style:normal;font-size:11px;color:#2563eb}
.mlist{columns:3 220px;column-gap:24px}.mlist a{display:block;padding:3px 0;text-decoration:none}.mlist a small{color:#64748b}
</style>'''
def page(path, title, desc, canon, body, depth, ja_alt=None, extra_head=''):
    up = '../' * depth
    XNAV = f'<a class="tn-x" href="https://x.com/{X_HANDLE}" target="_blank" rel="noopener">𝕏 Follow</a>' if X_HANDLE else ''
    alt = ''
    if ja_alt:
        alt = f'<link rel="alternate" hreflang="en" href="{canon}"><link rel="alternate" hreflang="ja" href="{ja_alt}">'
    h = f'''<!DOCTYPE html><html lang="en"><head>{GA}<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(title)}</title><meta name="description" content="{E(desc)}">
<link rel="canonical" href="{canon}">{alt}<link rel="icon" type="image/png" href="{up}favicon.png">
<meta property="og:type" content="article"><meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(desc)}"><meta property="og:url" content="{canon}"><meta property="og:image" content="https://poketango.com/ogp-en.png"><meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="{up}theme.css">{CSS}{ADS}{extra_head}
</head><body class="pkpage"><nav class="topnav"><a class="brand" href="{up}en/"><img class="brand-logo-en" src="{up}logo-en.svg" alt="PokeTango" width="130" height="30"></a><div class="tn-links"><a href="{up}en/learn/">Lessons</a><a href="{up}en/chart.html">Chart</a><a href="{up}en/quiz.html">Quiz</a><a href="{up}en/list.html">List</a><a href="{up}" lang="ja">日本語</a>{XNAV}</div></nav>
<main class="pkwrap">{body}</main><script src="{up}en/shop.js?v=1" defer></script>
<footer class="note" style="text-align:center;padding:24px 16px">Unofficial fan-made learning site. As an Amazon Associate, this site earns from qualifying purchases. Pokémon names, images and Pokédex text © Nintendo / Creatures Inc. / GAME FREAK inc. / The Pokémon Company.<br><a href="{up}policy.html">Operator &amp; privacy policy (Japanese)</a></footer></body></html>'''
    open(ROOT + path, 'w', encoding='utf-8').write(h)
def kana_html(name):
    out = ''
    for k, v in units(name):
        if v is None: continue
        sp = ' sp' if v in ('(double)', '(long)') else ''
        lab = {'(double)': 'double next', '(long)': 'long vowel'}.get(v, v)
        out += f'<div class="u{sp}"><b lang="ja">{E(k)}</b><span>{E(lab)}</span></div>'
    return out
# ---------- per Pokémon ----------
by_no = {x['key']: i for i, x in enumerate(mons)}
for i, x in enumerate(mons):
    prev = mons[i-1] if i > 0 else None; nxt = mons[i+1] if i+1 < len(mons) else None
    canon = f'https://poketango.com/en/p/{x["key"]}.html'
    hard = sorted({k for k, v in units(x['jn']) if v in ('(double)', '(long)') or len(k) == 2})
    tips = []
    if any(v == '(long)' for _, v in units(x['jn'])): tips.append('<b lang="ja">ー</b> is a long-vowel mark: it stretches the vowel before it (in romaji it is shown with a bar, like ō).')
    if any(v == '(double)' for _, v in units(x['jn'])): tips.append('The small <b lang="ja">ッ</b> doubles the next consonant, making a tiny pause (like the "tt" in "Pikka").')
    if any(len(k) == 2 for k, _ in units(x['jn'])): tips.append('A big kana followed by a small <b lang="ja">ャ ュ ョ</b> or <b lang="ja">ァ ィ ゥ ェ ォ</b> is read together as one sound.')
    body = f'''<section class="pk-hero"><div class="pk-hero-img"><img src="../../pokemon_sprites/{E(x['sprite'])}" alt="{E(x['en'])}" width="120" height="120"></div>
<div class="pk-hero-txt"><p class="pk-badges"><span class="badge">No.{x['no']:03d}</span><span class="badge gen">Gen {x['gen']} ({GENN.get(x['gen'],'')})</span></p>
<h1 class="pk-jn" style="font-size:20px">{E(x['en'])} in Japanese</h1><p class="big-jp" lang="ja">{E(x['jn'])}</p><p class="ro">{E(x['ro'])} <button class="say" aria-label="Listen" onclick="sayJa('{E(x['jn'])}')">🔊</button></p></div></section>
<section class="card"><h2>✍️ Read the name kana by kana</h2><div class="kana">{kana_html(x['jn'])}</div>{''.join('<p class="note">💡 '+t+'</p>' for t in tips)}
<p class="note">Japanese Pokémon names are written in <b>katakana</b>, the script used for foreign words and names. Learn the {len([1 for _,v in units(x['jn']) if v])} characters above and you can read “{E(x['jn'])}” yourself!</p></section>
<section class="card"><h2>📖 Pokédex entry in English and Japanese</h2><blockquote class="pk-text" lang="en">{E(x['text'])}</blockquote><p class="ja-text" lang="ja">{E(x['ja'])}</p>
<p class="note">The Japanese text is a translation of the English entry, written with kanji, hiragana and katakana. Try to spot the katakana words!</p>
<div class="row"><button class="chip-btn" onclick="sayJa(document.querySelector('.ja-text').textContent)">🔊 Listen in Japanese</button></div></section>
<section class="card"><p><a href="../learn/">📘 Free katakana lessons with Pokémon →</a></p><p><a href="../quiz.html">🎯 Test yourself: Pokémon katakana quiz →</a></p><p><a href="../chart.html">🔤 Full katakana chart with Pokémon examples →</a></p><p><a href="../../p/{x['key']}.html" lang="ja">日本語のページ（英語版図鑑の日本語訳・英単語）→</a></p></section>
<nav class="pnav">{f'<a href="{prev["key"]}.html">← {E(prev["en"])}</a>' if prev else '<span></span>'}<a href="../list.html">All</a>{f'<a href="{nxt["key"]}.html">{E(nxt["en"])} →</a>' if nxt else '<span></span>'}</nav>
<script>function sayJa(t){{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';u.rate=.8;speechSynthesis.speak(u)}}</script>'''
    page(f'en/p/{x["key"]}.html', f'{x["en"]} in Japanese: {x["jn"]} ({x["ro"]}) – Katakana, Romaji & Pokédex',
         f'How to write and read {x["en"]} in Japanese: {x["jn"]} ({x["ro"]}). Learn each katakana character, hear the pronunciation, and compare the English and Japanese Pokédex entries.',
         canon, body, 2, ja_alt=f'https://poketango.com/p/{x["key"]}.html')
# ---------- list ----------
body = '<section class="list-hero"><h1>All Pokémon names in Japanese</h1><p>' + str(len(mons)) + ' Pokémon with katakana and romaji</p></section>'
for g in sorted({x['gen'] for x in mons}):
    body += f'<section class="card"><h2 id="gen{g}">Generation {g} – {GENN.get(g,"")}</h2><div class="mlist">' + ''.join(f'<a href="p/{x["key"]}.html">{E(x["en"])} <span lang="ja">{E(x["jn"])}</span> <small>{E(x["ro"])}</small></a>' for x in mons if x['gen'] == g) + '</div></section>'
page('en/list.html', 'All Pokémon Names in Japanese – Katakana & Romaji List', f'A list of {len(mons)} Pokémon names in Japanese katakana with romaji readings, sorted by generation. Click any Pokémon to learn to read its name kana by kana.', 'https://poketango.com/en/list.html', body, 1)
# ---------- katakana chart with examples ----------
ex = {}
for x in mons:
    first = units(x['jn'])[0][0] if units(x['jn']) else ''
    if first and first not in ex: ex[first] = x
ROWS = ['アイウエオ','カキクケコ','サシスセソ','タチツテト','ナニヌネノ','ハヒフヘホ','マミムメモ','ヤ　ユ　ヨ','ラリルレロ','ワ　　　ヲ','ン　　　　','ガギグゲゴ','ザジズゼゾ','ダヂヅデド','バビブベボ','パピプペポ']
cells = ''
for row in ROWS:
    for c in row:
        if c == '　': cells += '<div></div>'; continue
        e = ex.get(c)
        if e: cells += f'<a href="p/{e["key"]}.html"><b lang="ja">{c}</b><small>{K[c]}</small><i>{E(e["en"])}</i></a>'
        else: cells += f'<div><b lang="ja">{c}</b><small>{K[c]}</small></div>'
body = f'<section class="list-hero"><h1>Katakana Chart with Pokémon</h1><p>Every katakana, with a Pokémon whose name starts with it</p></section><section class="card"><p class="note">Tap a character to see a Pokémon whose Japanese name begins with it. The blue name under each kana is that Pokémon in English.</p><div class="chart">{cells}</div></section><section class="card"><h2>Special marks</h2><div class="kana"><div class="u sp"><b lang="ja">ー</b><span>long vowel</span></div><div class="u sp"><b lang="ja">ッ</b><span>double next</span></div><div class="u"><b lang="ja">ャ</b><span>small ya</span></div><div class="u"><b lang="ja">ュ</b><span>small yu</span></div><div class="u"><b lang="ja">ョ</b><span>small yo</span></div></div><p class="note">Example: <a href="p/pikachu.html" lang="ja">ピカチュウ</a> = pi・ka・chu・u. The small ュ joins with チ to make “chu”.</p><p><a href="quiz.html">🎯 Practice with the katakana quiz →</a></p></section>'
page('en/chart.html', 'Katakana Chart with Pokémon Examples – Learn Japanese', 'A complete katakana chart where every character comes with a Pokémon whose Japanese name starts with it. A fun way for Pokémon fans to learn Japanese.', 'https://poketango.com/en/chart.html', body, 1)
# ---------- lessons ----------
LESSONS = [
 ('Vowels', 'アイウエオ', 'Every Japanese sound is built on five vowels: a, i, u, e, o.'),
 ('K and G', 'カキクケコガギグゲゴ', 'Add two small marks (゛, called dakuten) to a K-kana and it becomes a G sound.'),
 ('S and Z', 'サシスセソザジズゼゾ', 'Note シ is “shi”, not “si”. With dakuten the S-row becomes Z, and ジ is “ji”.'),
 ('T and D', 'タチツテトダヂヅデド', 'チ is “chi” and ツ is “tsu”. ヂ and ヅ are rare and sound like ジ and ズ.'),
 ('N', 'ナニヌネノ', 'A short row, but it appears in lots of Pokémon names.'),
 ('H, B and P', 'ハヒフヘホバビブベボパピプペポ', 'フ is “fu”. Dakuten (゛) turns H into B, and the small circle (゜, handakuten) turns H into P – like ピ in ピカチュウ.'),
 ('M', 'マミムメモ', 'The M-row. Look for it in names like ミュウ (Mew).'),
 ('Y and small ャュョ', 'ヤユヨャュョ', 'Small ャ ュ ョ after an “i” kana make one combined sound: キ+ャ = kya, チ+ュ = chu.'),
 ('R', 'ラリルレロ', 'Japanese R is between an English R and L. ラ ra, リ ri, ル ru, レ re, ロ ro.'),
 ('W, N and special marks', 'ワヲンーッ', 'ン is a stand-alone “n”. ー makes the vowel long, and a small ッ doubles the next consonant.'),
 ('Foreign sounds', 'ァィゥェォヴヮ', 'Small ァィゥェォ create sounds that Japanese borrowed from other languages, like フィ “fi” or ティ “ti”.'),
]
learned = []; acc = set()
for i, (t, ks, _) in enumerate(LESSONS):
    acc |= set(ks); learned.append(set(acc))
def lesson_of(name):
    chars = set(c for c in name if c in K or c in 'ーッ')
    if any(c not in K and c not in 'ーッ' for c in name if not c.isspace()): return None
    for i, st in enumerate(learned):
        if chars <= st: return i + 1
    return None
for x in mons: x['lesson'] = lesson_of(x['jn'])
def kanacell(c):
    r = K.get(c, {'ー': 'long', 'ッ': 'double'}.get(c, ''))
    sp = ' sp' if c in 'ーッ' else ''
    return f'<div class="u{sp}"><b lang="ja">{c}</b><span>{r}</span></div>'
lnav = '<div class="lvtabs" style="display:flex;flex-wrap:wrap;gap:6px">' + ''.join(f'<a href="lesson-{i+1}.html" style="padding:5px 10px;border-radius:99px;background:#eef2ff;color:#4338ca;font-weight:700;text-decoration:none">{i+1}</a>' for i in range(len(LESSONS))) + '</div>'
for i, (t, ks, tip) in enumerate(LESSONS):
    n = i + 1
    new = [x for x in mons if x['lesson'] == n]
    allr = [x for x in mons if x['lesson'] and x['lesson'] <= n]
    new.sort(key=lambda x: (len(x['jn']), x['no']))
    shown = new[:40]
    body = f'<section class="list-hero"><h1>Lesson {n}: {E(t)}</h1><p>Learn katakana with Pokémon' + (f' · {len(allr)} Pokémon names you can read after this lesson' if allr else ' · the foundation for every name') + '</p></section>'
    body += f'<section class="card"><h2>New katakana</h2><div class="kana">{"".join(kanacell(c) for c in ks)}</div><p class="note">💡 {E(tip)}</p><div class="row"><button class="chip-btn" onclick="sayJa(\'{"、".join(c for c in ks if c in K and c not in "ャュョァィゥェォヮ")}\')">🔊 Listen to this row</button></div></section>'
    if shown:
        body += '<section class="card"><h2>Pokémon you can now read</h2><p class="note">These names use only the katakana from lessons 1–' + str(n) + '. Try reading them before looking at the romaji!</p><div class="mlist">' + ''.join(f'<a href="../p/{x["key"]}.html"><span lang="ja" style="font-size:20px">{E(x["jn"])}</span> <small>{E(x["ro"])} · {E(x["en"])}</small></a>' for x in shown) + '</div>' + (f'<p class="note">…and {len(new)-len(shown)} more.</p>' if len(new) > len(shown) else '') + '</section>'
    body += f'<section class="card"><p class="cta-grid"><a class="cta green" href="../quiz.html?lesson={n}">🎯 ' + (f'Quiz: lessons 1–{n}' if n > 1 else 'Quiz: lesson 1') + '</a> ' + (f'<a class="cta blue" href="lesson-{n+1}.html">Next lesson →</a>' if n < len(LESSONS) else '<a class="cta blue" href="../list.html">All Pokémon →</a>') + f'</p>{lnav}</section>'
    body += "<script>function sayJa(t){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';u.rate=.7;speechSynthesis.speak(u)}</script>"
    page(f'en/learn/lesson-{n}.html', f'Katakana Lesson {n}: {t} – Learn Japanese with Pokémon', f'Katakana lesson {n} ({t}): learn {len(ks)} katakana and read {len(allr)} Pokémon names in Japanese. Free lessons with audio and a quiz.', f'https://poketango.com/en/learn/lesson-{n}.html', body, 2)
body = '<section class="list-hero"><h1>Learn Katakana with Pokémon</h1><p>11 short lessons · read every Pokémon name by the end</p></section><section class="card"><p>Each lesson teaches a few katakana and then shows the Pokémon names you can already read. By lesson 11 you can read all of them.</p><ol>' + ''.join(f'<li style="margin:6px 0"><a href="lesson-{i+1}.html"><b>{E(t)}</b></a> <span lang="ja">{E(ks)}</span> <small>· {len([x for x in mons if x["lesson"] and x["lesson"] <= i+1])} names readable</small></li>' for i, (t, ks, _) in enumerate(LESSONS)) + '</ol></section>'
page('en/learn/index.html', 'Learn Katakana with Pokémon – 11 Free Lessons', 'Free katakana course for Pokémon fans: 11 short lessons with audio, each unlocking more Pokémon names you can read in Japanese.', 'https://poketango.com/en/learn/', body, 2)

# ---------- quiz ----------
qd = [[x['key'], x['en'], x['jn'], x['ro'], x['sprite'], int(x['gen']), x['lesson'] or 99] for x in mons if all(v for _, v in units(x['jn']))]
json.dump(qd, open(ROOT + 'en/quiz.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
body = '''<section class="list-hero"><h1>Pokémon Katakana Quiz</h1><p>Read the Japanese name – which Pokémon is it?</p></section>
<section class="card" id="qbox"><div class="row" style="gap:8px;flex-wrap:wrap"><label>Mode <select id="mode"><option value="en">Katakana → English name</option><option value="ro">Katakana → romaji</option><option value="type">Type the romaji</option></select></label><label>Generation <select id="gen"><option value="1">Gen 1 (easiest)</option><option value="0">All generations</option></select></label><label>Lesson <select id="les"><option value="99">Any</option>'+''.join(f'<option value="{i}">1–{i}</option>' for i in range(1,12))+'</select></label></div>
<p class="big-jp" id="q" lang="ja" style="text-align:center;margin:18px 0 6px"></p><p style="text-align:center"><button class="chip-btn" id="hint">💡 Hint (sprite)</button> <button class="chip-btn" id="say">🔊 Listen</button></p><p style="text-align:center"><img id="sp" alt="" width="96" height="96" style="visibility:hidden"></p>
<div id="opts" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div><p id="res" style="text-align:center;font-weight:700;min-height:1.5em"></p><p style="text-align:center">Score <b id="sc">0</b> / <b id="tot">0</b> · Streak <b id="st">0</b></p></section>
<section class="card"><p class="note">Don’t know katakana yet? Start with the <a href="chart.html">katakana chart</a>. Each wrong answer shows the Pokémon so you learn as you go.</p></section>
<style>#opts button{font-size:18px;padding:14px;border-radius:14px;border:2px solid #cbd5e1;background:#fff;cursor:pointer}#opts button.ok{background:#dcfce7;border-color:#22c55e}#opts button.ng{background:#fee2e2;border-color:#ef4444}</style>
<script>let D=[],cur=null,sc=0,tot=0,st=0;const $=i=>document.getElementById(i);
function pool(){const g=+$("gen").value,l=+$("les").value;let P=g?D.filter(x=>x[5]===g):D;if(l<99){P=D.filter(x=>x[6]<=l)}return P.length>=4?P:D}
const norm=t=>t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z]/g,"");
function sayJa(t){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang="ja-JP";u.rate=.8;speechSynthesis.speak(u)}
function next(){const P=pool();cur=P[Math.floor(Math.random()*P.length)];const m=$("mode").value,idx=m==="en"?1:3;let c=[cur];while(c.length<4){const r=P[Math.floor(Math.random()*P.length)];if(!c.includes(r))c.push(r)}c.sort(()=>Math.random()-.5);
$("q").textContent=cur[2];$("sp").style.visibility="hidden";$("sp").src="../pokemon_sprites/"+cur[4];$("res").textContent="";
$("opts").innerHTML="";if(m==="type"){$("opts").innerHTML='<input id="ti" autocomplete="off" placeholder="type romaji, e.g. pikachuu" style="grid-column:1/3;font-size:20px;padding:12px;border-radius:12px;border:2px solid #cbd5e1"><button id="tb" style="grid-column:1/3">Check</button>';const go=()=>{const v=norm($("ti").value),a=norm(cur[3]),b2=a.replace(/(.)\1/g,"$1");typed(v===a||v===b2||norm(cur[3].replace(/ā/g,"aa").replace(/ī/g,"ii").replace(/ū/g,"uu").replace(/ē/g,"ee").replace(/ō/g,"ou"))===v||norm(cur[3].replace(/ō/g,"oo"))===v)};$("tb").onclick=go;$("ti").onkeydown=e=>{if(e.key==="Enter")go()};$("ti").focus();return}c.forEach(o=>{const b=document.createElement("button");b.textContent=o[idx];b.onclick=()=>ans(b,o,c,idx);$("opts").appendChild(b)})}
function ans(b,o,c,idx){if($("res").textContent)return;tot++;const ok=o===cur;if(ok){sc++;st++;b.classList.add("ok");$("res").textContent="✅ Correct! "+cur[2]+" = "+cur[3]}else{st=0;b.classList.add("ng");[...$("opts").children].forEach(x=>{if(x.textContent===cur[idx])x.classList.add("ok")});$("res").innerHTML="❌ It was "+cur[1]+" ("+cur[3]+") · <a href=\\"p/"+cur[0]+".html\\">learn this name</a>"}
$("sp").style.visibility="visible";$("sc").textContent=sc;$("tot").textContent=tot;$("st").textContent=st;sayJa(cur[2]);setTimeout(next,ok?1300:3200)}
function typed(ok){if($("res").textContent)return;tot++;if(ok){sc++;st++;$("res").textContent="✅ Correct! "+cur[2]+" = "+cur[3]+" ("+cur[1]+")"}else{st=0;$("res").innerHTML="❌ "+cur[2]+" = "+cur[3]+" ("+cur[1]+") · <a href=\\"p/"+cur[0]+".html\\">learn it</a>"}$("sp").style.visibility="visible";$("sc").textContent=sc;$("tot").textContent=tot;$("st").textContent=st;sayJa(cur[2]);setTimeout(next,ok?1500:3500)}
const qs=new URLSearchParams(location.search);if(qs.get("lesson")){$("les").value=qs.get("lesson");$("gen").value="0"}$("les").onchange=next;
$("hint").onclick=()=>$("sp").style.visibility="visible";$("say").onclick=()=>sayJa(cur[2]);$("mode").onchange=next;$("gen").onchange=next;
fetch("quiz.json").then(r=>r.json()).then(d=>{D=d;next()});</script>'''
page('en/quiz.html', 'Pokémon Katakana Quiz – Learn to Read Japanese with Pokémon', 'A free quiz: read Pokémon names written in Japanese katakana and pick the right Pokémon. Great practice for beginners learning Japanese.', 'https://poketango.com/en/quiz.html', body, 1)
# ---------- top ----------
pick = [x for x in mons if x['key'] in ('pikachu','charmander','eevee','gengar','snorlax','bulbasaur','squirtle','jigglypuff','mewtwo','lucario','greninja','sprigatito')]
FOLLOW = (f'<section class="card follow-x"><div><h2 style="margin:0 0 4px">Daily katakana on 𝕏</h2><p class="note" style="margin:0">One Pokémon name a day, read kana by kana. Plus fun facts you only learn from the Japanese names.</p></div><a class="xbtn" href="https://x.com/{X_HANDLE}" target="_blank" rel="noopener">Follow @{X_HANDLE}</a></section>' if X_HANDLE else '')
body = f'''<section class="en-hero"><img class="hero-logo" src="../logo-en.svg" alt="PokeTango" width="420" height="97">
<h1>Learn Japanese Katakana with Pokémon</h1><p>Read all {len(mons)} Pokémon names in Japanese – free, no sign-up</p>
<div class="float-kana" lang="ja"><span>ピ<small>pi</small></span><span>カ<small>ka</small></span><span>チュ<small>chu</small></span><span>ウ<small>u</small></span></div></section>
<section class="card"><p>In Japan, Pokémon have different names, written in <b>katakana</b>. Pikachu is <b lang="ja">ピカチュウ</b>, Charmander is <b lang="ja">ヒトカゲ</b> (Hitokage). If you love Pokémon, their names are the most fun way to learn to read Japanese.</p>
<div class="cta-grid"><a class="cta green" href="learn/">📘 Start lesson 1</a><a class="cta blue" href="quiz.html">🎯 Take the quiz</a><a class="cta orange" href="chart.html">🔤 Katakana chart</a><a class="cta purple" href="list.html">📚 All Pokémon</a></div></section>
<section class="card" id="potd-card" hidden><h2>🌟 Pokémon of the day</h2><div class="potd"><img id="potd-img" alt="" width="96" height="96"><div><p class="jp" id="potd-jp" lang="ja"></p><p class="ro" id="potd-ro"></p><a class="more" id="potd-a" href="#">Learn to read this name →</a></div></div></section>
<script>fetch("quiz.json").then(r=>r.json()).then(d=>{{const t=new Date(),n=(t.getFullYear()*372+t.getMonth()*31+t.getDate())%d.length,x=d[n];
document.getElementById("potd-img").src="../pokemon_sprites/"+x[4];document.getElementById("potd-img").alt=x[1];document.getElementById("potd-jp").textContent=x[2];
document.getElementById("potd-ro").textContent=x[3]+" = "+x[1];document.getElementById("potd-a").href="p/"+x[0]+".html";document.getElementById("potd-card").hidden=false}}).catch(()=>{{}})</script>
<section class="card"><h2>Popular Pokémon in Japanese</h2><div class="mlist">{''.join(f'<a href="p/{x["key"]}.html">{E(x["en"])} <span lang="ja">{E(x["jn"])}</span> <small>{E(x["ro"])}</small></a>' for x in pick)}</div></section>
{FOLLOW}
<section class="card"><h2>How it works</h2><p class="note">Each Pokémon page breaks the Japanese name into single katakana with romaji, lets you hear it read aloud, and shows the Pokédex entry in both English and Japanese. Made by a Japanese Pokémon fan who runs a site for Japanese kids learning English with the Pokédex.</p></section>'''
page('en/index.html', 'Learn Japanese Katakana with Pokémon – Pokémon Names in Japanese', f'Learn to read Japanese katakana with {len(mons)} Pokémon names. Romaji, audio, a katakana chart with Pokémon examples, and a free quiz.', 'https://poketango.com/en/', body, 1)
print(len(mons), len(qd))
for k in ['pikachu','charizard','mr-mime','nidoran-f','porygon2','type-null','farfetchd','chien-pao','ho-oh','flabebe','jangmo-o']:
    x = next((m for m in mons if m['key'] == k), None)
    if x: print(k, x['jn'], x['ro'])
