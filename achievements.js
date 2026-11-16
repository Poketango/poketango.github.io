// ===============================
// 地方ごとのメダル表示（データは medals.js）
// ===============================
// 前に見たときから増えたもの（NEW を付ける）
let COLL_UNSEEN = new Set();

async function renderMedals() {
    await medalReady;
    COLL_UNSEEN = new Set(collUnseenIds());

    const owned = new Set(medalLoad("medals"));
    const board = document.getElementById("medal-board");
    const tierCount = { bronze: 0, silver: 0, gold: 0 };
    const titles = [];

    MEDAL_REGIONS.forEach(region => {
        const card = document.createElement("div");
        card.className = "region-card";

        let got = 0;
        let rows = "";

        MEDAL_TYPES.forEach(type => {
            const p = medalProgress(region.key, type.key);
            const percent = Math.floor((p.count / p.total) * 100);

            let slots = "";
            MEDAL_TIERS.forEach(tier => {
                const id = `${region.key}-${type.key}-${tier.key}`;
                const has = owned.has(id);
                const goal = medalGoal(tier, p.total);
                const title = MEDAL_TITLES[region.key][type.key][tier.key];
                const label = tier.goal === "all" ? "コンプ" : `${goal}匹`;

                if (has) {
                    got++;
                    tierCount[tier.key]++;
                    titles.push({ isNew: COLL_UNSEEN.has("m:" + id), title, tier: tier.key, msg: MEDAL_MESSAGES[region.key][type.key][tier.key], src: MEDAL_SOURCES[region.key][type.key][tier.key] });
                }

                const tip = has
                    ? `称号「${title}」`
                    : `あと ${Math.max(goal - p.count, 0)} 匹で獲得`;

                const isNew = has && COLL_UNSEEN.has("m:" + id);
                slots += `<div class="medal ${tier.key} ${has ? "got" : ""} ${isNew ? "is-new" : ""}" data-tip="${tip}">` +
                         `<span class="m-icon">${MEDAL_EMOJI[tier.key]}</span>${tier.name}・${label}</div>`;
            });

            rows += `
                <div class="medal-row">
                    <div class="medal-row-head">
                        <span>${type.icon} ${type.name}</span>
                        <span>${p.count} / ${p.total}</span>
                    </div>
                    <div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>
                    <div class="medal-slots">${slots}</div>
                </div>`;
        });

        card.innerHTML = `<h3>${region.name}地方 <small>メダル ${got} / 6</small></h3>${rows}`;
        board.appendChild(card);
    });

    // 実績で手に入れた称号もまとめ欄に加える
    let achOwned = {};
    try { achOwned = JSON.parse(localStorage.getItem("achievements") || "{}"); } catch (e) { achOwned = {}; }
    const achTitles = [];
    for (const key in ACH_TRIVIA) {
        if (!achOwned[key]) continue;
        const a = ACH_LIST.find(x => x.key === key);
        achTitles.push({ isNew: COLL_UNSEEN.has("a:" + key), title: a ? a.name : ACH_EXTRA_NAMES[key], tier: ACH_TIER[key] || "bronze",
                         msg: ACH_TRIVIA[key].msg, src: ACH_TRIVIA[key].src, ach: true });
    }

    // まとめ欄
    const total = MEDAL_REGIONS.length * MEDAL_TYPES.length * MEDAL_TIERS.length;
    const order = { gold: 0, silver: 1, bronze: 2 };
    titles.sort((x, y) => order[x.tier] - order[y.tier]);
    achTitles.sort((x, y) => order[x.tier] - order[y.tier]);
    titles.push(...achTitles);

    const prog = medalOverallProgress();
    const rank = medalRank(prog.got);
    const near = collNearList(4);
    const eq = collEquipped();
    const rankPct = Math.round(rank.ratio * 100);

    document.getElementById("medal-summary").innerHTML = `
        <div class="rank-card">
            <div class="rank-icon">${rank.icon}</div>
            <div class="rank-main">
                <div class="rank-label">トレーナーランク ${rank.index + 1} / ${MEDAL_RANKS.length}</div>
                <div class="rank-name">${rank.name}</div>
                ${rank.next
                    ? `<div class="progress-bar rank-bar"><div class="progress-fill" style="width:${rankPct}%"></div></div>
                       <div class="rank-next">次の「${rank.next.icon}${rank.next.name}」まで、あとメダル <b>${rank.next.need - prog.got}</b> 個</div>`
                    : `<div class="rank-next">最高ランクに到達！</div>`}
            </div>
        </div>
        <div class="rank-ladder">${MEDAL_RANKS.map((r, i) =>
            `<span class="${i < rank.index ? "done" : i === rank.index ? "now" : ""}" title="${r.name}（メダル${r.need}個）">${i <= rank.index ? r.icon : "？"}</span>`).join("")}</div>

        ${near.length ? `
        <div class="near-box">
            <div class="near-head">🎯 もうすぐ手に入る</div>
            ${near.map(n => `
                <div class="near-item ${n.tier}">
                    <span class="near-icon">${n.icon}</span>
                    <div class="near-body">
                        <div class="near-name">${n.kind === "medal" ? `称号「${n.title}」<small>${n.name}</small>` : n.name}</div>
                        <div class="progress-bar"><div class="progress-fill" style="width:${Math.floor(n.ratio * 100)}%"></div></div>
                    </div>
                    <span class="near-left">あと<b>${n.left}</b></span>
                </div>`).join("")}
        </div>` : ""}

        <div class="overall-progress">
            <div class="overall-head"><span>全メダルの進捗</span><span>${prog.percent}%（${prog.got} / ${prog.total}）</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${prog.percent}%"></div></div>
            <div class="overall-sub">地方メダル ${prog.regionGot} / ${prog.regionTotal}　・　実績メダル ${prog.achGot} / ${prog.achTotal}</div>
        </div>
        <div class="summary-counts">
            <span>獲得メダル ${owned.size} / ${total}</span>
            <span>称号 ${titles.length}</span>
            <span class="pill">🥇 ${tierCount.gold}</span>
            <span class="pill">🥈 ${tierCount.silver}</span>
            <span class="pill">🥉 ${tierCount.bronze}</span>
        </div>
        ${titles.length ? `<p class="equip-note">称号を押すと、その称号を名乗れます。名乗った称号は、どのページでも上のバッジに表示されます。</p>` : ""}
        ${titles.length
            ? `<div class="title-rows">${titles.map(t =>
                `<div class="title-row"><button type="button" class="title-chip ${t.tier} ${eq && eq.title === t.title ? "equipped" : ""}" data-title="${t.title}" data-tier="${t.tier}">${MEDAL_EMOJI[t.tier]} ${t.title}${t.ach ? '<small class="ach-tag">実績</small>' : ""}${t.isNew ? '<small class="new-tag">NEW</small>' : ""}${eq && eq.title === t.title ? '<small class="eq-tag">名乗り中</small>' : ""}</button><span class="title-msg">${t.msg}<a class="title-src" href="${t.src}" target="_blank" rel="noopener">出典</a></span></div>`
              ).join("")}</div>`
            : `<p class="empty-note">まだ称号はありません。練習モードか実践モードでポケモンに出会ってみましょう。</p>`}
    `;

    // 称号を名乗る（もう一度押すとやめる）
    document.querySelectorAll("#medal-summary .title-chip").forEach(btn => {
        btn.addEventListener("click", () => {
            const cur = collEquipped();
            const title = btn.dataset.title;
            if (cur && cur.title === title) collEquip(null);
            else collEquip(title, btn.dataset.tier);
            const now = collEquipped();
            document.querySelectorAll("#medal-summary .title-chip").forEach(b => {
                const on = !!now && b.dataset.title === now.title;
                b.classList.toggle("equipped", on);
                const tag = b.querySelector(".eq-tag");
                if (on && !tag) b.insertAdjacentHTML("beforeend", '<small class="eq-tag">名乗り中</small>');
                if (!on && tag) tag.remove();
            });
        });
    });
}

