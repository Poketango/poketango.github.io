// =========================================================
// 練習・実践モードの入力をラクにする（quiz-ux.js）
// ・問題が出るたびに、答えの入力欄へ自動でカーソルを置く
// ・入力欄の外で文字キーを押しても、そのまま入力欄に入る
// =========================================================
(function () {
    const input = document.getElementById("answer-input");
    const desc = document.getElementById("desc");
    if (!input) return;

    function busyElsewhere() {
        const a = document.activeElement;
        if (!a || a === input || a === document.body) return false;
        const tag = a.tagName;
        // 検索欄や速さの選択など、ほかの入力中はじゃましない
        return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || a.isContentEditable;
    }

    function focusInput() {
        if (busyElsewhere()) return;
        if (input.offsetParent === null) return; // 画面に出ていないとき（ゲームオーバー画面など）
        input.focus({ preventScroll: true });
    }

    // 問題文が変わったら入力欄へ
    if (desc) {
        new MutationObserver(() => setTimeout(focusInput, 30))
            .observe(desc, { childList: true, characterData: true, subtree: true });
    }

    // ボタンを押したあとも入力欄へ戻す（ポケモンいれかえ・答え合わせなど）
    document.addEventListener("click", e => {
        if (e.target.closest("button")) setTimeout(focusInput, 30);
    });

    // スペースキーで「ポケモンいれかえ」（答えは1単語なので、入力欄の中でも使える）
    document.addEventListener("keydown", e => {
        if (e.key !== " " || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
        if (typeof window.showRandomPokemon !== "function") return;
        if (busyElsewhere() && document.activeElement !== input) return;
        if (!document.querySelector('button[onclick*="showRandomPokemon"]')) return; // 実践モードには入れかえがない
        e.preventDefault();
        input.value = "";
        window.showRandomPokemon();
    }, true);

    // 入力欄の外で英字を押したら、入力欄に入れる
    document.addEventListener("keydown", e => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (document.activeElement === input || busyElsewhere()) return;
        if (e.key.length === 1 && /[a-zA-Z'\-]/.test(e.key) && input.offsetParent !== null) {
            input.focus({ preventScroll: true });
        }
    });

    window.addEventListener("load", () => setTimeout(focusInput, 100));
    focusInput();
})();
