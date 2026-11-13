// Amazon Associates (pokekana-20) – English pages only
(function () {
  const TAG = "pokekana-20";
  const az = q => "https://www.amazon.com/s?k=" + encodeURIComponent(q) + "&tag=" + TAG;
  const hero = document.querySelector(".pk-hero img");
  const mon = hero ? hero.alt : null;
  const sprite = hero ? hero.getAttribute("src") : null;
  const BOOKS = [
    ["📘", "Remembering the Kana", "Learn hiragana & katakana in hours", "Remembering the Kana Heisig"],
    ["📗", "Genki I Textbook", "The classic beginner course", "Genki I textbook 3rd edition"],
    ["🃏", "Katakana Flashcards", "Practice anywhere", "katakana flash cards"],
    ["📕", "Japanese from Zero!", "Fun step-by-step book", "Japanese from Zero 1"],
    ["🎴", "Japanese Pokémon Cards", "Read real katakana on cards", "Japanese Pokemon cards booster box"],
  ];
  const css = document.createElement("style");
  css.textContent = `.shop{margin-top:16px}.shop h2{font-size:18px}.shop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
  .shop a.sc{display:flex;flex-direction:column;gap:4px;padding:12px;border-radius:14px;background:#fff7ed;border:2px solid #fed7aa;text-decoration:none;color:#1f2937}
  .shop a.sc:hover{transform:translateY(-2px)}.shop .ic{font-size:28px}.shop .ic img{width:56px;height:56px;image-rendering:pixelated}.shop b{font-size:14px}.shop small{font-size:12px;color:#6b7280}
  .shop .go{font-size:12px;font-weight:700;color:#b45309}.shop .disc{font-size:11px;color:#6b7280;margin-top:8px}`;
  document.head.appendChild(css);
  const card = (ic, t, s, q) => `<a class="sc" rel="nofollow sponsored noopener" target="_blank" href="${az(q)}"><span class="ic">${ic}</span><b>${t}</b><small>${s}</small><span class="go">View on Amazon ›</span></a>`;
  let items = [];
  if (mon) {
    const im = sprite ? `<img src="${sprite}" alt="">` : "🧸";
    items.push(card(im, mon + " Plush", "Soft toy", mon + " pokemon plush"));
    items.push(card("🃏", mon + " Cards", "Pokémon TCG", mon + " pokemon card"));
    items.push(card(im, mon + " Figure", "Figures & toys", mon + " pokemon figure"));
  }
  const seed = [...location.pathname].reduce((a, c) => a + c.charCodeAt(0), 0);
  const b = BOOKS.slice(seed % BOOKS.length).concat(BOOKS.slice(0, seed % BOOKS.length));
  items = items.concat(b.slice(0, mon ? 3 : 5).map(x => card(...x)));
  const sec = document.createElement("section");
  sec.className = "card shop";
  sec.innerHTML = `<h2>🛒 ${mon ? mon + " & Japanese learning picks" : "Japanese learning picks"}</h2><div class="shop-grid">${items.join("")}</div><p class="disc">As an Amazon Associate, this site earns from qualifying purchases.</p>`;
  const main = document.querySelector("main");
  const nav = main && main.querySelector(".pnav");
  if (main) (nav ? main.insertBefore(sec, nav) : main.appendChild(sec));
})();
