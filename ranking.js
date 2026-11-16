// =========================================================
// 60秒タイムアタックの週間ランキング（ranking.js）
// ・ニックネームだけで参加（裏では Firebase の匿名ログインで端末ごとに見分ける）
// ・記録は Firestore の ta60/{週の番号}/scores/{利用者ID} に1人1枠
// ・ズル対策はサーバー側のルール（firestore.rules）でも確かめている
//   スタートの記録から58〜150秒の間に送られた、1〜50問の記録だけ受け付ける
// ・日本時間の月曜0時にリセット
// =========================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {
    getFirestore, doc, getDoc, setDoc, serverTimestamp,
    collection, query, orderBy, limit, getDocs, where, getCountFromServer
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const app = initializeApp({
    apiKey: "AIzaSyCPBm2N4JjdJPF4E4zTonB5n8bKIWVmGhs",
    authDomain: "monspe-ranking.firebaseapp.com",
    projectId: "monspe-ranking",
    storageBucket: "monspe-ranking.firebasestorage.app",
    messagingSenderId: "69937495220",
    appId: "1:69937495220:web:24abf01a9bd9dce85cebe1"
});
const auth = getAuth(app);
const db = getFirestore(app);

const WEEK_MS = 604800000;
const OFFSET = 291600000; // 日本時間（+9時間）で月曜0時に切り替わるようにずらす
const MAX_SCORE = 50;
const NAME_KEY = "rankName";
const CACHE_KEY = "rankTopCache";

// ---------- 週 ----------
function weekId(t) { return String(Math.floor(((t || Date.now()) + OFFSET) / WEEK_MS)); }
function nextReset() { return (Number(weekId()) + 1) * WEEK_MS - OFFSET; }
function resetText() {
    const left = nextReset() - Date.now();
    const d = Math.floor(left / 86400000), h = Math.floor(left % 86400000 / 3600000);
    return d > 0 ? `あと${d}日${h}時間でリセット` : `あと${h}時間${Math.floor(left % 3600000 / 60000)}分でリセット`;
}

// ---------- ログイン（匿名） ----------
let userP = null;
function ensureUser() {
    if (!userP) {
        userP = new Promise((resolve, reject) => {
            const stop = onAuthStateChanged(auth, u => {
                if (u) { stop(); resolve(u.uid); }
            });
            auth.authStateReady().then(() => {
                if (!auth.currentUser) signInAnonymously(auth).catch(e => { userP = null; reject(e); });
            });
        });
    }
    return userP;
}

// ---------- ニックネーム ----------
const BAD = /(http|www|\.com|@|＠|死ね|しね|シネ|ころす|殺す|きもい|キモい|うざい|ちんこ|まんこ|うんこ|fuck|shit|sex)/i;
function checkName(n) {
    n = (n || "").trim();
    if (!n) return "ニックネームを入れてね";
    if ([...n].length > 10) return "ニックネームは10文字までです";
    if (/[0-9０-９]{4,}/.test(n)) return "数字を4つ以上続けて使うことはできません";
    if (BAD.test(n)) return "使えない言葉が入っています";
    return "";
}
function savedName() { try { return localStorage.getItem(NAME_KEY) || ""; } catch (e) { return ""; } }
function saveName(n) { try { localStorage.setItem(NAME_KEY, n); } catch (e) {} }

// ---------- 記録 ----------
let runStartedAt = 0;   // サーバーにスタート時刻が記録された（と分かった）時刻
async function startRun() {
    runStartedAt = Date.now();
    try {
        const uid = await ensureUser();
        await setDoc(doc(db, "runs", uid), { start: serverTimestamp() });
        runStartedAt = Date.now();
    } catch (e) { /* つながらなくてもゲームはそのまま遊べる */ }
}

async function myEntry() {
    const uid = await ensureUser();
    const snap = await getDoc(doc(db, "ta60", weekId(), "scores", uid));
    return snap.exists() ? snap.data() : null;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// 送信。戻り値 { ok, reason, rank, score }
async function submit(name, score) {
    const err = checkName(name);
    if (err) return { ok: false, reason: err };
    score = Math.floor(Number(score) || 0);
    if (score < 1) return { ok: false, reason: "1問以上正解すると登録できます" };
    if (score > MAX_SCORE) return { ok: false, reason: "この記録は登録できません" };
    const uid = await ensureUser();
    const ref = doc(db, "ta60", weekId(), "scores", uid);
    const old = await getDoc(ref);
    if (old.exists() && old.data().score > score) {
        return { ok: false, reason: "keep", score: old.data().score, rank: await rankOf(old.data().score) };
    }
    // スタートから58秒たっていなければ待つ
    const wait = runStartedAt ? runStartedAt + 58800 - Date.now() : 0;
    if (wait > 0) await sleep(wait);
    for (let i = 0; i < 2; i++) {
        try {
            await setDoc(ref, { name: name.trim(), score, at: serverTimestamp() });
            saveName(name.trim());
            try { sessionStorage.removeItem(CACHE_KEY); } catch (e) {}
            return { ok: true, score, rank: await rankOf(score) };
        } catch (e) {
            if (i === 0) { await sleep(2500); continue; }
            return { ok: false, reason: "登録できませんでした。スタートから時間がたちすぎたか、通信がうまくいかなかったようです。もう一度挑戦してね" };
        }
    }
}

// 自分より上の人数＋1
async function rankOf(score) {
    const q = query(collection(db, "ta60", weekId(), "scores"), where("score", ">", score));
    const c = await getCountFromServer(q);
    return c.data().count + 1;
}

// 上位（3分間は同じ結果を使って、読み取り回数を節約）
async function top(n) {
    n = n || 30;
    try {
        const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null");
        if (c && c.week === weekId() && c.n >= n && Date.now() - c.t < 180000) return c.list.slice(0, n);
    } catch (e) {}
    const q = query(collection(db, "ta60", weekId(), "scores"), orderBy("score", "desc"), limit(n));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, name: d.data().name, score: d.data().score, at: d.data().at ? d.data().at.toMillis() : 0 }));
    list.sort((a, b) => (b.score - a.score) || (a.at - b.at));
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ week: weekId(), n, t: Date.now(), list })); } catch (e) {}
    return list;
}

