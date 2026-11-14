// =========================================================
// X（旧Twitter）でシェアするボタン
// 実践モードの結果画面と、実績ページに表示する
// =========================================================
(function () {
    const SITE_URL = "https://poketango.com/";
    const TAG = "ポケたん";

    function shareUrl(text) {
        return "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text) +
               "&url=" + encodeURIComponent(SITE_URL + "?utm_source=x&utm_medium=share&utm_campaign=" + (location.pathname.split("/").pop().replace(".html","") || "top")) + "&hashtags=" + encodeURIComponent(TAG) + "&via=zukan_eitango";
    }

    function makeButton(getText) {
        const a = document.createElement("a");
        a.className = "share-x";
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "𝕏 でシェアする";
        a.addEventListener("click", () => { a.href = shareUrl(getText()); });
        a.href = shareUrl(getText());
        return a;
    }

    // 実践モード：結果が出たら連続正解数をシェア
    const failCombo = document.getElementById("fail-combo");
    if (failCombo) {
        const update = () => {
            const n = (failCombo.textContent.match(/\d+/) || ["0"])[0];
            let btn = document.getElementById("share-jissen");
            if (!btn) {
                btn = makeButton(() => "");
                btn.id = "share-jissen";
                failCombo.after(btn);
            }
            const text = `ポケモン図鑑の英単語クイズで ${n}問連続正解しました！あなたは何問いける？`;
            btn.href = shareUrl(text);
        };
        new MutationObserver(update).observe(failCombo, { childList: true, characterData: true, subtree: true });
    }

    // 実績ページ：進捗と称号の数をシェア
    const summary = document.getElementById("medal-summary");
    if (summary && typeof medalReady !== "undefined") {
        medalReady.then(() => {
            setTimeout(() => {
                const p = medalOverallProgress();
                const titles = summary.querySelectorAll(".title-row").length;
                const btn = makeButton(() =>
                    `ポケモン図鑑で英単語を勉強中！ 全メダルの進捗 ${p.percent}%、称号を${titles}個獲得しました。`);
                btn.id = "share-ach";
                summary.prepend(btn);
            }, 300);
        });
    }
})();
