// ===============================
// 実践モード専用スクリプト（完成版）
// ===============================

// データ
let pokedex = {};
let pokedexJP = {};
let pokemonNames = [];

// スコア
let combo = 0;
let best = Number(localStorage.getItem("bestScore") || 0);
document.getElementById("best").textContent = `最高記録：${best}`;

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

    nextQuestion();
}
loadData();

// ===============================
// ランダム出題
// ===============================
function nextQuestion() {
    const name = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
    showPokemon(name);
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

    if (user === correct) {
        combo++;
        document.getElementById("combo").textContent = `現在の連続正解数：${combo}`;

        if (combo === 10) unlockAchievement("combo10");
        if (combo === 20) unlockAchievement("combo20");
        if (combo === 50) unlockAchievement("combo50");

        // ★ メダル・実績用：正解を記録
        medalOnCorrect(window.currentPokemon, window.currentAnswer, "jissen", combo);

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
    document.getElementById("main").style.display = "none";
    document.getElementById("gameover-box").style.display = "block";

    document.getElementById("fail-title").textContent = "不正解！";
    document.getElementById("fail-answer").textContent = `正解：${window.currentAnswer}`;
    document.getElementById("fail-combo").textContent = `今回の連続正解数：${combo}`;
    document.getElementById("final-score").textContent = `今回の記録：${combo} 問`;

    // ★ ここから追加（不正解ポケモンの情報表示）
    const name = window.currentPokemon;
    document.getElementById("fail-poke-img").src = `pokemon_sprites/${name}.png`;
    document.getElementById("fail-desc-en").textContent = pokedex[name];
    document.getElementById("fail-desc-ja").textContent = pokedexJP[name];
    // ★ ここまで追加

    if (combo > best) {
        best = combo;
        localStorage.setItem("bestScore", best);
    }

    localStorage.setItem("lastScore", combo);

    document.getElementById("best-score").textContent = `最高記録：${best} 問`;

    combo = 0;
}


    


document.getElementById("retry-btn").addEventListener("click", () => {
    combo = 0;
    document.getElementById("main").style.display = "block";
    document.getElementById("gameover-box").style.display = "none";
    nextQuestion();
});

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
function makeBlank(description, name) {
    function normalizeWord(w) {
        return w.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    const exclude = [/* 省略（あなたの元コードのまま） */];

    const normalizedExclude = exclude.map(normalizeWord);

    const originalWords = description.split(" ");
    const cleaned = description.replace(/[.,!?;:]/g, "");
    const cleanedWords = cleaned.split(" ");

    const candidates = cleanedWords
        .map((w, i) => ({ word: w, index: i }))
        .filter(obj => {
            const nw = normalizeWord(obj.word);
            return !normalizedExclude.includes(nw) && nw.length > 2 && nw !== normalizeWord(name);
        });

    const targetIndex = candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)].index
        : Math.floor(Math.random() * cleanedWords.length);

    const answer = cleanedWords[targetIndex];
    originalWords[targetIndex] = `<span class="blank">_____</span>`;

    return {
        question: originalWords.join(" "),
        answer: answer
    };
}

// ===============================
// X（旧Twitter）投稿
// ===============================
document.getElementById("tweet-btn").addEventListener("click", () => {
    const score = Number(localStorage.getItem("lastScore") || 0);

    const text = `【実践モード記録】\n${score}連続正解を達成しました！\n#英語を勉強するテイでポケモン図鑑を見れる場所 \n#Pokedex Index`;

    const url = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text);

    window.open(url, "_blank");
});
