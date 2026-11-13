// ===============================
// 地方ごとのメダル表示（データは medals.js）
// ===============================
async function renderMedals() {
    await medalReady;

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
                    titles.push({ title, tier: tier.key, msg: MEDAL_MESSAGES[region.key][type.key][tier.key], src: MEDAL_SOURCES[region.key][type.key][tier.key] });
                }

                const tip = has
                    ? `称号「${title}」`
                    : `あと ${Math.max(goal - p.count, 0)} 匹で獲得`;

                slots += `<div class="medal ${tier.key} ${has ? "got" : ""}" data-tip="${tip}">` +
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
        achTitles.push({ title: a ? a.name : ACH_EXTRA_NAMES[key], tier: ACH_TIER[key] || "bronze",
                         msg: ACH_TRIVIA[key].msg, src: ACH_TRIVIA[key].src, ach: true });
    }

    // まとめ欄
    const total = MEDAL_REGIONS.length * MEDAL_TYPES.length * MEDAL_TIERS.length;
    const order = { gold: 0, silver: 1, bronze: 2 };
    titles.sort((x, y) => order[x.tier] - order[y.tier]);
    achTitles.sort((x, y) => order[x.tier] - order[y.tier]);
    titles.push(...achTitles);

    const prog = medalOverallProgress();
    document.getElementById("medal-summary").innerHTML = `
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
        ${titles.length
            ? `<div class="title-rows">${titles.map(t =>
                `<div class="title-row"><span class="title-chip ${t.tier}">${MEDAL_EMOJI[t.tier]} ${t.title}${t.ach ? '<small class="ach-tag">実績</small>' : ""}</span><span class="title-msg">${t.msg}<a class="title-src" href="${t.src}" target="_blank" rel="noopener">出典</a></span></div>`
              ).join("")}</div>`
            : `<p class="empty-note">まだ称号はありません。練習モードか実践モードでポケモンに出会ってみましょう。</p>`}
    `;
}

renderMedals();

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
    const head = document.createElement("h2");
    head.className = "ach-head";
    const mc = achMedalCount();
    head.innerHTML = `実績 ${got.length} / ${all.length}` +
        `<span class="ach-medals">🥇 ${mc.gold}　🥈 ${mc.silver}　🥉 ${mc.bronze}</span>`;
    list.appendChild(head);

    // 解除済みを先に、未解除はあとに
    [...got, ...all.filter(a => !achievements[a.key])].forEach(a => {
        const has = !!achievements[a.key];
        const div = document.createElement("div");
        div.classList.add("achievement");
        if (has) div.classList.add("unlocked", ACH_TIER[a.key] || "bronze");

        if (has) {
            div.innerHTML =
                `<div class="ach-title"><span class="ach-icon">${a.icon || "🏆"}</span>${a.name}` +
                `<span class="ach-medal">${MEDAL_EMOJI[ACH_TIER[a.key] || "bronze"]}</span></div>` +
                `<p class="ach-secret">${a.secret}</p>` +
                (ACH_TRIVIA[a.key] ? `<p class="ach-trivia">${ACH_TRIVIA[a.key].msg}<a class="title-src" href="${ACH_TRIVIA[a.key].src}" target="_blank" rel="noopener">出典</a></p>` : "");
            div.dataset.desc = a.desc;
        } else {
            div.innerHTML =
                `<div class="ach-title"><span class="ach-icon">🔒</span>？？？</div>`;
        }
        list.appendChild(div);
    });
}

renderAchievements();
