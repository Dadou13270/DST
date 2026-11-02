// Jeu « Trivial pompiers » (version simple, un seul écran). Module autonome : jeuMount(element, banque).
// Plateau de 28 cases, 7 thèmes, 7 « camemberts » à gagner. L'état est conservé hors du DOM : on peut remonter le jeu à volonté.
const THEMES0 = [
  { n: "Feu et phénomènes", c: "#d93a2b", e: "🔥" },
  { n: "Bâtiment et tactique", c: "#2f6fbd", e: "🏢" },
  { n: "Secours routier", c: "#e5a912", e: "🚗" },
  { n: "Gaz et risques", c: "#2e9d5b", e: "🧪" },
  { n: "Secours à personne", c: "#d2579a", e: "❤️" },
  { n: "Méthode et transmissions", c: "#7b50b8", e: "📋" },
  { n: "Conduite", c: "#0ea5e9", e: "🚒", off: true },
  { n: "Toxicité des fumées", c: "#0d9488", e: "☣️" },
];
const NIV = [null, { n: "Facile", c: "#16794a", p: "●○○" }, { n: "Moyen", c: "#c27a0a", p: "●●○" }, { n: "Difficile", c: "#b91c1c", p: "●●●" }];
let REG = { visibilite: "admin", chrono: false, chronoSec: 30 }; // réglages du jeu (document _reglages)
const SECS = [15, 20, 30, 45, 60, 90];
function chargerReglages(r) { if (r) REG = { visibilite: ["admin", "encadrement", "tous"].includes(r.visibilite) ? r.visibilite : "admin", chrono: r.chrono === true, chronoSec: SECS.includes(Number(r.chronoSec)) ? Number(r.chronoSec) : 30 }; }
const MAXT = 9, MINT = 4; // rubriques : 4 à 8 (les 8 premières sont celles des questions intégrées)
let THEMES = THEMES0.map((t) => ({ n: t.n, c: t.c, e: t.e, actif: !t.off, mots: "" })); // toutes les rubriques, actives ou non (l'indice = c des questions)
let ACT = [0, 1, 2, 3, 4, 5, 7]; // indices des rubriques jouées (actives et ayant au moins une question)
let JEU_KO = false; // moins de MINT rubriques jouables
const COULEURS = ["#111827", "#0ea5e9", "#f97316", "#84cc16", "#a855f7", "#ec4899"];
let N = 28; // cases = 4 par rubrique ; une case camembert sur 4
const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);
const pasCat = (nt) => { for (let m = 1; m < 30; m++) if (pgcd(4 + m, nt) === 1) return m; return 1; };
const cat = (i) => ACT[(i + Math.floor(i / 4) * pasCat(ACT.length)) % ACT.length]; // rubrique de la case i (les cases camembert ont toutes une rubrique différente)
const nbp = (j) => ACT.filter((t) => j.parts[t]).length;
function appliquerThemes() {
  if (G && G.joueurs && G.phase !== "menu" && G.phase !== "fin") return; // jamais en cours de partie
  const ok = THEMES.map((t, i) => (t.actif !== false && BQ.some((x) => x.c === i) ? i : -1)).filter((i) => i >= 0);
  JEU_KO = ok.length < MINT;
  ACT = ok.length >= MINT ? ok : [0, 1, 2, 3, 4, 5, 7];
  N = 4 * ACT.length;
}
function chargerThemes(arr) {
  if (!Array.isArray(arr)) return;
  THEMES = arr.slice(0, MAXT).map((t, i) => ({ n: String((t && t.n) || (THEMES0[i] && THEMES0[i].n) || "Rubrique " + (i + 1)), c: /^#[0-9a-f]{6}$/i.test(t && t.c) ? t.c : (THEMES0[i] || { c: "#64748b" }).c, e: String((t && t.e) || (THEMES0[i] && THEMES0[i].e) || "⭐"), actif: !t || t.actif !== false, mots: String((t && t.mots) || "") }));
  while (THEMES.length < THEMES0.length) { const t0 = THEMES0[THEMES.length]; THEMES.push({ n: t0.n, c: t0.c, e: t0.e, actif: !t0.off, mots: "" }); }
  appliquerThemes();
}
const camem = (i) => i % 4 === 0;
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const mel = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };


// ---- Questions issues des quiz et QCM publiés, classées par mots-clés ----
const MOTS = [
  ["feu", "incendie", "flamme", "fumee", "flash", "backdraft", "embrasement", "combustion", "pyrolyse", "extincteur", "calorifique", "thermique", "chaleur", "inflammation"],
  ["batiment", "structure", "tactique", "erp", "habitation", "toiture", "charpente", "facade", "evacuation", "desenfumage", "ventilation", "analyse de la situation", "engagement", "etablissement"],
  ["routier", "route", "vehicule", "accident", "desincarceration", "autoroute", "circulation", "balisage", "sinistre routier", "pieg"],
  ["gaz", "gpl", "butane", "propane", "bouteille", "fuite", "explosi", "atex", "matieres dangereuses", "produits dangereux", "chimique", "radiolog", "nrbc", "rch", "toxique"],
  ["secours a personne", "victime", "bilan", "hemorragie", "arret cardiaque", "reanimation", "rcp", "dae", "defibrill", "pls", "brulure", "traumat", "malaise", "detresse", "oxygene", "secourisme"],
  ["methode", "soiec", "transmission", "commandement", "message", "cos", "codis", "cta", "radio", "ordre", "ambiance", "compte rendu", "chef d'agres", "chef d'equipe"],
  [],
  ["toxicite des fumees", "toxicite", "fumees d'incendie", "suie", "cyanure", "monoxyde", "desorption", "cagoule", "sale", "propre", "ffp", "souillure", "alara", "reconditionnement", "rehabilitation", "sssm"],
];
const motsDe = (c) => (c < 8 ? MOTS[c] : []).concat(String(THEMES[c].mots || "").split(",").map((m) => norm(m).trim()).filter(Boolean));
const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
// Poids : thème de la question 3, rubrique 2, énoncé 2, titre du quiz 1.
function classer(theme, rubrique, enonce, titre) {
  const ch = [[norm(theme), 3], [norm(rubrique), 2], [norm(enonce), 2], [norm(titre), 1]];
  let best = -1, max = 0;
  THEMES.forEach((th, c) => { if (th.actif === false) return; const l = motsDe(c); let sc = 0; l.forEach((m) => ch.forEach(([t, w]) => { if (t.includes(m)) sc += w; })); if (sc > max) { max = sc; best = c; } });
  return best;
}
// quiz : documents exercicesQuiz publiés ; existantes : banque déjà connue (évite les doublons). Renvoie les nouvelles entrées.
function depuisQuiz(quiz, existantes) {
  const vus = new Set((existantes || []).map((x) => norm(x.q).replace(/[^a-z0-9]/g, "")));
  const out = [];
  STATS = { quiz: (quiz || []).length, vues: 0, repris: 0, type: 0, doublon: 0, sans: 0 };
  (quiz || []).forEach((z) => {
    if (!z || z.format === "cartes" || !Array.isArray(z.questions)) return;
    z.questions.forEach((q) => {
      STATS.vues++;
      let e = null;
      if ((q.type === "unique" || q.type === "multiple") && Array.isArray(q.choix)) {
        const ch = q.choix.filter((c) => (c.t || "").trim());
        const a = ch.map((c, i) => (c.ok ? i : -1)).filter((i) => i >= 0);
        if (ch.length >= 2 && a.length) e = { q: q.q, o: ch.map((c) => c.t), a, e: q.expl || "" };
      } else if (q.type === "vf") e = { q: "Vrai ou faux ? " + q.q, o: ["Vrai", "Faux"], a: [q.vf ? 0 : 1], e: q.expl || "" };
      if (!e || !(q.q || "").trim()) { STATS.type++; return; }
      const cle = norm(e.q).replace(/[^a-z0-9]/g, "");
      if (vus.has(cle)) { STATS.doublon++; return; }
      const c = classer(q.theme, z.rubrique, q.q, z.titre);
      vus.add(cle);
      if (c < 0) { STATS.sans++; out.push({ c: -1, s: "quiz", h: Math.floor(Math.random() * 840), ...e }); return; }
      STATS.repris++; out.push({ c, s: "quiz", ...e });
    });
  });
  return out;
}
let STATS = null; // bilan de la lecture des quiz publiés
let G = null; // état de la partie
let INTRO = false; // page d'accueil du jeu (plateau + explication) affichée avant le menu
let ELc = null; // élément courant (les animations redessinent dedans)
let tmr = null;
const FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
let BQ = [];
let OPTS = {}; // adaptateurs fournis par l'application : admin, listQ, saveQ, delQ, listP, logP
let ADM = { tab: "q", custom: null, parties: null, form: null, msg: "", filtre: -1 };
let piles = {};

const CSS = `
.tj{max-width:none;margin:0}.tj h1{margin:6px 0 4px}.tj .m{color:var(--mut,#667079)}
.tj .box{background:var(--card,#fff);border:1px solid var(--line,#d8dde1);border-radius:12px;padding:14px;margin:12px 0}
.tj .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.tj .grow{flex:1}
.tj button.b{padding:10px 16px;border-radius:10px;border:1px solid var(--line,#d8dde1);background:var(--card,#fff);color:var(--ink,#1b2127);font:inherit;font-weight:600;cursor:pointer}
.tj button.b.p{background:var(--red,#c42a1c);border-color:var(--red,#c42a1c);color:#fff}.tj button.b:disabled{opacity:.45;cursor:default}
.tj input.i{padding:9px 12px;border-radius:8px;border:1px solid var(--line,#d8dde1);background:var(--card,#fff);color:var(--ink,#1b2127);font:inherit;min-width:0}
.tj .lay{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:14px;align-items:start}@media(max-width:820px){.tj .lay{grid-template-columns:1fr}}
.tj .code{font-size:2.4rem;font-weight:800;letter-spacing:.25em}.tj .codep{letter-spacing:.2em;font-size:1.1rem}.tj button:disabled{opacity:.45;cursor:not-allowed}.tj .pl{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:10px;border:2px solid transparent}.tj .pl.on{border-color:var(--red,#c42a1c);background:rgba(196,42,28,.07)}
.tj .pion{width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #0006;flex:none}
.tj .parts{display:flex;gap:3px}.tj .part{width:16px;height:16px;border-radius:50%;border:2px solid var(--line,#d8dde1);background:transparent}
.tj .opt{display:block;width:100%;text-align:left;margin:6px 0;padding:11px 14px;border-radius:10px;border:2px solid var(--line,#d8dde1);background:var(--card,#fff);color:var(--ink,#1b2127);font:inherit;cursor:pointer}
.tj .opt.sel{border-color:var(--red,#c42a1c)}.tj .opt.ok{border-color:#16794a;background:rgba(22,121,74,.12)}.tj .opt.ko{border-color:#b3261e;background:rgba(179,38,30,.12)}
.tj tr.rl:hover{background:rgba(127,127,127,.12)}.tj tr.rl:focus-visible{outline:2px solid var(--red,#c42a1c);outline-offset:-2px}
.tj .bdg{display:inline-block;margin:3px 4px 3px 0;padding:4px 11px;border-radius:99px;border:2px solid var(--bc);background:transparent;color:var(--ink,#1b2127);font:inherit;font-size:.85rem;font-weight:700;cursor:pointer}.tj .bdg.on{background:var(--bc);color:#fff}.tj span.bdg{cursor:default}
.tj .tag{display:inline-block;padding:3px 10px;border-radius:99px;color:#fff;font-size:.85rem;font-weight:700}
.tj .de{font-size:2.4rem;font-weight:800}.tj .dg{display:inline-block;font-size:4.2rem;line-height:1;color:var(--ink,#1b2127)}.tj .dg.roule{animation:tjroll .35s linear infinite}.tj .dg.pose{animation:tjpose .4s ease-out}@keyframes tjroll{0%{transform:rotate(0) scale(1)}50%{transform:rotate(180deg) scale(1.15)}100%{transform:rotate(360deg) scale(1)}}@keyframes tjpose{0%{transform:scale(1.5)}60%{transform:scale(.92)}100%{transform:scale(1)}}.tj .exp{margin-top:8px;padding:10px;border-radius:8px;background:var(--soft,#f1f3f5);white-space:pre-line}
.tj input[type=radio],.tj input[type=checkbox]{width:auto;padding:0;margin:0;flex:none}.tj label:has(>input[type=radio]),.tj label:has(>input[type=checkbox]){display:inline-flex;align-items:center;gap:6px;cursor:pointer}
.tj .opt.ok{animation:tjpop .5s ease-out}.tj .opt.ko{animation:tjshake .4s}@keyframes tjpop{0%{transform:scale(1)}40%{transform:scale(1.04)}100%{transform:scale(1)}}@keyframes tjshake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.tj .cf{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:50}.tj .cf i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;animation-name:tjcf;animation-timing-function:linear;animation-fill-mode:forwards}@keyframes tjcf{to{transform:translateY(105vh) rotate(720deg);opacity:.8}}
@media(prefers-reduced-motion:reduce){.tj .opt.ok,.tj .opt.ko,.tj .cf i{animation:none}.tj .cf{display:none}}
.tj svg{width:100%;height:auto;display:block}.tj .leg{display:flex;gap:6px 12px;flex-wrap:wrap;font-size:.85rem}
`;

function nouvelleQuestion(cat) {
  const nc = G && G.nc;
  if (!piles[cat] || !piles[cat].length) piles[cat] = mel(BQ.filter((q) => q.c === cat || (nc && q.c === -1 && ACT[q.h % ACT.length] === cat)));
  const q = piles[cat].pop();
  const ordre = mel(q.o.map((_, i) => i));
  return { cat, n: q.n >= 1 && q.n <= 3 ? q.n : 2, q: q.q, opts: ordre.map((i) => q.o[i]), bon: ordre.map((i, k) => (q.a.includes(i) ? k : -1)).filter((k) => k >= 0), e: q.e || "", sel: [], rep: false, ok: false };
}
const pos = (i, R, cx, cy) => { const a = ((i + 0.5) / N) * 2 * Math.PI - Math.PI / 2; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; };
function plateau() {
  const cx = 220, cy = 220, R1 = 188, R0 = 128, RH = 58;
  const P = (r, a) => `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  const ang = (i) => ((i + 0.5) / N) * 2 * Math.PI - Math.PI / 2;
  const xy = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];
  let s = `<svg viewBox="0 0 440 440" role="img" aria-label="Plateau de jeu"><defs>
<radialGradient id="tjbg" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#26385a"/><stop offset="1" stop-color="#0b1424"/></radialGradient>
<radialGradient id="tjhub" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#cfd6e0"/></radialGradient>
${THEMES.map((t, k) => `<linearGradient id="tjg${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.c}" stop-opacity="1"/><stop offset="1" stop-color="${t.c}" stop-opacity=".72"/></linearGradient>`).join("")}
<filter id="tjsh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".55"/></filter>
</defs>
<circle cx="${cx}" cy="${cy}" r="214" fill="url(#tjbg)" stroke="#c42a1c" stroke-width="6"/>
<circle cx="${cx}" cy="${cy}" r="205" fill="none" stroke="#e8b84a" stroke-width="1.5" stroke-dasharray="2 5" opacity=".9"/>
<circle cx="${cx}" cy="${cy}" r="${R0 - 6}" fill="#0f1b30"/>`;
  // rayons (décoratifs) du centre vers les cases camembert, comme sur un vrai plateau
  for (let i = 0; i < N; i += 4) {
    const a = ang(i), t = cat(i), w = 0.2;
    s += `<path d="M${P(RH, a - w)} L${P(R0 - 2, a - w * 0.7)} L${P(R0 - 2, a + w * 0.7)} L${P(RH, a + w)}Z" fill="url(#tjg${t})" opacity=".92"/>`;
  }
  // couronne de cases
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / N) * 2 * Math.PI - Math.PI / 2, t = cat(i);
    s += `<path d="M${P(R0, a0)} L${P(R1, a0)} A${R1},${R1} 0 0 1 ${P(R1, a1)} L${P(R0, a1)} A${R0},${R0} 0 0 0 ${P(R0, a0)}Z" fill="url(#tjg${t})" stroke="#0b1424" stroke-width="3"/>`;
    s += `<path d="M${P(R1 - 5, a0 + 0.03)} A${R1 - 5},${R1 - 5} 0 0 1 ${P(R1 - 5, a1 - 0.03)}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>`;
    if (camem(i)) {
      const [x, y] = xy(i, (R0 + R1) / 2);
      s += `<g filter="url(#tjsh)"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="19" fill="#fff" stroke="${THEMES[t].c}" stroke-width="4"/></g><text x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}" text-anchor="middle" font-size="19">${THEMES[t].e}</text>`;
    }
  }
  // centre
  s += `<circle cx="${cx}" cy="${cy}" r="${RH + 7}" fill="#0b1424" stroke="#e8b84a" stroke-width="2"/>`;
  const j0 = G && G.joueurs ? G.joueurs[G.cur] : null;
  for (let u = 0; u < ACT.length; u++) {
    const t = ACT[u], a0 = (u / ACT.length) * 2 * Math.PI - Math.PI / 2, a1 = ((u + 1) / ACT.length) * 2 * Math.PI - Math.PI / 2;
    s += `<path d="M${cx},${cy} L${P(RH, a0)} A${RH},${RH} 0 0 1 ${P(RH, a1)}Z" fill="${THEMES[t].c}" opacity="${j0 && j0.parts[t] ? 1 : 0.28}" stroke="#0b1424" stroke-width="2"/>`;
  }
  s += `<circle cx="${cx}" cy="${cy}" r="17" fill="url(#tjhub)" stroke="#e8b84a" stroke-width="2"/><text x="${cx}" y="${cy + 7}" text-anchor="middle" font-size="20" fill="#c42a1c">★</text>`;
  if (G && G.joueurs) {
    // destinations possibles pendant le choix du sens
    if (G.phase === "dir") {
      const j = G.joueurs[G.cur];
      [(j.pos + G.de) % N, (j.pos - G.de + N * 6) % N].forEach((c) => {
        const [x, y] = xy(c, (R0 + R1) / 2);
        s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="22" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="5 4"><animate attributeName="stroke-opacity" values="1;.25;1" dur="1.2s" repeatCount="indefinite"/></circle>`;
      });
    }
    const par = {};
    G.joueurs.forEach((j, k) => { (par[j.pos] = par[j.pos] || []).push(k); });
    Object.entries(par).forEach(([c, l]) => l.forEach((k, n) => {
      const dec = l.length > 1 ? (n - (l.length - 1) / 2) * 15 : 0;
      const [x0, y0] = xy(Number(c), (R0 + R1) / 2 + (l.length > 1 ? 0 : 0));
      const tx = -Math.sin(ang(Number(c))) * dec, ty = Math.cos(ang(Number(c))) * dec;
      const x = x0 + tx, y = y0 + ty, cur = k === G.cur;
      s += `<g filter="url(#tjsh)"><circle cx="${x.toFixed(1)}" cy="${(y - 3).toFixed(1)}" r="${cur ? 10 : 8}" fill="${COULEURS[k]}" stroke="#fff" stroke-width="3"/><circle cx="${(x - 2.5).toFixed(1)}" cy="${(y - 6).toFixed(1)}" r="2.5" fill="#fff" opacity=".6"/></g>`;
      if (cur) s += `<circle cx="${x.toFixed(1)}" cy="${(y - 3).toFixed(1)}" r="10" fill="none" stroke="#fff" stroke-width="2"><animate attributeName="r" values="10;19;10" dur="1.6s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values=".9;0;.9" dur="1.6s" repeatCount="indefinite"/></circle>`;
    }));
    G.joueurs.forEach((x, n) => { if (x.parts.every(Boolean)) { const a = (n / G.joueurs.length) * 2 * Math.PI; s += `<circle cx="${(cx + 38 * Math.cos(a)).toFixed(1)}" cy="${(cy + 38 * Math.sin(a)).toFixed(1)}" r="8" fill="${COULEURS[n]}" stroke="#fff" stroke-width="2.5"/>`; } });
  }
  return s + "</svg>";
}
function joueursHtml() {
  return G.joueurs.map((j, k) => `<div class="pl${k === G.cur && G.phase !== "fin" ? " on" : ""}"><span class="pion" style="background:${COULEURS[k]}"></span><b class="grow">${esc(j.nom)}</b><span class="parts" aria-label="${nbp(j)} camemberts sur ${ACT.length}">${ACT.map((i) => { const t = THEMES[i]; return `<span class="part" title="${esc(t.n)}" style="${j.parts[i] ? `background:${t.c};border-color:${t.c}` : ""}"></span>`; }).join("")}</span></div>`).join("");
}
function panneau() {
  const j = G.joueurs[G.cur];
  if (G.phase === "fin") {
    const cl = [...G.joueurs].sort((a, b) => b.parts.filter(Boolean).length - a.parts.filter(Boolean).length);
    return `<div class="box"><h2 style="margin-top:0">🏆 ${esc(G.gagnant.nom)} remporte la partie !</h2><p class="m">Classement : ${cl.map((x) => esc(x.nom) + " (" + nbp(x) + "/" + ACT.length + ")").join(" · ")}</p><div class="row"><button class="b p" data-j="rejouer">Rejouer avec les mêmes joueurs</button><button class="b" data-j="menu">Nouvelle partie</button></div></div>`;
  }
  if (G.phase === "de" && j.parts.every(Boolean)) {
    const duel = G.joueurs.length > 1;
    return `<div class="box"><p><b>${esc(j.nom)}</b> a les ${ACT.length} camemberts et rejoint la <b>case centrale</b> ★.</p><p>${duel ? "Les adversaires choisissent le thème de la question finale :" : "Question finale : thème tiré au sort."}</p><div class="row">${duel ? ACT.map((i) => { const t = THEMES[i]; return `<button class="b" data-j="final" data-k="${i}" style="border-color:${t.c};border-width:3px">${t.e} ${esc(t.n)}</button>`; }).join("") : '<button class="b p" data-j="final">Question finale</button>'}</div></div>`;
  }
  if (G.phase === "roll") return `<div class="box" style="text-align:center"><p><b>${esc(j.nom)}</b> lance le dé…</p><span class="dg roule" aria-hidden="true">${FACES[(G.face || 1) - 1]}</span></div>`;
  if (G.phase === "move") return `<div class="box" style="text-align:center"><p><b>${esc(j.nom)}</b> avance… <span class="m">${G.restant} case${G.restant > 1 ? "s" : ""} restante${G.restant > 1 ? "s" : ""}</span></p><span class="dg" aria-hidden="true">${FACES[G.de - 1]}</span></div>`;
  if (G.phase === "de") return `<div class="box"><p><b>${esc(j.nom)}</b>, à toi de jouer.</p><button class="b p" data-j="lancer">🎲 Lancer le dé</button>${G.msg ? `<p class="m">${esc(G.msg)}</p>` : ""}</div>`;
  if (G.phase === "dir") {
    const f = (G.joueurs[G.cur].pos + G.de) % N, b = (G.joueurs[G.cur].pos - G.de + N * 6) % N;
    const btn = (c, dir, l) => `<button class="b" data-j="aller" data-d="${dir}" style="border-color:${THEMES[cat(c)].c};border-width:3px">${l} ${THEMES[cat(c)].e} ${esc(THEMES[cat(c)].n)}${camem(c) ? " ◉" : ""}</button>`;
    return `<div class="box"><p style="display:flex;align-items:center;gap:10px"><span class="dg pose" aria-hidden="true">${FACES[G.de - 1]}</span><span><b>${esc(j.nom)}</b> a fait <b>${G.de}</b> — choisis ton sens.</span></p><div class="row">${btn(f, 1, "↻ Avancer")}${btn(b, -1, "↺ Reculer")}</div><p class="m">◉ = case camembert : une bonne réponse sur une case du thème qui te manque donne le camembert.</p></div>`;
  }
  const q = G.question, t = THEMES[q.cat], multi = q.bon.length > 1;
  const opts = q.opts.map((o, k) => {
    const cls = q.rep ? (q.bon.includes(k) ? " ok" : q.sel.includes(k) ? " ko" : "") : q.sel.includes(k) ? " sel" : "";
    return `<button class="opt${cls}" data-j="opt" data-k="${k}"${q.rep ? " disabled" : ""}>${multi ? (q.sel.includes(k) ? "☑ " : "☐ ") : ""}${esc(o)}</button>`;
  }).join("");
  const fin = q.rep
    ? `<div class="exp"><b>${q.timeout ? "⏱ Temps écoulé" : q.ok ? "✅ Bonne réponse" : "❌ Mauvaise réponse"}</b>${G.gain ? `<br>🎉 ${esc(j.nom)} gagne le camembert « ${esc(THEMES[q.cat].n)} » !` : ""}${q.e ? "<br><br>" + esc(q.e) : ""}</div><div class="row" style="margin-top:10px"><button class="b p" data-j="suite">${q.ok ? (q.finale ? "Terminer la partie" : "Rejouer (bonne réponse)") : "Joueur suivant"}</button></div>`
    : `<div class="row" style="margin-top:8px"><button class="b p" data-j="valider"${q.sel.length ? "" : " disabled"}>Valider</button>${multi ? '<span class="m">Plusieurs réponses possibles</span>' : ""}</div>`;
  return `<div class="box"><div class="row" style="justify-content:space-between"><span class="row"><span class="tag" style="background:${t.c}">${t.e} ${esc(t.n)}</span><span class="tag" style="background:${NIV[q.n].c}" title="Niveau de difficulté">${NIV[q.n].p} ${NIV[q.n].n}</span></span><span class="m">${q.finale ? "★ Question finale · " : ""}${esc(j.nom)}</span></div>${REG.chrono && !q.rep ? `<div class="row" style="margin-top:8px" role="timer" aria-label="Temps restant"><div class="grow" style="height:8px;border-radius:4px;background:var(--line,#d8dde1)"><i id="tjchb" style="display:block;height:100%;border-radius:4px;background:#c42a1c;width:${Math.max(0, Math.min(100, (100 * (q.fin - Date.now())) / (REG.chronoSec * 1000)))}%"></i></div><b id="tjchr">${Math.max(0, Math.ceil((q.fin - Date.now()) / 1000))} s</b></div>` : ""}<h3 style="margin:10px 0">${esc(q.q)}</h3>${opts}${fin}</div>`;
}
function ecran() {
  const mh = multiEcran(); if (mh !== null) return mh;
  if (!G || G.phase === "menu") {
    const noms = (G && G.noms) || ["Joueur 1", "Joueur 2"];
    return `<div class="box"><h2 style="margin-top:0">Joueurs (1 à 6)</h2>${JEU_KO ? `<p class="m" role="alert">⚠ Jeu indisponible : il faut au moins ${MINT} rubriques actives ayant des questions (réglage dans Administration du jeu › Rubriques).</p>` : ""}${noms.map((n, i) => `<div class="row" style="margin:6px 0"><span class="pion" style="background:${COULEURS[i]}"></span><input class="i grow" data-nom="${i}" value="${esc(n)}" maxlength="20" aria-label="Nom du joueur ${i + 1}">${noms.length > 1 ? `<button class="b" data-j="retirer" data-k="${i}" aria-label="Retirer">✕</button>` : ""}</div>`).join("")}<div class="row" style="margin-top:8px">${noms.length < 6 ? '<button class="b" data-j="ajouter">+ Joueur</button>' : ""}${JEU_KO ? "" : '<button class="b p" data-j="start">Commencer la partie</button>'}</div></div>
<div class="box"><b>Banque de questions</b>${(() => { const n = (c) => BQ.filter((x) => x.c === c).length, nsans = G && G.nc ? BQ.filter((x) => x.c === -1).length : 0, total = ACT.reduce((a, c) => a + n(c), 0) + nsans; return `<table style="width:100%;border-collapse:collapse;margin-top:8px"><caption class="m" style="text-align:left;padding-bottom:4px">Questions disponibles par rubrique</caption><tr style="text-align:left"><th scope="col">Rubrique</th><th scope="col" style="text-align:right">Questions</th></tr>${ACT.map((c) => { const t = THEMES[c]; const ouv = G && G.rub && G.rub[c], l = BQ.filter((x) => x.c === c), nb = (k) => l.filter((x) => (x.s || "base") === k).length;
      return `<tr class="rl" data-j="rubligne" data-k="${c}" tabindex="0" role="button" aria-expanded="${ouv ? "true" : "false"}" title="Cliquer pour ${ouv ? "masquer" : "afficher"} le détail" style="border-top:1px solid var(--line,#d8dde1);cursor:pointer${ouv ? ";background:rgba(127,127,127,.08)" : ""}"><th scope="row" style="text-align:left;font-weight:600"><span class="pion" style="background:${t.c};display:inline-block;vertical-align:middle;margin-right:6px"></span>${t.e} ${esc(t.n)} <span class="m">${ouv ? "▾" : "▸"}</span></th><td style="text-align:right"><b>${n(c)}</b></td></tr>${ouv ? `<tr><td colspan="2" class="m" style="padding:2px 6px 8px 28px">Intégrées : ${nb("base")} · Quiz publiés : ${nb("quiz")} · Ajoutées : ${nb("perso")}${OPTS.admin ? ` <button class="b" data-j="admjeu" data-k="${c}">Voir / gérer les questions ajoutées</button>` : ""}</td></tr>` : ""}`; }).join("")}${nsans ? `<tr style="border-top:1px solid var(--line,#d8dde1)"><th scope="row" style="text-align:left;font-weight:600">Sans rubrique reconnue (réparties au hasard)</th><td style="text-align:right"><b>${nsans}</b></td></tr>` : ""}<tr style="border-top:2px solid var(--line,#d8dde1)"><th scope="row" style="text-align:left">Total</th><td style="text-align:right"><b>${total}</b></td></tr></table>`; })()}${!OPTS.admin ? "" : STATS ? `<div class="m" style="margin-top:6px">Quiz publiés lus : ${STATS.quiz} · questions lues : ${STATS.vues} · reprises : ${STATS.repris} · déjà dans le jeu : ${STATS.doublon} · type non géré (ordre, association, trous, libre) : ${STATS.type} · thème non reconnu : ${STATS.sans}</div>` : '<div class="m" style="margin-top:6px">Quiz publiés : aucun lu (chargement ou aucun quiz publié).</div>'}${OPTS.admin && STATS && STATS.sans ? `<label style="display:block;margin-top:6px"><input type="checkbox" data-j="nc"${G && G.nc ? " checked" : ""}> Ajouter aussi les ${STATS.sans} questions sans thème reconnu (réparties au hasard)</label>` : ""}</div>
<div class="box"><b>Règles</b><ul style="margin:6px 0 0 18px"><li>Lance le dé, choisis ton sens (avancer ou reculer) : la couleur de la case donne le thème de la question.</li><li>Bonne réponse : tu rejoues. Mauvaise réponse : au suivant.</li><li>Sur une case camembert ◉, une bonne réponse dans un thème que tu n'as pas encore donne le camembert.</li><li>Avec les ${ACT.length} camemberts, tu rejoins la case centrale ★ : tes adversaires choisissent le thème de la question finale. Bonne réponse : tu gagnes ; sinon, tu retentes à ton prochain tour.</li></ul><div class="leg" style="margin-top:8px">${ACT.map((i) => THEMES[i]).map((t) => `<span><span class="tag" style="background:${t.c}">${t.e} ${esc(t.n)}</span></span>`).join("")}</div></div>`;
  }
  const jj = G.joueurs[G.cur];
  const bandeau = G.phase === "fin" ? "" : `<div class="row" style="justify-content:space-between;margin-bottom:6px"><span class="row"><span class="pion" style="background:${COULEURS[G.cur]}"></span><b>${esc(jj.nom)}</b></span><span class="de" style="font-size:1.6rem" title="Dernier lancer">${G.phase === "roll" ? FACES[(G.face || 1) - 1] : G.de ? FACES[G.de - 1] + " " + G.de : "🎲"}</span></div>`;
  return `<div class="lay"><div class="box" style="background:var(--card,#fff)">${bandeau}${plateau()}</div><div>${panneau()}<div class="box">${joueursHtml()}</div></div></div>`;
}

// ---- Administration du jeu (réservée à l'admin) ----
const CIBLE = 30; // objectif de confort : questions par thème
const SRC = (x) => x.s || "base";
const versBanque = (d) => ({ id: d.id, c: d.c, n: d.n, q: d.q, o: d.o, a: d.a, e: d.e || "", s: "perso" });
function syncBQ() { BQ = BQ.filter((x) => x.s !== "perso").concat((ADM.custom || []).filter((d) => d.actif !== false).map(versBanque)); piles = {}; if (!G || G.phase === "menu") appliquerThemes(); }
const dateFr = (t) => { const d = new Date(t); return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); };
const mmss = (t) => `${Math.floor(t / 60)} min ${String(t % 60).padStart(2, "0")} s`;
function chargerAdmin() {
  if (ADM.custom === null && OPTS.listQ) OPTS.listQ().then((l) => { const th = l.find((x) => x.id === "_themes"), rg = l.find((x) => x.id === "_reglages"); if (th && !ADM.themesAdm) chargerThemes(th.themes); if (rg && !ADM.regAdm) chargerReglages(rg); ADM.custom = l.filter((x) => !String(x.id).startsWith("_")); { const lots = [["_seed_fumees", QFUMEES], ["_seed_mvicie", QMVICIE]].filter(([m]) => !l.some((x) => x.id === m)); if (lots.length) { const tous = lots.flatMap(([m, qs]) => qs.concat([{ id: m }])); Promise.all(tous.map((q) => Promise.resolve(OPTS.saveQ({ ...q, actif: true, le: Date.now() })))).then(() => { ADM.custom = null; chargerAdmin(); }).catch(() => {}); } } syncBQ(); dessiner(ELc); }).catch((e) => { ADM.custom = []; ADM.msg = "Erreur de lecture des questions : " + (e.message || e.code); dessiner(ELc); });
  if (ADM.tab === "p" && ADM.parties === null && OPTS.listP) OPTS.listP().then((l) => { ADM.parties = l; dessiner(ELc); }).catch((e) => { ADM.parties = []; ADM.msg = "Erreur de lecture des parties : " + (e.message || e.code); dessiner(ELc); });
}
const QFUMEES = [{"c":7,"q":"Quel principe doctrinal le GDO retient-il pour l'exposition aux fumées lors de la lutte contre l'incendie ?","o":["Le « juste besoin » d'exposition (principe ALARA)","L'exposition maximale pour une extinction rapide","L'exposition identique pour tous les équipiers","L'exposition uniquement en zone d'exclusion"],"a":[0],"e":"Le GDO retient le « juste besoin » d'exposition ; le principe ALARA (aussi bas que raisonnablement possible), issu du risque radiologique, est transposable aux incendies. (GDO Prévention des risques liés à la toxicité des fumées)","n":1,"id":"gdo-fumees-01"},{"c":7,"q":"À l'arrivée sur les lieux, comment faut-il stationner les engins vis-à-vis des fumées ?","o":["Vitres et ventilations ouvertes pour aérer","Vitres et ventilations fermées, même hors de la zone d'exposition","Moteur éteint et portes ouvertes","Dans le panache pour gagner du temps"],"a":[1],"e":"Un stationnement avec vitres et ventilations fermées doit être privilégié, même en dehors de la zone d'exposition aux fumées. (GDO Prévention des risques liés à la toxicité des fumées)","n":1,"id":"gdo-fumees-02"},{"c":7,"q":"En zone d'exclusion, comment le port de l'ARI est-il imposé ?","o":["Uniquement pendant l'attaque","Au choix du chef d'agrès","Port permanent jusqu'à la fin de l'opération","Seulement si des suies sont visibles"],"a":[2],"e":"Le COS peut ajuster les conditions de port des EPI selon son analyse des risques, sauf en zone d'exclusion qui impose le port permanent de l'ARI jusqu'à la fin de l'opération. (GDO Prévention des risques liés à la toxicité des fumées)","n":2,"id":"gdo-fumees-03"},{"c":7,"q":"Après retrait des EPI en zone de soutien, que préconise le GDO avant de s'hydrater et de se restaurer ?","o":["Fumer une cigarette à l'écart","Nettoyer visage, cou et mains avec des lingettes ou de l'eau froide et du savon","Rester en tenue pour garder la chaleur","Se rincer uniquement la bouche à l'eau chaude"],"a":[1],"e":"On nettoie visage, cou et mains (lingettes, ou eau froide et savon) avant de boire et manger ; yeux et bouche peuvent être lavés et on se mouche. (GDO Prévention des risques liés à la toxicité des fumées)","n":2,"id":"gdo-fumees-04"},{"c":7,"q":"Laquelle de ces étapes n'est PAS citée parmi les phases de pollution et de désorption ?","o":["Le déblai","Le transit vers le CIS","Le reconditionnement au CIS","Le trajet aller vers l'intervention"],"a":[3],"e":"Sont citées : repos et soutien sanitaire, déblai, nettoyage sur site, transit vers le CIS et reconditionnement au CIS. (GDO Prévention des risques liés à la toxicité des fumées)","n":1,"id":"gdo-fumees-05"},{"c":7,"q":"Où installe-t-on la zone de réhabilitation sur un feu de structure ?","o":["Dans la zone rouge, près de l'entrée","Sous le panache de fumées","Hors du panache de fumées, en zone orange","À l'intérieur de la cabine de l'engin"],"a":[2],"e":"Elle est installée en dehors du panache de fumées, en zone orange sur feu de structure, ou hors de la zone brûlée sur feu d'espace naturel. (GDO Prévention des risques liés à la toxicité des fumées)","n":2,"id":"gdo-fumees-06"},{"c":7,"q":"Après un déblai (souillure de degré moyen), où stocker la tenue pendant le retour au CIS ?","o":["Dans la cabine, sur les sièges","Hors de la cabine de l'engin incendie si possible","Dans le vestiaire du CIS directement","Dans un sac fermé sous le siège du chef"],"a":[1],"e":"Pour un degré de souillure moyen : brossage à sec, aération à l'extérieur, stockage hors de la cabine de l'engin si possible, puis nettoyage de la cagoule au CIS. (GDO Prévention des risques liés à la toxicité des fumées)","n":2,"id":"gdo-fumees-07"},{"c":7,"q":"Que faire d'une tenue très souillée après une attaque dans un volume en feu ?","o":["La brosser et la remettre en service","L'isoler, puis la remplacer selon la procédure du SIS","La laisser sécher dans la cabine","La laver à l'eau chaude sur place"],"a":[1],"e":"Pour un degré de souillure important (ou traces visibles après brossage) : isoler la tenue, hors de la cabine si possible, et la remplacer selon la procédure mise en place dans le SIS. (GDO Prévention des risques liés à la toxicité des fumées)","n":3,"id":"gdo-fumees-08"},{"c":7,"q":"De quelle protection doivent disposer les sapeurs-pompiers qui déshabillent des personnels aux tenues souillées ?","o":["Aucune, la tenue de service suffit","Un simple masque chirurgical","Protection respiratoire (FFP2, FFP3, cagoule filtrante, cartouche ou ARI), oculaire et cutanée, gants à usage unique","Uniquement des gants de manutention"],"a":[2],"e":"Le déshabillage est réalisé en amont de la zone de soutien par des personnels protégés (respiratoire, oculaire, cutanée) avec des gants à usage unique. (GDO Prévention des risques liés à la toxicité des fumées)","n":2,"id":"gdo-fumees-09"},{"c":7,"q":"Quel rôle logistique le conducteur de l'engin-pompe peut-il assurer sur les lieux ?","o":["Préparer un parc matériels propres, un parc souillés et une zone de nettoyage","Diriger la zone d'exclusion","Décider du degré de souillure des tenues","Rédiger le compte rendu au SSSM"],"a":[0],"e":"Il prépare parc propre, parc souillé et zone de nettoyage, et fournit le matériel demandé pour éviter le transfert de polluants dans le véhicule. (GDO Prévention des risques liés à la toxicité des fumées)","n":2,"id":"gdo-fumees-10"},{"c":7,"q":"Comment traiter les EPI et matériels qui restent souillés dans le véhicule ?","o":["Les poser sur les matériels propres pour gagner de la place","Les mettre à l'écart des matériels propres (sacs spécifiques, bacs étanches, espaces dédiés)","Les ranger dans la cabine","Les laisser à l'air libre dans l'habitacle"],"a":[1],"e":"Les EPI et matériels restés souillés sont isolés des matériels propres ; on peut aussi protéger l'intérieur de l'engin avec une bâche ou du polyane. (GDO Prévention des risques liés à la toxicité des fumées)","n":2,"id":"gdo-fumees-11"},{"c":7,"q":"Pourquoi utilise-t-on de l'eau froide pour retirer les suies de la peau au retour au CIS ?","o":["Pour économiser l'eau chaude","Elle limite l'ouverture des pores et l'intoxication par voie cutanée","Elle dissout mieux les suies","Elle est imposée par le règlement intérieur"],"a":[1],"e":"On retire les suies à l'eau savonneuse froide avant de se doucher rapidement : l'eau froide limite l'ouverture des pores et donc l'intoxication cutanée. (GDO Prévention des risques liés à la toxicité des fumées)","n":2,"id":"gdo-fumees-12"},{"c":7,"q":"Au quotidien, comment limiter la dépose de particules de fumées dans les locaux et engins ?","o":["Nettoyage périodique des casiers (gants à usage unique, FFP3 si besoin) et des cabines","Ne jamais nettoyer pour ne pas déplacer les poussières","Parfumer les vestiaires","Ranger les tenues dans les casiers personnels sans les aérer"],"a":[0],"e":"Nettoyage périodique des casiers et des cabines avec des EPI adaptés ; une odeur de fumée persistante doit inciter à nettoyer. (GDO Prévention des risques liés à la toxicité des fumées)","n":1,"id":"gdo-fumees-13"},{"c":7,"q":"Que se passe-t-il pendant le séchage des EPI à l'air libre, et quelle limite le GDO pose-t-il ?","o":["Les toxiques volatils continuent de se désorber (soleil, ozone, radicaux hydroxyles) ; l'exposition prolongée aux UV n'est pas toujours recommandée","Rien : le séchage ne sert qu'à éliminer l'humidité ; il faut toujours exposer au soleil","Les toxiques se fixent définitivement ; il faut sécher à l'ombre","La désorption s'arrête dès que l'EPI est sec ; le soleil est obligatoire"],"a":[0],"e":"La désorption se poursuit sous l'action de la lumière et des oxydants de l'air, et s'accentue avec la chaleur ; les UV prolongés peuvent abîmer certains matériaux selon usure, nature et teinte. (GDO Prévention des risques liés à la toxicité des fumées)","n":3,"id":"gdo-fumees-14"},{"c":7,"q":"Lors d'une prise en charge massive d'EPI et matériels souillés, que doit faire le COS ?","o":["Ignorer le sujet jusqu'au retour au CIS","Renvoyer tous les engins sans consigne","Constituer un secteur fonctionnel dédié confié à un cadre compétent, et répertorier les intervenants exposés pour informer le SSSM","Confier la mission au dernier arrivé"],"a":[2],"e":"Un secteur fonctionnel dédié est confié si possible à un cadre connaissant logistique, sécurité et gestion des EPI ; on répertorie les intervenants exposés et on informe le SSSM. (GDO Prévention des risques liés à la toxicité des fumées)","n":3,"id":"gdo-fumees-15"}];
const QMVICIE = [{"id":"gto-mv-01","c":0,"q":"À partir de quelle pression environ le sifflet de fin de charge d'un ARI se déclenche-t-il, imposant le retour du binôme ?","o":["Environ 100 bars","Environ 55 bars","Environ 20 bars","Environ 200 bars"],"a":[1],"e":"Sous 55 bars environ, le sifflet de fin de charge impose le retour systématique et immédiat du binôme au point de pénétration. Le retour peut même être engagé avant, pour garder l'autonomie du trajet retour. (GTO Engagement en milieu vicié)","n":1},{"id":"gto-mv-02","c":0,"q":"Selon le GTO, quelle est la seule unité de travail valide lors d'un engagement sous ARI ?","o":["Le chef d'agrès seul","Le binôme indissociable (un chef et un équipier)","Le trinôme","Le groupe de quatre"],"a":[1],"e":"Un sapeur-pompier ne doit jamais s'engager seul : le binôme, avec contact permanent (physique, visuel ou verbal), est la seule unité de travail valide. (GTO Engagement en milieu vicié)","n":1},{"id":"gto-mv-03","c":0,"q":"Dans quel cas le port de l'ARI est-il obligatoire du point de vue de l'oxygène ?","o":["Concentration en oxygène inférieure à 17 %","Concentration en oxygène inférieure à 21 %","Concentration en oxygène inférieure à 10 %","Concentration en oxygène supérieure à 17 %"],"a":[0],"e":"Le port de l'ARI est obligatoire notamment si la concentration en oxygène est inférieure à 17 %, si la qualité de l'air est inconnue, en présence de produits toxiques ou de monoxyde de carbone. (GTO Engagement en milieu vicié)","n":2},{"id":"gto-mv-04","c":0,"q":"Quelle est la pression minimale avant engagement d'un binôme avec une bouteille de 300 bars ?","o":["200 bars","250 bars","270 bars","300 bars exactement"],"a":[2],"e":"La pression avant engagement ne doit pas être inférieure à la pression nominale moins 10 % : 270 bars pour une bouteille de 300 bars. En dessous, l'engagement est limité à des missions restreintes validées par le responsable du point de pénétration. (GTO Engagement en milieu vicié)","n":2},{"id":"gto-mv-05","c":0,"q":"Sur une ligne guide, que signifient trois olives successives ?","o":["La direction de la sortie","La direction du sinistre (« in-cen-die »)","La présence d'une dérivation","La fin de la ligne"],"a":[1],"e":"Trois olives successives (3 syllabes « in-cen-die ») indiquent la direction du sinistre ; une olive isolée (1 syllabe « vie ») indique la direction de la sortie. (GTO Engagement en milieu vicié)","n":2},{"id":"gto-mv-06","c":0,"q":"Combien de dérivations peut-on effectuer au maximum sur la ligne guide ?","o":["1","2","3","5"],"a":[2],"e":"Les dispositifs de dérivation (plaquettes, clés) permettent jusqu'à 3 dérivations sur la ligne guide, principalement pour la reconnaissance de grands volumes. (GTO Engagement en milieu vicié)","n":3},{"id":"gto-mv-07","c":0,"q":"Combien de porteurs un contrôleur ARI gère-t-il, ou supervise-t-il, au maximum ?","o":["4 porteurs, soit 2 binômes","6 porteurs, soit 3 binômes","10 porteurs : 4 binômes et le binôme de sécurité","20 porteurs, sans limite de binômes"],"a":[2],"e":"Le contrôleur gère ou supervise au maximum 10 porteurs, soit 4 binômes et le binôme de sécurité, au point de pénétration (frontière entre zone d'exclusion et zone contrôlée). (GTO Engagement en milieu vicié)","n":3},{"id":"gto-mv-08","c":0,"q":"Quelle mission ne doit PAS être confiée au binôme de sécurité, afin de préserver sa capacité d'intervention ?","o":["L'assistance respiratoire d'un binôme en difficulté","Le sauvetage d'un binôme engagé","La surveillance de l'itinéraire de repli","L'aide à l'établissement des tuyaux et le contrôle de l'ouvrant"],"a":[3],"e":"Les missions du binôme de sécurité sont limitées à la sécurité et au sauvetage ; l'aide à l'établissement des tuyaux et le contrôle de l'ouvrant doivent être confiés à un autre binôme. (GTO Engagement en milieu vicié)","n":2},{"id":"gto-mv-09","c":0,"q":"Quel filtre anti-aérosols arrête 99,95 % des aérosols ?","o":["P1","P2","P3","Aucun, le maximum est de 94 %"],"a":[2],"e":"Classes de filtres : P1 arrête 80 %, P2 94 % et P3 99,95 % des aérosols. Ils se colmatent à l'usage, surtout en ambiance empoussiérée. (GTO Engagement en milieu vicié)","n":2},{"id":"gto-mv-10","c":0,"q":"Quelle limite l'INRS fixe-t-il pour l'emploi d'une cartouche anti-gaz ?","o":["Une concentration inférieure ou égale à 60 fois la VLCT du toxique, connue","Toute concentration, si la cartouche est neuve","Une concentration inférieure à la VLCT seule","Une concentration inconnue mais faible"],"a":[0],"e":"L'INRS limite l'emploi à une concentration connue inférieure ou égale à 60 fois la valeur limite à court terme (ex. chlore : VLCT 0,5 ppm, soit 30 ppm max). La durée de vie réelle d'une cartouche ne peut pas être définie précisément. (GTO Engagement en milieu vicié)","n":3}];
const QCONDUITE = [{"c":6,"q":"Qui est responsable du véhicule en circulation ?","o":["Le conducteur, seul et unique responsable","Le chef d'agrès","Le chef de centre","Le directeur du SDIS"],"a":[0],"e":"Le conducteur est « le seul et unique responsable du véhicule en circulation » ; la responsabilité du chef d'agrès n'est pas retenue par les textes. Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_01","n":1},{"c":6,"q":"La responsabilité pénale du conducteur correspond à :","o":["Sa responsabilité individuelle face à la société","Sa responsabilité professionnelle","Sa responsabilité devant son chef de centre","La responsabilité du SDIS"],"a":[0],"e":"La responsabilité disciplinaire est la responsabilité professionnelle ; la responsabilité pénale est la responsabilité individuelle face à la société. Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_02","n":2},{"c":6,"q":"Quelle est la peine prévue pour la conduite sans le permis correspondant (art. L221-2) ?","o":["Un an d'emprisonnement et 15 000 € d'amende","Un retrait de 6 points seulement","Six mois d'emprisonnement et 3 750 € d'amende","Une simple amende forfaitaire"],"a":[0],"e":"Art. L221-2 : un an d'emprisonnement et 15 000 € d'amende. Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_03","n":3},{"c":6,"q":"Que doit faire tout usager à l'approche d'un véhicule d'intérêt général utilisant ses avertisseurs spéciaux (art. R414-9) ?","o":["Réduire sa vitesse et, au besoin, s'arrêter ou se garer pour faciliter son passage","Accélérer pour dégager la voie","Maintenir son allure et sa position","Allumer ses feux de détresse et rester sur place"],"a":[0],"e":"Art. R414-9 : tout usager doit réduire sa vitesse et, au besoin, s'arrêter ou se garer. Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_04","n":2},{"c":6,"q":"Les règles de circulation ne s'appliquent pas aux véhicules d'intérêt général prioritaires (art. R432-1) sous réserve de :","o":["Utiliser leurs avertisseurs spéciaux, dans les cas justifiés par l'urgence de la mission, sans mettre en danger les autres usagers","Rouler à plus de 100 km/h","Avoir l'accord du centre de traitement de l'alerte à chaque infraction","Avoir un équipage complet"],"a":[0],"e":"Art. R432-1 : usage des avertisseurs spéciaux, urgence de la mission et absence de mise en danger des autres usagers. Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_05","n":3},{"c":6,"q":"Quels sont les trois principes pour être prioritaire selon le document stagiaire ?","o":["Être vu, être compris, être entendu","Être rapide, être sûr, être prudent","Être armé, être équipé, être formé","Être vu, être suivi, être arrêté"],"a":[0],"e":"« Pour être prioritaire il faut être : ETRE VU / ETRE COMPRIS / ETRE ENTENDU ». Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_06","n":1},{"c":6,"q":"Quels sont les avertisseurs spéciaux d'un véhicule de sapeurs-pompiers ?","o":["Gyrophares (ou rampe lumineuse) et avertisseur sonore deux tons","Feux de détresse et klaxon","Feux de croisement et phares antibrouillard","Rampe lumineuse seule"],"a":[0],"e":"Avertisseurs spéciaux : gyrophares ou rampe lumineuse et avertisseur sonore (deux tons). Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_07","n":1},{"c":6,"q":"Au retour d'une mission, un véhicule de sapeurs-pompiers est-il prioritaire ?","o":["Non, il doit respecter strictement le code de la route","Oui, tant que les gyrophares sont allumés","Oui, s'il transporte une victime","Oui, sur autorisation du chef d'agrès"],"a":[0],"e":"« Il n'est donc pas question de se croire prioritaire en retour de mission ». Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_08","n":2},{"c":6,"q":"Que dit le document stagiaire des sens interdits ?","o":["Les sapeurs-pompiers ne sont pas autorisés à les franchir","Ils peuvent les franchir en intervention","Ils peuvent les franchir avec deux tons","Ils peuvent les franchir si le chef d'agrès l'ordonne"],"a":[0],"e":"En cas d'urgence absolue, toutes les précautions doivent être prises et le conducteur engage seul sa responsabilité. Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_09","n":1},{"c":6,"q":"Devant un feu rouge clignotant (passage à niveau, pont-levis…), le conducteur doit :","o":["Marquer l'arrêt absolu","Ralentir et passer avec les deux tons","Passer si la voie est dégagée","Passer sur ordre du chef d'agrès"],"a":[0],"e":"Tout conducteur doit marquer l'arrêt absolu devant un feu rouge, fixe ou clignotant. Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_10","n":2},{"c":6,"q":"Le règlement du SDIS cité autorise-t-il de déroger au port de la ceinture ?","o":["Non, en aucun cas","Oui, en intervention urgente","Oui, pour le conducteur seulement","Oui, sur courte distance"],"a":[0],"e":"Art. 255 du règlement du SDIS 51 : on ne déroge pas au port de la ceinture, aux feux rouges clignotants, aux limitations de tonnage et de hauteur. Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_11","n":2},{"c":6,"q":"Quel taux d'alcool le règlement du SDIS 51 exige-t-il pour conduire ?","o":["0 g/L","0,2 g/L","0,5 g/L","0,8 g/L"],"a":[0],"e":"Art. 246 : le taux doit être de 0 g/L ; 0,2 g/L de sang ou 0,1 mg/L d'air expiré est toléré lors de contrôles inopinés. Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_12","n":3},{"c":6,"q":"Comment un conducteur doit-il aborder un carrefour en intervention ?","o":["À vitesse réduite, voire en marquant l'arrêt","À vitesse constante avec les deux tons","En accélérant pour dégager le carrefour","En klaxonnant uniquement"],"a":[0],"e":"Art. 255 : aborder les carrefours à vitesse réduite, voire marquer l'arrêt, surtout si la visibilité est réduite. Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_13","n":2},{"c":6,"q":"Où doit-on utiliser l'avertisseur deux tons par rapport à une intersection ?","o":["Suffisamment en amont de l'intersection","Uniquement à l'entrée du carrefour","Seulement au feu rouge","Jamais en agglomération"],"a":[0],"e":"Le deux tons s'utilise suffisamment en amont de l'intersection ou du groupe de véhicules. Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_14","n":3},{"c":6,"q":"Quand le guidage par le chef d'agrès est-il obligatoire ?","o":["Pour toute manœuvre sans visibilité directe du conducteur, notamment en marche arrière","Uniquement sur la voie publique","Uniquement de nuit","Uniquement en centre de secours"],"a":[0],"e":"Valable à l'extérieur comme à l'intérieur des centres. Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_15","n":2},{"c":6,"q":"Les avertisseurs spéciaux sont réservés :","o":["Aux missions d'urgence","À tous les déplacements","Aux retours d'intervention","Aux manœuvres en centre"],"a":[0],"e":"Source : règlement du SDIS cité dans le document stagiaire. Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_16","n":1},{"c":6,"q":"Pour un départ feux, où le conducteur du fourgon doit-il s'arrêter ?","o":["Toujours après l'adresse, pour laisser la place au moyen aérien","Juste devant l'adresse","Au plus loin possible","À l'angle de la rue précédente"],"a":[0],"e":"Il doit « toujours dépasser l'adresse » (zone d'exclusion). Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_17","n":2},{"c":6,"q":"Pour une fuite de gaz, à quelle distance le conducteur s'arrête-t-il de l'intervention ?","o":["50 m avant","10 m avant","100 m après","Devant l'adresse"],"a":[0],"e":"Il « s'arrêtera toujours 50 m avant l'intervention ». Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_18","n":3},{"c":6,"q":"Sur intervention, comment orienter les roues du fourgon ?","o":["À l'opposé de la zone de travail","Vers la zone de travail","Parallèles à l'axe de la chaussée","Sans importance"],"a":[0],"e":"Orienter les roues à l'opposé de la zone de travail, caler si besoin. Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_19","n":2},{"c":6,"q":"Classes selon le MTC : quel intervalle correspond à la classe « Moyen » ?","o":["Entre 7,5 T et 16 T","Entre 2 T et 7,5 T","Plus de 16 T","Moins de 2 T"],"a":[0],"e":"Léger : 2 T < MTC ≤ 7,5 T ; Moyen : 7,5 T < MTC ≤ 16 T ; Super : MTC > 16 T. Source : « Document stagiaire COD 1 », enasis.fr.","id":"jq_conduite_20","n":3}];
const QENASIS = [{"c":5,"q":"Que signifie SDIS ?","o":["Service Départemental d'Incendie et de Secours","Secteur Départemental d'Intervention et de Sauvetage","Service De l'Intervention et du Secours","Structure Départementale d'Incendie et de Sécurité"],"a":[0],"e":"Chaque département possède un SDIS. Source : « Missions et organisation opérationnelle des services d'incendie et de secours » (SDIS 01), enasis.fr.","id":"jq_enasis_01","n":1},{"c":5,"q":"Quels personnels composent le SDIS ?","o":["SPP, SPV, SSSM et PATS","Uniquement des SPP et des SPV","SPP, SPV et gendarmes","SPV, SSSM et policiers municipaux"],"a":[0],"e":"Sapeurs-pompiers professionnels, volontaires, Service de Santé et de Secours Médical, personnels administratifs et techniques spécialisés. Source : enasis.fr, Missions et organisation opérationnelle.","id":"jq_enasis_02","n":2},{"c":5,"q":"Que signifie PATS ?","o":["Personnels Administratifs et Techniques Spécialisés","Personnels d'Aide Technique et de Secours","Postes d'Appui Technique et Sanitaire","Personnels Affectés aux Transmissions et au Secours"],"a":[0],"e":"PATS = personnels administratifs et techniques spécialisés, une des composantes du SDIS. Source : enasis.fr.","id":"jq_enasis_03","n":1},{"c":4,"q":"Quelles professions comprend le SSSM (Service de Santé et de Secours Médical) ?","o":["Médecins, pharmaciens, vétérinaires, infirmiers","Médecins, kinésithérapeutes, dentistes, infirmiers","Médecins et ambulanciers uniquement","Infirmiers, aides-soignants, pharmaciens, psychologues"],"a":[0],"e":"Le SSSM comprend médecins, pharmaciens, vétérinaires et infirmiers. Source : fiche « Les grades SP » (SDIS 63), enasis.fr.","id":"jq_enasis_04","n":2},{"c":5,"q":"Quelles sont les trois catégories de grades des sapeurs-pompiers ?","o":["Hommes du rang, sous-officiers, officiers","Sapeurs, caporaux, officiers","Hommes du rang, cadres, directeurs","Sous-officiers, officiers, officiers supérieurs"],"a":[0],"e":"Source : fiche « Les grades SP » (SDIS 63) et document « Missions et organisation opérationnelle », enasis.fr.","id":"jq_enasis_05","n":1},{"c":5,"q":"Quel arrêté fixe les tenues, uniformes, insignes et attributs des sapeurs-pompiers ?","o":["L'arrêté du 8 avril 2015","L'arrêté du 1er janvier 2000","L'arrêté du 25 juillet 2001","L'arrêté du 8 avril 1995"],"a":[0],"e":"L'arrêté du 8 avril 2015 réglemente le port des tenues, uniformes, insignes et attributs. Source : « Les grades SP », enasis.fr.","id":"jq_enasis_06","n":3},{"c":5,"q":"Comment s'adresse-t-on à un sergent ?","o":["« Bonjour, sergent »","« Bonjour mon sergent »","« Mes respects mon sergent »","« Bonjour chef »"],"a":[0],"e":"Pour un caporal ou un sergent : « Bonjour, caporal / sergent ». Source : enasis.fr, Missions et organisation opérationnelle.","id":"jq_enasis_07","n":2},{"c":5,"q":"Comment s'adresse-t-on à un adjudant ?","o":["« Bonjour mon adjudant »","« Bonjour, adjudant »","« Mes respects mon adjudant »","« Salut chef »"],"a":[0],"e":"Adjudant et lieutenant : « Bonjour mon … ». Source : enasis.fr.","id":"jq_enasis_08","n":2},{"c":5,"q":"Quelle formule de salutation est utilisée pour un capitaine, un commandant ou un colonel ?","o":["« Mes respects mon … »","« Bonjour mon … »","« Bonjour, … »","« Mes hommages, … »"],"a":[0],"e":"Capitaine, commandant, lieutenant-colonel, colonel : « Mes respects mon [grade] ». Source : enasis.fr.","id":"jq_enasis_09","n":2},{"c":5,"q":"Dans « Bonjour mon lieutenant », que signifie « mon » ?","o":["Une abréviation de « monsieur »","L'adjectif possessif","Une marque de grade","Un titre réservé aux officiers supérieurs"],"a":[0],"e":"« Mon » est l'abréviation de « monsieur » et non l'adjectif possessif ; il ne s'adresse qu'au personnel masculin. Source : enasis.fr.","id":"jq_enasis_10","n":3},{"c":5,"q":"Comment appelle-t-on un engin de sapeurs-pompiers dans l'organisation opérationnelle ?","o":["Un agrès","Un module","Un détachement","Une équipe"],"a":[0],"e":"Chaque engin est dénommé « agrès ». Source : enasis.fr, Missions et organisation opérationnelle.","id":"jq_enasis_11","n":1},{"c":5,"q":"Qui commande un agrès ?","o":["Un chef d'agrès, au minimum sous-officier","Un chef de groupe","Un officier de garde","Le conducteur de l'engin"],"a":[0],"e":"Chaque agrès est commandé par un chef d'agrès (minimum sous-officier). Source : enasis.fr.","id":"jq_enasis_12","n":2},{"c":4,"q":"Que signifie VSAV ?","o":["Véhicule de Secours et d'Assistance aux Victimes","Véhicule de Sauvetage et d'Appui Vital","Véhicule Spécialisé d'Assistance et de Ventilation","Véhicule de Secours Avancé aux Victimes"],"a":[0],"e":"Le VSAV assure les missions de secours à personne. Source : enasis.fr.","id":"jq_enasis_13","n":1},{"c":1,"q":"Que signifie FPT ?","o":["Fourgon Pompe Tonne","Fourgon Pompier Tout terrain","Fourgon de Protection Technique","Fourgon Pompe Transport"],"a":[0],"e":"Le FPT assure les missions de lutte contre les incendies. Source : enasis.fr.","id":"jq_enasis_14","n":1},{"c":5,"q":"Quelle est la mission du VTU (Véhicule Tout Usage) ?","o":["Les opérations diverses","La lutte contre les incendies","Le secours à personne","Le transport de matériel de désincarcération"],"a":[0],"e":"VTU : missions relatives aux opérations diverses. Source : enasis.fr.","id":"jq_enasis_15","n":2},{"c":5,"q":"Combien d'agrès un chef de groupe commande-t-il au maximum ?","o":["4","2","6","8"],"a":[0],"e":"Le chef de groupe commande jusqu'à 4 agrès (lieutenant à capitaine). Source : enasis.fr.","id":"jq_enasis_16","n":2},{"c":5,"q":"Quels grades peut avoir un chef de colonne ?","o":["De capitaine à commandant","De sergent à adjudant","De lieutenant à capitaine","De commandant à colonel"],"a":[0],"e":"Le chef de colonne commande jusqu'à 4 chefs de groupe (capitaine à commandant). Source : enasis.fr.","id":"jq_enasis_17","n":3},{"c":5,"q":"Que signifie COS ?","o":["Commandant des Opérations de Secours","Chef des Opérations de Sécurité","Coordonnateur des Opérations de Sauvetage","Commandant d'Origine du Secteur"],"a":[0],"e":"Le COS est un sapeur-pompier officier ou sous-officier qui dirige la partie opérationnelle. Source : enasis.fr.","id":"jq_enasis_18","n":1},{"c":5,"q":"Qui assure habituellement la fonction de DOS (Directeur des Opérations de Secours) ?","o":["Le maire ou le préfet","Le chef de centre","Le directeur du SDIS","Le médecin-chef"],"a":[0],"e":"Le DOS est le maire ou le préfet, selon leurs pouvoirs de police respectifs. Source : enasis.fr.","id":"jq_enasis_19","n":2},{"c":5,"q":"Quel est le rôle du COS par rapport au DOS ?","o":["Il met en œuvre, sous l'autorité du DOS, les moyens publics et privés mobilisés","Il remplace le DOS dès l'arrivée des secours","Il réquisitionne les moyens privés à la place du DOS","Il n'a aucun lien hiérarchique avec le DOS"],"a":[0],"e":"Sous l'autorité du DOS, le COS dirige la partie opérationnelle et met en œuvre tous les moyens mobilisés. Source : enasis.fr.","id":"jq_enasis_20","n":3}];
function formVide() { return { id: "", c: 0, n: 2, q: "", o: ["", "", "", ""], ok: [true, false, false, false], e: "", actif: true }; }
function adminQuestions() {
  const cust = ADM.custom || [];
  const cnt = THEMES.map((t, c) => { const l = BQ.filter((x) => x.c === c); return { base: l.filter((x) => SRC(x) === "base").length, quiz: l.filter((x) => SRC(x) === "quiz").length, perso: l.filter((x) => SRC(x) === "perso").length, tot: l.length }; });
  const tot = cnt.reduce((a, x) => ({ base: a.base + x.base, quiz: a.quiz + x.quiz, perso: a.perso + x.perso, tot: a.tot + x.tot }), { base: 0, quiz: 0, perso: 0, tot: 0 });
  let h = `<div class="box"><b>Nombre de questions du jeu : ${tot.tot}</b> <span class="m">= ${tot.base} intégrées + ${tot.quiz} quiz publiés + ${tot.perso} ajoutées</span><br><span class="m">Objectif de confort : ${CIBLE} questions par thème (sous ce seuil, les questions reviennent trop souvent au cours d'une partie). Il manque ${cnt.reduce((a, x) => a + Math.max(0, CIBLE - x.tot), 0)} question(s) au total pour atteindre l'objectif partout.</span><table style="width:100%;border-collapse:collapse;margin-top:8px"><tr style="text-align:left"><th>Thème</th><th>Intégrées</th><th>+ Quiz publiés</th><th>+ Ajoutées</th><th>= Total</th><th style="width:30%"></th></tr>`;
  cnt.forEach((x, c) => { const p = Math.min(100, Math.round((x.tot / CIBLE) * 100)); h += `<tr style="border-top:1px solid var(--line,#d8dde1)"><td>${THEMES[c].e} ${esc(THEMES[c].n)}</td><td>${x.base}</td><td>${x.quiz}</td><td>${x.perso}</td><td><b>${x.tot}</b></td><td><div style="height:8px;border-radius:4px;background:var(--line,#d8dde1)"><i style="display:block;height:100%;border-radius:4px;width:${p}%;background:${THEMES[c].c}"></i></div><span class="m">${x.tot >= CIBLE ? "✅ objectif atteint (" + x.tot + "/" + CIBLE + ")" : "⚠ " + x.tot + "/" + CIBLE + " : il manque " + (CIBLE - x.tot)}</span></td></tr>`; });
  h += `<tr style="border-top:2px solid var(--line,#d8dde1)"><td><b>Total</b></td><td><b>${tot.base}</b></td><td><b>${tot.quiz}</b></td><td><b>${tot.perso}</b></td><td><b>${tot.tot}</b></td><td></td></tr></table><p class="m" style="margin:6px 0 0">Les « Ajoutées » comptent seulement les questions actives. Les questions des quiz publiés sont lues automatiquement.</p></div>`;
  const f = ADM.form;
  if (f) {
    h += `<div class="box"><b>${f.id ? "Modifier la question" : "Ajouter une question"}</b>
<label class="m" style="display:block;margin-top:8px">Thème</label><select class="i" data-f="c">${THEMES.map((t, c) => `<option value="${c}"${f.c === c ? " selected" : ""}>${t.e} ${esc(t.n)}</option>`).join("")}</select>
<label class="m" style="display:block;margin-top:8px">Niveau de difficulté</label><select class="i" data-f="n">${[1, 2, 3].map((k) => `<option value="${k}"${(f.n || 2) === k ? " selected" : ""}>${NIV[k].p} ${NIV[k].n}</option>`).join("")}</select>
<label class="m" style="display:block;margin-top:8px">Question</label><textarea class="i" style="width:100%" rows="2" data-f="q">${esc(f.q)}</textarea>
<label class="m" style="display:block;margin-top:8px">Réponses (coche la ou les bonnes)</label>
${f.o.map((o, n) => `<div class="row" style="margin:4px 0"><input type="checkbox" data-j="admok" data-k="${n}"${f.ok[n] ? " checked" : ""} aria-label="Bonne réponse"><input class="i grow" data-f="o${n}" value="${esc(o)}" placeholder="Réponse ${n + 1}"><button class="b" data-j="admopt-" data-k="${n}"${f.o.length <= 2 ? " disabled" : ""} aria-label="Retirer">✕</button></div>`).join("")}
${f.o.length < 6 ? '<button class="b" data-j="admopt+">+ Réponse</button>' : ""}
<label class="m" style="display:block;margin-top:8px">Explication affichée après la réponse (facultatif)</label><textarea class="i" style="width:100%" rows="2" data-f="e">${esc(f.e)}</textarea>
<div class="row" style="margin-top:10px"><button class="b p" data-j="admsave">Enregistrer</button><button class="b" data-j="admcancel">Annuler</button></div></div>`;
  } else h += `<div class="row"><button class="b p" data-j="admnew">+ Ajouter une question</button><button class="b" data-j="admenasis">Importer 20 questions ENASIS</button>${THEMES.length > 7 ? `<button class="b" data-j="admfumees">Importer les 15 questions « ${esc(THEMES[7].n)} »</button>` : ""}<button class="b" data-j="admmvicie">Importer les 10 questions « Milieu vicié »</button>${THEMES.length > 6 ? `<button class="b" data-j="admconduite">Importer 20 questions « ${esc(THEMES[6].n)} »</button>` : ""}</div>`;
  const lst = cust.filter((d) => ADM.filtre < 0 || d.c === ADM.filtre);
  h += `<div class="box"><div class="row" style="justify-content:space-between"><b>Questions ajoutées (${cust.length})</b></div><div role="group" aria-label="Filtrer par rubrique" style="margin:6px 0"><button class="bdg${ADM.filtre < 0 ? " on" : ""}" style="--bc:#475569" data-j="admfiltre" data-k="-1">Toutes · ${cust.length} ajoutée${cust.length > 1 ? "s" : ""} / ${tot.tot} au total</button>${THEMES.map((t, c) => { const aj = cust.filter((d) => d.c === c), act = aj.filter((d) => d.actif !== false).length; return `<button class="bdg${ADM.filtre === c ? " on" : ""}" style="--bc:${t.c}" data-j="admfiltre" data-k="${c}">${t.e} ${esc(t.n)} · ${aj.length} ajoutée${aj.length > 1 ? "s" : ""} / ${cnt[c].tot} au total${act < aj.length ? " (" + (aj.length - act) + " désactivée" + (aj.length - act > 1 ? "s" : "") + ")" : ""}</button>`; }).join("")}</div><p class="m" style="margin:0 0 6px">Chaque badge indique les questions ajoutées de la rubrique, puis le total de la rubrique (intégrées + quiz publiés + ajoutées actives, comme dans le tableau). La liste ci-dessous ne montre que les questions ajoutées.</p>`;
  if (ADM.custom === null) h += `<p class="m">Chargement…</p>`;
  else if (!lst.length) h += `<p class="m">Aucune question ajoutée${ADM.filtre >= 0 ? " dans ce thème" : ""}.</p>`;
  else h += lst.map((d) => `<div style="border-top:1px solid var(--line,#d8dde1);padding:8px 0"><div class="row"><span class="tag" style="background:${THEMES[d.c] ? THEMES[d.c].c : "#64748b"}">${THEMES[d.c] ? THEMES[d.c].e : "?"}</span><span class="m" title="Niveau ${NIV[d.n || 2].n}" style="color:${NIV[d.n || 2].c}">${NIV[d.n || 2].p}</span><b class="grow">${esc(d.q)}</b></div><div class="m" style="margin:4px 0">${d.o.map((o, n) => (d.a.includes(n) ? "✅ " : "▫️ ") + esc(o)).join(" · ")}</div><div class="row"><button class="b" data-j="admedit" data-k="${esc(d.id)}">Modifier</button><button class="b" data-j="admtog" data-k="${esc(d.id)}">${d.actif === false ? "Activer" : "Désactiver"}</button><button class="b" data-j="admdel" data-k="${esc(d.id)}">Supprimer</button>${d.actif === false ? '<span class="m">désactivée</span>' : ""}</div></div>`).join("");
  if (ADM.filtre >= 0) {
    const bi = BQ.filter((x) => !x.s && x.c === ADM.filtre);
    if (bi.length) h += `<p class="m" style="margin:10px 0 4px"><b>Questions intégrées (${bi.length})</b> — fournies avec le jeu, non modifiables.</p>` + bi.map((d) => `<div style="border-top:1px solid var(--line,#d8dde1);padding:8px 0"><div class="row"><span class="tag" style="background:${THEMES[d.c] ? THEMES[d.c].c : "#64748b"}">${THEMES[d.c] ? THEMES[d.c].e : "?"}</span><span class="m" style="color:${NIV[d.n || 2].c}">${NIV[d.n || 2].p}</span><b class="grow">${esc(d.q)}</b></div><div class="m" style="margin:4px 0">${d.o.map((o, n) => (d.a.includes(n) ? "✅ " : "▫️ ") + esc(o)).join(" · ")}</div></div>`).join("");
  }
  return h + "</div>";
}
function adminReglages() {
  if (!ADM.reg) ADM.reg = { ...REG };
  const r = ADM.reg;
  return `<div class="box"><b>Réglages du jeu</b>
<label class="m" style="display:block;margin-top:10px">Qui peut jouer ?</label>
<select class="i" data-reg="visibilite"><option value="admin"${r.visibilite === "admin" ? " selected" : ""}>Administrateurs seulement (test)</option><option value="encadrement"${r.visibilite === "encadrement" ? " selected" : ""}>Encadrement : administrateurs, gestionnaires et administrateurs de département</option><option value="tous"${r.visibilite === "tous" ? " selected" : ""}>Tous les comptes connectés</option></select>
<label style="display:block;margin-top:14px"><input type="checkbox" data-j="regchrono"${r.chrono ? " checked" : ""}> Chronomètre par question</label>
<label class="m" style="display:block;margin-top:6px">Durée par question</label>
<select class="i" data-reg="chronoSec"${r.chrono ? "" : " disabled"}>${SECS.map((x) => `<option value="${x}"${r.chronoSec === x ? " selected" : ""}>${x} secondes</option>`).join("")}</select>
<p class="m" style="margin:6px 0 0">Quand le temps est écoulé, la question est comptée comme une mauvaise réponse et on passe au joueur suivant. Le niveau de difficulté (facile, moyen, difficile) s'affiche sur chaque question ; il se règle question par question dans l'onglet Questions (« moyen » par défaut).</p>
<div class="row" style="margin-top:12px"><button class="b p" data-j="regsave">Enregistrer les réglages</button></div></div>`;
}
function adminRubriques() {
  if (!ADM.rub) ADM.rub = THEMES.map((t) => ({ ...t }));
  const R = ADM.rub, nq = (i) => BQ.filter((x) => x.c === i).length;
  let h = `<div class="box"><b>Rubriques du jeu</b> <span class="m">(${MINT} à ${MAXT} rubriques jouées ; le plateau compte 4 cases par rubrique et un camembert par rubrique)</span>
<p class="m" style="margin:6px 0">Une rubrique est jouée si elle est active et possède au moins une question. Les 8 premières sont celles des questions intégrées : elles se renomment et se désactivent mais ne se suppriment pas. Les mots-clés servent à classer automatiquement les quiz publiés (en plus du titre, de la rubrique et du thème du quiz).</p>`;
  R.forEach((t, i) => {
    const n = nq(i), jouee = t.actif !== false && n > 0;
    h += `<div style="border-top:1px solid var(--line,#d8dde1);padding:8px 0"><div class="row">
<input type="color" data-rub="c" data-i="${i}" value="${esc(t.c)}" aria-label="Couleur de la rubrique ${i + 1}" style="width:38px;height:34px;padding:0;border:0;background:none">
<input class="i" data-rub="e" data-i="${i}" value="${esc(t.e)}" maxlength="4" style="width:60px;text-align:center" aria-label="Emoji">
<input class="i grow" data-rub="n" data-i="${i}" value="${esc(t.n)}" maxlength="40" aria-label="Nom de la rubrique">
<label class="m"><input type="checkbox" data-j="rubact" data-k="${i}"${t.actif !== false ? " checked" : ""}> active</label>
${i >= 8 && i === R.length - 1 && n === 0 ? `<button class="b" data-j="rubdel" data-k="${i}">Supprimer</button>` : ""}</div>
<div class="row" style="margin-top:4px"><input class="i grow" data-rub="mots" data-i="${i}" value="${esc(t.mots || "")}" placeholder="mots-clés séparés par des virgules (pour classer les quiz)" aria-label="Mots-clés"></div>
<div class="m" style="margin-top:2px">${n} question${n > 1 ? "s" : ""} · ${jouee ? "✅ jouée" : t.actif === false ? "désactivée" : "⚠ aucune question : non jouée"}</div></div>`;
  });
  h += `<div class="row" style="margin-top:10px">${R.length < MAXT ? '<button class="b" data-j="rubadd">+ Ajouter une rubrique</button>' : ""}<button class="b p" data-j="rubsave">Enregistrer les rubriques</button><button class="b" data-j="rubcancel">Annuler les changements</button></div></div>`;
  return h;
}
function adminParties() {
  const l = ADM.parties;
  if (l === null) return `<div class="box"><p class="m">Chargement…</p></div>`;
  if (!l.length) return `<div class="box"><p class="m">Aucune partie enregistrée pour l'instant. Une partie est enregistrée à sa fin, ou quand on l'abandonne après au moins une question.</p></div>`;
  const fin = l.filter((x) => x.terminee), q = l.reduce((a, x) => a + (x.questions || 0), 0), ok = l.reduce((a, x) => a + (x.bonnes || 0), 0);
  const moyD = Math.round(l.reduce((a, x) => a + (x.duree || 0), 0) / l.length), moyJ = (l.reduce((a, x) => a + (x.nb || 0), 0) / l.length).toFixed(1);
  const th = THEMES.map((t, c) => ({ t, n: l.reduce((a, x) => a + ((x.th || [])[2 * c] || 0), 0), ok: l.reduce((a, x) => a + ((x.th || [])[2 * c + 1] || 0), 0) }));
  const kpi = (v, n) => `<div class="box" style="margin:0;text-align:center"><div style="font-size:1.7rem;font-weight:800">${v}</div><div class="m">${n}</div></div>`;
  let h = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:12px 0">${kpi(l.length, "parties jouées")}${kpi(fin.length, "terminées")}${kpi(q, "questions posées")}${kpi(q ? Math.round((ok / q) * 100) + " %" : "—", "bonnes réponses")}${kpi(mmss(moyD), "durée moyenne")}${kpi(moyJ, "joueurs par partie")}</div>`;
  h += `<div class="box"><b>Réussite par thème</b>${th.map((x) => { const p = x.n ? Math.round((x.ok / x.n) * 100) : 0; return `<div class="row" style="margin:6px 0"><span style="width:210px">${x.t.e} ${esc(x.t.n)}</span><div class="grow" style="height:10px;border-radius:5px;background:var(--line,#d8dde1)"><i style="display:block;height:100%;border-radius:5px;width:${p}%;background:${x.t.c}"></i></div><b style="width:90px;text-align:right">${x.n ? p + " %" : "—"} <span class="m">(${x.n})</span></b></div>`; }).join("")}<p class="m" style="margin:6px 0 0">Entre parenthèses : nombre de questions posées. Un thème très mal réussi peut signaler une question à reformuler.</p></div>`;
  h += `<div class="box"><b>Dernières parties</b><div style="overflow:auto"><table style="width:100%;border-collapse:collapse;margin-top:8px"><tr style="text-align:left"><th>Date</th><th>Joueurs</th><th>Gagnant</th><th>Questions</th><th>Réussite</th><th>Durée</th></tr>${[...l].sort((a, b) => (b.le || 0) - (a.le || 0)).slice(0, 50).map((x) => `<tr style="border-top:1px solid var(--line,#d8dde1)"><td>${dateFr(x.le)}</td><td>${esc((x.joueurs || []).join(", "))}</td><td>${x.terminee ? "🏆 " + esc(x.gagnant || "") : '<span class="m">abandonnée</span>'}</td><td>${x.questions || 0}</td><td>${x.questions ? Math.round(((x.bonnes || 0) / x.questions) * 100) + " %" : "—"}</td><td>${mmss(x.duree || 0)}</td></tr>`).join("")}</table></div></div>`;
  return h;
}
function adminHtml() {
  chargerAdmin();
  return `<div class="row" style="margin:6px 0"><button class="b" data-j="admback">← Retour au jeu</button><button class="b${ADM.tab === "q" ? " p" : ""}" data-j="admtab" data-t="q">Questions</button><button class="b${ADM.tab === "p" ? " p" : ""}" data-j="admtab" data-t="p">Parties jouées</button><button class="b${ADM.tab === "r" ? " p" : ""}" data-j="admtab" data-t="r">Rubriques</button><button class="b${ADM.tab === "g" ? " p" : ""}" data-j="admtab" data-t="g">Réglages</button></div>${ADM.msg ? `<p class="m" role="status">${esc(ADM.msg)}</p>` : ""}${ADM.tab === "q" ? adminQuestions() : ADM.tab === "r" ? adminRubriques() : ADM.tab === "g" ? adminReglages() : adminParties()}`;
}
function enregistrerPartie(terminee) {
  if (MULTI && MULTI.role === "client") return;
  if (!G || !G.st || G.logged || !OPTS.logP || G.st.n === 0) return;
  G.logged = true;
  const th = []; G.st.th.forEach((x) => th.push(x[0], x[1]));
  Promise.resolve(OPTS.logP({ le: Date.now(), joueurs: G.joueurs.map((j) => j.nom), nb: G.joueurs.length, gagnant: terminee && G.gagnant ? G.gagnant.nom : "", terminee: !!terminee, questions: G.st.n, bonnes: G.st.ok, duree: Math.round((Date.now() - G.st.t0) / 1000), th })).catch(() => {});
}
let SON = { on: true, ctx: null, last: "" }; // sons du jeu (synthétisés, aucun fichier) ; réglage mémorisé
try { if (localStorage.getItem("tj-son") === "0") SON.on = false; } catch { /* stockage indisponible */ }
function sonCtx() {
  if (!SON.ctx) { try { const C = window.AudioContext || window.webkitAudioContext; if (C) SON.ctx = new C(); } catch { /* audio indisponible */ } }
  if (SON.ctx && SON.ctx.state === "suspended") SON.ctx.resume().catch(() => {});
  return SON.ctx;
}
function note(f, t0, d, type, vol) {
  const c = SON.ctx; if (!c) return;
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
  o.type = type || "sine"; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.05);
}
const SONS = {
  pas: () => { note(520, 0, 0.06, "triangle", 0.14); note(390, 0.03, 0.08, "sine", 0.08); },
  de: () => [0, 1, 2, 3, 4, 5].forEach((i) => note(280 + i * 45, i * 0.07, 0.06, "square", 0.07)),
  bon: () => { note(660, 0, 0.12); note(880, 0.1, 0.22); },
  gain: () => [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.1, 0.28)),
  ko: () => { note(220, 0, 0.25, "sawtooth", 0.09); note(165, 0.18, 0.4, "sawtooth", 0.09); },
  fin: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => note(f, i * 0.14, 0.32, "triangle", 0.2)),
};
function jouerSon(k) { if (!SON.on || !sonCtx()) return; try { SONS[k](); } catch { /* ignoré */ } }
function sonApres() {
  if (!G || !G.joueurs) { SON.last = ""; return; }
  const q = G.question, key = G.phase + "|" + G.cur + "|" + (q ? q.q + (q.rep ? "|r" + (q.ok ? 1 : 0) : "") : "") + (G.phase === "move" ? "|" + G.restant : "");
  if (key === SON.last) return;
  SON.last = key;
  if (G.phase === "roll") jouerSon("de");
  else if (G.phase === "move") jouerSon("pas");
  else if (G.phase === "fin") jouerSon("fin");
  else if (q && q.rep) jouerSon(q.ok ? (G.gain || q.finale ? "gain" : "bon") : "ko");
}
const sonBtn = () => `<button class="b" data-j="son" aria-pressed="${SON.on}" title="Activer ou couper le son">${SON.on ? "🔊 Son" : "🔇 Son coupé"}</button>`;
const confettis = () => `<div class="cf" aria-hidden="true">${Array.from({ length: 36 }, (_, i) => `<i style="left:${(i * 37) % 100}%;background:${["#c42a1c", "#e8b84a", "#2e9e5b", "#2e6bd6", "#8a4fd6"][i % 5]};animation-delay:${((i * 53) % 100) / 100}s;animation-duration:${2 + ((i * 29) % 15) / 10}s"></i>`).join("")}</div>`;
function introHtml() {
  return `<style>${CSS}</style><div class="tj"><div class="lay"><div class="box" style="background:var(--card,#fff)">${plateau()}</div><div class="box" style="align-self:center"><h1 style="margin:0 0 4px">🎲 Trivial pompiers</h1><p class="m" style="margin:0 0 10px">Le jeu de révision de l'équipe</p><p>Lance le dé, avance sur le plateau et réponds aux questions de chaque rubrique. Une bonne réponse sur une case camembert te fait gagner un quartier : le premier qui réunit les quartiers de toutes les rubriques gagne.</p><p class="m">Seul ou à plusieurs sur le même écran, ou à distance avec un code de salle donné par ton formateur.</p><button class="b" data-j="intro" style="font-size:1.05rem;padding:10px 22px">▶ Jouer</button></div></div></div>`;
}
function dessiner(el) {
  if (INTRO && !MULTI && G && G.phase === "menu" && G.vue !== "admin") { el.innerHTML = introHtml(); return; }
  el.innerHTML = `<style>${CSS}</style><div class="tj"><div class="row" style="justify-content:space-between"><h1>Trivial pompiers <small class="m">${G && G.vue === "admin" ? "· administration" : "(version test)"}</small></h1><span class="row" style="gap:8px">${sonBtn()}${G && G.phase !== "menu" ? '<button class="b" data-j="menu">Abandonner</button>' : OPTS.admin && !(G && G.vue === "admin") ? '<button class="b" data-j="adm">⚙ Administration du jeu</button>' : ""}</span></div>${G && G.vue === "admin" ? adminHtml() : (!G || G.phase === "menu" ? multiMenuBox() : multiBanniere()) + ecran()}${G && G.phase === "fin" && SON.last !== "fin|" ? confettis() : ""}</div>`;
  multiApres();
  sonApres();
}
function agir(el, b) {
  sonCtx();
  if (b.dataset.j === "son") { SON.on = !SON.on; try { localStorage.setItem("tj-son", SON.on ? "1" : "0"); } catch { /* ignoré */ } if (SON.on) jouerSon("bon"); dessiner(el); return; }
  if (b.dataset.j === "intro") { INTRO = false; dessiner(el); return; }
  if (multiAgir(b.dataset.j, b)) return;
  const a = b.dataset.j, j = G && G.joueurs && G.joueurs[G.cur];
  if (a === "menu" || a === "start" || a === "rejouer") { clearInterval(tmr); stopChrono(); }
  if ((a === "menu" || a === "start" || a === "rejouer") && G && G.st && G.phase !== "fin") enregistrerPartie(false);
  if (G && (G.phase === "roll" || G.phase === "move") && a !== "menu") return; // animation en cours
  if (a === "adm") { G.vue = "admin"; }
  else if (a === "admback") { G.vue = ""; }
  else if (a === "admtab") { ADM.tab = b.dataset.t; ADM.msg = ""; }
  else if (a === "admenasis") {
    ADM.msg = "Import en cours…"; dessiner(ELc);
    Promise.all(QENASIS.map((q) => Promise.resolve(OPTS.saveQ({ ...q, actif: true, le: Date.now() })))).then(() => { ADM.msg = QENASIS.length + " questions ENASIS importées."; ADM.custom = null; chargerAdmin(); }).catch((e) => { ADM.msg = "Erreur : " + (e.message || e.code); dessiner(ELc); });
    return;
  }
  else if (a === "regchrono") { ADM.reg.chrono = b.checked; }
  else if (a === "regsave") {
    const r = ADM.reg, doc = { id: "_reglages", visibilite: r.visibilite, chrono: !!r.chrono, chronoSec: Number(r.chronoSec) || 30, le: Date.now() };
    ADM.msg = "Enregistrement…";
    Promise.resolve(OPTS.saveQ(doc)).then(() => { ADM.regAdm = true; chargerReglages(doc); ADM.reg = null; ADM.msg = "Réglages enregistrés."; dessiner(ELc); }).catch((e) => { ADM.msg = "Erreur : " + (e.message || e.code); dessiner(ELc); });
  }
  else if (a === "rubadd") { if ((ADM.rub || []).length < MAXT) ADM.rub.push({ n: "Nouvelle rubrique", c: ["#0ea5e9", "#f97316"][ADM.rub.length - 8] || "#0ea5e9", e: "⭐", actif: true, mots: "" }); }
  else if (a === "rubdel") { const k = Number(b.dataset.k); if (k >= 8 && k === ADM.rub.length - 1) ADM.rub.pop(); }
  else if (a === "rubact") { ADM.rub[Number(b.dataset.k)].actif = b.checked; }
  else if (a === "rubcancel") { ADM.rub = null; ADM.msg = ""; }
  else if (a === "rubsave") {
    const R = ADM.rub, bad = R.findIndex((t) => !String(t.n).trim());
    const jouables = R.filter((t, i) => t.actif !== false && BQ.some((x) => x.c === i)).length;
    if (bad >= 0) ADM.msg = "Erreur : la rubrique " + (bad + 1) + " n'a pas de nom.";
    else if (jouables < MINT) ADM.msg = "Erreur : il faut au moins " + MINT + " rubriques actives ayant des questions (actuellement " + jouables + ").";
    else {
      const doc = { id: "_themes", themes: R.map((t) => ({ n: String(t.n).trim(), c: t.c, e: String(t.e || "⭐").trim() || "⭐", actif: t.actif !== false, mots: String(t.mots || "").trim() })), le: Date.now() };
      ADM.msg = "Enregistrement…";
      Promise.resolve(OPTS.saveQ(doc)).then(() => { ADM.themesAdm = true; chargerThemes(doc.themes); ADM.rub = null; ADM.msg = "Rubriques enregistrées : " + ACT.length + " jouées."; dessiner(ELc); }).catch((e) => { ADM.msg = "Erreur : " + (e.message || e.code); dessiner(ELc); });
    }
  }
  else if (a === "admfumees") {
    Promise.all(QFUMEES.map((q) => Promise.resolve(OPTS.saveQ({ ...q, actif: true, le: Date.now() })))).then(() => { ADM.msg = QFUMEES.length + " questions importées."; ADM.custom = null; chargerAdmin(); }).catch((e) => { ADM.msg = "Erreur : " + (e.message || e.code); dessiner(ELc); });
  }
  else if (a === "admmvicie") {
    Promise.all(QMVICIE.map((q) => Promise.resolve(OPTS.saveQ({ ...q, actif: true, le: Date.now() })))).then(() => { ADM.msg = QMVICIE.length + " questions importées."; ADM.custom = null; chargerAdmin(); }).catch((e) => { ADM.msg = "Erreur : " + (e.message || e.code); dessiner(ELc); });
  }
  else if (a === "admconduite") {
    ADM.msg = "Import en cours…"; dessiner(ELc);
    Promise.all(QCONDUITE.map((q) => Promise.resolve(OPTS.saveQ({ ...q, actif: true, le: Date.now() })))).then(() => { ADM.msg = QCONDUITE.length + " questions importées."; ADM.custom = null; chargerAdmin(); }).catch((e) => { ADM.msg = "Erreur : " + (e.message || e.code); dessiner(ELc); });
    return;
  }
  else if (a === "rubligne") { const k = Number(b.dataset.k); G.rub = G.rub || {}; G.rub[k] = !G.rub[k]; }
  else if (a === "admfiltre") { ADM.filtre = Number(b.dataset.k); }
  else if (a === "admjeu") { ADM.tab = "q"; ADM.filtre = Number(b.dataset.k); G.vue = "admin"; }
  else if (a === "admnew") { ADM.form = formVide(); ADM.msg = ""; }
  else if (a === "admcancel") { ADM.form = null; }
  else if (a === "admopt+") { ADM.form.o.push(""); ADM.form.ok.push(false); }
  else if (a === "admopt-") { const k = Number(b.dataset.k); ADM.form.o.splice(k, 1); ADM.form.ok.splice(k, 1); }
  else if (a === "admok") { ADM.form.ok[Number(b.dataset.k)] = b.checked; }
  else if (a === "admedit") { const d = (ADM.custom || []).find((x) => x.id === b.dataset.k); if (d) { ADM.form = { id: d.id, c: d.c, n: d.n || 2, q: d.q, o: [...d.o], ok: d.o.map((_, n) => d.a.includes(n)), e: d.e || "", actif: d.actif !== false }; ADM.msg = ""; } }
  else if (a === "admsave") {
    const f = ADM.form, idx = f.o.map((o, n) => (o.trim() ? n : -1)).filter((n) => n >= 0), o = idx.map((n) => f.o[n].trim()), ok = idx.map((n, k) => (f.ok[n] ? k : -1)).filter((k) => k >= 0);
    if (!f.q.trim()) ADM.msg = "Erreur : la question est vide.";
    else if (o.length < 2) ADM.msg = "Erreur : au moins deux réponses.";
    else if (!ok.length) ADM.msg = "Erreur : coche au moins une bonne réponse.";
    else {
      const doc = { ...(f.id ? { id: f.id } : {}), c: f.c, n: f.n || 2, q: f.q.trim(), o, a: ok, e: f.e.trim(), actif: f.actif !== false, le: Date.now() };
      ADM.msg = "Enregistrement…";
      Promise.resolve(OPTS.saveQ(doc)).then((id) => {
        const d = { ...doc, id: f.id || id };
        ADM.custom = [...(ADM.custom || []).filter((x) => x.id !== d.id), d]; ADM.form = null; ADM.msg = "Question enregistrée."; syncBQ(); dessiner(ELc);
      }).catch((e) => { ADM.msg = "Erreur : " + (e.message || e.code); dessiner(ELc); });
    }
  }
  else if (a === "admtog") {
    const d = (ADM.custom || []).find((x) => x.id === b.dataset.k);
    if (d) Promise.resolve(OPTS.saveQ({ ...d, actif: d.actif === false })).then(() => { d.actif = d.actif === false; syncBQ(); dessiner(ELc); }).catch((e) => { ADM.msg = "Erreur : " + (e.message || e.code); dessiner(ELc); });
  }
  else if (a === "admdel") {
    const d = (ADM.custom || []).find((x) => x.id === b.dataset.k);
    if (d && window.confirm("Supprimer cette question ?")) Promise.resolve(OPTS.delQ(d.id)).then(() => { ADM.custom = ADM.custom.filter((x) => x.id !== d.id); syncBQ(); dessiner(ELc); }).catch((e) => { ADM.msg = "Erreur : " + (e.message || e.code); dessiner(ELc); });
  }
  else if (a === "nc") { G.nc = b.checked; piles = {}; }
  else if (a === "ajouter") { G.noms.push("Joueur " + (G.noms.length + 1)); }
  else if (a === "retirer") { G.noms.splice(Number(b.dataset.k), 1); }
  else if (a === "start" || a === "rejouer") {
    appliquerThemes();
    const prevU = a === "rejouer" ? G.joueurs.map((x) => x.uid) : [];
    const noms = a === "rejouer" ? G.joueurs.map((x) => x.nom) : G.noms.map((n, i) => n.trim() || "Joueur " + (i + 1));
    piles = {};
    G = { phase: "de", nc: !!(G && G.nc), st: { n: 0, ok: 0, th: THEMES.map(() => [0, 0]), t0: Date.now() }, noms, joueurs: noms.map((n, i) => ({ nom: n, uid: prevU[i], pos: 0, parts: THEMES.map((_, t) => !ACT.includes(t)) })), cur: 0, de: 0, question: null, msg: "", gain: false };
  }
  else if (a === "menu") { G = { phase: "menu", nc: !!(G && G.nc), noms: (G && G.noms) || ["Joueur 1", "Joueur 2"] }; }
  else if (a === "lancer") lancerDe();
  else if (a === "aller") {
    const d = Number(b.dataset.d); G.phase = "move"; G.restant = G.de; G.gain = false; G.msg = ""; clearInterval(tmr);
    tmr = setInterval(() => {
      j.pos = (j.pos + d + N) % N; G.restant--;
      if (G.restant <= 0) { clearInterval(tmr); G.question = nouvelleQuestion(cat(j.pos)); G.question.case = j.pos; G.phase = "q"; lancerChrono(); }
      dessiner(ELc);
    }, 260);
  }
  else if (a === "final") {
    const k = b.dataset.k !== undefined ? Number(b.dataset.k) : ACT[Math.floor(Math.random() * ACT.length)];
    G.question = nouvelleQuestion(k); G.question.finale = true; G.phase = "q"; G.gain = false; G.msg = ""; lancerChrono();
  }
  else if (a === "opt") {
    const q = G.question, k = Number(b.dataset.k);
    if (q.rep) return;
    if (q.bon.length > 1) q.sel = q.sel.includes(k) ? q.sel.filter((x) => x !== k) : [...q.sel, k]; else q.sel = [k];
  }
  else if (a === "valider") {
    const q = G.question; if (q.rep || !q.sel.length) return;
    stopChrono(); corriger(q, false);
  }
  else if (a === "suite") {
    const q = G.question;
    if (q.finale && q.ok) { G.phase = "fin"; G.gagnant = j; enregistrerPartie(true); }
    else { if (!q.ok) { G.cur = (G.cur + 1) % G.joueurs.length; } G.phase = "de"; G.msg = q.ok ? "Bonne réponse : rejoue !" : ""; G.gain = false; if (q.ok && !j.parts.every(Boolean)) lancerDe(); }
  }
  dessiner(ELc);
}
let tq = null; // chronomètre de la question
const stopChrono = () => { clearInterval(tq); tq = null; };
function corriger(q, temps) {
  const j = G.joueurs[G.cur];
  q.rep = true; q.timeout = !!temps; q.ok = !temps && q.sel.length === q.bon.length && q.sel.every((k) => q.bon.includes(k));
  G.st.n++; G.st.th[q.cat][0]++; if (q.ok) { G.st.ok++; G.st.th[q.cat][1]++; }
  G.gain = false;
  if (q.ok && !q.finale && camem(q.case) && !j.parts[q.cat]) { j.parts[q.cat] = true; G.gain = true; }
}
function lancerChrono() {
  stopChrono();
  if (!REG.chrono || !G || !G.question) return;
  const q = G.question; q.fin = Date.now() + REG.chronoSec * 1000;
  tq = setInterval(() => {
    if (!G || G.phase !== "q" || G.question !== q || q.rep) { stopChrono(); return; }
    const r = Math.max(0, Math.ceil((q.fin - Date.now()) / 1000));
    const t = ELc && ELc.querySelector("#tjchr"), b = ELc && ELc.querySelector("#tjchb");
    if (t) t.textContent = r + " s"; if (b) b.style.width = Math.max(0, (100 * (q.fin - Date.now())) / (REG.chronoSec * 1000)) + "%";
    if (r <= 0) { stopChrono(); corriger(q, true); dessiner(ELc); }
  }, 250);
}
function lancerDe() {
  const fin = 1 + Math.floor(Math.random() * 6); let n = 0;
  G.phase = "roll"; G.face = fin; clearInterval(tmr);
  tmr = setInterval(() => {
    n++; G.face = 1 + Math.floor(Math.random() * 6);
    if (n >= 11) { clearInterval(tmr); G.de = fin; G.phase = "dir"; }
    dessiner(ELc);
  }, 90);
}
// ---- Multijoueur : une partie, plusieurs téléphones ----
// Le formateur (hôte) fait tourner le jeu et publie l'état dans un document ; les joueurs affichent cet état et envoient leurs actions.
// Adaptateurs fournis par l'application : OPTS.salle = { uid(), nom(), peutCreer(), set(id, data), watchDoc(id, cb), watchCode(code, cb), qr(texte), lien(code) }.
let MULTI = null; // { role: "host" | "client", code, uid, mode, joueursL, vu, vus, unsub[], timers[], ... }
const MU = { code: "", nom: "", mode: "salle", joue: false, msg: "" };
const ACTIONS_JOUEUR = ["lancer", "aller", "opt", "valider", "suite", "final"];
const HORS_LIGNE = 40000, TOUR_MAX = 90000;
const salleOk = () => !!(OPTS.salle && OPTS.salle.uid && OPTS.salle.uid());
const aleaCode = () => { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 5; i++) s += c[Math.floor(Math.random() * c.length)]; return s; };
const pidDoc = (code, uid) => code + "_" + uid;
const lsGet = () => { try { return JSON.parse(localStorage.getItem("tj-multi") || "null"); } catch { return null; } };
const lsSet = (v) => { try { if (v) localStorage.setItem("tj-multi", JSON.stringify(v)); else localStorage.removeItem("tj-multi"); } catch { /* sans stockage */ } };
const cfgPublic = () => ({ themes: THEMES.map((t) => ({ n: t.n, c: t.c, e: t.e })), act: [...ACT], chrono: !!REG.chrono, chronoSec: REG.chronoSec });
function lireEtat(code) {
  return new Promise((ok) => {
    let u = null, fait = false;
    const fin = (d) => { if (fait) return; fait = true; try { if (u) u(); } catch { /* déjà fermé */ } ok(d); };
    try { u = OPTS.salle.watchDoc(code, (d) => { if (d) fin(d); }); if (fait && u) u(); } catch { fin(null); }
    setTimeout(() => fin(null), 5000);
  });
}
function multiNettoyer() {
  if (!MULTI) return;
  (MULTI.unsub || []).forEach((u) => { try { u(); } catch { /* déjà fermé */ } });
  (MULTI.timers || []).forEach((t) => clearInterval(t));
  clearTimeout(MULTI.pt); clearInterval(MULTI.rollT);
  MULTI = null;
}
// Sortie de la page : on coupe les abonnements, la partie pourra être reprise (code mémorisé).
export function multiDetach() { if (MULTI) { multiNettoyer(); G = { phase: "menu", noms: (G && G.noms) || ["Joueur 1", "Joueur 2"] }; stopChrono(); } }

