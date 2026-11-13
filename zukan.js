let pokedex = {};
let pokedexJP = {};
let pokedexStats = {};
let pokemonNames = [];
let jpNameMap = {};
let currentIndex = 0;  // 図鑑番号（0始まり）

function showPokemon(name) {
    // 図鑑番号を保存
    currentIndex = pokedexStats[name].id - 1;  // id は 1始まりなので -1
}

async function loadData() {
    const resEn = await fetch("pokedex_en.json");
    pokedex = await resEn.json();

    const resJp = await fetch("pokedex_jp.json");
    pokedexJP = await resJp.json();

    const resName = await fetch("pokemon_names_jp.json");
    jpNameMap = await resName.json();

    const resStats = await fetch("pokedex_stats.json");
    pokedexStats = await resStats.json();

    pokemonNames = Object.keys(pokedex);

    pokemonNames = Object.keys(pokedexStats).filter(n => pokedex[n]).sort((a, b) => {
        return pokedexStats[a].id - pokedexStats[b].id;
    });

    setupSearch();

    // ブックマーク一覧から来たときは、そのポケモンを表示する
    const wanted = new URLSearchParams(location.search).get("p");
    if (wanted && pokedex[wanted]) {
        showPokemon(wanted);
    } else {
        showRandomPokemon();
    }


}

function showRandomPokemon() {
    const name = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
    showPokemon(name);
}

function showPokemon(name) {

    currentIndex = pokemonNames.indexOf(name);

    // ★ 実績用：図鑑で読んだポケモンを記録
    medalOnZukan(name);


    document.getElementById("poke-img").src = `pokemon_sprites/${name}.png`;
    document.getElementById("poke-name").textContent = name;

    // ★ 穴あきなし → 英語説明をそのまま表示
    document.getElementById("desc").textContent = pokedex[name];

    // 日本語説明
    document.getElementById("desc-ja").textContent = pokedexJP[name];

    // 種族値
    drawRadarChart(pokedexStats[name]);
}

let chartInstance = null;

function drawRadarChart(stats) {
    const ctx = document.getElementById("stats-chart").getContext("2d");

    if (chartInstance) chartInstance.destroy();

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
                    font: { weight: "bold", size: 14 },
                    formatter: v => v,
                    align: "end",
                    anchor: "end"
                }
            },
            scales: {
                r: {
                    suggestedMin: 0,
                    suggestedMax: 150,
                    ticks: { display: false }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function hiraToKata(str) {
    return str.replace(/[\u3041-\u3096]/g, ch =>
        String.fromCharCode(ch.charCodeAt(0) + 0x60)
    );
}

function setupSearch() {
    const searchBox = document.getElementById("search-box");
    const searchResults = document.getElementById("search-results");

    searchBox.addEventListener("input", () => {
        const raw = searchBox.value;
        const keyword = raw.toLowerCase();
        const kanaKeyword = hiraToKata(raw);

        searchResults.innerHTML = "";
        if (keyword.length === 0) return;

        const matches = [];

        pokemonNames.forEach(en => {
            if (en.includes(keyword)) matches.push(en);
        });

        Object.entries(jpNameMap).forEach(([en, jp]) => {
            if (jp.includes(kanaKeyword)) matches.push(en);
        });

        const unique = [...new Set(matches)];

        unique.forEach(name => {
            const li = document.createElement("li");
            const id = pokedexStats[name]?.id ?? "???";
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

function showNextPokemon() {
    currentIndex++;
    if (currentIndex >= pokemonNames.length) currentIndex = 0;

    const nextName = pokemonNames[currentIndex];
    showPokemon(nextName);
}

function showPrevPokemon() {
    currentIndex--;
    if (currentIndex < 0) currentIndex = pokemonNames.length - 1;

    const prevName = pokemonNames[currentIndex];
    showPokemon(prevName);
}


loadData();
