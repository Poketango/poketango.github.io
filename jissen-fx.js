// =========================================================
// 実践モードの演出（jissen-fx.js）
// カウントダウン、効果音、コンボの演出、残り時間の警告、新記録の紙ふぶき
// 効果音はすべてブラウザの中で作る（音声ファイルは使わない）
// =========================================================
const FX = (function () {
    let ctx = null;
    let muted = false;
    try { muted = localStorage.getItem("jissenMute") === "1"; } catch (e) {}

    // ---------- 効果音 ----------
    function ac() {
        if (muted) return null;
        try {
            if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (ctx.state === "suspended") ctx.resume();
        } catch (e) { return null; }
        return ctx;
    }
    // 1つの音を鳴らす（at＝何秒後、dur＝長さ）
    function tone(freq, dur, opt) {
        const c = ac(); if (!c) return;
        const o = Object.assign({ type: "square", vol: 0.12, at: 0, slide: 0 }, opt || {});
        const t = c.currentTime + o.at;
        const osc = c.createOscillator(), g = c.createGain();
        osc.type = o.type;
        osc.frequency.setValueAtTime(freq, t);
        if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(o.vol, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g).connect(c.destination);
        osc.start(t); osc.stop(t + dur + 0.02);
    }
    const sfx = {
        count: () => tone(660, 0.16, { vol: 0.14 }),
        go: () => { tone(988, 0.12, { vol: 0.13 }); tone(1319, 0.35, { vol: 0.13, at: 0.1 }); },
        correct: (combo) => {
            const up = Math.min(combo, 20) * 18;           // コンボが続くほど少しずつ高く
            tone(880 + up, 0.07, { type: "triangle", vol: 0.16 });
            tone(1320 + up, 0.14, { type: "triangle", vol: 0.16, at: 0.07 });
        },
        wrong: () => { tone(220, 0.18, { type: "sawtooth", vol: 0.1 }); tone(150, 0.35, { type: "sawtooth", vol: 0.1, at: 0.16 }); },
        tick: (n) => tone(n <= 1 ? 1400 : 1100, 0.05, { vol: 0.08 }),
        milestone: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.12, { type: "triangle", vol: 0.14, at: i * 0.07 })),
        over: () => tone(392, 0.6, { type: "triangle", vol: 0.12, slide: 196 }),
        record: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.5 : 0.13, { type: "square", vol: 0.1, at: i * 0.12 }))
    };

    // ---------- 消音ボタン ----------
    function setupSoundButton() {
        const b = document.getElementById("sound-btn");
        if (!b) return;
        const draw = () => { b.textContent = muted ? "🔇" : "🔊"; b.classList.toggle("off", muted); };
        b.addEventListener("click", () => {
            muted = !muted;
            try { localStorage.setItem("jissenMute", muted ? "1" : "0"); } catch (e) {}
            draw();
            if (!muted) tone(880, 0.08, { type: "triangle", vol: 0.12 });
        });
        draw();
    }

    // ---------- 画面の演出 ----------
    function layer() { return document.getElementById("fx-layer"); }
    function banner(text, sub, cls) {
        const L = layer(); if (!L) return;
        const d = document.createElement("div");
        d.className = "fx-banner " + (cls || "");
        d.innerHTML = `<b>${text}</b>` + (sub ? `<span>${sub}</span>` : "");
        L.appendChild(d);
        setTimeout(() => d.remove(), 1700);
    }
    function plus(text) {
        const box = document.getElementById("question-box"); if (!box) return;
        const d = document.createElement("div");
        d.className = "fx-plus"; d.textContent = text;
        box.appendChild(d);
        setTimeout(() => d.remove(), 800);
    }
    function flash(cls) {
        const box = document.getElementById("question-box"); if (!box) return;
        box.classList.remove("fx-ok", "fx-ng"); void box.offsetWidth; box.classList.add(cls);
    }
    function comboHeat(n) {
        const el = document.getElementById("combo"); if (!el) return;
        el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
        el.classList.toggle("heat1", n >= 5 && n < 10);
        el.classList.toggle("heat2", n >= 10 && n < 20);
        el.classList.toggle("heat3", n >= 20);
    }
    const MILESTONES = { 5: "いい調子！", 10: "すごい！", 15: "その調子！", 20: "止まらない！", 30: "神がかってる！", 40: "まだいける！", 50: "伝説級！", 75: "ありえない…！", 100: "殿堂入り！" };

    // ---------- カウントダウン ----------
    function countdown(done) {
        const box = document.getElementById("countdown");
        const span = box.querySelector("span");
        const steps = ["3", "2", "1", "GO!"];
        let i = 0;
        box.hidden = false;
        function step() {
            const t = steps[i];
            span.textContent = t;
            span.className = t === "GO!" ? "go" : "n" + t;
            span.style.animation = "none"; void span.offsetWidth; span.style.animation = "";
            if (t === "GO!") sfx.go(); else sfx.count();
            i++;
            if (i < steps.length) setTimeout(step, 800);
            else setTimeout(() => { box.hidden = true; done(); }, 550);
        }
        step();
    }

    // ---------- 紙ふぶき ----------
    function confetti() {
        const cv = document.getElementById("confetti"); if (!cv) return;
        const g = cv.getContext("2d");
        const W = cv.width = innerWidth, H = cv.height = innerHeight;
        const colors = ["#e3350d", "#ffcb05", "#2a75bb", "#2fa84f", "#e0408a", "#7b3fbf"];
        const ps = Array.from({ length: 140 }, () => ({
            x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35,
            vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
            s: 6 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
            c: colors[Math.floor(Math.random() * colors.length)]
        }));
        cv.style.display = "block";
        const t0 = performance.now();
        (function frame(now) {
            g.clearRect(0, 0, W, H);
            ps.forEach(p => {
                p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
                g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c;
                g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore();
            });
            if (now - t0 < 2800) requestAnimationFrame(frame);
            else { g.clearRect(0, 0, W, H); cv.style.display = "none"; }
        })(t0);
    }

    // ---------- 外から呼ぶ入口 ----------
    let lastTick = null;
    return {
        setup: setupSoundButton,
        countdown,
        correct(n, isTA) {
            sfx.correct(n); flash("fx-ok"); plus(isTA ? "+1" : n + " COMBO"); comboHeat(n);
            if (MILESTONES[n] || (n > 100 && n % 50 === 0)) {
                setTimeout(sfx.milestone, 120);
                banner(n + (isTA ? "問正解！" : " COMBO!"), MILESTONES[n] || "まだまだ！", n >= 20 ? "big" : "");
            }
        },
        wrong() { sfx.wrong(); flash("fx-ng"); comboHeat(0); },
        // 残り時間（秒）を渡すと、3秒を切ったところで1秒ごとに音と画面の点滅
        timer(left) {
            const hurry = left > 0 && left <= 3;
            document.body.classList.toggle("fx-hurry", hurry);
            const n = Math.ceil(left);
            if (hurry && n !== lastTick) { lastTick = n; sfx.tick(n); }
            if (!hurry) lastTick = null;
        },
        stopTimer() { document.body.classList.remove("fx-hurry"); lastTick = null; },
        gameover(newRecord, score) {
            document.body.classList.remove("fx-hurry");
            comboHeat(0);
            if (newRecord && score > 0) {
                sfx.record(); confetti();
                setTimeout(() => banner("NEW RECORD!", "自己ベスト更新 " + score + "問", "big gold"), 150);
            } else { sfx.wrong(); setTimeout(sfx.over, 350); }
        }
    };
})();
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", FX.setup);
else FX.setup();