// ---------- menu : créer / rejoindre ----------
function multiMenuBox() {
  if (!salleOk()) return "";
  const S = OPTS.salle, rep = lsGet();
  if (!MU.code && OPTS.codeInitial) MU.code = String(OPTS.codeInitial).toUpperCase().slice(0, 5);
  let h = `<div class="box"><h2 style="margin-top:0">Jouer à plusieurs, chacun sur son téléphone</h2>`;
  if (MU.msg) h += `<p class="m" role="status">${esc(MU.msg)}</p>`;
  if (rep && rep.code) h += `<div class="row" style="margin-bottom:8px"><button class="b p" data-j="mreprendre">Reprendre la partie ${esc(rep.code)} (${rep.role === "host" ? "formateur" : "joueur"})</button><button class="b" data-j="moublier">Oublier</button></div>`;
  h += `<label class="m" style="display:block">Rejoindre une partie</label><div class="row"><input class="i" data-mu="code" value="${esc(MU.code)}" placeholder="Code" maxlength="5" style="text-transform:uppercase;width:130px;letter-spacing:.2em" aria-label="Code de la partie" autocomplete="off"><input class="i grow" data-mu="nom" value="${esc(MU.nom || S.nom() || "")}" placeholder="Ton nom" maxlength="20" aria-label="Ton nom"><button class="b p" data-j="mrejoindre">Rejoindre</button></div>`;
  if (S.peutCreer && S.peutCreer()) {
    h += `<div style="margin-top:14px;border-top:1px solid var(--line,#d8dde1);padding-top:10px"><label class="m" style="display:block">Créer une partie (formateur)</label>
<div class="row"><label><input type="radio" name="mmode" data-j="mmode" data-k="salle"${MU.mode === "salle" ? " checked" : ""}> En salle de cours</label><label><input type="radio" name="mmode" data-j="mmode" data-k="distance"${MU.mode === "distance" ? " checked" : ""}> À distance</label></div>
<label style="display:block;margin:6px 0"><input type="checkbox" data-j="mjoue"${MU.joue ? " checked" : ""}> Je joue aussi</label>
<button class="b p" data-j="mcreer">Créer la partie</button>
<p class="m" style="margin:6px 0 0">${MU.mode === "salle" ? "Le plateau s'affiche en grand sur cet écran ; chacun répond depuis son téléphone." : "Chacun voit le plateau sur son téléphone. Cet écran sert au formateur."} Les participants doivent avoir accès au jeu (Réglages du jeu › Qui peut jouer ?).</p></div>`;
  }
  return h + "</div>";
}
async function mCreer() {
  const S = OPTS.salle, uid = S.uid();
  appliquerThemes();
  if (JEU_KO) { MU.msg = "Jeu indisponible : au moins " + MINT + " rubriques actives avec des questions sont nécessaires."; return; }
  let code = "";
  for (let i = 0; i < 6 && !code; i++) {
    const c = aleaCode();
    try { await S.set(c, { code: c, host: uid, phase: "lobby", mode: MU.mode, lobby: [], cfg: cfgPublic(), hb: Date.now(), v: Date.now() }); code = c; } catch { /* code déjà pris : on réessaie */ }
  }
  if (!code) { MU.msg = "Création impossible (connexion ou droits). Réessaie."; return; }
  multiNettoyer();
  MULTI = { role: "host", code, uid, mode: MU.mode, joue: MU.joue, nomHote: MU.nom || S.nom() || "Formateur", joueursL: [], vu: {}, vus: {}, parti: {}, unsub: [], timers: [], last: "", lastT: 0, qr: "" };
  G = { phase: "lobby", noms: [] };
  MULTI.unsub.push(S.watchCode(code, hoteJoueurs));
  MULTI.timers.push(setInterval(() => multiPublier(true), 10000), setInterval(verifierTours, 4000));
  lsSet({ code, role: "host" });
  if (S.qr && S.lien) Promise.resolve(S.qr(S.lien(code))).then((q) => { if (MULTI && MULTI.code === code) { MULTI.qr = q; dessiner(ELc); } }).catch(() => {});
  MU.msg = "";
}
function hoteJoueurs(list) {
  if (!MULTI || MULTI.role !== "host") return;
  const now = Date.now();
  MULTI.joueursL = (list || []).filter((d) => d.uid).sort((a, b) => (a.t0 || 0) - (b.t0 || 0));
  MULTI.joueursL.forEach((d) => {
    const v = MULTI.vu[d.uid];
    if (!v || v.le !== d.le) MULTI.vu[d.uid] = { le: d.le, at: now };
    if (d.left && !MULTI.parti[d.uid]) { MULTI.parti[d.uid] = true; if (G && G.joueurs) retirerJoueur(d.uid); }
    if (d.act && d.act.n > (MULTI.vus[d.uid] || 0)) { MULTI.vus[d.uid] = d.act.n; multiAction(d.uid, d.act); }
  });
  if (G && G.phase === "lobby") { multiPublier(false); dessiner(ELc); }
}
const enLigne = (uid) => { const v = MULTI && MULTI.vu[uid]; return !!v && Date.now() - v.at < HORS_LIGNE; };
function lobbyActifs() { return (MULTI.joueursL || []).filter((d) => !d.left && enLigne(d.uid)); }
function multiLobbyHtml() {
  const L = lobbyActifs(), nb = L.length + (MULTI.joue ? 1 : 0), S = OPTS.salle;
  const lien = S.lien ? S.lien(MULTI.code) : "";
  const qr = MULTI.qr ? (String(MULTI.qr).startsWith("<") ? `<div style="width:160px;height:160px;background:#fff;padding:4px;border-radius:6px">${MULTI.qr}</div>` : `<img src="${esc(MULTI.qr)}" alt="QR code pour rejoindre" width="160" height="160" style="background:#fff;border-radius:6px">`) : "";
  return `<div class="box"><h2 style="margin-top:0">Partie multijoueur · en attente des joueurs</h2>
<div class="row" style="align-items:center;gap:20px"><div><div class="m">Code à saisir dans le jeu</div><div class="code">${esc(MULTI.code)}</div>${lien ? `<div class="m" style="word-break:break-all">${esc(lien)}</div>` : ""}</div>${qr}</div>
<div class="row" style="margin-top:10px"><label><input type="radio" name="mmode" data-j="mmode" data-k="salle"${MULTI.mode === "salle" ? " checked" : ""}> En salle de cours</label><label><input type="radio" name="mmode" data-j="mmode" data-k="distance"${MULTI.mode === "distance" ? " checked" : ""}> À distance</label></div>
<label style="display:block;margin:6px 0"><input type="checkbox" data-j="mjoue"${MULTI.joue ? " checked" : ""}> Je joue aussi</label>
<b>Joueurs (${nb} sur 6 maximum)</b>
<div style="margin:6px 0">${MULTI.joue ? `<div class="pl"><span class="pion" style="background:${COULEURS[0]}"></span><b class="grow">${esc(MULTI.nomHote)} (formateur)</b></div>` : ""}${L.slice(0, 6 - (MULTI.joue ? 1 : 0)).map((d, i) => `<div class="pl"><span class="pion" style="background:${COULEURS[i + (MULTI.joue ? 1 : 0)]}"></span><b class="grow">${esc(d.nom)}</b><span class="m">connecté</span></div>`).join("") || (MULTI.joue ? "" : '<p class="m">Personne pour l\'instant : demande aux joueurs de saisir le code.</p>')}${L.length + (MULTI.joue ? 1 : 0) > 6 ? '<p class="m">Partie complète : les suivants ne joueront pas.</p>' : ""}</div>
<div class="row"><button class="b p" data-j="mdemarrer"${nb < 1 ? " disabled" : ""}>Démarrer la partie</button><button class="b" data-j="menu">Annuler</button></div></div>`;
}
function mDemarrer() {
  if (!MULTI || MULTI.role !== "host") return;
  appliquerThemes();
  if (JEU_KO) { MU.msg = "Jeu indisponible (rubriques)."; return; }
  const arr = [];
  if (MULTI.joue) arr.push({ nom: MULTI.nomHote, uid: MULTI.uid });
  lobbyActifs().forEach((d) => { if (arr.length < 6) arr.push({ nom: d.nom, uid: d.uid }); });
  if (!arr.length) return;
  piles = {};
  MULTI.cfg = cfgPublic();
  G = { phase: "de", nc: false, st: { n: 0, ok: 0, th: THEMES.map(() => [0, 0]), t0: Date.now() }, noms: arr.map((x) => x.nom), joueurs: arr.map((x) => ({ nom: x.nom, uid: x.uid, pos: 0, parts: THEMES.map((_, t) => !ACT.includes(t)) })), cur: 0, de: 0, question: null, msg: "", gain: false, tourT: Date.now() };
  multiPublier(true);
}
// ---------- publication de l'état (hôte) ----------
function etatPublic() {
  const base = { code: MULTI.code, host: MULTI.uid, mode: MULTI.mode, cfg: MULTI.cfg || cfgPublic() };
  if (!G || G.phase === "lobby") return { ...base, phase: "lobby", lobby: lobbyActifs().map((d) => d.nom) };
  const q = G.question, flat = []; G.st.th.forEach((x) => flat.push(x[0], x[1]));
  return {
    ...base, phase: G.phase, cur: G.cur, de: G.de || 0, restant: G.restant || 0, gain: !!G.gain, msg: G.msg || "", gagnant: G.gagnant ? G.gagnant.nom : "",
    joueurs: G.joueurs.map((j) => ({ uid: j.uid || "", nom: j.nom, pos: j.pos, parts: j.parts })),
    q: q ? { cat: q.cat, n: q.n, q: q.q, opts: q.opts, sel: q.sel, rep: !!q.rep, ok: !!q.ok, timeout: !!q.timeout, finale: !!q.finale, multi: q.bon.length > 1, reste: q.fin && !q.rep ? Math.max(0, q.fin - Date.now()) : 0, ...(q.rep ? { bon: q.bon, e: q.e || "" } : {}) } : null,
    st: { n: G.st.n, ok: G.st.ok, th: flat, t0: G.st.t0 },
  };
}
function multiPublier(force) {
  if (!MULTI || MULTI.role !== "host") return;
  const st = etatPublic();
  const key = JSON.stringify(st, (k, v) => (k === "reste" ? undefined : v));
  if (!force && key === MULTI.last) return;
  if (!force && (st.phase === "roll" || st.phase === "move") && MULTI.lastPhase === st.phase) return;
  const dt = Date.now() - MULTI.lastT;
  if (!force && dt < 450) { clearTimeout(MULTI.pt); MULTI.pt = setTimeout(() => multiPublier(false), 450 - dt); return; }
  clearTimeout(MULTI.pt);
  MULTI.last = key; MULTI.lastPhase = st.phase; MULTI.lastT = Date.now();
  st.v = st.hb = Date.now();
  Promise.resolve(OPTS.salle.set(MULTI.code, st)).catch(() => { MULTI.last = ""; });
}
// ---------- actions des joueurs (hôte) ----------
function actionValide(t, uid) { // uid = null : le formateur peut agir à la place du joueur dont c'est le tour
  if (!G || !G.joueurs || G.phase === "lobby") return false;
  const cur = G.joueurs[G.cur], q = G.question, ph = G.phase, mine = uid === null || (cur && cur.uid === uid);
  if (t === "lancer") return mine && ph === "de" && !cur.parts.every(Boolean);
  if (t === "aller") return mine && ph === "dir";
  if (t === "opt") return mine && ph === "q" && !!q && !q.rep;
  if (t === "valider") return mine && ph === "q" && !!q && !q.rep && q.sel.length > 0;
  if (t === "suite") return mine && ph === "q" && !!q && q.rep;
  if (t === "final") return ph === "de" && cur.parts.every(Boolean) && (G.joueurs.length < 2 || uid === null || !(cur.uid === uid));
  return false;
}
function multiAction(uid, act) {
  if (!ACTIONS_JOUEUR.includes(act.t) || !actionValide(act.t, uid)) return;
  const ds = { j: act.t };
  if (act.k !== undefined) ds.k = String(act.k);
  if (act.d !== undefined) ds.d = String(act.d);
  agir(ELc, { dataset: ds, checked: false });
}
function retirerJoueur(uid) {
  const i = G.joueurs.findIndex((j) => j.uid === uid);
  if (i < 0) return;
  const etaitCur = i === G.cur;
  G.joueurs.splice(i, 1);
  if (!G.joueurs.length) { G = { phase: "menu", noms: ["Joueur 1", "Joueur 2"] }; stopChrono(); clearInterval(tmr); multiFermer("Plus aucun joueur : partie terminée."); return; }
  if (i < G.cur) G.cur--;
  if (etaitCur) { stopChrono(); clearInterval(tmr); G.cur = G.cur % G.joueurs.length; G.phase = "de"; G.question = null; G.msg = "Un joueur a quitté : au suivant."; G.gain = false; }
  dessiner(ELc);
}
function verifierTours() {
  if (!MULTI || MULTI.role !== "host" || !G || !G.joueurs || G.phase === "lobby" || G.phase === "fin" || G.phase === "roll" || G.phase === "move") return;
  const j = G.joueurs[G.cur]; if (!j || j.uid === MULTI.uid) return;
  const idle = Date.now() - (G.tourT || Date.now()), off = !enLigne(j.uid), q = G.question;
  if (G.phase === "de" || G.phase === "dir") {
    if ((off && idle > 20000) || idle > TOUR_MAX) { G.cur = (G.cur + 1) % G.joueurs.length; G.phase = "de"; G.msg = j.nom + " " + (off ? "est absent" : "n'a pas joué") + " : au suivant."; dessiner(ELc); }
  } else if (G.phase === "q" && q && !q.rep) {
    if ((off && idle > 20000) || (!REG.chrono && idle > TOUR_MAX)) { stopChrono(); corriger(q, true); dessiner(ELc); }
  } else if (G.phase === "q" && q && q.rep && idle > 30000) { agir(ELc, { dataset: { j: "suite" }, checked: false }); }
}
function multiFermer(msg) {
  if (MULTI && MULTI.role === "host") { try { OPTS.salle.set(MULTI.code, { code: MULTI.code, host: MULTI.uid, phase: "ferme", mode: MULTI.mode, hb: Date.now(), v: Date.now() }); } catch { /* hors ligne */ } }
  lsSet(null); multiNettoyer(); if (msg) MU.msg = msg;
}
// ---------- côté joueur ----------
function ecrireJoueur() {
  if (!MULTI || MULTI.role !== "client") return;
  Promise.resolve(OPTS.salle.set(pidDoc(MULTI.code, MULTI.uid), { code: MULTI.code, uid: MULTI.uid, nom: MULTI.nom, t0: MULTI.t0, le: Date.now(), left: !!MULTI.left, act: MULTI.act || null })).catch(() => {});
}
async function mRejoindre(code, nom, t0) {
  const S = OPTS.salle, uid = S.uid();
  code = String(code || "").toUpperCase().trim(); nom = String(nom || "").trim();
  if (code.length < 4 || !nom) { MU.msg = "Saisis le code de la partie et ton nom."; return; }
  MU.msg = "Connexion…"; dessiner(ELc);
  const st = await lireEtat(code);
  if (!st || !st.host) { MU.msg = "Code inconnu : vérifie le code ou demande-le au formateur."; return; }
  if (st.phase === "ferme") { MU.msg = "Cette partie est terminée."; lsSet(null); return; }
  const deja = (st.joueurs || []).some((j) => j.uid === uid);
  if (st.phase !== "lobby" && !deja) { MU.msg = "La partie a déjà commencé."; return; }
  multiNettoyer();
  MULTI = { role: "client", code, uid, nom, t0: t0 || Date.now(), n: 0, act: null, unsub: [], timers: [], hb: { v: 0, at: Date.now() } };
  G = { phase: "lobby", noms: [] };
  ecrireJoueur();
  MULTI.unsub.push(S.watchDoc(code, clientEtat));
  MULTI.timers.push(setInterval(ecrireJoueur, 8000), setInterval(tickClient, 250));
  lsSet({ code, role: "client", nom, t0: MULTI.t0 });
  MU.msg = ""; MU.code = code; MU.nom = nom;
}
function hydrater(S) {
  const c = S.cfg || {};
  if (c.themes) THEMES = c.themes.map((t) => ({ n: t.n, c: t.c, e: t.e, actif: true, mots: "" }));
  if (c.act) { ACT = [...c.act]; N = 4 * ACT.length; }
  REG = { ...REG, chrono: !!c.chrono, chronoSec: c.chronoSec || 30 };
  const q = S.q;
  G = {
    phase: S.phase, vue: "", cur: S.cur || 0, de: S.de || 0, restant: S.restant || 0, face: (G && G.face) || 1, gain: !!S.gain, msg: S.msg || "",
    gagnant: S.gagnant ? { nom: S.gagnant } : null, joueurs: (S.joueurs || []).map((j) => ({ uid: j.uid, nom: j.nom, pos: j.pos || 0, parts: j.parts || [] })), st: S.st,
    question: q ? { cat: q.cat, n: q.n || 2, q: q.q, opts: q.opts || [], sel: q.sel || [], rep: !!q.rep, ok: !!q.ok, timeout: !!q.timeout, finale: !!q.finale, e: q.e || "", bon: q.rep ? (q.bon || []) : q.multi ? [0, 1] : [0], fin: q.reste ? Date.now() + q.reste : 0 } : null,
  };
  if (S.phase === "roll") {
    if (!MULTI.rollT) MULTI.rollT = setInterval(() => { if (G) { G.face = 1 + Math.floor(Math.random() * 6); dessiner(ELc); } }, 110);
  } else if (MULTI.rollT) { clearInterval(MULTI.rollT); MULTI.rollT = null; }
}
function clientEtat(S) {
  if (!MULTI || MULTI.role !== "client") return;
  if (!S) { multiNettoyer(); lsSet(null); G = { phase: "menu", noms: ["Joueur 1", "Joueur 2"] }; MU.msg = "Partie introuvable."; dessiner(ELc); return; }
  if (S.phase === "ferme") { multiNettoyer(); lsSet(null); G = { phase: "menu", noms: ["Joueur 1", "Joueur 2"] }; MU.msg = "Le formateur a terminé la partie."; dessiner(ELc); return; }
  if (S.hb !== MULTI.hb.v) MULTI.hb = { v: S.hb, at: Date.now() };
  MULTI.S = S;
  if (S.phase === "lobby") { G = { phase: "lobby", noms: [] }; MULTI.lobby = S.lobby || []; }
  else {
    if (!(S.joueurs || []).some((j) => j.uid === MULTI.uid)) { multiNettoyer(); lsSet(null); G = { phase: "menu", noms: ["Joueur 1", "Joueur 2"] }; MU.msg = "Tu ne fais pas partie de cette partie (déjà commencée ou complète)."; dessiner(ELc); return; }
    hydrater(S);
  }
  dessiner(ELc);
}
function tickClient() {
  if (!MULTI || MULTI.role !== "client") return;
  const off = Date.now() - MULTI.hb.at > 45000;
  if (off !== !!MULTI.hostOff) { MULTI.hostOff = off; dessiner(ELc); return; }
  const q = G && G.question;
  if (G && G.phase === "q" && q && !q.rep && q.fin && REG.chrono) {
    const r = Math.max(0, Math.ceil((q.fin - Date.now()) / 1000)), t = ELc && ELc.querySelector("#tjchr"), b = ELc && ELc.querySelector("#tjchb");
    if (t) t.textContent = r + " s"; if (b) b.style.width = Math.max(0, (100 * (q.fin - Date.now())) / (REG.chronoSec * 1000)) + "%";
  }
}
function multiEnvoyer(a, b) {
  if (!ACTIONS_JOUEUR.includes(a) || !G || !G.joueurs) return;
  const act = { t: a, n: Math.max((MULTI.n || 0) + 1, Date.now()) };
  if (b.dataset.k !== undefined) act.k = Number(b.dataset.k);
  if (b.dataset.d !== undefined) act.d = Number(b.dataset.d);
  MULTI.n = act.n; MULTI.act = act;
  const q = G.question;
  if (a === "opt" && q && !q.rep) { const k = act.k; q.sel = q.bon.length > 1 ? (q.sel.includes(k) ? q.sel.filter((x) => x !== k) : [...q.sel, k]) : [k]; }
  ecrireJoueur(); dessiner(ELc);
}
function multiBanniere() {
  if (!MULTI || !G || G.phase === "lobby" || G.vue === "admin") return "";
  const nbOn = MULTI.role === "host" ? lobbyActifs().length : 0;
  if (MULTI.role === "host") return `${MU.msg ? `<div class="box" role="status">${esc(MU.msg)}</div>` : ""}<div class="box" style="padding:8px 12px"><span class="m">Partie multijoueur · code</span> <b class="codep">${esc(MULTI.code)}</b> <span class="m">· ${MULTI.mode === "salle" ? "salle de cours" : "à distance"} · ${nbOn} joueur${nbOn > 1 ? "s" : ""} connecté${nbOn > 1 ? "s" : ""} · le formateur peut jouer à la place d'un joueur absent</span></div>`;
  const cur = G.joueurs && G.joueurs[G.cur], k = (G.joueurs || []).findIndex((j) => j.uid === MULTI.uid), mine = cur && cur.uid === MULTI.uid;
  return `${MULTI.hostOff ? '<div class="box" role="alert" style="border-color:#b91c1c"><b>⚠ Le formateur semble déconnecté.</b> La partie reprendra dès son retour.</div>' : ""}<div class="box" style="padding:8px 12px"><span class="pion" style="background:${COULEURS[Math.max(0, k)]};display:inline-block;vertical-align:middle"></span> <b>${esc(MULTI.nom)}</b> <span class="m">· code ${esc(MULTI.code)} ·</span> ${G.phase === "fin" ? "<b>Partie terminée</b>" : mine ? "<b>🎲 C'est ton tour !</b>" : `<span class="m">au tour de</span> <b>${esc(cur ? cur.nom : "")}</b>`}</div>`;
}
function multiEcran() {
  if (!MULTI || !G) return null;
  if (G.phase === "lobby") {
    if (MULTI.role === "host") return multiLobbyHtml();
    return `<div class="box"><h2 style="margin-top:0">Partie ${esc(MULTI.code)}</h2><p>Tu es connecté en tant que <b>${esc(MULTI.nom)}</b>. En attente du démarrage par le formateur…</p><p class="m">Joueurs : ${(MULTI.lobby || []).map(esc).join(", ") || "—"}</p>${MULTI.hostOff ? '<p class="m">⚠ Le formateur semble déconnecté.</p>' : ""}<div class="row"><button class="b" data-j="menu">Quitter</button></div></div>`;
  }
  if (MULTI.role === "client" && MULTI.S && MULTI.S.mode === "salle" && G.phase !== "fin") return `<div>${panneau()}${joueursHtml()}</div>`;
  return null;
}
function multiApres() {
  if (!MULTI || !G) return;
  if (MULTI.role === "host") {
    if (G.joueurs && G.phase !== "lobby") { const k = G.phase + "|" + G.cur + "|" + (G.question ? (G.question.rep ? 1 : 0) + G.question.q : ""); if (k !== MULTI.tk) { MULTI.tk = k; G.tourT = Date.now(); } }
    multiPublier(false);
    return;
  }
  if (!G.joueurs || G.phase === "lobby" || !ELc) return;
  const cur = G.joueurs[G.cur], mine = !!cur && cur.uid === MULTI.uid, duel = G.joueurs.length > 1;
  ELc.querySelectorAll("button[data-j]").forEach((bt) => {
    const a = bt.dataset.j;
    if (a === "menu") { bt.textContent = "Quitter"; return; }
    const ok = a === "final" ? (duel ? !mine : mine) : ACTIONS_JOUEUR.includes(a) ? mine : false;
    if (!ok) bt.disabled = true;
  });
}
// Renvoie true si l'action est entièrement traitée ici.
function multiAgir(a, b) {
  if (a === "mmode") { MU.mode = b.dataset.k; if (MULTI && MULTI.role === "host") { MULTI.mode = b.dataset.k; multiPublier(false); } dessiner(ELc); return true; }
  if (a === "mjoue") { MU.joue = b.checked; if (MULTI && MULTI.role === "host") MULTI.joue = b.checked; dessiner(ELc); return true; }
  if (a === "mrejoindre") { mRejoindre(MU.code, MU.nom || (OPTS.salle && OPTS.salle.nom && OPTS.salle.nom()), null).then(() => dessiner(ELc)); return true; }
  if (a === "mcreer") { MU.msg = "Création…"; dessiner(ELc); mCreer().then(() => dessiner(ELc)); return true; }
  if (a === "mdemarrer") { mDemarrer(); dessiner(ELc); return true; }
  if (a === "moublier") { lsSet(null); dessiner(ELc); return true; }
  if (a === "mreprendre") {
    const r = lsGet(); if (!r) return true;
    if (r.role === "client") { mRejoindre(r.code, r.nom || (OPTS.salle.nom && OPTS.salle.nom()), r.t0).then(() => dessiner(ELc)); return true; }
    lireEtat(r.code).then((S) => {
      if (!S || S.host !== OPTS.salle.uid() || S.phase === "ferme") { MU.msg = "Partie introuvable."; lsSet(null); return dessiner(ELc); }
      reprendreHote(S); dessiner(ELc);
    });
    return true;
  }
  if (!MULTI) return false;
  if (a === "menu") {
    if (MULTI.role === "client") { MULTI.left = true; ecrireJoueur(); multiNettoyer(); lsSet(null); G = { phase: "menu", noms: ["Joueur 1", "Joueur 2"] }; dessiner(ELc); return true; }
    if (!MULTI.conf) { MULTI.conf = true; MU.msg = "Clique à nouveau sur « Abandonner » pour arrêter la partie de tous les joueurs."; dessiner(ELc); return true; }
    { if (G && G.st && G.phase !== "fin" && G.joueurs) enregistrerPartie(false); stopChrono(); clearInterval(tmr); multiFermer("Partie multijoueur arrêtée."); G = { phase: "menu", noms: ["Joueur 1", "Joueur 2"] }; }
    dessiner(ELc); return true;
  }
  if (MULTI.role === "client") { multiEnvoyer(a, b); return true; }
  if (ACTIONS_JOUEUR.includes(a) && !actionValide(a, null)) return true; // hôte : action impossible dans cet état
  return false;
}
function reprendreHote(S) {
  appliquerThemes();
  multiNettoyer();
  const uid = OPTS.salle.uid();
  MULTI = { role: "host", code: S.code, uid, mode: S.mode || "salle", joue: (S.joueurs || []).some((j) => j.uid === uid), nomHote: ((S.joueurs || []).find((j) => j.uid === uid) || {}).nom || "Formateur", cfg: S.cfg, joueursL: [], vu: {}, vus: {}, parti: {}, unsub: [], timers: [], last: "", lastT: 0, qr: "" };
  MULTI.unsub.push(OPTS.salle.watchCode(S.code, hoteJoueurs));
  MULTI.timers.push(setInterval(() => multiPublier(true), 10000), setInterval(verifierTours, 4000));
  if (S.phase === "lobby" || !S.joueurs) { G = { phase: "lobby", noms: [] }; return; }
  const th = []; for (let i = 0; i < THEMES.length; i++) th.push([(S.st && S.st.th && S.st.th[2 * i]) || 0, (S.st && S.st.th && S.st.th[2 * i + 1]) || 0]);
  G = { phase: S.phase === "fin" ? "fin" : "de", nc: false, st: { n: (S.st && S.st.n) || 0, ok: (S.st && S.st.ok) || 0, th, t0: (S.st && S.st.t0) || Date.now() }, noms: S.joueurs.map((j) => j.nom), joueurs: S.joueurs.map((j) => ({ nom: j.nom, uid: j.uid, pos: j.pos, parts: THEMES.map((_, t) => !!j.parts[t]) })), cur: S.cur || 0, de: S.de || 0, question: null, msg: "Partie reprise par le formateur.", gain: false, tourT: Date.now() };
  if (S.phase === "fin" && S.gagnant) G.gagnant = G.joueurs.find((j) => j.nom === S.gagnant) || G.joueurs[0];
  if (S.phase === "dir") { G.phase = "dir"; }
  else if (S.phase === "q" && S.q) {
    if (S.q.rep) { G.phase = "q"; G.question = { cat: S.q.cat, n: S.q.n, q: S.q.q, opts: S.q.opts, bon: S.q.bon || [], e: S.q.e || "", sel: S.q.sel || [], rep: true, ok: !!S.q.ok, timeout: !!S.q.timeout, finale: !!S.q.finale, case: -1 }; }
    else { piles = {}; G.question = nouvelleQuestion(S.q.cat); G.question.finale = !!S.q.finale; G.question.case = G.joueurs[G.cur].pos; G.phase = "q"; lancerChrono(); }
  }
}