const medalsDone = renderMedals();

// ===============================
// 連続正解進捗
// ===============================
const bestScore = Number(localStorage.getItem("bestScore") || 0);
const comboPercent = Math.min(Math.floor((bestScore / 50) * 100), 100);

document.getElementById("combo-progress").style.width = comboPercent + "%";
document.getElementById("combo-count").textContent = `${bestScore} / 50`;

// ===============================
// 実績一覧
// ===============================
// ===============================
// 実績一覧（達成済みのみ表示 + ホバー説明）
// ===============================

// ===============================
// 実績一覧（達成済みのみ表示 + ホバー説明）
// ===============================
const achievementInfo = {
    combo10: {
        name: "10連続正解",
        desc: "10問連続で正解すると解除されます。",
        secret: "あなたの集中力は本物です。次は20連続を目指しましょう。"
    },
    combo20: {
        name: "20連続正解",
        desc: "20問連続で正解すると解除されます。",
        secret: "ここまで来た人はほとんどいません。誇っていい記録です。"
    },
    combo50: {
        name: "50連続正解",
        desc: "50問連続で正解すると解除されます。",
        secret: "伝説級の実力です。あなたは真のポケモンマスター。"
    },
    kantoComplete: {
        name: "カントー図鑑コンプリート",
        desc: "カントー地方のポケモンをすべて見つけると解除されます。",
        secret: "初代コンプリート、おめでとうございます。旅はまだ続きます。"
    },
    johtoComplete: {
        name: "ジョウト図鑑コンプリート",
        desc: "ジョウト地方のポケモンをすべて見つけると解除されます。",
        secret: "ジョウト地方を極めたあなたに、心からの敬意を。"
    },
    hoennComplete: {
        name: "ホウエン図鑑コンプリート",
        desc: "ホウエン地方のポケモンをすべて見つけると解除されます。",
        secret: "ホウエンの冒険を制覇したあなたは、まさに探検家。"
    }
};