// ---------- 表示 ----------
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const MEDAL = ["🥇", "🥈", "🥉"];

function listHtml(list, myId) {
    if (!list.length) return `<p class="rk-empty">今週はまだだれも登録していません。1位になるチャンス！</p>`;
    let rank = 0, prev = null;
    return `<ol class="rk-list">${list.map((r, i) => {
        if (r.score !== prev) { rank = i + 1; prev = r.score; }
        const me = r.id === myId;
        return `<li class="${me ? "me" : ""} ${rank <= 3 ? "top" + rank : ""}">` +
            `<span class="rk-no">${rank <= 3 ? MEDAL[rank - 1] : rank}</span>` +
            `<span class="rk-name">${esc(r.name)}${me ? '<small>あなた</small>' : ""}</span>` +
            `<span class="rk-score">${r.score}<small>問</small></span></li>`;
    }).join("")}</ol>`;
}

// 実践モードの結果画面に出す箱
async function showResultBox(score) {
    const host = document.getElementById("gameover-box");
    if (!host) return;
    let box = document.getElementById("rank-box");
    if (!box) {
        box = document.createElement("section");
        box.id = "rank-box";
        const flex = document.getElementById("fail-flex");
        host.insertBefore(box, flex ? flex.nextSibling : host.firstChild);
    }
    box.style.display = "";
    box.innerHTML = `<h3>⚡ 今週のランキング <small>${resetText()}</small></h3><div class="rk-status">読みこみ中…</div><div class="rk-body"></div>`;
    const status = box.querySelector(".rk-status");
    const body = box.querySelector(".rk-body");

    const render = async (msg) => {
        status.innerHTML = msg;
        try {
            const uid = await ensureUser();
            body.innerHTML = listHtml(await top(10), uid) + `<a class="rk-more" href="ranking.html">ランキングをすべて見る →</a>`;
        } catch (e) { body.innerHTML = ""; }
    };

    const send = async (name) => {
        status.textContent = "登録中…";
        let r;
        try { r = await submit(name, score); } catch (e) { r = { ok: false, reason: "通信がうまくいきませんでした" }; }
        if (r.ok) await render(`<b>${esc(name)}</b> さんの記録 <b>${r.score}問</b> を登録しました！ 今週 <b class="rk-big">${r.rank}位</b>`);
        else if (r.reason === "keep") await render(`今週の自己ベスト <b>${r.score}問</b>（${r.rank}位）はそのまま残っています。`);
        else { await render(esc(r.reason)); if (/ニックネーム|文字|言葉|数字/.test(r.reason)) askName(r.reason); }
    };

    const askName = (err) => {
        status.innerHTML =
            `<form class="rk-form">` +
            `<label>ニックネームで参加（10文字まで。本名は書かないでね）</label>` +
            `<div><input maxlength="10" value="${esc(savedName())}" placeholder="ニックネーム" autocomplete="off">` +
            `<button type="submit">ランキングに登録</button></div>` +
            (err ? `<p class="rk-err">${esc(err)}</p>` : "") + `</form>`;
        const f = status.querySelector("form");
        f.addEventListener("submit", e => {
            e.preventDefault();
            const n = f.querySelector("input").value.trim();
            const bad = checkName(n);
            if (bad) { askName(bad); return; }
            send(n);
        });
        // 結果画面のスペースキー操作と混ざらないように
        f.querySelector("input").addEventListener("keydown", e => e.stopPropagation(), true);
    };

    if (score < 1) { await render("1問以上正解すると、ランキングに登録できます。"); return; }
    if (score > MAX_SCORE) { await render("この記録はランキングに登録できません。"); return; }
    const name = savedName();
    if (name && !checkName(name)) send(name);
    else { askName(""); try { const uid = await ensureUser(); body.innerHTML = listHtml(await top(10), uid) + `<a class="rk-more" href="ranking.html">ランキングをすべて見る →</a>`; } catch (e) {} }
}

// スタート画面に今週の1位を出す
async function showStartHint() {
    const el = document.getElementById("ss-rank");
    if (!el) return;
    ensureUser().catch(() => {});   // スタート前にログインを済ませておく
    try {
        const t = await top(10);
        el.innerHTML = t.length
            ? `今週の1位 <b>${esc(t[0].name)}</b> さん ${t[0].score}問　<a href="ranking.html">ランキング</a>`
            : `今週のランキングはまだ空っぽ。最初の1位になろう！　<a href="ranking.html">ランキング</a>`;
    } catch (e) { el.textContent = ""; }
}

window.MonspeRank = { weekId, nextReset, resetText, ensureUser, startRun, submit, top, myEntry, rankOf, checkName, savedName, saveName, listHtml, showResultBox, showStartHint };
window.dispatchEvent(new Event("monspe-rank-ready"));
