// =========================================================
// 穴埋めクイズで「答えにする単語」を選ぶ（練習モード・実践モード共通）
//   ・ポケモンの名前（どのポケモンでも）、Pokémon、地名などの固有名詞は答えにしない
//   ・the や is のような簡単すぎる単語、3文字以下の単語も答えにしない
// =========================================================
const QUIZ_EASY_WORDS = new Set((
    "a an the and or but nor so yet for of to in on at by as up down off out over under into onto from with without within " +
    "about above after again against all also although always am any are aren't around away back be became because become becomes " +
    "been before being below between both can can't cannot could did didn't do does doesn't doing done don't each either else even " +
    "ever every few first get gets go goes going gone got had has hasn't have haven't having he her here hers him his how however " +
    "i if is isn't it it's its itself just keep keeps kind least less let like likely lot lots made make makes many may might more " +
    "most much must my never new next no not now often once one ones only other others our out own part put rather really said same " +
    "see seen she should since so some something sometimes soon still such take takes than that that's their theirs them themselves " +
    "then there there's these they they're thing things this those though through thus too two three four five very want wants was " +
    "wasn't way ways we well were weren't what when where whether which while who whom whose why will with won't would yes you your " +
    "able across along among another anything become behind beside besides beyond come comes came during enough everything else " +
    "here's instead itself less little long look looks looked many near nearly once onto per perhaps quite seems seem seemed shall " +
    "someone somehow toward towards upon used uses using whenever wherever whose year years time times day days good bad big small " +
    "great high low old young said says says also even ever pokemon pokémon pokemons"
).split(/\s+/));

function quizNorm(w) {
    return String(w).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
        .replace(/[’‘`]/g, "'").replace(/'s$/, "").replace(/[^a-z'\-]/g, "");
}

let quizNameSet = null;
function quizPokemonNames() {
    if (quizNameSet) return quizNameSet;
    const s = new Set();
    try {
        const keys = (typeof pokemonNames !== "undefined" && pokemonNames.length) ? pokemonNames
            : (typeof pokedex !== "undefined" ? Object.keys(pokedex) : []);
        keys.forEach(k => {
            const n = quizNorm(k); if (!n) return;
            s.add(n); s.add(n.replace(/[-'.]/g, ""));
            n.split(/[-\s]/).forEach(p => { if (p.length > 3) s.add(p); });   // mr-mime → mime など
        });
    } catch (e) { }
    if (s.size) quizNameSet = s;
    return s;
}

function makeBlank(description, name) {
    const names = quizPokemonNames();
    const own = quizNorm(name || "");
    const words = String(description).split(" ");
    const candidates = [];
    words.forEach((raw, i) => {
        // 単語の前後の記号を外す（"Cubone's" → Cubone, "death." → death）
        const m = raw.match(/^([^A-Za-zÀ-ÿ]*)([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’\-]*[A-Za-zÀ-ÿ]|[A-Za-zÀ-ÿ])([^A-Za-zÀ-ÿ]*)$/);
        if (!m) return;
        let core = m[2];
        let tail = m[3];
        const poss = core.match(/['’]s$/i);
        if (poss) { tail = core.slice(-2) + tail; core = core.slice(0, -2); }
        const n = quizNorm(core);
        if (n.length < 4) return;                                 // 3文字以下は簡単すぎる
        if (QUIZ_EASY_WORDS.has(n)) return;                       // the, this, their などは除外
        if (/['’]/.test(core)) return;                            // can't などの短縮形
        if (n === own || names.has(n) || names.has(n.replace(/[-']/g, ""))) return;   // ポケモンの名前
        if (n.startsWith(own) && own.length > 3) return;          // Pikachu の変化形など
        const sentenceStart = i === 0 || /[.!?]["”’)]*$/.test(words[i - 1]);
        if (/^[A-ZÀ-Ý]/.test(core) && !sentenceStart) return;    // 文の途中の大文字＝地名・人名などの固有名詞
        candidates.push({ i, lead: m[1], core, tail });
    });
    let pick = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null;
    if (!pick) {
        // 候補が無いとき（ごく短い文）は、いちばん長い単語
        let best = null;
        words.forEach((raw, i) => {
            const m = raw.match(/^([^A-Za-z]*)([A-Za-z][A-Za-z\-]*)(.*)$/);
            if (m && (!best || m[2].length > best.core.length)) best = { i, lead: m[1], core: m[2], tail: m[3] };
        });
        pick = best || { i: 0, lead: "", core: words[0], tail: "" };
    }
    const shown = words.slice();
    shown[pick.i] = pick.lead + '<span class="blank">_____</span>' + pick.tail;
    return { question: shown.join(" "), answer: pick.core };
}
