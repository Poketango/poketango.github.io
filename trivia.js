// =========================================================
// ポケモンごとの豆知識（trivia.js）
// ・開発の裏話、名前の由来、種族値で特に変わっている点（あるポケモンだけ）を出す
//   （順位などは、このサイトの種族値データ 1025匹分 をもとに計算）
// ・出典として、各ポケモンの種族値が載っている Pokémon Database のページを示す
// ・練習モードと図鑑モードの、レーダーチャートの下に表示する
// =========================================================
(function () {
    const STAT_JA = {
        "hp": "HP", "attack": "こうげき", "defense": "ぼうぎょ",
        "special-attack": "とくこう", "special-defense": "とくぼう", "speed": "すばやさ"
    };
    const STAT_KEYS = Object.keys(STAT_JA);

    // Pokémon Database のページ名に合わせる
    function dbSlug(name) {
        const fix = { "nidoranf": "nidoran-f", "nidoranm": "nidoran-m", "mime jr.": "mime-jr", "mr. mime": "mr-mime", "mr. rime": "mr-rime" };
        if (fix[name]) return fix[name];
        return name.replace(/[.']/g, "").replace(/\s+/g, "-");
    }

    let origins = null, backs = {};
    fetch("backstories.json").then(r => r.json()).then(j => { backs = j; if (window.__triviaRefresh) window.__triviaRefresh(); }).catch(() => {});
    fetch("name_origins.json").then(r => r.json()).then(j => { origins = j; if (window.__triviaRefresh) window.__triviaRefresh(); }).catch(() => { origins = {}; });

    let cache = null;
    function table() {
        if (cache) return cache;
        const S = (typeof pokedexStats === "object") ? pokedexStats : null;
        if (!S || !Object.keys(S).length) return null;
        const rows = Object.keys(S).map(n => {
            const s = S[n];
            const total = STAT_KEYS.reduce((a, k) => a + (s[k] || 0), 0);
            return { n, s, total, id: parseInt(s.id, 10) };
        });
        // 順位（同じ値は同じ順位）
        const rankOf = (vals, v) => 1 + vals.filter(x => x > v).length;
        const totals = rows.map(r => r.total);
        const per = {};
        STAT_KEYS.forEach(k => per[k] = rows.map(r => r.s[k] || 0));
        cache = { rows, byName: Object.fromEntries(rows.map(r => [r.n, r])), totals, per, rankOf, N: rows.length };
        return cache;
    }

    // 特徴のある種族値だけを拾う（極端に高い・低い、配分が極端、全部同じ、ほかのポケモンと完全一致）
    function factsFor(name) {
        const T = table();
        if (!T || !T.byName[name]) return null;
        const r = T.byName[name], s = r.s;
        const jpOf = n => (typeof jpNameMap === "object" && jpNameMap[n]) || n;
        const jp = jpOf(name);
        const out = []; // [優先度, 文]
        const keys = STAT_KEYS.concat(["total"]);
        const val = (x, k) => k === "total" ? x.total : (x.s[k] || 0);
        const label = k => k === "total" ? "種族値の合計" : "「" + STAT_JA[k] + "」";
        keys.forEach(k => {
            const v = val(r, k);
            const higher = T.rows.filter(x => val(x, k) > v).length;
            const lower = T.rows.filter(x => val(x, k) < v).length;
            const same = T.rows.filter(x => val(x, k) === v).length - 1;
            if (higher < 10) {
                const head = higher === 0 ? (same ? "トップタイ" : "単独トップ") : `${higher + 1}位${same ? "（同率あり）" : ""}`;
                out.push([higher === 0 ? 0 : 3, `${label(k)}の ${v} は、全${T.N}匹の中で${head}。`]);
            } else if (lower < 10) {
                const head = lower === 0 ? (same ? "最低タイ" : "ただ1匹の最低値") : `下から${lower + 1}番目の低さ${same ? "（同率あり）" : ""}`;
                out.push([lower === 0 ? 1 : 4, `${label(k)}の ${v} は、全${T.N}匹の中で${head}。`]);
            }
        });
        const vs = STAT_KEYS.map(k => s[k] || 0);
        if (vs.every(v => v === vs[0])) {
            out.push([1, `6つの能力がすべて ${vs[0]} でそろっている、めずらしい横並びの配分だ。`]);
        } else {
            let mx = STAT_KEYS[0], mn = STAT_KEYS[0];
            STAT_KEYS.forEach(k => { if (s[k] > s[mx]) mx = k; if (s[k] < s[mn]) mn = k; });
            if (s[mn] > 0 && s[mx] / s[mn] >= 5) {
                const x = s[mx] / s[mn];
                out.push([x >= 10 ? 0 : 2, `いちばん高い「${STAT_JA[mx]}」${s[mx]} は、いちばん低い「${STAT_JA[mn]}」${s[mn]} の${x >= 10 ? "なんと" : "約"}${Math.round(x)}倍。能力の配分がかなり極端だ。`]);
            }
        }
        const sig = vs.join(",");
        const twins = T.rows.filter(x => x.n !== name && Math.abs(x.id - r.id) > 3 &&
            STAT_KEYS.map(k => x.s[k] || 0).join(",") === sig).map(x => jpOf(x.n));
        if (twins.length) out.push([1, `${twins.join("・")} とは、6つの種族値がひとつ残らず同じ。`]);
        if (!out.length) return null;
        out.sort((a, b) => a[0] - b[0]);
        return { facts: out.slice(0, 3).map(x => x[1]), src: "https://pokemondb.net/pokedex/" + dbSlug(name), srcLabel: "Pokémon Database（種族値）" };
    }

    function render(box, name) {
        const data = factsFor(name);
        const list = box.querySelector("ul");
        list.innerHTML = "";
        const bk = backs[name], backBox = box.querySelector(".trivia-back");
        if (bk) { backBox.style.display = ""; backBox.querySelector("p").textContent = bk.t; const ba = backBox.querySelector("a"); ba.href = bk.src;
            ba.textContent = /dic\.pixiv/.test(bk.src) ? "ピクシブ百科事典（余談）" : /pokemondb/.test(bk.src) ? "PokéBase（Pokémon Database のQ&A）" : /_beta$/.test(bk.src) ? "Bulbapedia（発売前・開発中の版の記事）" : "Bulbapedia（Trivia）"; }
        else backBox.style.display = "none";
        const o = origins && origins[name];
        const originBox = box.querySelector(".trivia-origin");
        if (o) {
            originBox.style.display = "";
            originBox.querySelector("p").textContent = o.t;
            const oa = originBox.querySelector("a");
            oa.href = o.src;
        } else {
            originBox.style.display = "none";
        }
        const statBox = box.querySelector(".trivia-stats");
        if (data) {
            statBox.style.display = "";
            data.facts.forEach(t => {
                const li = document.createElement("li");
                li.textContent = t;
                list.appendChild(li);
            });
            const a = box.querySelector(".stats-src a");
            a.href = data.src;
            a.textContent = data.srcLabel;
        } else statBox.style.display = "none";
        box.style.display = (bk || o || data) ? "" : "none";
    }

    function init() {
        const col = document.getElementById("chart-column");
        const img = document.getElementById("poke-img");
        if (!col || !img) return;

        const box = document.createElement("section");
        box.className = "trivia-box";
        box.innerHTML = `<h3>💡 このポケモンの豆知識</h3>
            <div class="trivia-back"><h4>🎬 開発の裏話</h4><p></p>
            <p class="trivia-src">出典：<a target="_blank" rel="noopener">Bulbapedia（Trivia）</a></p></div>
            <div class="trivia-origin"><h4>📛 名前の由来</h4><p></p>
            <p class="trivia-src">出典：<a target="_blank" rel="noopener">Bulbapedia（Name origin / In other languages）</a></p></div>
            <div class="trivia-stats"><h4>📊 種族値のここが変わってる</h4><ul></ul>
            <p class="trivia-src stats-src">出典：<a target="_blank" rel="noopener"></a>（順位はこのサイトの全1025匹分のデータで計算）</p></div>`;
        col.appendChild(box);
        box.style.display = "none";

        const update = () => {
            const m = (img.getAttribute("src") || "").match(/pokemon_sprites\/(.+)\.png/);
            if (!m) return;
            const name = decodeURIComponent(m[1]);
            // データの読み込みが終わるまで少し待つ
            let tries = 0;
            (function tryRender() {
                if (table() || tries > 40) { render(box, name); return; }
                tries++; setTimeout(tryRender, 150);
            })();
        };
        window.__triviaRefresh = update;
        new MutationObserver(update).observe(img, { attributes: true, attributeFilter: ["src"] });
        update();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
