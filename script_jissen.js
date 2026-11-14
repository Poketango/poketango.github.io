// ===============================
// 実践モード専用スクリプト（完成版）
// ===============================

// データ
let pokedex = {};
let pokedexJP = {};
let pokemonNames = [];

// スコア
let combo = 0;
// ===============================
// ルール（モード）
//   ja: 日本語訳を出すか / perQ: 1問の制限時間(秒) / total: 全体の制限時間(秒)
// ===============================
const JISSEN_MODES = {
    normal: { label: "ノーマル", ja: true, perQ: 0, total: 0, desc: "1回まちがえたら終わり。何問連続で正解できるか挑戦！" },
    noja:   { label: "日本語なし", ja: false, perQ: 0, total: 0, desc: "日本語訳なし。英文だけで答えを考えよう。" },
    sec10:  { label: "10秒サバイバル", ja: true, perQ: 10, total: 0, desc: "1問10秒以内に答えないと終了。まちがえても終了。" },
    ta60:   { label: "60秒タイムアタック", ja: true, perQ: 0, total: 60, desc: "60秒で何問正解できるか。まちがえても続けられる（正解が表示されて次の問題へ）。" },
    oni:    { label: "鬼（日本語なし＋8秒）", ja: false, perQ: 8, total: 0, desc: "日本語訳なし、1問8秒。上級者向け。" }
};
const MODE_ICON = { normal: "🔥", noja: "🇬🇧", sec10: "⏱️", ta60: "⚡", oni: "👹" };
// ホームのモード選択から ?mode=〇〇 で来たらそのモード、なければ前回のモード
let jMode = new URLSearchParams(location.search).get("mode");
if (!JISSEN_MODES[jMode]) jMode = localStorage.getItem("jissenMode");
if (!JISSEN_MODES[jMode]) jMode = "normal";
let dataReady = false, counting = false;
const bestKey = m => m === "normal" ? "bestScore" : "bestScore_" + m;
let best = Number(localStorage.getItem(bestKey(jMode)) || 0);
document.getElementById("best").textContent = `最高記録：${best}`;
let timerId = null, qStart = 0, runStart = 0, taScore = 0, playing = false, timeoutFlag = false;
function jissenStats() { try { return JSON.parse(localStorage.getItem("jissenStats") || "{}"); } catch (e) { return {}; } }
function jissenStatsSave(o) { try { localStorage.setItem("jissenStats", JSON.stringify(o)); } catch (e) {} }
function recordModeBest(mode, score) {
    const js = jissenStats(); js.best = js.best || {};
    if (!js.best[mode] || score > js.best[mode]) js.best[mode] = score;
    jissenStatsSave(js);
    if (typeof achCheck === "function") achCheck({}, false);
}
function setMode(m) {
    jMode = m; localStorage.setItem("jissenMode", m);
    try { history.replaceState(null, "", "jissen.html?mode=" + m); } catch (e) {}
    document.querySelectorAll("#mode-bar button[data-mode]").forEach(b => b.classList.toggle("on", b.dataset.mode === m));
    document.getElementById("mode-desc").textContent = JISSEN_MODES[m].desc;
    best = Number(localStorage.getItem(bestKey(m)) || 0);
    document.getElementById("best").textContent = `最高記録：${best}`;
    restartRun();
}
function restartRun() {
    stopTimer(); combo = 0; taScore = 0; playing = false; timeoutFlag = false;
    document.getElementById("combo").textContent = JISSEN_MODES[jMode].total ? "正解数：0" : "現在の連続正解数：0";
    document.getElementById("main").style.display = "block";
    document.getElementById("gameover-box").style.display = "none";
    document.getElementById("ta-flash").textContent = "";
    const cfg = JISSEN_MODES[jMode];
    document.getElementById("timer-wrap").style.display = "none";
    if (typeof FX !== "undefined") FX.stopTimer();
    showStart();
}
// ===============================
// スタート画面とカウントダウン
// ===============================
function showStart() {
    const cfg = JISSEN_MODES[jMode];
    document.getElementById("start-screen").style.display = "block";
    document.getElementById("question-box").style.display = "none";
    document.getElementById("ss-icon").textContent = MODE_ICON[jMode] || "🔥";
    document.getElementById("ss-name").textContent = cfg.label;
    document.getElementById("ss-desc").textContent = cfg.desc;
    document.getElementById("ss-best").textContent = best ? `最高記録 ${best}問` : "まだ記録がありません";
    document.body.dataset.mode = jMode;
    const b = document.getElementById("start-btn");
    b.disabled = !dataReady;
    b.innerHTML = dataReady ? 'スタート<kbd class="key-hint">Space</kbd>' : "読みこみ中…";
}
function beginRun() {
    if (!dataReady || counting || playing) return;
    counting = true;
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("main").style.display = "block";
    document.getElementById("gameover-box").style.display = "none";
    document.getElementById("question-box").style.display = "none";
    const go = () => {
        counting = false;
        const cfg = JISSEN_MODES[jMode];
        document.getElementById("question-box").style.display = "";
        document.getElementById("timer-wrap").style.display = (cfg.perQ || cfg.total) ? "block" : "none";
        nextQuestion();
    };
    if (typeof FX !== "undefined") FX.countdown(go); else go();
}
document.getElementById("start-btn").addEventListener("click", beginRun);
// スタート画面では Space か Enter で始める
window.addEventListener("keydown", e => {
    const ss = document.getElementById("start-screen");
    if (!ss || ss.style.display === "none" || counting) return;
    const go = e.key === " " || e.code === "Space" || e.key === "Enter" || e.keyCode === 32 || e.keyCode === 13;
    if (!go || e.repeat) return;
    if (e.target && e.target.closest && e.target.closest("#mode-bar")) return;
    e.preventDefault(); e.stopPropagation();
    beginRun();
}, true);
// プレイ中にロゴを押したときだけ確認する
document.querySelectorAll(".logo-link").forEach(a => a.addEventListener("click", e => {
    if ((playing || counting) && !confirm("ホームに戻りますか？（今回の記録は残りません）")) e.preventDefault();
}));
function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } if (typeof FX !== "undefined") FX.stopTimer(); }
function startTimer() {
    const cfg = JISSEN_MODES[jMode];
    stopTimer();
    if (!cfg.perQ && !cfg.total) return;
    timerId = setInterval(() => {
        const now = Date.now();
        const limit = cfg.total || cfg.perQ;
        const start = cfg.total ? runStart : qStart;
        const left = Math.max(0, limit - (now - start) / 1000);
        const bar = document.getElementById("timer-bar");
        bar.style.width = (left / limit * 100) + "%";
        bar.classList.toggle("warn", left <= Math.min(3, limit * 0.3));
        if (typeof FX !== "undefined") FX.timer(left);
        document.getElementById("timer-text").textContent = (cfg.total ? `残り ${left.toFixed(1)} 秒　正解 ${taScore}` : `残り ${left.toFixed(1)} 秒`);
        if (left <= 0) { stopTimer(); timeoutFlag = true; if (cfg.perQ) medalOnWrong(); gameOver(); }
    }, 100);
}

