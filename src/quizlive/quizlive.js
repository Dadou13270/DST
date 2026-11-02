// Quiz en direct (séance en salle) : tous répondent à la même question, en même temps, sur leur téléphone.
// Le formateur (hôte) anime et publie l'état dans quizLive/{CODE} ; chaque joueur écrit ses réponses dans quizLive/{CODE}_{uid}.
// Les bonnes réponses ne sont publiées qu'au moment de la révélation. Le module est du JS pur : il sert l'application React et la page hébergée.
// Adaptateurs (o) : uid(), nom(), set(id, data), watchDoc(id, cb), watchCode(code, cb), qr(texte), lien(code), quitter(), role "hote"|"joueur", code, quiz (hôte).
const TYPES_OK = ["unique", "multiple", "vf"];
const HORS_LIGNE = 40000;
const LETTRES = "ABCDEFGH";
const COUL = ["#2563eb", "#dc2626", "#d97706", "#16a34a", "#7c3aed", "#0891b2", "#db2777", "#4b5563"];
const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const QL_DUREES = [10, 15, 20, 30, 45, 60];
export const qlCode = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);

// Questions utilisables en direct : choix unique, choix multiple, vrai / faux.
export function qlQuestions(quiz) {
  const out = [];
  ((quiz && quiz.questions) || []).forEach((q) => {
    if (!q || !TYPES_OK.includes(q.type) || !String(q.q || "").trim()) return;
    if (q.type === "vf") { out.push({ q: q.q, opts: ["Vrai", "Faux"], bon: [q.vf === false ? 1 : 0], multi: false, e: q.expl || "", pts: Number(q.pts) || 1 }); return; }
    const ch = (q.choix || []).filter((c) => c && String(c.t || "").trim());
    const bon = []; ch.forEach((c, k) => { if (c.ok) bon.push(k); });
    if (ch.length < 2 || ch.length > 8 || !bon.length) return;
    out.push({ q: q.q, opts: ch.map((c) => c.t), bon, multi: q.type === "multiple" || bon.length > 1, e: q.expl || "", pts: Number(q.pts) || 1 });
  });
  return out;
}
const aleaCode = () => { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 5; i++) s += c[Math.floor(Math.random() * c.length)]; return s; };
export function qlLire(o, code, ms) {
  return new Promise((ok) => {
    let u = null, fait = false;
    const fin = (d) => { if (fait) return; fait = true; try { if (u) u(); } catch { /* déjà fermé */ } ok(d); };
    // Un premier résultat vide peut venir du cache local : on attend la confirmation du serveur avant de conclure « introuvable ».
    try { u = o.watchDoc(code, (d) => { if (d) fin(d); }); if (fait && u) u(); } catch { fin(null); }
    setTimeout(() => fin(null), ms || 5000);
  });
}
export const qlExiste = async (o, code, ms) => { const d = await qlLire(o, qlCode(code), ms); return !!(d && d.host && d.phase !== "ferme"); };
// Crée la salle de quiz en direct (phase « lobby ») et renvoie son code.
export async function qlCreer(o, quiz, opts) {
  const Q = qlQuestions(quiz);
  if (!Q.length) throw new Error("Ce quiz n'a aucune question utilisable en direct (choix unique, choix multiple ou vrai / faux).");
  const ordre = Q.map((_, i) => i);
  if (opts && opts.melange) for (let i = ordre.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ordre[i], ordre[j]] = [ordre[j], ordre[i]]; }
  for (let k = 0; k < 8; k++) {
    const code = aleaCode();
    if (await qlExiste(o, code, 1200)) continue;
    try {
      await o.set(code, { code, host: o.uid(), hostNom: o.nom() || "Formateur", titre: quiz.titre || "Quiz", qid: quiz.id || "", n: Q.length, dur: (opts && opts.dur) || 20, ordre, phase: "lobby", i: 0, pts: {}, noms: {}, ok: {}, nrep: 0, hb: Date.now(), v: Date.now() });
      return code;
    } catch { /* code pris ou refusé : on réessaie */ }
  }
  throw new Error("Création impossible (connexion ou droits).");
}

