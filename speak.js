// =========================================================
// 英語の読み上げとキーボード操作（speak.js）
// ・図鑑モード：説明文を英語で読み上げる。← → キーで前後のポケモンへ
// ・練習／実践モード：問題文を読み上げ（穴は「blank」と読む）
//   まちがえたあとは、正解の入った文を読み上げられる
// ・ブラウザの読み上げ機能（Web Speech API）を使うので、追加の料金や登録は不要
// =========================================================

(function () {
    const canSpeak = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    const RATE_KEY = "speakRate";

    function getRate() {
        try { return parseFloat(localStorage.getItem(RATE_KEY)) || 0.9; } catch (e) { return 0.9; }
    }
    function setRate(v) {
        try { localStorage.setItem(RATE_KEY, String(v)); } catch (e) {}
    }

    function pickVoice() {
        const voices = speechSynthesis.getVoices();
        return voices.find(v => /en-US/i.test(v.lang) && /Google|Microsoft|Samantha/i.test(v.name))
            || voices.find(v => /en-US/i.test(v.lang))
            || voices.find(v => /^en/i.test(v.lang))
            || null;
    }

    let playingBtn = null;

    function stop() {
        if (!canSpeak) return;
        speechSynthesis.cancel();
        if (playingBtn) { playingBtn.classList.remove("playing"); playingBtn = null; }
    }

    function speak(text, btn) {
        if (!canSpeak || !text) return;
        const wasMine = playingBtn === btn;
        stop();
        if (wasMine) return; // 再生中にもう一度押すと止める

        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        u.rate = getRate();
        const v = pickVoice();
        if (v) u.voice = v;
        u.onend = u.onerror = () => {
            if (playingBtn === btn) { btn.classList.remove("playing"); playingBtn = null; }
        };
        playingBtn = btn;
        btn.classList.add("playing");
        speechSynthesis.speak(u);
    }

    function cleanText(t) {
        return (t || "").replace(/_{2,}/g, " blank ").replace(/\s+/g, " ").trim();
    }

    // 読み上げボタンの列を作る。buttons: [{label, text: () => 文字列, id}]
    function makeBar(afterEl, buttons) {
        const bar = document.createElement("div");
        bar.className = "speak-bar";

        const made = buttons.map(b => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "speak-btn";
            btn.textContent = b.label;
            if (b.id) btn.id = b.id;
            btn.addEventListener("click", () => speak(b.text(), btn));
            bar.appendChild(btn);
            return btn;
        });

        const rate = document.createElement("label");
        rate.className = "speak-rate";
        rate.innerHTML = `速さ <select>
            <option value="0.7">ゆっくり</option>
            <option value="0.9">ふつう</option>
            <option value="1.1">はやい</option>
        </select>`;
        const sel = rate.querySelector("select");
        sel.value = String(getRate());
        if (!sel.value) sel.value = "0.9";
        sel.addEventListener("change", () => { setRate(parseFloat(sel.value)); stop(); });
        bar.appendChild(rate);

        afterEl.insertAdjacentElement("afterend", bar);
        return made;
    }

    function onTextChange(el, fn) {
        if (el) new MutationObserver(fn).observe(el, { childList: true, characterData: true, subtree: true });
    }

    function init() {
        const desc = document.getElementById("desc");
        const page = location.pathname.split("/").pop() || "index.html";

        // ---------- 図鑑モード ----------
        if (page === "zukan.html") {
            if (canSpeak && desc) {
                makeBar(desc, [{ label: "🔊 英語で聞く", text: () => cleanText(desc.textContent) }]);
                onTextChange(desc, stop); // ポケモンが変わったら止める
            }

            // ← → キーで前後のポケモンへ
            document.addEventListener("keydown", e => {
                const tag = (e.target && e.target.tagName) || "";
                if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
                if (e.key === "ArrowLeft" && typeof showPrevPokemon === "function") { showPrevPokemon(); e.preventDefault(); }
                if (e.key === "ArrowRight" && typeof showNextPokemon === "function") { showNextPokemon(); e.preventDefault(); }
                if (e.key === " " && !e.repeat && typeof showRandomPokemon === "function") { showRandomPokemon(); e.preventDefault(); }
            });
            const nextBtn = [...document.querySelectorAll("#content button")].pop();
            if (nextBtn) {
                const hint = document.createElement("div");
                hint.className = "key-hint";
                hint.textContent = "キーボードの ← → で前後のポケモン、スペースでいれかえができます";
                nextBtn.insertAdjacentElement("afterend", hint);
            }
        }

        // ---------- 練習モード・実践モード ----------
        if ((page === "practice.html" || page === "jissen.html") && canSpeak && desc) {
            const fullText = () => {
                const n = window.currentPokemon;
                return (typeof pokedex === "object" && n && pokedex[n]) ? cleanText(pokedex[n]) : "";
            };
            const [, answerBtn] = makeBar(desc, [
                { label: "🔊 問題文を聞く", text: () => cleanText(desc.textContent) },
                { label: "🔊 正解の文を聞く", text: fullText }
            ]);

            // 正解の文は、まちがえたあとだけ聞ける（答えが分かってしまうため）
            const judge = document.getElementById("judge");
            const refresh = () => {
                const t = (judge && judge.textContent) || "";
                answerBtn.style.display = /不正解/.test(t) ? "" : "none";
            };
            refresh();
            onTextChange(judge, refresh);
            onTextChange(desc, () => { stop(); refresh(); });

            // 実践モードのゲームオーバー画面
            const failEn = document.getElementById("fail-desc-en");
            if (failEn) {
                makeBar(failEn, [{ label: "🔊 この文を聞く", text: () => cleanText(failEn.textContent) }]);
            }
        }
    }

    if (canSpeak) speechSynthesis.getVoices(); // 声の一覧を先に読み込ませる

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
