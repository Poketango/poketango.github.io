// =========================================================
// アフィリエイト広告（A8.net 経由）
// ---------------------------------------------------------
// 「広告ゾーン」は作らず、ページの空いている場所に自然に溶け込む形で置く。
// どの広告にも小さな「PR」表示を付ける（ステルスマーケティング規制への対応）。
// 売れ筋を入れ替えるときは、下の HOT だけ書き換えればよい。
// =========================================================

// いま売れている商品（季節や新発売に合わせてここだけ書き換える）
// [アイコン, 表示する文字, 楽天での検索キーワード]
const HOT = [
    ["🔥", "11/13発売 メガゲンガー・メガカイリュー デッキ", "スペシャルデッキセットMEGA メガオーダイル メガカイリュー メガゲンガー"],
    ["🎉", "30周年記念パック 30th CELEBRATION", "ポケモンカード 30th CELEBRATION"],
    ["🎮", "Pokémon LEGENDS Z-A（Switch）", "Pokemon LEGENDS Z-A"],
    ["🎄", "クリスマスに ポケモンのぬいぐるみ", "ポケモン ぬいぐるみ"],
];

// ---- リンクを作る部品 ----
// 楽天市場の検索（A8.net経由・承認済みの楽天プログラム）
function rakutenLink(keyword) {
    const s = "https://search.rakuten.co.jp/search/mall/" + encodeURIComponent(keyword) + "/";
    const inner = "http://hb.afl.rakuten.co.jp/hgc/0ea62065.34400275.0ea62066.204f04c0/a26110980102_4BGH3G_21TRSI_2HOM_BW8O1?pc=" + encodeURIComponent(s) + "&m=" + encodeURIComponent(s);
    return "https://rpx.a8.net/svt/ejp?a8mat=4BGH3G+21TRSI+2HOM+BW8O1&rakuten=y&a8ejpredirect=" + encodeURIComponent(inner);
}
const RAKUTEN_PIXEL = "4BGH3G+21TRSI+2HOM+BW8O1";
// A8.netで提携済みのプログラム（2026-11-13 提携）
const A8 = {
    bee:     { mat: "4BGK7Z+1LR2GI+5NJ8+5YJRM", text: "人気トレカを販売！豊富な品揃え！トレカ通販【Bee本舗通販店】" },
    furuichi:{ mat: "4BGK7Z+1YULRM+5W1M+BWVTE", text: "スリーブのまま送るだけ！上場企業が運営するトレカ宅配買取【ふるいち トレカ買取】" },
    qqkids:  { mat: "4BGK7Z+15OD4I+4HHM+66H9E", text: "【QQキッズ】こども専用オンライン英会話" },
    cloudy:  { mat: "4BGK7Z+16V8C2+46SW+60WN6", text: "1契約で家族6人まで受けられるオンライン英会話【クラウティ】" },
};
const PR = '<span class="pr">PR</span>';
function pixel(mat) {
    return '<img class="a8px" width="1" height="1" src="https://www10.a8.net/0.gif?a8mat=' + mat + '" alt="">';
}
function link(href, inner, cls, mat) {
    return '<a class="' + cls + '" rel="nofollow sponsored noopener" target="_blank" href="' + href + '">' + inner + '</a>' + (mat ? pixel(mat) : "");
}
function rakuten(inner, kw, cls) { return link(rakutenLink(kw), inner, cls, RAKUTEN_PIXEL); }
function a8(key, cls, before) {
    const p = A8[key];
    return link("https://px.a8.net/svt/ejp?a8mat=" + p.mat, (before || "") + p.text, cls, p.mat);
}
function el(html, tag, cls) {
    const e = document.createElement(tag || "div");
    if (cls) e.className = cls;
    e.innerHTML = html;
    return e;
}
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];