const CSS = `.ql{--qlr:var(--red,#c42a1c);color:var(--ink,#1b2127);max-width:980px;margin:0 auto}.ql.hote{max-width:1200px}.ql h1,.ql h2{margin:.2em 0}.ql .box{background:var(--card,#fff);border:1px solid var(--line,#d8dde1);border-radius:12px;padding:14px 16px;margin:10px 0}.ql .m{color:var(--mut,#667079)}.ql .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.ql .grow{flex:1;min-width:0}.ql .b{font:inherit;cursor:pointer;border:1px solid var(--line,#d8dde1);background:var(--card,#fff);color:inherit;border-radius:8px;padding:9px 16px;min-height:40px}.ql .b.p{background:var(--qlr);border-color:var(--qlr);color:#fff;font-weight:600}.ql .b:disabled{opacity:.5;cursor:not-allowed}
.ql .code{font-size:clamp(2.4rem,7vw,4.4rem);font-weight:800;letter-spacing:.25em;line-height:1.1}.ql .qt{font-size:clamp(1.25rem,3vw,2.1rem);font-weight:700;line-height:1.25;margin:8px 0 14px}.ql.hote .qt{font-size:clamp(1.5rem,3.4vw,2.6rem)}
.ql .opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:10px}.ql .op{display:flex;gap:12px;align-items:center;text-align:left;font:inherit;font-size:clamp(1rem,2.2vw,1.35rem);border:3px solid var(--c);background:var(--card,#fff);color:inherit;border-radius:12px;padding:14px;cursor:pointer;min-height:64px}.ql .op i{flex:none;width:2.1em;height:2.1em;border-radius:8px;background:var(--c);color:#fff;display:grid;place-items:center;font-style:normal;font-weight:800}.ql .op.on{background:var(--c);color:#fff}.ql .op.on i{background:#fff;color:var(--c)}.ql .op:disabled{cursor:default}.ql .op.bon{box-shadow:0 0 0 4px #16794a;border-color:#16794a}.ql .op.mauv{opacity:.55}.ql .op .n{margin-left:auto;font-weight:700;white-space:nowrap}
.ql .bar{height:12px;background:var(--line,#d8dde1);border-radius:9px;overflow:hidden}.ql .bar b{display:block;height:100%;background:var(--qlr);transition:width .25s linear}.ql .pl{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:10px;margin:4px 0;background:var(--soft,#f5f6f7)}.ql .pl.moi{outline:2px solid var(--qlr)}.ql .pl .rk{width:2.2em;text-align:center;font-weight:800}.ql .pl .sc{margin-left:auto;font-weight:800;font-variant-numeric:tabular-nums}.ql .res{font-size:1.5rem;font-weight:800}.ql .ok{color:#16794a}.ql .ko{color:#c42a1c}.ql .qrb{background:#fff;padding:6px;border-radius:8px;line-height:0}`;
const medaille = (r) => (r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : r + "ᵉ");
const memeEnsemble = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