export function questionsDeQuiz(quiz, existantes) { return depuisQuiz(quiz, existantes); }
export default function jeuMount(el, banque, opts) {
  BQ = (banque || []).filter((x) => x && typeof x.q === "string" && Array.isArray(x.o)); ELc = el; OPTS = opts || OPTS;
  if (ADM.custom) BQ = BQ.filter((x) => x.s !== "perso").concat(ADM.custom.filter((d) => d.actif !== false).map(versBanque));
  if (OPTS.reglages && !ADM.regAdm) chargerReglages(OPTS.reglages);
  if (OPTS.themes && !ADM.themesAdm) chargerThemes(OPTS.themes); else if (!G || G.phase === "menu") appliquerThemes();
  if (!G) G = { phase: "menu", noms: ["Joueur 1", "Joueur 2"] };
  INTRO = !MULTI && G.phase === "menu" && !OPTS.codeInitial;
  dessiner(el);
  if (el.__tj) return;
  el.__tj = true;
  el.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.dataset && e.target.dataset.j === "rubligne") { e.preventDefault(); agir(el, e.target); } });
  el.addEventListener("click", (e) => { const b = e.target.closest("[data-j]"); if (b && el.contains(b)) agir(el, b); });
  el.addEventListener("input", (e) => { const t = e.target; if (t.dataset && t.dataset.mu) { MU[t.dataset.mu] = t.dataset.mu === "code" ? t.value.toUpperCase().replace(/[^A-Z0-9]/g, "") : t.value; return; } if (t.dataset && t.dataset.nom !== undefined && G && G.noms) G.noms[Number(t.dataset.nom)] = t.value; if (t.dataset && t.dataset.f && ADM.form) { const f = t.dataset.f; if (f === "q" || f === "e") ADM.form[f] = t.value; else if (f[0] === "o") ADM.form.o[Number(f.slice(1))] = t.value; } if (t.dataset && t.dataset.reg && ADM.reg) ADM.reg[t.dataset.reg] = t.dataset.reg === "chronoSec" ? Number(t.value) : t.value; if (t.dataset && t.dataset.rub && ADM.rub) ADM.rub[Number(t.dataset.i)][t.dataset.rub] = t.value; });
  el.addEventListener("change", (e) => { const t = e.target; if (t.dataset && t.dataset.reg && ADM.reg) { ADM.reg[t.dataset.reg] = t.dataset.reg === "chronoSec" ? Number(t.value) : t.value; return; } if (!t.dataset || !t.dataset.f) return; if (t.dataset.f === "c" && ADM.form) ADM.form.c = Number(t.value); else if (t.dataset.f === "n" && ADM.form) ADM.form.n = Number(t.value); else if (t.dataset.f === "filtre") { ADM.filtre = Number(t.value); dessiner(el); } });
}
