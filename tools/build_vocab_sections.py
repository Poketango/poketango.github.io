import json, re, glob, html, sys
SP = '/tmp/claude-0/-home-claude/54bdb7d1-4a6b-5303-9309-667597b73246/scratchpad/'
ROOT = '/home/claude/gh/'
D = {}
for f in sorted(glob.glob(SP + 'dict/*.txt')):
    for line in open(f, encoding='utf-8'):
        line = line.strip()
        if not line: continue
        w, m, pos, lv = line.split('|')
        D[w] = (m, pos, lv)
need = json.load(open(SP + 'vocab_need.json'))['page']
POS = {'名': '名詞', '動': '動詞', '形': '形容詞', '副': '副詞', '前': '前置詞', '接': '接続詞', '代': '代名詞'}
LVORD = {'中1': 1, '中2': 2, '中3': 3, '高': 4, '大': 5}
LVNAME = {'中1': '中1', '中2': '中2', '中3': '中3', '高': '高校', '大': '大学'}
BASEV = set("""cry laugh grow fall feel move run fly sleep shake shine glow float sink freeze melt burn explode disappear vanish appear tremble shiver dance sing fight flee wake lose think believe want forget become look seem""".split())

def E(x): return html.escape(x, quote=False)

# grammar patterns: (regex, function(match)->html or None, priority)
G = []
def g(rx, fn, pr=1, flags=re.I):
    G.append((re.compile(rx, flags), fn, pr))

