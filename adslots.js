// =========================================================
// Google AdSense の表示枠（全ページ共通）
// ---------------------------------------------------------
// Vector のソフト紹介ページと同じくらい（1ページ最大5枠）を目安に、
// 本文のカードとカードの間へ自動で差し込む。
// 審査中や在庫切れで広告が来なかった枠は、ラベルごと自動で隠れる。
// 広告ユニット monspe_display（レスポンシブ）を全枠で使い回す。
// =========================================================
(function () {
    if (window.__adslots) return;
    window.__adslots = true;
    const CLIENT = "ca-pub-4829093383068106";
    const SLOT = "1478855669";
    const MAX = 5;
    const EN = /^\/en\//.test(location.pathname) || document.documentElement.lang === "en";
    const LABEL = EN ? "Advertisement" : "スポンサーリンク";

    const css = document.createElement("style");
    css.textContent = `
    .gad{margin:18px auto;max-width:760px;text-align:center;clear:both;min-height:0}
    .gad .gad-l{display:block;font-size:11px;color:#9ca3af;letter-spacing:.08em;margin:0 0 4px}
    .gad ins.adsbygoogle{display:block}
    /* 広告が実際に入るまでは高さ0で待たせる（幅は残すので広告の読み込みは止まらない） */
    .gad:not(:has(ins[data-ad-status="filled"])){height:0;margin:0 auto;overflow:hidden}
    li.gad-li{list-style:none;grid-column:1/-1;width:100%}
    @media print{.gad{display:none!important}}`;
    document.head.appendChild(css);

    // AdSense の読み込みコードがないページには足す
    if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
        const s = document.createElement("script");
        s.async = true; s.crossOrigin = "anonymous";
        s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + CLIENT;
        document.head.appendChild(s);
    }

    let count = 0;
    function make(tag) {
        const box = document.createElement(tag || "div");
        box.className = tag === "li" ? "gad gad-li" : "gad";
        box.innerHTML = '<span class="gad-l">' + LABEL + '</span><ins class="adsbygoogle" data-ad-client="' + CLIENT +
            '" data-ad-slot="' + SLOT + '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
        return box;
    }
    function place(ref, where, tag) {
        if (!ref || count >= MAX) return false;
        const box = make(tag);
        if (where === "after") ref.after(box);
        else if (where === "before") ref.before(box);
        else ref.appendChild(box);
        count++;
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
        return true;
    }

    function run() {
        const root = document.querySelector("main.pkwrap, .pkwrap, main, #layout, .policy, #bm-page, #page");
        // クイズや実践モードは、押し間違いが起きないようボタンから離した下側だけに置く
        const game = document.querySelector("#content #poke-name, #main #poke-name");
        if (game) {
            const box = document.getElementById("content") || document.getElementById("main");
            place(box, "after");
            return;
        }
        if (!root) {
            // 本文の入れ物がないページ（トップ、実践モード、実績など）は目印の要素のあとに置く
            [".mode-grid", "#ach-intro", "#progress-box", "#main"].forEach(sel => {
                const e = document.querySelector(sel);
                if (e && !e.closest(".gad")) place(e, "after");
            });
            // いちばん下（フッターの直前）
            const f = document.getElementById("site-footer") || document.querySelector("body > footer");
            if (f) place(f, "before");
            else {
                const blocks = [...document.body.children].filter(e => !/^(SCRIPT|STYLE|NOSCRIPT)$/.test(e.tagName) &&
                    getComputedStyle(e).position === "static" && e.offsetHeight > 0);
                const tail = blocks[blocks.length - 1];
                if (tail && !tail.classList.contains("gad")) place(tail, "after");
            }
            return;
        }

        // 長い一覧（ポケモン一覧など）は、60件ごとに一覧の中へ混ぜる
        const list = root.querySelector(".pk-list");
        const hero = root.querySelector(".list-hero, .en-hero, .pk-hero");
        if (hero) place(hero, "after");
        if (list) {
            const items = [...list.children];
            for (let i = 60; i < items.length && count < MAX - 1; i += 60) place(items[i], "before", items[i].tagName === "LI" ? "li" : "div");
        }

        // 本文のカードの間に、だいたい2枚おきに入れる
        const cards = [...root.querySelectorAll(":scope > section, :scope > .card, :scope > article")]
            .filter(c => !c.matches(".list-hero, .en-hero, .pk-hero") && !c.closest(".gad"));
        if (!hero && cards.length) place(cards[0], "after");
        const step = cards.length > 8 ? 3 : 2;
        for (let i = 2; i < cards.length - 1 && count < MAX - 1; i += step) place(cards[i], "after");

        // 長い記事のカードは、真ん中あたりにも入れる
        cards.forEach(c => {
            if (count >= MAX - 1 || c.offsetHeight < 1600) return;
            const kids = [...c.children].filter(k => /^(P|H2|H3|UL|OL|FIGURE|TABLE|DIV)$/.test(k.tagName));
            if (kids.length >= 6) place(kids[Math.floor(kids.length / 2)], "before");
        });

        // 本文の最後（フッターの直前）
        const last = root.lastElementChild;
        if (last && !last.classList.contains("gad")) place(root, "append");
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
    else run();
})();
