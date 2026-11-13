// =========================================================
// ブックマーク機能（bookmark.js）
// ・ポケモンの画像の横に「☆ブックマーク」ボタンを自動で付ける
// ・保存先はブラウザの localStorage（キー：bookmarks）
// ・practice.html?bm=1 のときは、ブックマークしたポケモンだけ出題する
// =========================================================

const BM_KEY = "bookmarks";

function bmLoad() {
    try {
        const v = JSON.parse(localStorage.getItem(BM_KEY) || "[]");
        return Array.isArray(v) ? v.filter(x => x && typeof x.name === "string") : [];
    } catch (e) {
        return [];
    }
}

function bmSave(list) {
    try { localStorage.setItem(BM_KEY, JSON.stringify(list)); } catch (e) {}
}

function bmHas(name) {
    return bmLoad().some(x => x.name === name);
}

function bmCount() {
    return bmLoad().length;
}

function bmAdd(name) {
    if (!name || bmHas(name)) return;
    const list = bmLoad();
    list.push({ name: name, at: Date.now() });
    bmSave(list);
}

function bmRemove(name) {
    bmSave(bmLoad().filter(x => x.name !== name));
}

function bmToggle(name) {
    if (bmHas(name)) { bmRemove(name); return false; }
    bmAdd(name); return true;
}

// 画像の src から英語名を取り出す（pokemon_sprites/mr. mime.png → "mr. mime"）
function bmNameFromImg(img) {
    const src = img.getAttribute("src") || "";
    const m = src.match(/pokemon_sprites\/(.+)\.png/);
    return m ? decodeURIComponent(m[1]) : null;
}

// ---------- 小さなお知らせ ----------
function bmToast(text) {
    let box = document.getElementById("bm-toast");
    if (!box) {
        box = document.createElement("div");
        box.id = "bm-toast";
        document.body.appendChild(box);
    }
    box.textContent = text;
    box.classList.add("show");
    clearTimeout(box._t);
    box._t = setTimeout(() => box.classList.remove("show"), 1600);
}

// ---------- 画像の横にボタンを付ける ----------
function bmAttachTo(img) {
    if (!img || img.dataset.bmAttached) return;
    img.dataset.bmAttached = "1";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bm-btn";
    img.insertAdjacentElement("afterend", btn);

    const refresh = () => {
        const name = bmNameFromImg(img);
        btn.style.display = name ? "" : "none";
        const on = name && bmHas(name);
        btn.classList.toggle("on", !!on);
        btn.textContent = on ? "★ ブックマーク済み" : "☆ ブックマーク";
        btn.title = on ? "もう一度押すとブックマークを外します" : "このポケモンをブックマークに追加します";
    };

    btn.addEventListener("click", () => {
        const name = bmNameFromImg(img);
        if (!name) return;
        const on = bmToggle(name);
        refresh();
        bmToast(on ? "ブックマークに追加しました" : "ブックマークを外しました");
    });

    new MutationObserver(refresh).observe(img, { attributes: true, attributeFilter: ["src"] });
    refresh();
}

// ---------- 苦手リスト（まちがえたあと、まだ正解していないポケモン） ----------
function bmWrongList() {
    try {
        const ex = JSON.parse(localStorage.getItem("statsEx") || "{}");
        const pending = ex.wrongPending || {}, by = ex.wrongBy || {};
        return Object.keys(pending).filter(n => pending[n]).map(n => ({ name: n, count: by[n] || 1 }));
    } catch (e) {
        return [];
    }
}

// ---------- 練習モード：ブックマークだけ出題 ----------
function bmSetupPracticeFilter() {
    const params = new URLSearchParams(location.search);
    const mode = params.get("bm");
    if (mode !== "1" && mode !== "wrong") return;
    if (typeof window.showRandomPokemon !== "function" || typeof window.showPokemon !== "function") return;

    const names = mode === "wrong" ? bmWrongList().map(x => x.name) : bmLoad().map(x => x.name);
    if (names.length === 0) return;

    let last = null;
    window.showRandomPokemon = function () {
        const pool = names.filter(n => typeof pokedex === "object" && pokedex[n]);
        if (pool.length === 0) return;
        let pick = pool[Math.floor(Math.random() * pool.length)];
        if (pool.length > 1 && pick === last) {
            pick = pool[(pool.indexOf(pick) + 1) % pool.length];
        }
        last = pick;
        window.showPokemon(pick);
    };

    const note = document.createElement("div");
    note.className = "bm-mode-note";
    note.innerHTML = mode === "wrong"
        ? `✎ まだ正解できていない ${names.length} 匹だけで出題中（正解すると苦手リストから消えます）　<a href="practice.html">ふつうの練習にもどす</a>`
        : `★ ブックマークした ${names.length} 匹だけで出題中　<a href="practice.html">ふつうの練習にもどす</a>`;
    const header = document.getElementById("site-header") || document.body.firstElementChild;
    header.insertAdjacentElement("afterend", note);
}

// ---------- 起動 ----------
bmSetupPracticeFilter();

function bmInit() {
    ["poke-img", "fail-poke-img"].forEach(id => bmAttachTo(document.getElementById(id)));

    // ホームの「ブックマーク」ボタンに登録数を出す
    const cnt = document.getElementById("bm-home-count");
    if (cnt) {
        const w = bmWrongList().length;
        cnt.textContent = `${bmCount()} 匹を登録中` + (w ? `／苦手 ${w} 匹` : "");
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bmInit);
} else {
    bmInit();
}