g(r"\b(it|they|this pok[ée]mon|\w+) (is|are) said to (\w+)", lambda m: f"<span lang=\"en\">{E(m.group(0))}</span> の「be said to + 動詞」は「〜すると言われている」という意味。図鑑でよく出てくる、うわさや言い伝えを伝える言い方です。", 5)
g(r"\bit is said that\b", lambda m: "<span lang=\"en\">It is said that 〜</span> は「〜と言われている」という決まった言い方です。it は「それ」とは訳さず、that 以下の内容を指します。", 5)
g(r"\b(is|are|was|were) (believed|thought|known|considered|rumored) to (be )?\w+", lambda m: f"<span lang=\"en\">{E(m.group(0))}</span> は「be + 過去分詞 + to」の形で「〜だと{ {'believed':'信じられている','thought':'考えられている','known':'知られている','considered':'考えられている','rumored':'うわさされている'}[m.group(2).lower()] }」という意味になります。", 5)
g(r"\bso (\w+) that\b", lambda m: f"<span lang=\"en\">so {E(m.group(1))} that 〜</span> は「とても{E(m.group(1))}なので〜」という意味。so のあとの形容詞や副詞が理由、that 以下が結果を表します。", 5)
g(r"\btoo (\w+) to (\w+)", lambda m: f"<span lang=\"en\">too {E(m.group(1))} to {E(m.group(2))}</span> は「〜すぎて…できない」という意味の決まった形です。", 5)
g(r"\b(\w+) enough to (\w+)", lambda m: (f"<span lang=\"en\">{E(m.group(1))} enough to {E(m.group(2))}</span> は「…するのに十分なほど〜」という意味。enough は形容詞のあとに置くのがポイントです。" if m.group(1).lower() not in ('not','is','are','long') else None), 4)
g(r"\bnot only\b.*?\bbut( also)?\b", lambda m: "<span lang=\"en\">not only A but (also) B</span> は「AだけでなくBも」という意味の決まった形です。", 5)
g(r"\bas (\w+) as\b", lambda m: (f"<span lang=\"en\">as {E(m.group(1))} as 〜</span> は「〜と同じくらい{E(m.group(1))}」という比べ方。2つのものが同じ程度であることを表します。" if m.group(1).lower() not in ('soon','well','long','far','much','many') else None), 4)
g(r"\bthe (\w+er) .{0,40}?, the (\w+er)\b", lambda m: f"<span lang=\"en\">the 比較級 〜, the 比較級 …</span> は「〜すればするほど、ますます…」という意味の形です。", 5)
g(r"\b(\w+er|more \w+) than\b", lambda m: (f"<span lang=\"en\">{E(m.group(1))} than 〜</span> は比較級の文で「〜よりも…」という意味。2つのものを比べるときに使います。" if m.group(1).lower() not in ('other','rather','never','ever','over','under','after','either','neither','whether','faster') or m.group(1).lower()=='faster' else None), 2)
g(r"\b(make|makes|made) (it|them|people|its \w+|their \w+|\w+) (\w+)\b", lambda m: (f"<span lang=\"en\">{E(m.group(0))}</span> は「make + 人・もの + 動詞の原形」で「〜に…させる」という意味です。" if m.group(3).lower() in BASEV else None), 4)
g(r"\b(lets?|letting) (it|them|\w+) (\w+)\b", lambda m: (f"<span lang=\"en\">{E(m.group(0))}</span> は「let + 人・もの + 動詞の原形」で「〜に…させてあげる、…させておく」という意味です。" if m.group(3).lower() in BASEV|{'see','go','live','rest','fly','escape'} else None), 4)
g(r"\b(allows?|enables?) (it|them|\w+) to (\w+)", lambda m: f"<span lang=\"en\">{E(m.group(0))}</span> は「{m.group(1).lower().rstrip('s')} + 人・もの + to 動詞」で「〜が…できるようにする」という意味です。", 4)
g(r"\bin order to (\w+)", lambda m: f"<span lang=\"en\">in order to {E(m.group(1))}</span> は「〜するために」と目的を表す言い方です。to だけより目的がはっきりします。", 4)
g(r"\bso that\b", lambda m: "<span lang=\"en\">so that 〜</span> は「〜するように、〜できるように」と目的を表す接続詞です。", 4)
g(r"\beven (if|though|when)\b", lambda m: f"<span lang=\"en\">even {m.group(1).lower()} 〜</span> は「たとえ〜でも」「〜なのに」という意味で、ふつうなら予想される結果とちがうことを表します。", 4)
g(r"\bused to (\w+)", lambda m: (f"<span lang=\"en\">used to {E(m.group(1))}</span> は「以前は〜していた(今はちがう)」という意味。be used to(〜に慣れている)とまちがえないように注意。" if m.group(1).lower() not in ('make','be','the','create','attack','catch','dig','help') and not re.search(r'\b(is|are|was|were|be) used to', m.string[max(0,m.start()-8):m.end()]) else None), 4)
g(r"\b(keeps?|kept) (\w+ing)\b", lambda m: f"<span lang=\"en\">{E(m.group(0))}</span> は「keep + 動詞のing形」で「〜し続ける」という意味です。", 3)
g(r"\b(seems?|appears?) to (be |have )?(\w+)", lambda m: f"<span lang=\"en\">{E(m.group(0))}</span> は「seem/appear to + 動詞」で「〜するように見える、〜らしい」という意味です。", 3)
g(r"\btends? to (\w+)", lambda m: f"<span lang=\"en\">{E(m.group(0))}</span> は「〜しがちである、〜する傾向がある」という意味です。", 3)
g(r"\b(is|are) able to (\w+)", lambda m: f"<span lang=\"en\">{E(m.group(0))}</span> は「be able to + 動詞」で「〜することができる」という意味。can とほぼ同じです。", 2)
g(r"\bwhen (it|they|its|this|\w+)\b", lambda m: "<span lang=\"en\">when 〜</span> は「〜するとき」という意味の接続詞。when のまとまりが、もう一方の文がいつ起こるかを表しています。", 1)
g(r"\bif (it|they|its|you|someone|anyone|\w+)\b", lambda m: "<span lang=\"en\">if 〜</span> は「もし〜ならば」という条件を表す接続詞です。", 1)
g(r"\b(which|who) (\w+)", lambda m: (f"<span lang=\"en\">{m.group(1).lower()}</span> は関係代名詞で、直前の名詞をくわしく説明するまとまりを作っています。{'人や生き物' if m.group(1).lower()=='who' else 'もの'}について説明するときに使います。" if m.start()>0 and m.string[m.start()-2]!='.' else None), 2)
g(r"\b(\w+ly) (\w+ed)\b", lambda m: None, 0)
g(r"\b(has|have) (been|\w+ed|\w+en) ", lambda m: (f"<span lang=\"en\">{E(m.group(0).strip())}</span> は「have/has + 過去分詞」の現在完了形。過去から今までの経験や継続、完了を表します。" if m.group(2).lower() not in ('often','even','seen ') else None), 3)
g(r"\b(is|are|was|were|be|been|being|get|gets) ([a-z]+ed|seen|known|found|thrown|eaten|made|born|built|taken|given|caught|struck|worn|hidden|drawn|blown|frozen|broken|shown|held|kept|told|said|bitten|stolen|sold) by\b", lambda m: f"<span lang=\"en\">{E(m.group(0))}</span> は受け身(受動態)の形で「〜によって…される」という意味です。", 3)
g(r"\b(\w+) (\w+ing) (on|in|at|from|with|around|inside|near) ", lambda m: None, 0)