(function () {
    function pokemonPage() {
        const hero = document.querySelector(".pk-hero-txt");
        const jn = ((document.querySelector(".pk-jn") || {}).textContent || "").replace("の英語名", "").trim();
        if (!hero || !jn) return false;
        const seed = [...jn].reduce((a, c) => a + c.charCodeAt(0), 0);
        const special = HOT.filter(h => h[1].includes(jn));
        const hot = special[0] || pick(HOT, seed);

        // ① 英語名のすぐ下：そのポケモンのカード
        hero.appendChild(el(rakuten("🃏 " + jn + "のカードを見る" + PR, "ポケモンカード " + jn, "hero-ad"), "p", "hero-ad-wrap"));

        // ② 図鑑モード・クイズのボタンの並びに、グッズのボタン
        const cta = document.querySelector(".pk-cta");
        if (cta) cta.insertAdjacentHTML("beforeend", rakuten("🧸 " + jn + "のぬいぐるみ・グッズ" + PR, "ポケモン " + jn + " グッズ", "cta orange"));

        // ③ 英語名の由来のあと：英語に興味を持った人向け
        const origin = document.querySelector("#origin");
        if (origin) origin.appendChild(el("英語名の由来、子どもにも教えたくなったら👉 " + a8(pick(["qqkids", "cloudy"], seed), "inline-ad") + PR, "p", "inline-ad-line"));

        // ④ 豆知識のあと：いま人気の商品
        const trivia = document.querySelector("#trivia");
        if (trivia) trivia.appendChild(el("いま話題👉 " + rakuten(hot[0] + " " + hot[1], hot[2], "inline-ad") + PR, "p", "inline-ad-line"));

        // ⑤ 種族値のあと：カードを買う・売る
        const stats = document.querySelector("#stats");
        if (stats) stats.appendChild(el(
            "🃏 " + jn + "のカード、買うなら " + a8("bee", "inline-ad") + PR + "／売るなら " + a8("furuichi", "inline-ad") + PR,
            "p", "inline-ad-line"));

        // ⑥ よくある質問の最後に、Q&Aの形で
        const faq = document.querySelector("#faq .pk-faq");
        if (faq) faq.insertAdjacentHTML("beforeend",
            "<dt>ポケモンで英語に興味を持った子に、次は何がいい？" + PR + "</dt><dd>話す練習なら " + a8(seed % 2 ? "qqkids" : "cloudy", "inline-ad") + " のような子ども向けオンライン英会話で、無料体験から試せます。</dd>");
        return true;
    }

    function listPage() {
        const list = document.querySelector(".pkwrap .pk-list");
        if (!list) return false;
        // 一覧のカードの間に、同じ形の「PR」カードを混ぜる
        const tiles = [
            ...HOT.map(h => rakuten('<span class="ad-ico">' + h[0] + '</span><span class="no">PR</span><span class="jn">' + h[1] + '</span><span class="en">楽天市場で見る</span>', h[2], "ad-tile")),
            a8("bee", "ad-tile", '<span class="ad-ico">🛍️</span><span class="no">PR</span><span class="jn">ポケカを買う</span><span class="en">'),
            a8("qqkids", "ad-tile", '<span class="ad-ico">🧒</span><span class="no">PR</span><span class="jn">英語を話したくなったら</span><span class="en">'),
        ];
        const items = [...list.children];
        let n = 0;
        items.forEach((li, i) => {
            if (i > 0 && i % 18 === 5) {
                const ad = el(tiles[n++ % tiles.length], "li", "ad-li");
                li.before(ad);
            }
        });
        return true;
    }

    function hubPage() {
        const table = document.querySelector(".pkwrap .hub-table");
        if (table) {
            const rows = [...table.querySelectorAll("tr")].slice(1);
            let n = 0;
            const lines = [
                () => rakuten(HOT[n % HOT.length][0] + " " + HOT[n % HOT.length][1], HOT[n % HOT.length][2], "inline-ad"),
                () => "🃏 ポケカを買うなら " + a8("bee", "inline-ad"),
                () => "🗣️ " + a8("qqkids", "inline-ad"),
            ];
            rows.forEach((r, i) => {
                if (i > 0 && i % 25 === 12) {
                    const tr = document.createElement("tr");
                    tr.className = "ad-row";
                    tr.innerHTML = '<td colspan="4">' + PR + " " + lines[n % lines.length]() + "</td>";
                    n++;
                    r.before(tr);
                }
            });
        }
        const feats = [...document.querySelectorAll(".pkwrap .feat")];
        feats.forEach((f, i) => {
            if (i % 4 === 3) {
                const h = HOT[(i >> 2) % HOT.length];
                f.after(el(PR + " " + (i % 8 === 3 ? rakuten(h[0] + " " + h[1], h[2], "inline-ad") : a8("cloudy", "inline-ad")), "p", "inline-ad-line"));
            }
        });
        // 見出しのすぐ下に、いま話題の商品をひとこと
        const hero = document.querySelector(".pkpage .list-hero");
        if (hero) hero.appendChild(el(rakuten("🔥 いま話題：" + HOT[0][1] + PR, HOT[0][2], "hero-ad"), "p", "hero-ad-wrap"));
        return !!(table || feats.length);
    }

    function homePage() {
        const grid = document.querySelector(".mode-grid");
        if (!grid) return false;
        // モード選択の下に、横スクロールのチップ
        const chips = HOT.map(h => rakuten(h[0] + " " + h[1] + PR, h[2], "chip-ad")).join("") +
            a8("bee", "chip-ad", "🛍️ ") + a8("qqkids", "chip-ad", "🧒 ");
        grid.after(el(chips, "div", "chip-ad-row"));
        return true;
    }

    function run() {
        if (pokemonPage()) return;
        listPage() || hubPage() || homePage();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
    else run();
})();
