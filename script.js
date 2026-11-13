let combo = 0;  // 連続正解数
let pokedex = {};
let pokedexJP = {};
let pokedexStats = {};
let pokemonNames = [];
let jpNameMap = {}; // 英語名 → 日本語名

// ===============================
// 回答判定
// ===============================
document.getElementById("check-answer-btn").addEventListener("click", checkAnswer);
document.getElementById("answer-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkAnswer();
});

function checkAnswer() {
    const userAnswer = document.getElementById("answer-input").value.trim().toLowerCase();
    const correct = window.currentAnswer.toLowerCase();

    const judge = document.getElementById("judge");
    const comboText = document.getElementById("combo");

    if (userAnswer === correct) {
        judge.textContent = "正解！";
        judge.style.color = "green";

        combo++;
        comboText.textContent = `連続正解数：${combo}`;

        // ★ メダル・実績用：正解を記録
        medalOnCorrect(window.currentPokemon, window.currentAnswer, "practice", combo);

        // 次の問題を自動で出す（任意）
        setTimeout(() => {
            document.getElementById("answer-input").value = "";
            judge.textContent = "";
            showRandomPokemon();
        }, 800);

    } else {
        judge.textContent = `不正解… 正解は「${window.currentAnswer}」`;
        judge.style.color = "red";

        combo = 0;
        comboText.textContent = `連続正解数：0`;

        // ★ 実績用：不正解を記録
        medalOnWrong();
    }
}



async function loadData() {
    // 英語
    const resEn = await fetch("pokedex_en.json");
    pokedex = await resEn.json();

    // 日本語
    const resJp = await fetch("pokedex_jp.json");
    pokedexJP = await resJp.json();

    // 日本語名（英語名→日本語名）
    const resName = await fetch("pokemon_names_jp.json");
    jpNameMap = await resName.json();

    // 種族値
    const resStats = await fetch("pokedex_stats.json");
    pokedexStats = await resStats.json();

    pokemonNames = Object.keys(pokedex);

    setupSearch();
    showRandomPokemon();
}



// ===============================
// ランダム表示
// ===============================
function showRandomPokemon() {
    const name = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
    showPokemon(name);
}


// ===============================
// 指定ポケモンを表示（検索でも使用）
// ===============================
function showPokemon(name) {
    // ★ メダル用：今のポケモンを覚えて遭遇を記録
    window.currentPokemon = name;
    medalRecordSeen(name);

    // 画像
    const imgPath = `pokemon_sprites/${name}.png`;

    // 英語説明
    const description = pokedex[name];

    // 穴あき処理
    const result = makeBlank(description, name);
    document.getElementById("desc").innerHTML = result.question;

    // 正解保存
    window.currentAnswer = result.answer;

    // 日本語訳
    const jaText = pokedexJP[name];
    document.getElementById("desc-ja").textContent = jaText;

    // 答え欄リセット
    document.getElementById("answer").textContent = "";

    // ★ 正誤判定のリセット（ここを追加）
    document.getElementById("judge").textContent = "";
    document.getElementById("answer-input").value = "";

    // HTML反映
    document.getElementById("poke-img").src = imgPath;
    document.getElementById("poke-name").textContent = name;

    // 種族値
    const stats = pokedexStats[name];
    drawRadarChart(stats);
}



// ===============================
// レーダーチャート
// ===============================
let chartInstance = null;