g(r"\bby (\w+ing)\b", lambda m: f"<span lang=\"en\">by {E(m.group(1))}</span> は「by + 動詞のing形」で「〜することによって」と手段を表します。", 3)
g(r"\b(before|after|without|while|instead of|for|from) (\w+ing)\b", lambda m: (f"<span lang=\"en\">{E(m.group(0))}</span> は前置詞のあとに動詞のing形(動名詞)が続く形で、「{ {'before':'〜する前に','after':'〜したあとで','without':'〜せずに','while':'〜している間に','instead of':'〜するかわりに','for':'〜することに対して','from':'〜することから'}[m.group(1).lower()] }」という意味です。" if m.group(2).lower() not in ('nothing','something','anything','everything','morning','evening','spring','string','king','ring','wing','thing','building','clothing','lightning','offspring','ceiling') else None), 3)
g(r"\bbecause\b", lambda m: "<span lang=\"en\">because 〜</span> は「〜なので、〜だから」と理由を表す接続詞です。", 2)
g(r"\buntil\b", lambda m: "<span lang=\"en\">until 〜</span> は「〜するまで(ずっと)」という意味。その時点まで状態や動作が続くことを表します。", 2)
g(r"\b(have|has) long been\b", lambda m: f"<span lang=\"en\">{E(m.group(0))}</span> は現在完了形で「ずっと昔から〜である」という意味。long が「長い間」を表しています。", 4)
g(r"\b(tries|try|tried|wants|likes|loves|begins|began|starts|started|continues|attempts|plans|needs|refuses|learns|helps) to (\w+)", lambda m: f"<span lang=\"en\">{E(m.group(0))}</span> は「動詞 + to + 動詞の原形」の形で、to 以下が「〜すること」を表します。", 2)
g(r"\b(\w+ed|uses|use|eats) (\w+ ){0,3}to (\w+)", lambda m: (f"<span lang=\"en\">to {E(m.group(3))}</span> は「〜するために」と目的を表す不定詞です。" if m.group(3).lower() in BASEV|{'catch','protect','attract','find','keep','attack','scare','defend','hunt','escape','communicate','hide','show','store','absorb','warn','fight','lure','search','build','make','avoid','trap','capture','dig','charge','gather','heal','help','cool','warm','grow','survive','sense','release','create','strike','control','fly','swim','travel','see','hear','lift','break','cut','slice','pierce','burn','scare','intimidate','threaten','calm','soothe','mark','attract','court','ward'} else None), 2)
g(r"\bthe (\w+est|most \w+)\b", lambda m: (f"<span lang=\"en\">the {E(m.group(1))}</span> は最上級で「最も〜」という意味です。" if m.group(1).lower() not in ('rest','west','forest','nest','chest','interest','harvest','test','crest','request','quest','guest','priest','contest') else None), 2)
g(r"\b(can|could) (\w+)\b", lambda m: (f"<span lang=\"en\">{E(m.group(0))}</span> は「can + 動詞の原形」で「〜することができる」と能力を表します。" if m.group(2).lower() not in ('be','not','also','even','only','easily','still','often','sometimes') else None), 1)