export function quizLiveMount(el0, o) {
  const hote = o.role === "hote", uid = o.uid(), code = qlCode(o.code);
  let el = el0, mort = false;
  const timers = [], unsub = [];
  // ---- état commun ----
  let S = null; // dernier état publié (côté joueur) ou état courant (côté hôte)
  let msg = "";
  const rendre = () => {
    if (mort || !el) return;
    const ph = S && S.phase;
    let h = "";
    try { h = hote ? vueHote() : vueJoueur(); } catch (e) { h = `<div class="box">Erreur d'affichage : ${esc(e.message)}</div>`; }
    el.innerHTML = `<style>${CSS}</style><div class="ql ${hote ? "hote" : ""}" data-ph="${esc(ph || "")}">${h}</div>`;
    majChrono();
  };
  const classement = () => {
    const pts = (S && S.pts) || {}, noms = (S && S.noms) || {};
    const ids = Object.keys(noms);
    ids.sort((a, b) => (pts[b] || 0) - (pts[a] || 0) || String(noms[a]).localeCompare(String(noms[b]), "fr"));
    let r = 0, prev = null;
    return ids.map((id, k) => { if ((pts[id] || 0) !== prev) { r = k + 1; prev = pts[id] || 0; } return { id, nom: noms[id], pts: pts[id] || 0, rang: r, ok: ((S && S.ok) || {})[id] || 0 }; });
  };
  const ligne = (x, moi) => `<div class="pl${moi ? " moi" : ""}"><span class="rk">${medaille(x.rang)}</span><b class="grow">${esc(x.nom)}${moi ? " (toi)" : ""}</b><span class="m">${x.ok} bonne${x.ok > 1 ? "s" : ""}</span><span class="sc">${x.pts} pts</span></div>`;
  const optsHtml = (q, o2) => `<div class="opts">${q.opts.map((t, k) => {
    const c = COUL[k % COUL.length], cl = ["op"];
    if (o2.sel && o2.sel.includes(k)) cl.push("on");
    if (o2.bon) cl.push(o2.bon.includes(k) ? "bon" : "mauv");
    return `<button class="${cl.join(" ")}" style="--c:${c}" data-q="${o2.action || ""}" data-k="${k}"${o2.off ? " disabled" : ""}><i>${LETTRES[k]}</i><span>${esc(t)}</span>${o2.dist ? `<span class="n">${o2.dist[k] || 0}</span>` : ""}</button>`;
  }).join("")}</div>`;
  const barre = () => `<div class="bar" aria-hidden="true"><b id="qlb" style="width:100%"></b></div>`;
  let finLocal = 0; // fin de la question en cours (horloge locale)
  function majChrono() {
    const t = el && el.querySelector("#qlt"), b = el && el.querySelector("#qlb");
    if (!S || S.phase !== "q" || !finLocal) return;
    const r = Math.max(0, finLocal - Date.now()), tot = (S.dur || 20) * 1000;
    if (t) t.textContent = Math.ceil(r / 1000) + " s";
    if (b) b.style.width = Math.max(0, (100 * r) / tot) + "%";
  }

  // =================== HÔTE ===================
  const Q = hote ? qlQuestions(o.quiz) : [];
  const joueurs = {}; // uid → { nom, le, at, left, a }
  let confQuit = false;
  let ans = {}, t0 = 0, last = "", lastT = 0, pt = null, revealing = false, tout = 0;
  const ordreQ = (i) => Q[(S.ordre || [])[i] != null ? S.ordre[i] : i];
  const enLigne = (id) => { const j = joueurs[id]; return !!j && !j.left && Date.now() - j.at < HORS_LIGNE; };
  const actifs = () => Object.keys(joueurs).filter(enLigne);
  function publier(force) {
    if (!hote || mort || !S) return;
    const p = { ...S };
    p.noms = { ...S.noms };
    Object.keys(joueurs).forEach((id) => { if (!joueurs[id].left) p.noms[id] = joueurs[id].nom; });
    const q = S.phase === "q" || S.phase === "rep" ? ordreQ(S.i) : null;
    p.q = q ? { q: q.q, opts: q.opts, multi: q.multi } : null;
    p.reste = S.phase === "q" ? Math.max(0, (S.dur || 20) * 1000 - (Date.now() - t0)) : 0;
    p.nrep = Object.keys(ans).length; p.nj = actifs().length;
    const key = JSON.stringify(p, (k, v) => (k === "reste" ? undefined : v));
    if (!force && key === last) return;
    const dt = Date.now() - lastT;
    if (!force && dt < 350) { clearTimeout(pt); pt = setTimeout(() => publier(false), 350 - dt); return; }
    clearTimeout(pt);
    last = key; lastT = Date.now(); p.hb = p.v = Date.now();
    S.noms = p.noms;
    Promise.resolve(o.set(code, JSON.parse(JSON.stringify(p)))).catch(() => { last = ""; });
  }
  function ouvrirQ(i) {
    S.phase = "q"; S.i = i; ans = {}; revealing = false; tout = 0; t0 = Date.now(); finLocal = t0 + S.dur * 1000;
    delete S.rep; delete S.dist; delete S.rc;
    publier(true); rendre();
  }
  function reveler() {
    if (S.phase !== "q" || revealing) return;
    revealing = true;
    const q = ordreQ(S.i), dist = q.opts.map(() => 0), rc = {}, dur = S.dur * 1000;
    S.pts = { ...S.pts }; S.ok = { ...S.ok };
    Object.keys(joueurs).forEach((id) => { if (!joueurs[id].left && S.pts[id] == null) S.pts[id] = 0; });
    Object.keys(ans).forEach((id) => {
      const a = ans[id]; a.sel.forEach((k) => { if (dist[k] != null) dist[k]++; });
      const bon = memeEnsemble(a.sel, q.bon);
      const gain = bon ? Math.round(q.pts * (500 + 500 * (1 - Math.min(1, a.dt / dur)))) : 0;
      rc[id] = [gain, bon ? 1 : 0];
      S.pts[id] = (S.pts[id] || 0) + gain; if (bon) S.ok[id] = (S.ok[id] || 0) + 1;
    });
    S.phase = "rep"; S.rep = { bon: q.bon, e: q.e || "" }; S.dist = dist; S.rc = rc;
    publier(true); rendre();
  }
  function suivante() {
    if (S.phase !== "rep") return;
    if (S.i + 1 < S.n) ouvrirQ(S.i + 1); else { S.phase = "fin"; publier(true); rendre(); }
  }
  function lesJoueurs(list) {
    if (mort) return;
    const now = Date.now();
    (list || []).forEach((d) => {
      if (!d.uid) return;
      const j = joueurs[d.uid] || (joueurs[d.uid] = { nom: d.nom || "Joueur", le: 0, at: now, left: false });
      if (j.le !== d.le) { j.le = d.le; j.at = now; }
      j.nom = String(d.nom || j.nom).slice(0, 24); j.left = !!d.left; j.a = d.a || null;
      if (S.phase === "q" && d.a && d.a.i === S.i && !ans[d.uid] && !j.left && Array.isArray(d.a.sel) && d.a.sel.length) {
        const q = ordreQ(S.i);
        ans[d.uid] = { sel: d.a.sel.filter((k) => Number.isInteger(k) && k >= 0 && k < q.opts.length), dt: Math.max(0, Math.min(Number(d.a.dt) || 0, S.dur * 1000 + 3000)) };
        if (!ans[d.uid].sel.length) delete ans[d.uid];
      }
    });
    publier(false); rendre();
  }
  function tickHote() {
    if (S.phase === "q") {
      majChrono();
      const el2 = Date.now() - t0, a = actifs();
      if (el2 >= S.dur * 1000) reveler();
      else if (a.length && a.every((id) => ans[id])) { if (!tout) tout = Date.now(); else if (Date.now() - tout > 1200) reveler(); }
      else tout = 0;
    } else if (S.phase === "lobby") rendre();
  }
  // ---- vue hôte ----
  function vueHote() {
    if (!S) return `<div class="box">Chargement…</div>`;
    const bar = `<div class="row" style="justify-content:space-between"><span class="m">Quiz en direct · <b>${esc(S.titre)}</b> · code <b>${esc(code)}</b></span><span class="row"><button class="b${confQuit ? " p" : ""}" data-q="quitter">${S.phase === "fin" ? "Fermer" : confQuit ? "Confirmer l'arrêt pour tous" : "Quitter"}</button></span></div>`;
    if (S.phase === "lobby") {
      const L = actifs().map((id) => joueurs[id].nom), lien = o.lien ? o.lien(code) : "";
      const qr = hote && qrHtml;
      return `${bar}<div class="box"><div class="row" style="gap:28px;align-items:center"><div><div class="m">Code à saisir (Séance en salle) ou QR code à scanner</div><div class="code">${esc(code)}</div>${lien ? `<div class="m" style="word-break:break-all">${esc(lien)}</div>` : ""}</div>${qr ? `<div class="qrb">${qr}</div>` : ""}</div></div>
<div class="box"><div class="row"><label>Temps par question <select data-qd="dur" aria-label="Temps par question">${QL_DUREES.map((s) => `<option value="${s}"${S.dur === s ? " selected" : ""}>${s} s</option>`).join("")}</select></label><span class="m">${S.n} question${S.n > 1 ? "s" : ""}</span></div></div>
<div class="box"><b>Participants connectés (${L.length})</b><div style="margin-top:6px">${L.map((n) => `<span class="pl" style="display:inline-flex;margin:3px">${esc(n)}</span>`).join("") || '<p class="m">En attente des participants : ils saisissent le code dans « Séance en salle ».</p>'}</div></div>
<div class="row"><button class="b p" data-q="start"${L.length ? "" : " disabled"}>Démarrer le quiz</button>${L.length ? "" : '<span class="m">Au moins un participant est nécessaire.</span>'}</div>`;
    }
    if (S.phase === "q") {
      const q = ordreQ(S.i), nj = actifs().length, na = Object.keys(ans).length;
      return `${bar}<div class="box"><div class="row" style="justify-content:space-between"><b>Question ${S.i + 1} / ${S.n}</b><span><b id="qlt" style="font-size:1.6rem">${S.dur} s</b></span></div>${barre()}<div class="qt">${esc(q.q)}</div>${q.multi ? '<p class="m">Plusieurs bonnes réponses possibles.</p>' : ""}${optsHtml(q, { off: true })}<div class="row" style="margin-top:12px;justify-content:space-between"><b>${na} / ${nj} réponse${na > 1 ? "s" : ""}</b><button class="b p" data-q="reveler">Révéler maintenant</button></div></div>`;
    }
    if (S.phase === "rep") {
      const q = ordreQ(S.i), cl = classement(), nbOk = Object.values(S.rc || {}).filter((x) => x[1]).length, nbR = Object.keys(S.rc || {}).length;
      return `${bar}<div class="box"><b>Question ${S.i + 1} / ${S.n} · correction</b><div class="qt">${esc(q.q)}</div>${optsHtml(q, { off: true, bon: S.rep.bon, dist: S.dist })}<p><b>${nbOk}</b> bonne${nbOk > 1 ? "s" : ""} réponse${nbOk > 1 ? "s" : ""} sur ${nbR} réponse${nbR > 1 ? "s" : ""}.</p>${S.rep.e ? `<p class="m">${esc(S.rep.e)}</p>` : ""}</div><div class="box"><b>Classement</b>${cl.slice(0, 5).map((x) => ligne(x, false)).join("") || '<p class="m">—</p>'}</div><div class="row"><button class="b p" data-q="suivante">${S.i + 1 < S.n ? "Question suivante" : "Voir le podium"}</button></div>`;
    }
    const cl = classement();
    return `${bar}<div class="box"><h2>🏆 Podium · ${esc(S.titre)}</h2>${cl.slice(0, 3).map((x) => ligne(x, false)).join("")}</div>${cl.length > 3 ? `<div class="box"><b>Classement complet</b>${cl.slice(3).map((x) => ligne(x, false)).join("")}</div>` : ""}<div class="row"><button class="b" data-q="csv">Télécharger le classement (CSV)</button><button class="b p" data-q="quitter">Terminer</button></div>`;
  }
  let qrHtml = "";

  // =================== JOUEUR ===================
  let moi = { nom: (o.nom && o.nom()) || "Joueur", t0: Date.now(), left: false, a: null };
  let hb = { v: 0, at: Date.now() }, hoteOff = false, recvI = -1, recvAt = 0, aEnvoi = {}, selLoc = [];
  function ecrire() {
    if (hote || mort) return;
    Promise.resolve(o.set(code + "_" + uid, { code, uid, nom: moi.nom, le: Date.now(), left: !!moi.left, a: moi.a || null })).catch(() => {});
  }
  function recoit(d) {
    if (mort) return;
    if (!d) { msg = "Partie introuvable."; S = null; rendre(); return; }
    if (d.phase === "ferme") { msg = "Le formateur a terminé la partie."; S = d; rendre(); return; }
    if (d.hb !== hb.v) hb = { v: d.hb, at: Date.now() };
    if (d.phase === "q" && (d.i !== recvI)) { recvI = d.i; recvAt = Date.now(); finLocal = recvAt + (d.reste || d.dur * 1000); selLoc = []; }
    S = d; rendre();
  }
  function vueJoueur() {
    if (!S) return `<div class="box"><p>${esc(msg || "Connexion…")}</p><div class="row"><button class="b" data-q="quitter">Retour</button></div></div>`;
    const cl = classement(), moiC = cl.find((x) => x.id === uid);
    const bar = `<div class="box" style="padding:8px 12px"><div class="row" style="justify-content:space-between"><span><b>${esc(moi.nom)}</b> <span class="m">· ${esc(S.titre)} · code ${esc(code)}</span></span><span>${moiC ? `<b>${moiC.pts} pts</b>` : ""} <button class="b" data-q="quitter" style="min-height:32px;padding:4px 10px">Quitter</button></span></div></div>${hoteOff ? '<div class="box" role="alert" style="border-color:#b91c1c"><b>⚠ Le formateur semble déconnecté.</b> Le quiz reprendra dès son retour.</div>' : ""}`;
    if (S.phase === "ferme") return `${bar}<div class="box"><h2>Quiz terminé</h2><p>${esc(msg)}</p></div>`;
    if (S.phase === "lobby") return `${bar}<div class="box"><h2>Tu es connecté</h2><p>En attente du démarrage par le formateur…</p><p class="m">${S.nj || Object.keys(S.noms || {}).length || 1} participant${(S.nj || 1) > 1 ? "s" : ""} connecté${(S.nj || 1) > 1 ? "s" : ""}.</p></div>`;
    if (S.phase === "q") {
      const q = S.q, fait = aEnvoi[S.i], reste = finLocal - Date.now(), fini = reste <= 0;
      const sel = fait ? fait.sel : selLoc;
      return `${bar}<div class="box"><div class="row" style="justify-content:space-between"><b>Question ${S.i + 1} / ${S.n}</b><b id="qlt">${S.dur} s</b></div>${barre()}<div class="qt">${esc(q.q)}</div>${q.multi ? '<p class="m">Plusieurs réponses possibles : coche puis valide.</p>' : ""}${optsHtml(q, { sel, action: "opt", off: !!fait || fini })}${q.multi && !fait && !fini ? `<div class="row" style="margin-top:12px"><button class="b p" data-q="envoyer"${selLoc.length ? "" : " disabled"}>Valider</button></div>` : ""}${fait ? '<p class="m" style="margin-top:12px">✓ Réponse envoyée. Attends la correction…</p>' : fini ? '<p class="m" style="margin-top:12px">⏱ Temps écoulé.</p>' : ""}</div>`;
    }
    if (S.phase === "rep") {
      const q = S.q, r = (S.rc || {})[uid], fait = aEnvoi[S.i] || (r ? { sel: [] } : null);
      const titre = r ? (r[1] ? `<span class="res ok">✅ Bonne réponse ! +${r[0]} pts</span>` : '<span class="res ko">❌ Mauvaise réponse</span>') : '<span class="res ko">Pas de réponse</span>';
      return `${bar}<div class="box">${titre}<div class="qt">${esc(q.q)}</div>${optsHtml(q, { off: true, sel: fait ? fait.sel : [], bon: S.rep.bon, dist: S.dist })}${S.rep.e ? `<p class="m">${esc(S.rep.e)}</p>` : ""}${moiC ? `<p><b>${medaille(moiC.rang)}</b> sur ${cl.length} · ${moiC.pts} pts</p>` : ""}</div><div class="box"><b>Classement</b>${cl.slice(0, 5).map((x) => ligne(x, x.id === uid)).join("")}${moiC && moiC.rang > 5 ? ligne(moiC, true) : ""}</div><p class="m">En attente de la question suivante…</p>`;
    }
    return `${bar}<div class="box"><h2>🏆 Quiz terminé</h2>${moiC ? `<p class="res">${medaille(moiC.rang)} sur ${cl.length} · ${moiC.pts} pts · ${moiC.ok} bonne${moiC.ok > 1 ? "s" : ""} réponse${moiC.ok > 1 ? "s" : ""}</p>` : ""}${cl.slice(0, 3).map((x) => ligne(x, x.id === uid)).join("")}</div>${cl.length > 3 ? `<div class="box"><b>Classement</b>${cl.slice(3, 12).map((x) => ligne(x, x.id === uid)).join("")}</div>` : ""}`;
  }
  function envoyerRep(sel) {
    if (hote || !S || S.phase !== "q" || aEnvoi[S.i]) return;
    const dt = Math.max(0, Date.now() - recvAt);
    if (dt > S.dur * 1000 + 1500) return;
    aEnvoi[S.i] = { sel: [...sel] };
    moi.a = { i: S.i, sel: [...sel], dt };
    ecrire(); rendre();
  }
  // =================== événements ===================
  function clic(e) {
    const b = e.target.closest("[data-q]"); if (!b || !el.contains(b)) return;
    const a = b.dataset.q, k = Number(b.dataset.k);
    if (a === "quitter") { sortir(true); return; }
    if (hote) {
      if (a === "start" && S.phase === "lobby") { if (!actifs().length) return; Object.keys(joueurs).forEach((id) => { if (!joueurs[id].left && S.pts[id] == null) S.pts[id] = 0; }); ouvrirQ(0); }
      else if (a === "reveler") reveler();
      else if (a === "suivante") suivante();
      else if (a === "csv") csv();
      return;
    }
    if (!S || S.phase !== "q" || aEnvoi[S.i]) return;
    if (a === "opt") {
      if (S.q.multi) { selLoc = selLoc.includes(k) ? selLoc.filter((x) => x !== k) : [...selLoc, k]; rendre(); } else envoyerRep([k]);
    } else if (a === "envoyer" && selLoc.length) envoyerRep(selLoc);
  }
  function changement(e) {
    const t = e.target;
    if (hote && t.dataset && t.dataset.qd === "dur" && S.phase === "lobby") { S.dur = Number(t.value) || 20; publier(true); }
  }
  function csv() {
    const cl = classement(), l = ["Rang;Nom;Points;Bonnes réponses"].concat(cl.map((x) => [x.rang, '"' + String(x.nom).replace(/"/g, '""') + '"', x.pts, x.ok].join(";")));
    const bl = new Blob(["﻿" + l.join("\n")], { type: "text/csv;charset=utf-8" });
    if (o.telecharger) { o.telecharger("quiz-" + code + ".csv", bl); return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(bl); a.download = "quiz-" + code + ".csv"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function sortir(quitte) {
    if (hote && quitte) {
      if (S && (S.phase === "q" || S.phase === "rep") && !confQuit) { confQuit = true; rendre(); return; }
      if (S) { S.phase = "ferme"; S.v = Date.now(); try { Promise.resolve(o.set(code, JSON.parse(JSON.stringify({ ...S, q: null, ordre: S.ordre || [], hb: Date.now() })))).catch(() => {}); } catch { /* hors ligne */ } }
    } else if (!hote && quitte) { moi.left = true; ecrire(); }
    detruire(); if (o.quitter) o.quitter();
  }
  function detruire() {
    mort = true; timers.forEach((t) => clearInterval(t)); clearTimeout(pt); unsub.forEach((u) => { try { u(); } catch { /* fermé */ } });
    if (el) { el.removeEventListener("click", clic); el.removeEventListener("change", changement); }
  }
  // =================== démarrage ===================
  const inst = {
    key: (hote ? "h" : "j") + code,
    attach(n) { if (el) { el.removeEventListener("click", clic); el.removeEventListener("change", changement); } el = n; el.addEventListener("click", clic); el.addEventListener("change", changement); rendre(); },
    destroy() { detruire(); },
  };
  el.addEventListener("click", clic); el.addEventListener("change", changement);
  if (hote) {
    S = null; rendre();
    qlLire(o, code).then((d) => {
      if (mort) return;
      if (!d || d.host !== uid) { S = null; msg = "Salle introuvable."; el.innerHTML = `<div class="ql box">Salle de quiz introuvable ou non autorisée. <button class="b" data-q="quitter">Retour</button></div>`; return; }
      S = { ...d, pts: d.pts || {}, noms: d.noms || {}, ok: d.ok || {} };
      if (S.phase === "q") { ans = {}; t0 = Date.now() - Math.max(0, S.dur * 1000 - (d.reste || S.dur * 1000)); finLocal = t0 + S.dur * 1000; }
      if (S.phase === "rep" && !S.rep) S.phase = "q";
      if (o.qr && o.lien) Promise.resolve(o.qr(o.lien(code))).then((q) => { qrHtml = String(q).startsWith("<") ? `<div style="width:170px;height:170px">${q}</div>` : `<img src="${esc(q)}" alt="QR code pour rejoindre" width="170" height="170">`; rendre(); }).catch(() => {});
      unsub.push(o.watchCode(code, lesJoueurs));
      timers.push(setInterval(() => publier(true), 10000), setInterval(tickHote, 300));
      publier(true); rendre();
    });
  } else {
    S = null; rendre();
    qlLire(o, code).then((d) => {
      if (mort) return;
      if (!d || !d.host) { msg = "Code inconnu : vérifie le code ou demande-le au formateur."; rendre(); return; }
      if (d.phase === "ferme") { msg = "Cette partie est terminée."; rendre(); return; }
      ecrire();
      unsub.push(o.watchDoc(code, recoit));
      timers.push(setInterval(ecrire, 8000), setInterval(() => {
        const off = Date.now() - hb.at > 45000;
        if (off !== hoteOff) { hoteOff = off; rendre(); } else majChrono();
        if (S && S.phase === "q" && finLocal && Date.now() > finLocal && !aEnvoi[S.i] && el && el.querySelector(".op:not([disabled])")) rendre();
      }, 250));
    });
  }
  return inst;
}