let achievements = JSON.parse(localStorage.getItem("achievements") || "{}");
const list = document.getElementById("achievement-list");

async function renderAchievements() {
    await medalReady;
    achievements = JSON.parse(localStorage.getItem("achievements") || "{}");

    // 連続正解の実績＋medals.js の実績をまとめる
    // （ジョウト・ホウエンのコンプ実績は金メダルに置き換えたので、取った人にだけ表示）
    const icons = { combo10: "🔥", combo20: "🔥", combo50: "🔥", kantoComplete: "🏆", johtoComplete: "🏆", hoennComplete: "🏆" };
    const all = [];
    for (const key in achievementInfo) {
        const always = key.startsWith("combo");
        if (!always && !achievements[key]) continue;
        all.push({ key, icon: icons[key], ...achievementInfo[key] });
    }
    ACH_LIST.forEach(a => all.push(a));

    const got = all.filter(a => achievements[a.key]);
    const st = achStats(), ex = achEx();
    const progOf = {};
    all.forEach(a => { progOf[a.key] = achProgressOf(a.key, st, ex); });

    const head = document.createElement("h2");
    head.className = "ach-head";
    const mc = achMedalCount();
    head.innerHTML = `実績 ${got.length} / ${all.length}` +
        `<span class="ach-medals">🥇 ${mc.gold}　🥈 ${mc.silver}　🥉 ${mc.bronze}</span>`;
    list.appendChild(head);

    // 絞り込み
    const filters = [["all", "すべて"], ["near", "もうすぐ"], ["locked", "未解除"], ["got", "解除済み"], ["secret", "隠し実績"]];
    const bar = document.createElement("div");
    bar.className = "ach-filter";
    bar.innerHTML = filters.map(([k, n], i) => `<button type="button" data-f="${k}" class="${i === 0 ? "on" : ""}">${n}</button>`).join("");
    list.appendChild(bar);

    // 解除済み（新しいもの優先）→ 進み具合の大きい未解除 → 残り
    const locked = all.filter(a => !achievements[a.key]);
    locked.sort((x, y) => ((progOf[y.key]?.ratio) || 0) - ((progOf[x.key]?.ratio) || 0));
    const gotSorted = [...got].sort((x, y) => (COLL_UNSEEN.has("a:" + y.key) ? 1 : 0) - (COLL_UNSEEN.has("a:" + x.key) ? 1 : 0));

    const cards = [];
    [...gotSorted, ...locked].forEach(a => {
        const has = !!achievements[a.key];
        const tier = ACH_TIER[a.key] || "bronze";
        const secret = !has && !!ACH_SECRET_HINTS[a.key];
        const p = progOf[a.key];
        const div = document.createElement("div");
        div.classList.add("achievement", tier);
        div.dataset.state = has ? "got" : "locked";
        if (secret || (ACH_SECRET_HINTS[a.key])) div.dataset.secret = "1";
        if (!has && p && p.ratio >= 0.5) div.dataset.near = "1";

        if (has) {
            div.classList.add("unlocked");
            const isNew = COLL_UNSEEN.has("a:" + a.key);
            if (isNew) div.classList.add("is-new");
            div.innerHTML =
                `<div class="ach-title"><span class="ach-icon">${a.icon || "🏆"}</span>${a.name}` +
                (isNew ? `<span class="new-tag">NEW</span>` : "") +
                `<span class="ach-medal">${MEDAL_EMOJI[tier]}</span></div>` +
                `<p class="ach-secret">${a.secret}</p>` +
                (ACH_TRIVIA[a.key] ? `<p class="ach-trivia">${ACH_TRIVIA[a.key].msg}<a class="title-src" href="${ACH_TRIVIA[a.key].src}" target="_blank" rel="noopener">出典</a></p>` : "");
            div.dataset.desc = a.desc;
        } else if (secret) {
            div.classList.add("locked", "secret");
            div.innerHTML =
                `<div class="ach-title"><span class="ach-icon">❓</span>？？？<span class="ach-medal dim">${MEDAL_EMOJI[tier]}</span></div>` +
                `<p class="ach-hint">ヒント：${ACH_SECRET_HINTS[a.key]}</p>`;
        } else {
            div.classList.add("locked");
            div.innerHTML =
                `<div class="ach-title"><span class="ach-icon">${a.icon || "🏆"}</span>${a.name}<span class="ach-medal dim">${MEDAL_EMOJI[tier]}</span></div>` +
                `<p class="ach-cond">${a.desc}</p>` +
                (p ? `<div class="ach-prog"><div class="progress-bar"><div class="progress-fill" style="width:${Math.floor(p.ratio * 100)}%"></div></div><span>${p.cur} / ${p.goal}</span></div>` : "") +
                `<p class="ach-reward">🎁 解除すると称号と、とっておきのポケモン雑学がもらえる</p>`;
        }
        cards.push(div);
        list.appendChild(div);
    });

    bar.addEventListener("click", e => {
        const b = e.target.closest("button");
        if (!b) return;
        bar.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
        const f = b.dataset.f;
        cards.forEach(c => {
            const show = f === "all" ||
                (f === "got" && c.dataset.state === "got") ||
                (f === "locked" && c.dataset.state === "locked") ||
                (f === "near" && c.dataset.near === "1") ||
                (f === "secret" && c.dataset.secret === "1");
            c.style.display = show ? "" : "none";
        });
    });
}

// メダルと実績を両方描いてから、NEW を「見た」にする
Promise.all([medalsDone, renderAchievements()]).then(() => {
    collMarkAllSeen();
    medalBadgeUpdate();
});