g(r"\b(It|it|They|they) ([a-z]+(?<!s)s|[a-z]+es)\b", lambda m: (f"<span lang=\"en\">{E(m.group(0))}</span> は現在形。図鑑では、そのポケモンがふだんから繰り返している習性を現在形で表します。主語が it なので動詞に s がついています。" if m.group(1).lower()=='it' and m.group(2).lower() not in ('is','has','does','was','its','always','sometimes','also','often') else None), 0.5)

def grammar(text):
    found = []
    for rx, fn, pr in G:
        if pr == 0: continue
        if pr == 0.5 and found: continue
        m = rx.search(text)
        if not m: continue
        try: h = fn(m)
        except Exception: h = None
        if h: found.append((pr, m.start(), h))
    found.sort(key=lambda x: (-x[0], x[1]))
    out, seen = [], set()
    for pr, st, h in found:
        k = h[:30]
        if k in seen: continue
        seen.add(k); out.append(h)
        if len(out) == 2: break
    return out

def table(words):
    rows = []
    for w in words:
        if w not in D: continue
        m, pos, lv = D[w]
        if m == '-': continue
        rows.append((w, m, pos, lv))
    if len(rows) > 8:
        keep = sorted(rows, key=lambda r: -LVORD[r[3]])[:8]
        rows = [r for r in rows if r in keep]
    return rows

def section(name_ja, words, text):
    rows = table(words)
    gs = grammar(text)
    if len(rows) < 2 and not gs: return None
    h = '<section class="card" id="words"><h2><img class="hi" src="/home_icons/items/tm.png" alt="" width="28" height="28">この図鑑文に出てくる英単語</h2>\n'
    if rows:
        h += '<table class="vt"><tr><th>英単語</th><th>意味</th><th>品詞</th><th>レベル</th></tr>\n'
        for w, m, pos, lv in rows:
            cls = 'lv h' if lv in ('高', '大') else 'lv'
            h += f'<tr><td class="w" lang="en">{E(w)}</td><td>{E(m)}</td><td>{POS[pos]}</td><td><span class="{cls}">{LVNAME[lv]}</span></td></tr>\n'
        h += '</table>\n'
    if gs:
        h += '<p class="gram"><b>文法ポイント</b>　' + '<br>'.join(gs) + '</p>\n'
    h += '</section>\n'
    return h

if __name__ == '__main__':
    dry = '--dry' in sys.argv
    n = 0; nog = 0; sample = sys.argv[-1] if len(sys.argv) > 1 and not sys.argv[-1].startswith('--') else None
    for key, words in need.items():
        p = ROOT + 'p/' + key + '.html'
        s = open(p, encoding='utf-8').read()
        if 'id="words"' in s: continue
        text = html.unescape(re.search(r'<blockquote class="pk-text" lang="en">(.*?)</blockquote>', s, re.S).group(1))
        text = text.replace('’', "'")
        sec = section(key, words, text)
        if not sec: continue
        if not grammar(text): nog += 1
        if sample and key == sample: print(text); print(sec)
        if dry: n += 1; continue
        s = s.replace('<section class="card" id="origin">', sec + '<section class="card" id="origin">', 1) if 'id="origin"' in s else s.replace('<section class="card" id="stats">', sec + '<section class="card" id="stats">', 1)
        s = s.replace('<a href="#dex">図鑑</a>', '<a href="#dex">図鑑</a><a href="#words">単語</a>', 1)
        open(p, 'w', encoding='utf-8').write(s); n += 1
    print('pages', n, 'without grammar', nog)