// ===============================
// 実績データ
// ===============================
let achievements = JSON.parse(localStorage.getItem("achievements") || "{}");

function unlockAchievement(key) {
    if (!achievements[key]) {
        achievements[key] = true;
        localStorage.setItem("achievements", JSON.stringify(achievements));
        showAchievementPopup(key);
        medalBadgeUpdate();
    }
}

// ===============================
// 遭遇記録
// ===============================
let seen = JSON.parse(localStorage.getItem("seen") || "[]");

function recordSeen(name) {
    if (!seen.includes(name)) {
        seen.push(name);
    }
    // ★ 保存とメダル判定は medals.js にまかせる
    medalRecordSeen(name);
}

// ===============================
// カントー地方 151匹
// ===============================
const regions = {
    kanto: [
        "bulbasaur","ivysaur","venusaur","charmander","charmeleon","charizard","squirtle","wartortle","blastoise",
        "caterpie","metapod","butterfree","weedle","kakuna","beedrill","pidgey","pidgeotto","pidgeot","rattata",
        "raticate","spearow","fearow","ekans","arbok","pikachu","raichu","sandshrew","sandslash","nidoran-f",
        "nidorina","nidoqueen","nidoran-m","nidorino","nidoking","clefairy","clefable","vulpix","ninetales",
        "jigglypuff","wigglytuff","zubat","golbat","oddish","gloom","vileplume","paras","parasect","venonat","venomoth",
        "diglett","dugtrio","meowth","persian","psyduck","golduck","mankey","primeape","growlithe","arcanine",
        "poliwag","poliwhirl","poliwrath","abra","kadabra","alakazam","machop","machoke","machamp",
        "bellsprout","weepinbell","victreebel","tentacool","tentacruel","geodude","graveler","golem",
        "ponyta","rapidash","slowpoke","slowbro","magnemite","magneton","farfetchd","doduo","dodrio",
        "seel","dewgong","grimer","muk","shellder","cloyster","gastly","haunter","gengar","onix",
        "drowzee","hypno","krabby","kingler","voltorb","electrode","exeggute","exeggutor","cubone","marowak",
        "hitmonlee","hitmonchan","lickitung","koffing","weezing","rhyhorn","rhydon","chansey","tangela",
        "kangaskhan","horsea","seadra","goldeen","seaking","staryu","starmie","mr-mime","scyther","jynx",
        "electabuzz","magmar","pinsir","tauros","magikarp","gyarados","lapras","ditto","eevee","vaporeon",
        "jolteon","flareon","porygon","omanyte","omastar","kabuto","kabutops","aerodactyl","snorlax",
        "articuno","zapdos","moltres","dratini","dragonair","dragonite","mewtwo","mew"
    ]
};

