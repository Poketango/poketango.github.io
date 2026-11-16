// =========================================================
// ホーム：実践モードのモード選択（mode-picker.js）
// 「実践モード」を押すとモードの一覧が開き、選ぶとそのモードで始まる
// =========================================================
(function () {
    const MODES = [
        { id: "normal", icon: "poke-ball", name: "ノーマル", desc: "1回まちがえたら終わり。何問つづけて正解できる？", tag: "定番" },
        { id: "noja",   icon: "great-ball", name: "日本語なし", desc: "日本語訳なし。英文だけで答えを考える", tag: "中級" },
        { id: "sec10",  icon: "quick-ball", name: "10秒サバイバル", desc: "1問10秒。時間切れでも終わり", tag: "スピード" },
        { id: "ta60",   icon: "timer-ball", name: "60秒タイムアタック", desc: "60秒で何問とけるか。まちがえても続く", tag: "スコア" },
        { id: "oni",    icon: "master-ball", name: "鬼", desc: "日本語なし＋1問8秒。上級者向け", tag: "最難関" }
    ];
    const bestKey = m => m === "normal" ? "bestScore" : "bestScore_" + m;
    function best(m) { try { return Number(localStorage.getItem(bestKey(m)) || 0); } catch (e) { return 0; } }
    function last() { try { return localStorage.getItem("jissenMode") || "normal"; } catch (e) { return "normal"; } }

    function build() {
        const wrap = document.createElement("div");
        wrap.id = "mode-picker";
        wrap.hidden = true;
        wrap.innerHTML =
            '<div class="mp-back" data-close></div>' +
            '<div class="mp-panel" role="dialog" aria-modal="true" aria-labelledby="mp-title">' +
            '<button class="mp-x" data-close aria-label="閉じる">×</button>' +
            '<h2 id="mp-title">実践モード</h2><p class="mp-lead">挑戦するモードを選んでください</p>' +
            '<div class="mp-list">' + MODES.map(m =>
                `<a class="mp-card mp-${m.id}" href="jissen.html?mode=${m.id}">` +
                `<span class="mp-icon"><img src="home_icons/items/${m.icon}.png" alt="" width="36" height="36"></span>` +
                `<span class="mp-body"><span class="mp-name">${m.name}<em>${m.tag}</em></span>` +
                `<span class="mp-desc">${m.desc}</span></span>` +
                `<span class="mp-best"><small>最高記録</small><b data-best="${m.id}">0</b></span></a>`).join("") +
            '</div></div>';
        document.body.appendChild(wrap);
        wrap.addEventListener("click", e => { if (e.target.closest("[data-close]")) close(); });
        return wrap;
    }
    let el = null;
    function open() {
        el = el || build();
        el.querySelectorAll("[data-best]").forEach(b => {
            const v = best(b.dataset.best);
            b.textContent = v ? v + "問" : "—";
        });
        el.querySelectorAll(".mp-card").forEach(c => c.classList.toggle("mp-last", c.classList.contains("mp-" + last())));
        el.hidden = false;
        document.body.classList.add("mp-open");
        const first = el.querySelector(".mp-last") || el.querySelector(".mp-card");
        if (first) first.focus();
    }
    function close() { if (el) el.hidden = true; document.body.classList.remove("mp-open"); }
    document.addEventListener("keydown", e => { if (e.key === "Escape" && el && !el.hidden) close(); });

    const btn = document.querySelector(".mode-button.battle");
    if (btn) {
        btn.removeAttribute("onclick");
        btn.addEventListener("click", e => { e.preventDefault(); open(); });
    }
    if (location.hash === "#jissen") open();
    window.openModePicker = open;
})();