function drawRadarChart(stats) {
    const ctx = document.getElementById("stats-chart").getContext("2d");

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: "radar",
        data: {
            labels: ["HP", "こうげき", "ぼうぎょ", "すばやさ", "とくぼう", "とくこう"],
            datasets: [{
                label: "Base Stats",
                data: [
                    stats["hp"],
                    stats["attack"],
                    stats["defense"],
                    stats["speed"],
                    stats["special-defense"],
                    stats["special-attack"],
                ],
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 2,
                pointBackgroundColor: "rgba(255, 99, 132, 1)"
            }]
        },
        options: {
            plugins: {
                datalabels: {
                    color: "#000",
                    font: {
                        weight: "bold",
                        size: 14
                    },
                    formatter: (value) => value,
                    align: "end",
                    anchor: "end"
                }
            },
            scales: {
                r: {
                    suggestedMin: 0,
                    suggestedMax: 150,
                    ticks: {
                        display: false
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}



 // ===============================
// 穴あき処理（完全版）
// ===============================
function makeBlank(description, name) {

    // アクセント除去＋小文字化
    function normalizeWord(w) {
        return w
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    }

    // 除外ワード（大文字小文字混在OK）
    const exclude = [
        "About","Above","After","Again","All","Although","Always","And","Any","As",
        "Because","Before","Below","Both","But","By","Can't","Each","Either","Ever",
        "Every","Few","For","From","Here","How","I","If","In","Into","Is","It","Its",
        "Just","Least","Less","Many","More","Most","Much","Now","Of","On","Once","One",
        "Only","Or","Over","Pokemon","Pokémon","Since","Some","Sometimes","Such","Than","That",
        "The","Their","Them","Then","There","These","They","This","Though","Through",
        "To","Under","Until","Very","Was","We","Were","What","When","Where","Which",
        "While","Who","Whom","Whose","Why","Will","With","Without","Would","Yet","You",
        "about","above","after","again","all","although","always","and","any","as",
        "because","before","below","both","but","by","can","can't","each","either",
        "ever","every","few","for","from","has","here","how","if","in","into","is","it",
        "its","it's","just","least","less","out","many","more","most","much","now",
        "of","on","once","one","only","or","over","since","some","sometimes","such",
        "than","that","the","their","them","then","there","these","they","this",
        "though","through","to","under","until","very","was","we","were","what",
        "when","where","which","while","who","whom","whose","why","will","with",
        "without","would","yet","you"
    ];

    // 除外ワードを正規化しておく
    const normalizedExclude = exclude.map(normalizeWord);

    // 元の文章を単語に分割（表示用）
    const originalWords = description.split(" ");

    // 記号を除去したバージョン（穴あき判定用）
    const cleaned = description.replace(/[.,!?;:]/g, "");
    const cleanedWords = cleaned.split(" ");

    // 候補抽出
    const candidates = cleanedWords
        .map((w, i) => ({ word: w, index: i }))
        .filter(obj => {
            const nw = normalizeWord(obj.word);
            return (
                !normalizedExclude.includes(nw) &&     // 除外ワードではない
                nw.length > 2 &&                       // 3文字以上
                nw !== normalizeWord(name)             // ポケモン名ではない
            );
        });

    // 穴を開ける単語のインデックス
    const targetIndex = candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)].index
        : Math.floor(Math.random() * cleanedWords.length);

    const answer = cleanedWords[targetIndex];

    // 表示用の originalWords に穴を開ける
    originalWords[targetIndex] = `<span class="blank">_____</span>`;

    return {
        question: originalWords.join(" "),
        answer: answer
    };
}



function hiraToKata(str) {
    return str.replace(/[\u3041-\u3096]/g, ch =>
        String.fromCharCode(ch.charCodeAt(0) + 0x60)
    );
}

// ===============================
// 検索機能
// ===============================
function setupSearch() {
    const searchBox = document.getElementById("search-box");
    const searchResults = document.getElementById("search-results");

 searchBox.addEventListener("input", () => {
    const raw = searchBox.value;
    const keyword = raw.toLowerCase();
    const kanaKeyword = hiraToKata(raw); // ★ ひらがな→カタカナ変換

    searchResults.innerHTML = "";
    if (keyword.length === 0) return;

    const matches = [];

    // 英語名で検索
    pokemonNames.forEach(en => {
        if (en.includes(keyword)) {
            matches.push(en);
        }
    });

    // 日本語名で検索（カタカナ対応）
    Object.entries(jpNameMap).forEach(([en, jp]) => {
        if (jp.includes(kanaKeyword)) {   // ← ここがポイント
            matches.push(en);
        }
    });

    // 重複削除
    const unique = [...new Set(matches)];

    unique.forEach(name => {
        const li = document.createElement("li");
        const id = pokedexStats[name]?.id ?? "???";  // ← 3桁の図鑑番号
        li.textContent = `#${id}  ${jpNameMap[name]} (${name})`;

        li.onclick = () => {
            showPokemon(name);
            searchResults.innerHTML = "";
            searchBox.value = "";
        };
        searchResults.appendChild(li);
    });
});

}






// ===============================
// 初期化
// ===============================
loadData();