function checkRegionComplete() {
    const allSeen = regions.kanto.every(name => seen.includes(name));
    if (allSeen) unlockAchievement("kantoComplete");
}

// ===============================
// データ読み込み
// ===============================
async function loadData() {
    pokedex = await (await fetch("pokedex_en.json")).json();
    pokedexJP = await (await fetch("pokedex_jp.json")).json();

    pokemonNames = Object.keys(pokedex);
    dataReady = true;
    if (!playing && !counting) showStart();
}
loadData();

// ===============================
// ランダム出題
// ===============================
function nextQuestion() {
    const name = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
    showPokemon(name);
    const cfg = JISSEN_MODES[jMode];
    qStart = Date.now();
    if (!playing) { playing = true; runStart = Date.now(); if (cfg.perQ || cfg.total) startTimer(); }
    const inp = document.getElementById("answer-input"); if (inp && window.innerWidth > 700) inp.focus();
}

// ===============================
// ポケモン表示
// ===============================
function showPokemon(name) {
    window.currentPokemon = name;

    const imgPath = `pokemon_sprites/${name}.png`;
    const description = pokedex[name];
    const jaText = pokedexJP[name];

    const result = makeBlank(description, name);

    document.getElementById("poke-img").src = imgPath;
    document.getElementById("desc").innerHTML = result.question;
    document.getElementById("desc-ja").textContent = jaText;
    document.getElementById("desc-ja").classList.toggle("hidden-ja", !JISSEN_MODES[jMode].ja);

    window.currentAnswer = result.answer;

    document.getElementById("judge").textContent = "";
    document.getElementById("answer-input").value = "";

    recordSeen(name);
    checkRegionComplete();
}

// ===============================
// 回答判定
// ===============================
document.getElementById("check-answer-btn").addEventListener("click", checkAnswer);
document.getElementById("answer-input").addEventListener("keydown", e => {
    if (e.key === "Enter") checkAnswer();
});

function checkAnswer() {
    const user = document.getElementById("answer-input").value.trim().toLowerCase();
    const correct = window.currentAnswer.toLowerCase();

    if (!user || !playing) return;
    const cfg = JISSEN_MODES[jMode];
    const elapsed = (Date.now() - qStart) / 1000;
    if (user === correct) {
        combo++;
        if (cfg.total) taScore++;
        document.getElementById("combo").textContent = cfg.total ? `正解数：${taScore}` : `現在の連続正解数：${combo}`;
        document.getElementById("ta-flash").textContent = "";

        if (jMode === "normal") {
            if (combo === 10) unlockAchievement("combo10");
            if (combo === 20) unlockAchievement("combo20");
            if (combo === 50) unlockAchievement("combo50");
        }
        // 実践モードの新ルール用の記録（称号の判定に使う）
        const left = cfg.perQ ? cfg.perQ - elapsed : 99;
        window.jissenCtx = { mode: jMode, combo: combo, elapsed: elapsed, left: left };
        const js = jissenStats(); js.combo = js.combo || {};
        if (!cfg.total && combo > (js.combo[jMode] || 0)) js.combo[jMode] = combo;
        if (elapsed <= 2) js.fast = (js.fast || 0) + 1;
        if (cfg.perQ && left <= 1) js.buzzer = (js.buzzer || 0) + 1;
        jissenStatsSave(js);

        // ★ メダル・実績用：正解を記録
        medalOnCorrect(window.currentPokemon, window.currentAnswer, "jissen", combo);
        if (typeof FX !== "undefined") FX.correct(cfg.total ? taScore : combo, !!cfg.total);

        nextQuestion();
    } else if (cfg.total) {
        // タイムアタック：まちがえても続行（正解を見せて次へ）
        medalOnWrong();
        combo = 0;
        if (typeof FX !== "undefined") FX.wrong();
        document.getElementById("ta-flash").textContent = `✗ 正解は ${window.currentAnswer}`;
        nextQuestion();
    } else {
        // ★ 実績用：不正解を記録
        medalOnWrong();
        gameOver();
    }
}

// ===============================
// ゲームオーバー
// ===============================
function gameOver() {
    stopTimer(); playing = false;
    const cfg = JISSEN_MODES[jMode];
    const score = cfg.total ? taScore : combo;
    document.getElementById("main").style.display = "none";
    document.getElementById("gameover-box").style.display = "block";

    document.getElementById("fail-title").textContent = cfg.total ? "タイムアップ！" : (timeoutFlag ? "時間切れ！" : "不正解！");
    document.getElementById("fail-answer").textContent = `正解：${window.currentAnswer}`;
    document.getElementById("fail-combo").textContent = cfg.total ? `60秒間の正解数：${taScore}` : `今回の連続正解数：${combo}`;
    document.getElementById("final-score").textContent = `【${cfg.label}】今回の記録：${score} 問`;
    timeoutFlag = false;
    recordModeBest(jMode, score);

    // ★ ここから追加（不正解ポケモンの情報表示）
    const name = window.currentPokemon;
    document.getElementById("fail-poke-img").src = `pokemon_sprites/${name}.png`;
    document.getElementById("fail-desc-en").textContent = pokedex[name];
    document.getElementById("fail-desc-ja").textContent = pokedexJP[name];
    // ★ ここまで追加

    const newRecord = score > best;
    if (newRecord) {
        best = score;
        localStorage.setItem(bestKey(jMode), best);
    }
    if (typeof FX !== "undefined") FX.gameover(newRecord, score);

    localStorage.setItem("lastScore", score);
    localStorage.setItem("lastMode", cfg.label);

    document.getElementById("best-score").textContent = `最高記録：${best} 問`;

    combo = 0;
}


    


document.getElementById("retry-btn").addEventListener("click", () => { restartRun(); beginRun(); });
document.querySelectorAll("#mode-bar button[data-mode]").forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));
setMode(jMode);


// ===============================
// ゲームオーバー画面のキー操作
// スペースキー：もう一度挑戦する／Escキー：ホームへ戻る
// ===============================
// ゲームオーバー画面のキー操作：Space＝もう一度挑戦する、Esc＝ホームへ戻る
// 日本語入力がオンのままでも反応するように、key・code・keyCode のどれでも判定する
function jissenGameOverKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const box = document.getElementById("gameover-box");
    if (!box || getComputedStyle(box).display === "none") return;
    const space = e.key === " " || e.key === "Spacebar" || e.code === "Space" || e.keyCode === 32;
    const esc = e.key === "Escape" || e.key === "Esc" || e.code === "Escape" || e.keyCode === 27;
    if (!space && !esc) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.repeat) return;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (space) document.getElementById("retry-btn").click();
    else location.href = "index.html";
}
window.addEventListener("keydown", jissenGameOverKey, true);

// ===============================
// 実績ポップアップ
// ===============================
function showAchievementPopup(key) {
    const popup = document.getElementById("achievement-popup");
    if (!popup) return;

    const names = {
        combo10: "10連続正解",
        combo20: "20連続正解",
        combo50: "50連続正解",
        kantoComplete: "カントー図鑑コンプリート"
    };

    popup.textContent = `🏆 実績解除：${names[key]}`;
    popup.style.display = "block";

    setTimeout(() => {
        popup.style.display = "none";
    }, 3000);
}

// ===============================
// 穴あき処理
// ===============================
// makeBlank は quiz-words.js（練習・実践で共通）にあります

// ===============================
// X（旧Twitter）投稿
// ===============================
document.getElementById("tweet-btn").addEventListener("click", () => {
    const score = Number(localStorage.getItem("lastScore") || 0);

    const mode = localStorage.getItem("lastMode") || "ノーマル";
    const head = mode.includes("タイムアタック") ? `【実践モード・${mode}】\n60秒で${score}問正解しました！` : `【実践モード・${mode}】\n${score}連続正解を達成しました！`;
    const text = head + `\n#ポケたん\nhttps://poketango.com/jissen.html`;

    const url = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text);

    window.open(url, "_blank");
});
