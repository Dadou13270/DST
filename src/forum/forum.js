// Forum d'entraide. Module autonome (comme le jeu) : forumMount(element, opts).
// opts : { uid, nom, admin, mod, ls(coll), put(coll, id|null, data) -> id, del(coll, id), users() -> [{id, nom}] }
// Collections : forumCats (catégories + document "_reglages"), forumSujets, forumMsgs, forumSign (signalements), forumMods (modérateurs).
const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const fmt = (ms) => (ms ? new Date(ms).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—");
const ini = (n) => String(n || "?").split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join("") || "?";
const MAXT = 140, MAXM = 4000, DELAI = 15000;
const CHARTE0 = "Soyez courtois et bienveillants. Pas d'informations personnelles ni de données opérationnelles sensibles (noms de victimes, adresses, numéros). Restez dans l'entraide pour la préparation et la révision. Les messages hors sujet peuvent être masqués par les modérateurs.";
const CATS0 = [
  { nom: "Questions sur les scénarios", desc: "Un scénario, un SOIEC, un message : demande de l'aide ou propose ta méthode.", ico: "🎯", ordre: 1 },
  { nom: "Méthode et doctrine (GDO, GTO)", desc: "Comprendre un guide de doctrine, une technique, une règle d'engagement.", ico: "📖", ordre: 2 },
  { nom: "Révisions et partage", desc: "Fiches, astuces, plannings de révision, retours d'expérience.", ico: "📚", ordre: 3 },
  { nom: "Vie de l'application", desc: "Suggestions, bugs, idées de nouveaux contenus.", ico: "🛠️", ordre: 4 },
];

const CSS = `
.fo{max-width:none;margin:0;color:var(--ink,#1b2127)}
.fo h1{margin:0 0 4px}.fo .m{color:var(--mut,#667079);font-size:.88rem}
.fo .box{background:var(--card,#fff);border:1px solid var(--line,#d8dde1);border-radius:12px;padding:14px;margin:0 0 12px;box-shadow:0 1px 4px rgba(0,0,0,.05)}
.fo .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.fo .grow{flex:1;min-width:0}.fo .bw{justify-content:space-between}
.fo .b{border:1px solid var(--line,#d8dde1);background:var(--card,#fff);color:var(--ink,#1b2127);padding:7px 12px;border-radius:8px;cursor:pointer;font:inherit;font-size:.9rem}
.fo .b:hover{border-color:var(--red,#c42a1c)}.fo .b.p{background:var(--red,#c42a1c);border-color:var(--red,#c42a1c);color:#fff;font-weight:600}.fo .b.d{color:#b91c1c}
.fo .b.s{padding:3px 9px;font-size:.8rem}
.fo input,.fo textarea,.fo select{width:100%;padding:8px 10px;border:1px solid var(--line,#d8dde1);border-radius:8px;background:var(--card,#fff);color:inherit;font:inherit}
.fo textarea{min-height:110px;resize:vertical}
.fo .cat{display:flex;gap:12px;align-items:center;cursor:pointer;border-left:4px solid var(--red,#c42a1c)}.fo .cat:hover{background:var(--soft,#f5f6f7)}
.fo .ico{font-size:1.7rem;width:2.2rem;text-align:center}
.fo .sj{display:flex;gap:10px;align-items:center;padding:10px 4px;border-top:1px solid var(--line,#d8dde1);cursor:pointer}.fo .sj:first-child{border-top:0}.fo .sj:hover{background:var(--soft,#f5f6f7)}
.fo .sj b.t{display:block}.fo .nb{min-width:54px;text-align:center;font-size:.8rem;color:var(--mut,#667079)}.fo .nb b{display:block;font-size:1.1rem;color:var(--ink,#1b2127)}
.fo .tag{display:inline-block;font-size:.72rem;padding:1px 8px;border-radius:9px;background:var(--soft,#eceff1);margin-right:4px}
.fo .tag.ok{background:#d9f2e4;color:#14633d}.fo .tag.w{background:#fdf1d6;color:#7a5200}.fo .tag.r{background:var(--red,#c42a1c);color:#fff}.fo .tag.mod{background:#dbe7fb;color:#1c4a8c}.fo .tag.adm{background:#1b2127;color:#fff}
.fo .new{display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--red,#c42a1c);margin-right:6px}
.fo .msg{display:flex;gap:12px}.fo .msg .av{flex:none;width:38px;height:38px;border-radius:50%;background:var(--red,#c42a1c);color:#fff;display:grid;place-items:center;font-weight:700;font-size:.85rem}
.fo .msg .bd{flex:1;min-width:0}.fo .msg.best{border-left:4px solid #16794a;background:rgba(22,121,74,.06)}.fo .msg.cache{opacity:.55}
.fo .tx{white-space:pre-wrap;word-break:break-word;margin:6px 0}.fo .tx .q{display:block;border-left:3px solid var(--line,#d8dde1);padding-left:8px;color:var(--mut,#667079)}
.fo .tx a{color:var(--red,#c42a1c)}
.fo .bc{font-size:.85rem;margin-bottom:8px}.fo .bc a{color:var(--red,#c42a1c);cursor:pointer}
.fo .tabs{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0;border:0!important;box-shadow:none!important;padding:0}.fo .tabs::after,.fo .tabs::before{display:none!important}.fo details.box{margin-top:16px}.fo .chip{border:1px solid var(--line,#d8dde1);background:var(--card,#fff);border-radius:99px;padding:4px 12px;cursor:pointer;font:inherit;font-size:.85rem;color:inherit}.fo .chip.on{background:var(--red,#c42a1c);border-color:var(--red,#c42a1c);color:#fff}
.fo .al{padding:8px 12px;border-radius:8px;background:#fdf1d6;color:#5c4100;margin:8px 0}
.fo .sim{font-size:.85rem;margin:4px 0}.fo .sim a{color:var(--red,#c42a1c);cursor:pointer}
@media(max-width:600px){.fo .nb{display:none}.fo .msg .av{width:30px;height:30px}}
`;

const S = { el: null, o: null, vue: "home", cat: "", sujet: "", cats: [], sujets: [], msgs: [], sign: [], mods: [], reg: { ouvert: true, charte: CHARTE0 }, q: "", filtre: "tous", msg: "", draft: {}, edit: "", tab: "sign", chargé: false, users: null, last: 0, timer: null, sig: "" };
const vu = () => { try { return JSON.parse(localStorage.getItem("fo-vu") || "{}"); } catch { return {}; } };
const vuSet = (id, t) => { try { const v = vu(); v[id] = t; localStorage.setItem("fo-vu", JSON.stringify(v)); } catch { /* ignore */ } };
const estMod = () => !!(S.o.admin || S.o.mod);
const estAdm = () => !!S.o.admin;
const cat = (id) => S.cats.find((c) => c.id === id);
const sj = (id) => S.sujets.find((s) => s.id === id);
const visible = (s) => s.etat !== "masque" || estMod() || s.uid === S.o.uid;

function lien(t) {
  const h = esc(t).replace(/(^|\n)&gt;\s?([^\n]*)/g, (m, a, b) => `${a}<span class="q">${b}</span>`);
  return h.replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);
}
const nomAff = (uid, nom) => esc(nom || "Membre") + (S.mods.some((m) => m.id === uid) ? ' <span class="tag mod">Modérateur</span>' : "");

async function charger(msgsDe) {
  const o = S.o;
  const [cats, suj, mods, pres] = await Promise.all([o.ls("forumCats"), o.ls("forumSujets"), o.ls("forumMods"), o.ls("forumPres").catch(() => [])]);
  if (o.get && o.uid) { const d = await o.get("forumSuivis", o.uid).catch(() => null); S.suiv = (d && d.s) || {}; } else S.suiv = S.suiv || {};
  S.pres = pres.filter((p) => Date.now() - (p.t || 0) < 300000).sort((a, b) => String(a.nom).localeCompare(String(b.nom), "fr"));
  S.reg = { ouvert: true, charte: CHARTE0, ...(cats.find((c) => c.id === "_reglages") || {}) };
  S.cats = cats.filter((c) => !String(c.id).startsWith("_")).sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  S.sujets = suj;
  S.mods = mods;
  if (msgsDe) S.msgs = (await o.ls("forumMsgs")).filter((m) => m.sujet === msgsDe).sort((a, b) => (a.t || 0) - (b.t || 0));
  if (estMod()) S.sign = (await o.ls("forumSign")).sort((a, b) => (b.t || 0) - (a.t || 0));
  S.chargé = true;
  S.last = Date.now();
}
async function amorcer() {
  if (!estAdm()) return;
  if (S.cats.length || S.reg.vu) return;
  await Promise.all(CATS0.map((c) => S.o.put("forumCats", null, c)));
  await S.o.put("forumCats", "_reglages", { ouvert: true, charte: CHARTE0, vu: 1 });
  await charger();
}

// ---------- vues ----------
function entete() {
  const nbSign = estMod() ? S.sign.filter((x) => !x.traite).length : 0;
  return `<div class="row bw"><div><h1>💬 Forum d'entraide</h1><div class="m">Entre stagiaires, pour se préparer et réviser ensemble. Modéré par l'équipe de formation.</div></div>
  <div class="row"><button class="b" data-f="home">🏠 Forum</button>${S.reg.ouvert || estMod() ? '<button class="b p" data-f="nouveau">+ Nouveau sujet</button>' : ""}${estMod() ? `<button class="b" data-f="mod">🛡️ Modération${nbSign ? ` <span class="tag r">${nbSign}</span>` : ""}</button>` : ""}${estAdm() ? '<button class="b" data-f="admin">⚙️ Administrer</button>' : ""}<button class="b" data-f="actu" title="Actualiser" aria-label="Actualiser">↻</button></div></div>
  ${S.msg ? `<div class="al" role="status">${esc(S.msg)}</div>` : ""}${!S.reg.ouvert ? '<div class="al">Le forum est en lecture seule pour le moment.</div>' : ""}`;
}
function ligneSujet(s) {
  const lu = vu()[s.id] || 0, nouveau = s.maj > lu && s.uid !== S.o.uid || (s.maj > lu && s.dernierUid && s.dernierUid !== S.o.uid);
  const c = cat(s.cat);
  return `<div class="sj" data-f="ouvrir" data-k="${esc(s.id)}" tabindex="0" role="button"><div class="grow"><b class="t">${nouveau ? '<span class="new" title="Nouveau"></span>' : ""}${s.epingle ? "📌 " : ""}${esc(s.titre)}</b>
  <span class="m">${c ? esc(c.ico || "") + " " + esc(c.nom) + " · " : ""}par ${esc(s.nom || "Membre")} · ${fmt(s.t)}${s.dernierNom && s.nb ? ` · dernière réponse de ${esc(s.dernierNom)}` : ""}</span><div>${s.resolu ? '<span class="tag ok">✅ Résolu</span>' : ""}${s.ferme ? '<span class="tag w">🔒 Verrouillé</span>' : ""}${s.etat === "masque" ? '<span class="tag r">Masqué</span>' : ""}${!s.nb && !s.resolu ? '<span class="tag">Sans réponse</span>' : ""}</div></div>
  <div class="nb"><b>${s.nb || 0}</b>réponse${(s.nb || 0) > 1 ? "s" : ""}</div></div>`;
}
function filtrer(l) {
  const q = norm(S.q);
  return l.filter(visible).filter((s) => {
    if (S.filtre === "sans" && (s.nb || s.resolu)) return false;
    if (S.filtre === "resolu" && !s.resolu) return false;
    if (S.filtre === "miens" && s.uid !== S.o.uid) return false;
    if (q && !norm(s.titre + " " + s.texte).includes(q)) return false;
    return true;
  }).sort((a, b) => (b.epingle ? 1 : 0) - (a.epingle ? 1 : 0) || (b.maj || b.t || 0) - (a.maj || a.t || 0));
}
function barreRecherche() {
  const F = [["tous", "Tous"], ["sans", "Sans réponse"], ["resolu", "Résolus"], ["miens", "Mes sujets"]];
  return `<div class="row"><input class="grow" data-f="q" type="search" placeholder="Rechercher dans le forum…" value="${esc(S.q)}" aria-label="Rechercher"></div>
  <div class="tabs">${F.map(([k, l]) => `<button class="chip${S.filtre === k ? " on" : ""}" data-f="filtre" data-k="${k}">${l}</button>`).join("")}</div>`;
}
function enLigne() {
  const l = S.pres || [];
  return `<div class="box"><b>🟢 En ligne sur le forum (${l.length})</b><div class="row" style="margin-top:8px">${l.length ? l.map((p) => `<span class="chip" style="cursor:default" title="${S.mods.some((m) => m.id === p.id) ? "Modérateur" : ""}">${S.mods.some((m) => m.id === p.id) ? "🛡️ " : ""}${esc(p.nom || "Anonyme")}${p.id === S.o.uid ? " (toi)" : ""}</span>`).join("") : '<span class="m">Personne pour le moment.</span>'}</div><p class="m" style="margin:8px 0 0">Membres actifs sur le forum ces 5 dernières minutes.</p></div>`;
}
function ping() { if (S.o && S.o.uid) S.o.put("forumPres", S.o.uid, { nom: S.o.nom || "Anonyme", t: Date.now() }).then(() => { if (S.pres && !S.pres.some((p) => p.id === S.o.uid)) S.pres.push({ id: S.o.uid, nom: S.o.nom, t: Date.now() }); }).catch(() => {}); }
function blocSuivis() {
  const l = S.sujets.filter((x) => (S.suiv || {})[x.id] && visible(x)).map((x) => ({ x, nv: (x.maj || 0) > S.suiv[x.id] && x.dernierUid !== S.o.uid })).sort((a, b) => (b.nv - a.nv) || ((b.x.maj || 0) - (a.x.maj || 0)));
  if (!l.length) return "";
  return `<div class="box"><b>🔔 Sujets suivis (${l.length}${l.some((e) => e.nv) ? ` · ${l.filter((e) => e.nv).length} avec du nouveau` : ""})</b>${l.map((e) => `<div class="row bw" style="padding:5px 0;border-top:1px solid var(--line,#d8dde1)"><a data-f="ouvrir" data-k="${esc(e.x.id)}">${esc(e.x.titre)}</a><span>${e.nv ? '<span class="tag r">● Nouveau</span> ' : ""}<span class="m">${e.x.nb || 0} réponse(s)</span></span></div>`).join("")}</div>`;
}
function vueHome() {
  const charte = `<details class="box"><summary style="cursor:pointer;font-weight:600">📜 Règles du forum</summary><div class="tx">${lien(S.reg.charte || CHARTE0)}</div></details>`;
  const filtre = S.q || S.filtre !== "tous";
  const rec = filtrer(S.sujets).slice(0, filtre ? 100 : 12);
  const cats = S.cats.filter((c) => !c.masque || estMod()).map((c) => {
    const l = S.sujets.filter((s) => s.cat === c.id && visible(s)), der = l.sort((a, b) => (b.maj || 0) - (a.maj || 0))[0];
    return `<div class="box cat" data-f="cat" data-k="${esc(c.id)}" tabindex="0" role="button"><div class="ico">${esc(c.ico || "💬")}</div><div class="grow"><b>${esc(c.nom)}</b>${c.ferme ? ' <span class="tag w">Réservé aux modérateurs</span>' : ""}<div class="m">${esc(c.desc || "")}</div></div><div class="nb m"><b>${l.length}</b>sujet${l.length > 1 ? "s" : ""}</div><div class="m" style="min-width:110px">${der ? "Dernière activité<br>" + fmt(der.maj || der.t) : "Aucun sujet"}</div></div>`;
  }).join("");
  return `${entete()}${charte}${blocSuivis()}${barreRecherche()}${filtre ? "" : cats}<div class="box"><b>${filtre ? "Résultats" : "Derniers sujets"}</b>${rec.length ? rec.map(ligneSujet).join("") : '<p class="m">Aucun sujet pour le moment.</p>'}</div>${enLigne()}`;
}
function vueCat() {
  const c = cat(S.cat);
  if (!c) return vueHome();
  const l = filtrer(S.sujets.filter((s) => s.cat === c.id));
  return `${entete()}<div class="bc"><a data-f="home">Forum</a> › ${esc(c.ico || "")} ${esc(c.nom)}</div>${barreRecherche()}<div class="box"><div class="m" style="margin-bottom:6px">${esc(c.desc || "")}</div>${l.length ? l.map(ligneSujet).join("") : '<p class="m">Aucun sujet dans cette rubrique. Lance la discussion !</p>'}</div>`;
}
function msgHtml(m, s, i) {
  const mien = m.uid === S.o.uid, bonne = s.bonne === m.id, merci = Object.keys(m.merci || {}).length;
  const ferme = s.ferme && !estMod();
  return `<div class="box msg${bonne ? " best" : ""}${m.etat === "masque" ? " cache" : ""}"><div class="av">${esc(ini(m.nom))}</div><div class="bd">
  <div class="row bw"><span><b>${nomAff(m.uid, m.nom)}</b> <span class="m">· ${fmt(m.t)}${m.ed ? " · modifié" : ""}</span></span><span>${bonne ? '<span class="tag ok">✅ Meilleure réponse</span>' : ""}${m.etat === "masque" ? '<span class="tag r">Masqué</span>' : ""}</span></div>
  ${S.edit === m.id ? `<textarea data-f="draft" data-k="e${esc(m.id)}" maxlength="${MAXM}">${esc(S.draft["e" + m.id] != null ? S.draft["e" + m.id] : m.texte)}</textarea><div class="row" style="margin-top:6px"><button class="b p s" data-f="editok" data-k="${esc(m.id)}">Enregistrer</button><button class="b s" data-f="editno">Annuler</button></div>` : `<div class="tx">${lien(m.texte)}</div>`}
  <div class="row"><button class="b s" data-f="merci" data-k="${esc(m.id)}" ${S.o.uid ? "" : "disabled"}>👍 Merci${merci ? ` (${merci})` : ""}</button>${ferme || !S.reg.ouvert && !estMod() ? "" : `<button class="b s" data-f="citer" data-k="${esc(m.id)}">Citer</button>`}
  ${(s.uid === S.o.uid || estMod()) && !bonne ? `<button class="b s" data-f="bonne" data-k="${esc(m.id)}">✅ Meilleure réponse</button>` : ""}${(s.uid === S.o.uid || estMod()) && bonne ? `<button class="b s" data-f="bonne" data-k="">Retirer ✅</button>` : ""}
  ${(mien && !s.ferme) || estMod() ? `<button class="b s" data-f="edit" data-k="${esc(m.id)}">Modifier</button>` : ""}${mien || estMod() ? `<button class="b s d" data-f="msgdel" data-k="${esc(m.id)}">Supprimer</button>` : ""}
  ${!mien ? `<button class="b s" data-f="signal" data-t="msg" data-k="${esc(m.id)}">🚩 Signaler</button>` : ""}${estMod() ? `<button class="b s" data-f="msgmasque" data-k="${esc(m.id)}">${m.etat === "masque" ? "Afficher" : "Masquer"}</button>` : ""}</div></div></div>`;
}
function vueSujet() {
  const s = sj(S.sujet);
  if (!s || !visible(s)) return `${entete()}<div class="box">Ce sujet n'existe plus. <button class="b" data-f="home">Retour au forum</button></div>`;
  const c = cat(s.cat), mien = s.uid === S.o.uid, reps = S.msgs.filter((m) => m.etat !== "masque" || estMod() || m.uid === S.o.uid);
  const mod = estMod() ? `<div class="box"><b>🛡️ Modération</b><div class="row" style="margin-top:6px"><button class="b s" data-f="epingle">${s.epingle ? "Désépingler" : "📌 Épingler"}</button><button class="b s" data-f="ferme">${s.ferme ? "🔓 Déverrouiller" : "🔒 Verrouiller"}</button><button class="b s" data-f="resolu">${s.resolu ? "Rouvrir" : "✅ Marquer résolu"}</button><button class="b s" data-f="masque">${s.etat === "masque" ? "Afficher" : "Masquer"}</button>
  <select data-f="deplacer" style="width:auto"><option value="">Déplacer vers…</option>${S.cats.filter((x) => x.id !== s.cat).map((x) => `<option value="${esc(x.id)}">${esc(x.nom)}</option>`).join("")}</select><button class="b s d" data-f="sjdel">Supprimer le sujet</button></div></div>` : "";
  const peut = S.reg.ouvert && (!s.ferme || estMod());
  const rep = peut ? `<div class="box"><b>Ta réponse</b><textarea data-f="draft" data-k="rep" maxlength="${MAXM}" placeholder="Écris ta réponse…">${esc(S.draft.rep || "")}</textarea><div class="row bw" style="margin-top:6px"><span class="m">Sois constructif. Pas de données personnelles.</span><button class="b p" data-f="repondre">Publier la réponse</button></div></div>` : `<div class="al">${s.ferme ? "🔒 Ce sujet est verrouillé : plus de nouvelles réponses." : "Le forum est en lecture seule."}</div>`;
  return `${entete()}<div class="bc"><a data-f="home">Forum</a> › ${c ? `<a data-f="cat" data-k="${esc(c.id)}">${esc(c.ico || "")} ${esc(c.nom)}</a>` : "—"}</div>
  <div class="box"><div class="row bw"><h2 style="margin:0">${s.epingle ? "📌 " : ""}${esc(s.titre)}</h2><span>${s.resolu ? '<span class="tag ok">✅ Résolu</span>' : ""}${s.ferme ? '<span class="tag w">🔒 Verrouillé</span>' : ""}${s.etat === "masque" ? '<span class="tag r">Masqué</span>' : ""}<button class="b s" data-f="suivre" title="Être prévenu des nouvelles réponses (bloc « Sujets suivis » de l'accueil)">${(S.suiv || {})[s.id] ? "🔔 Suivi · ne plus suivre" : "🔔 Suivre"}</button></span></div></div>
  <div class="box msg${s.etat === "masque" ? " cache" : ""}"><div class="av">${esc(ini(s.nom))}</div><div class="bd"><div class="row bw"><span><b>${nomAff(s.uid, s.nom)}</b> <span class="m">· ${fmt(s.t)}${s.ed ? " · modifié" : ""} · auteur du sujet</span></span></div>
  ${S.edit === "S" ? `<input data-f="draft" data-k="et" maxlength="${MAXT}" value="${esc(S.draft.et != null ? S.draft.et : s.titre)}" style="margin:6px 0"><textarea data-f="draft" data-k="eS" maxlength="${MAXM}">${esc(S.draft.eS != null ? S.draft.eS : s.texte)}</textarea><div class="row" style="margin-top:6px"><button class="b p s" data-f="editok" data-k="S">Enregistrer</button><button class="b s" data-f="editno">Annuler</button></div>` : `<div class="tx">${lien(s.texte)}</div>`}
  <div class="row">${(mien && !s.ferme) || estMod() ? '<button class="b s" data-f="edit" data-k="S">Modifier</button>' : ""}${!mien ? `<button class="b s" data-f="signal" data-t="sujet" data-k="${esc(s.id)}">🚩 Signaler</button>` : ""}${mien && !estMod() ? '<button class="b s d" data-f="sjdel">Supprimer</button>' : ""}${mien && !s.resolu ? '<button class="b s" data-f="resolu">✅ Marquer comme résolu</button>' : ""}${mien && s.resolu ? '<button class="b s" data-f="resolu">Rouvrir</button>' : ""}</div></div></div>
  ${mod}<h3 style="margin:14px 0 6px">${reps.length} réponse${reps.length > 1 ? "s" : ""}</h3>${reps.map((m, i) => msgHtml(m, s, i)).join("")}${rep}`;
}
function vueNouveau() {
  const ouvertes = S.cats.filter((c) => !c.ferme || estMod());
  if (!S.reg.ouvert && !estMod()) return `${entete()}<div class="box">Le forum est en lecture seule.</div>`;
  const t = S.draft.nt || "", sim = t.length > 3 ? S.sujets.filter((s) => visible(s) && norm(s.titre).split(" ").some((w) => w.length > 4 && norm(t).includes(w))).slice(0, 3) : [];
  return `${entete()}<div class="bc"><a data-f="home">Forum</a> › Nouveau sujet</div><div class="box"><b>Nouveau sujet</b>
  <label class="m" style="display:block;margin-top:8px">Rubrique</label><select data-f="draft" data-k="nc">${ouvertes.map((c) => `<option value="${esc(c.id)}"${(S.draft.nc || S.cat) === c.id ? " selected" : ""}>${esc(c.ico || "")} ${esc(c.nom)}</option>`).join("")}</select>
  <label class="m" style="display:block;margin-top:8px">Titre (clair et précis)</label><input data-f="draft" data-k="nt" maxlength="${MAXT}" value="${esc(t)}" placeholder="Ex. Comment hiérarchiser les objectifs d'un feu de cave ?">
  ${sim.length ? `<div class="sim">Sujets proches : ${sim.map((s) => `<a data-f="ouvrir" data-k="${esc(s.id)}">${esc(s.titre)}</a>`).join(" · ")}</div>` : ""}
  <label class="m" style="display:block;margin-top:8px">Ton message</label><textarea data-f="draft" data-k="nx" maxlength="${MAXM}" placeholder="Détaille ta question, ce que tu as déjà essayé…">${esc(S.draft.nx || "")}</textarea>
  <div class="row bw" style="margin-top:8px"><span class="m">Pas de données personnelles ni de noms de victimes.</span><button class="b p" data-f="publier">Publier le sujet</button></div></div>`;
}
function vueMod() {
  if (!estMod()) return vueHome();
  const sg = S.sign.filter((x) => (S.tab === "sign" ? !x.traite : x.traite));
  const masq = S.sujets.filter((s) => s.etat === "masque");
  const ligneSig = (x) => {
    const s = sj(x.sujet), m = x.type === "msg" ? S.msgs.find((y) => y.id === x.ref) : null;
    return `<div class="box"><div class="row bw"><span><b>${x.type === "msg" ? "Message" : "Sujet"} signalé</b> <span class="m">par ${esc(x.nom || "Membre")} · ${fmt(x.t)}</span></span>${x.traite ? '<span class="tag ok">Traité</span>' : ""}</div>
    <div class="tx">${s ? `Sujet : <a data-f="ouvrir" data-k="${esc(s.id)}">${esc(s.titre)}</a>` : "Sujet supprimé"}</div><div class="tx"><b>Motif :</b> ${esc(x.motif || "—")}</div>
    <div class="row">${s ? `<button class="b s" data-f="ouvrir" data-k="${esc(s.id)}">Voir</button>` : ""}${!x.traite ? `<button class="b s" data-f="signok" data-k="${esc(x.id)}">Ignorer / traité</button>` : ""}<button class="b s d" data-f="signdel" data-k="${esc(x.id)}">Supprimer le signalement</button>${!x.traite && s && x.type === "sujet" ? `<button class="b s" data-f="signmasque" data-k="${esc(x.id)}">Masquer le sujet</button>` : ""}${!x.traite && x.type === "msg" ? `<button class="b s" data-f="signmsg" data-k="${esc(x.id)}" data-s="${esc(x.sujet)}" data-r="${esc(x.ref)}">Masquer le message</button>` : ""}</div></div>`;
  };
  return `${entete()}<div class="bc"><a data-f="home">Forum</a> › Modération</div><div class="tabs"><button class="chip${S.tab === "sign" ? " on" : ""}" data-f="tab" data-k="sign">Signalements à traiter (${S.sign.filter((x) => !x.traite).length})</button><button class="chip${S.tab === "hist" ? " on" : ""}" data-f="tab" data-k="hist">Traités (${S.sign.filter((x) => x.traite).length})</button><button class="chip${S.tab === "masq" ? " on" : ""}" data-f="tab" data-k="masq">Sujets masqués (${masq.length})</button></div>
  ${S.tab === "masq" ? `<div class="box">${masq.length ? masq.map(ligneSujet).join("") : '<p class="m">Aucun sujet masqué.</p>'}</div>` : sg.length ? sg.map(ligneSig).join("") : '<div class="box m">Aucun signalement.</div>'}`;
}
function vueAdmin() {
  if (!estAdm()) return vueHome();
  const dispo = (S.users || []).filter((u) => !S.mods.some((m) => m.id === u.id));
  return `${entete()}<div class="bc"><a data-f="home">Forum</a> › Administration</div>
  <div class="box"><b>Réglages</b><label class="row" style="margin:8px 0"><input type="checkbox" data-f="ouvert" ${S.reg.ouvert ? "checked" : ""} style="width:auto"> Forum ouvert aux nouveaux sujets et réponses (décocher = lecture seule)</label>
  <label class="m" style="display:block">Règles du forum (affichées en haut)</label><textarea data-f="draft" data-k="charte" maxlength="1500">${esc(S.draft.charte != null ? S.draft.charte : S.reg.charte || CHARTE0)}</textarea><div style="margin-top:6px"><button class="b p" data-f="regsave">Enregistrer les réglages</button></div></div>
  <div class="box"><b>Modérateurs (${S.mods.length})</b><p class="m">Les modérateurs peuvent masquer, supprimer, épingler, verrouiller, déplacer les sujets et traiter les signalements. Toi, administrateur, l'es d'office.</p>
  ${S.mods.map((m) => `<div class="row bw" style="padding:4px 0"><span>🛡️ ${esc(m.nom || m.id)}</span><button class="b s d" data-f="moddel" data-k="${esc(m.id)}">Retirer</button></div>`).join("") || '<p class="m">Aucun modérateur désigné.</p>'}
  <div class="row" style="margin-top:8px">${S.users === null ? '<button class="b" data-f="usersload">Choisir un inscrit…</button>' : `<select class="grow" data-f="modsel"><option value="">Désigner un modérateur…</option>${dispo.sort((a, b) => String(a.nom).localeCompare(String(b.nom))).map((u) => `<option value="${esc(u.id)}">${esc(u.nom || u.id)}</option>`).join("")}</select><button class="b p" data-f="modadd">Désigner</button>`}</div></div>
  <div class="box"><b>Rubriques</b>${S.cats.map((c, i) => `<div class="row" style="padding:6px 0;border-top:1px solid var(--line,#d8dde1)"><input data-f="cico" data-k="${esc(c.id)}" value="${esc(c.ico || "")}" maxlength="4" style="width:60px" aria-label="Icône"><input class="grow" data-f="cnom" data-k="${esc(c.id)}" value="${esc(c.nom)}" maxlength="60" aria-label="Nom"><button class="b s" data-f="cup" data-k="${esc(c.id)}" ${i ? "" : "disabled"}>↑</button><button class="b s" data-f="cdn" data-k="${esc(c.id)}" ${i < S.cats.length - 1 ? "" : "disabled"}>↓</button>
  <button class="b s" data-f="cferme" data-k="${esc(c.id)}" title="Seuls les modérateurs peuvent y créer des sujets">${c.ferme ? "🔒 Modérateurs seuls" : "Ouverte à tous"}</button><button class="b s" data-f="cmasque" data-k="${esc(c.id)}">${c.masque ? "Masquée" : "Visible"}</button><button class="b s d" data-f="cdel" data-k="${esc(c.id)}">Supprimer</button></div><input data-f="cdesc" data-k="${esc(c.id)}" value="${esc(c.desc || "")}" maxlength="140" placeholder="Description" style="margin-bottom:4px"><div class="m" style="margin-bottom:4px">${S.sujets.filter((s) => s.cat === c.id).length} sujet(s)</div>`).join("")}
  <div class="row" style="margin-top:8px"><input class="grow" data-f="draft" data-k="cn" value="${esc(S.draft.cn || "")}" maxlength="60" placeholder="Nom de la nouvelle rubrique"><button class="b p" data-f="cadd">+ Ajouter</button></div></div>`;
}
function dessiner() {
  if (!S.el || !S.el.isConnected) return;
  const v = { home: vueHome, cat: vueCat, sujet: vueSujet, nouveau: vueNouveau, mod: vueMod, admin: vueAdmin }[S.vue] || vueHome;
  const haut = S.el.scrollTop;
  S.el.innerHTML = `<style>${CSS}</style><div class="fo">${S.chargé ? v() : '<p class="m">Chargement du forum…</p>'}</div>`;
  S.el.scrollTop = haut;
}

// ---------- actions ----------
const maintenant = () => Date.now();
function antiSpam() {
  const l = Number(localStorage.getItem("fo-last") || 0);
  if (maintenant() - l < DELAI) { S.msg = "Patiente quelques secondes avant de publier à nouveau."; return false; }
  try { localStorage.setItem("fo-last", String(maintenant())); } catch { /* ignore */ }
  return true;
}
async function suivreMaj(id, on) {
  const m = { ...(S.suiv || {}) };
  if (on) m[id] = maintenant(); else delete m[id];
  await S.o.put("forumSuivis", S.o.uid, { s: m });
  S.suiv = m;
  if (S.o.change) S.o.change();
}
async function aller(vue, extra = {}) {
  S.msg = ""; S.edit = ""; Object.assign(S, { vue }, extra);
  S.chargé = vue === "sujet" ? false : S.chargé; dessiner();
  try { await charger(vue === "sujet" ? S.sujet : null); } catch (e) { S.msg = "Erreur de chargement : " + (e.message || e.code); S.chargé = true; }
  if (vue === "sujet") { const s = sj(S.sujet); if (s) { vuSet(s.id, maintenant()); if ((S.suiv || {})[s.id]) suivreMaj(s.id, true).catch(() => {}); } }
  dessiner();
}
async function maj(coll, id, patch, apres) {
  try { await S.o.put(coll, id, patch); if (apres) await apres(); } catch (e) { S.msg = "Erreur : " + (e.message || e.code); }
  try { await charger(S.vue === "sujet" ? S.sujet : null); } catch { /* ignore */ }
  dessiner();
}
async function clic(f, b, e) {
  const k = b.dataset.k, s = sj(S.sujet), o = S.o;
  if (f === "home") return aller("home", { cat: "" });
  if (f === "actu") { S.msg = "Actualisé."; return aller(S.vue); }
  if (f === "cat") return aller("cat", { cat: k });
  if (f === "ouvrir") return aller("sujet", { sujet: k });
  if (f === "nouveau") return aller("nouveau");
  if (f === "mod") return aller("mod");
  if (f === "admin") { await aller("admin"); return; }
  if (f === "filtre") { S.filtre = k; return dessiner(); }
  if (f === "tab") { S.tab = k; return dessiner(); }
  if (f === "editno") { S.edit = ""; S.draft = {}; return dessiner(); }
  if (f === "edit") { S.edit = k; S.draft = {}; return dessiner(); }
  if (f === "publier") {
    const t = (S.draft.nt || "").trim(), x = (S.draft.nx || "").trim(), c = S.draft.nc || S.cat || (S.cats[0] || {}).id;
    if (t.length < 5 || x.length < 10) { S.msg = "Donne un titre (5 caractères min.) et un message (10 caractères min.)."; return dessiner(); }
    if (!c) { S.msg = "Aucune rubrique disponible."; return dessiner(); }
    if (!antiSpam()) return dessiner();
    try {
      const id = await o.put("forumSujets", null, { cat: c, titre: t.slice(0, MAXT), texte: x.slice(0, MAXM), uid: o.uid, nom: o.nom, t: maintenant(), maj: maintenant(), nb: 0, epingle: false, ferme: false, resolu: false, etat: "ok" });
      S.draft = {}; await suivreMaj(id, true).catch(() => {}); return aller("sujet", { sujet: id });
    } catch (er) { S.msg = "Erreur : " + (er.message || er.code); return dessiner(); }
  }
  if (!s && ["repondre", "merci", "citer", "bonne", "msgdel", "msgmasque", "epingle", "ferme", "resolu", "masque", "deplacer", "sjdel", "editok", "signal", "suivre"].includes(f)) return;
  if (f === "suivre") { try { await suivreMaj(s.id, !(S.suiv || {})[s.id]); S.msg = (S.suiv || {})[s.id] ? "Tu suis ce sujet : il apparaîtra sur ton accueil avec les nouvelles réponses." : "Sujet non suivi."; } catch (er) { S.msg = "Erreur : " + (er.message || er.code); } return dessiner(); }
  if (f === "repondre") {
    const x = (S.draft.rep || "").trim();
    if (x.length < 2) { S.msg = "Écris ta réponse."; return dessiner(); }
    if (!antiSpam()) return dessiner();
    try {
      await o.put("forumMsgs", null, { sujet: s.id, texte: x.slice(0, MAXM), uid: o.uid, nom: o.nom, t: maintenant(), etat: "ok", merci: {} });
      await o.put("forumSujets", s.id, { nb: (s.nb || 0) + 1, maj: maintenant(), dernierNom: o.nom, dernierUid: o.uid });
      S.draft.rep = ""; S.msg = "Réponse publiée.";
    } catch (er) { S.msg = "Erreur : " + (er.message || er.code); }
    await suivreMaj(s.id, true).catch(() => {}); await charger(s.id); vuSet(s.id, maintenant()); return dessiner();
  }
  if (f === "citer") { const m = S.msgs.find((y) => y.id === k); if (m) { S.draft.rep = (S.draft.rep ? S.draft.rep + "\n" : "") + "> " + m.nom + " : " + m.texte.split("\n").join("\n> ").slice(0, 300) + "\n\n"; dessiner(); } return; }
  if (f === "merci") { const m = S.msgs.find((y) => y.id === k); if (!m) return; const mr = { ...(m.merci || {}) }; if (mr[o.uid]) delete mr[o.uid]; else mr[o.uid] = 1; return maj("forumMsgs", m.id, { merci: mr }); }
  if (f === "bonne") return maj("forumSujets", s.id, { bonne: k || "", resolu: !!k || s.resolu });
  if (f === "editok") {
    if (k === "S") { const t = (S.draft.et != null ? S.draft.et : s.titre).trim(), x = (S.draft.eS != null ? S.draft.eS : s.texte).trim(); if (t.length < 5 || x.length < 10) { S.msg = "Titre et message trop courts."; return dessiner(); } S.edit = ""; S.draft = {}; return maj("forumSujets", s.id, { titre: t.slice(0, MAXT), texte: x.slice(0, MAXM), ed: maintenant() }); }
    const x = (S.draft["e" + k] != null ? S.draft["e" + k] : (S.msgs.find((y) => y.id === k) || {}).texte || "").trim(); if (x.length < 2) { S.msg = "Message trop court."; return dessiner(); }
    S.edit = ""; S.draft = {}; return maj("forumMsgs", k, { texte: x.slice(0, MAXM), ed: maintenant() });
  }
  if (f === "msgdel") {
    if (!window.confirm("Supprimer ce message ?")) return;
    try { await o.del("forumMsgs", k); await o.put("forumSujets", s.id, { nb: Math.max(0, (s.nb || 1) - 1), bonne: s.bonne === k ? "" : s.bonne || "" }); } catch (er) { S.msg = "Erreur : " + (er.message || er.code); }
    await charger(s.id); return dessiner();
  }
  if (f === "msgmasque") { const m = S.msgs.find((y) => y.id === k); return maj("forumMsgs", k, { etat: m && m.etat === "masque" ? "ok" : "masque" }); }
  if (f === "epingle") return maj("forumSujets", s.id, { epingle: !s.epingle });
  if (f === "ferme") return maj("forumSujets", s.id, { ferme: !s.ferme });
  if (f === "resolu") return maj("forumSujets", s.id, { resolu: !s.resolu });
  if (f === "masque") return maj("forumSujets", s.id, { etat: s.etat === "masque" ? "ok" : "masque" });
  if (f === "sjdel") {
    if (!window.confirm("Supprimer ce sujet et toutes ses réponses ?")) return;
    try { for (const m of S.msgs) await o.del("forumMsgs", m.id); await o.del("forumSujets", s.id); } catch (er) { S.msg = "Erreur : " + (er.message || er.code); return dessiner(); }
    S.msg = "Sujet supprimé."; return aller("cat", { cat: s.cat });
  }
  if (f === "signal") {
    const motif = window.prompt("Pourquoi signales-tu ce contenu ? (hors sujet, insultes, données personnelles…)");
    if (motif === null) return;
    try { await o.put("forumSign", null, { type: b.dataset.t, ref: k, sujet: s.id, motif: String(motif).slice(0, 300), uid: o.uid, nom: o.nom, t: maintenant(), traite: false }); S.msg = "Merci, le signalement a été transmis aux modérateurs."; } catch (er) { S.msg = "Erreur : " + (er.message || er.code); }
    return dessiner();
  }
  if (f === "signok") return maj("forumSign", k, { traite: true });
  if (f === "signdel") return maj("forumSign", k, null);
  if (f === "signmasque") { const x = S.sign.find((y) => y.id === k); return maj("forumSujets", x.sujet, { etat: "masque" }, () => o.put("forumSign", k, { traite: true })); }
  if (f === "signmsg") return maj("forumMsgs", b.dataset.r, { etat: "masque" }, () => o.put("forumSign", k, { traite: true }));
  // administration
  if (f === "regsave") return maj("forumCats", "_reglages", { ouvert: S.reg.ouvert, charte: (S.draft.charte != null ? S.draft.charte : S.reg.charte || "").slice(0, 1500), vu: 1 }, () => { S.msg = "Réglages enregistrés."; });
  if (f === "usersload") { try { S.users = await o.users(); } catch (er) { S.msg = "Erreur : " + (er.message || er.code); S.users = []; } return dessiner(); }
  if (f === "modadd") { const id = S.draft.modsel; const u = (S.users || []).find((x) => x.id === id); if (!u) return; return maj("forumMods", id, { nom: u.nom || "" }, () => { S.draft.modsel = ""; S.msg = "Modérateur désigné : " + (u.nom || id); }); }
  if (f === "moddel") return maj("forumMods", k, null, () => { S.msg = "Modérateur retiré."; });
  if (f === "cadd") { const n = (S.draft.cn || "").trim(); if (!n) return; return maj("forumCats", null, { nom: n, desc: "", ico: "💬", ordre: S.cats.length + 1 }, () => { S.draft.cn = ""; }); }
  if (f === "cdel") { const c = cat(k); if (S.sujets.some((x) => x.cat === k)) { S.msg = "Déplace ou supprime d'abord les sujets de cette rubrique."; return dessiner(); } if (!window.confirm("Supprimer la rubrique « " + (c && c.nom) + " » ?")) return; return maj("forumCats", k, null); }
  if (f === "cferme" || f === "cmasque") { const c = cat(k); return maj("forumCats", k, f === "cferme" ? { ferme: !c.ferme } : { masque: !c.masque }); }
  if (f === "cup" || f === "cdn") {
    const i = S.cats.findIndex((c) => c.id === k), j = f === "cup" ? i - 1 : i + 1; if (j < 0 || j >= S.cats.length) return;
    const a = S.cats[i], c2 = S.cats[j];
    try { await o.put("forumCats", a.id, { ordre: j + 1 }); await o.put("forumCats", c2.id, { ordre: i + 1 }); } catch (er) { S.msg = "Erreur : " + (er.message || er.code); }
    await charger(); return dessiner();
  }
}
function saisie(e) {
  const t = e.target, f = t.dataset && t.dataset.f; if (!f) return;
  if (f === "q") { S.q = t.value; const p = t.selectionStart; dessiner(); const n = S.el.querySelector('[data-f="q"]'); if (n) { n.focus(); n.setSelectionRange(p, p); } return; }
  if (f === "draft") { S.draft[t.dataset.k] = t.value; if (t.dataset.k === "nt") { /* suggestions : rafraîchir à la fin de saisie */ clearTimeout(S.tt); S.tt = setTimeout(() => { const el = S.el.querySelector('[data-k="nt"]'); const p = el && el.selectionStart; dessiner(); const n = S.el.querySelector('[data-k="nt"]'); if (n) { n.focus(); n.setSelectionRange(p, p); } }, 600); } return; }
  if (f === "cnom" || f === "cico" || f === "cdesc") { clearTimeout(S.ct); const k = t.dataset.k, v = t.value; S.ct = setTimeout(() => S.o.put("forumCats", k, f === "cnom" ? { nom: v.trim() || "Rubrique" } : f === "cico" ? { ico: v } : { desc: v }).catch(() => {}), 700); }
}
function change(e) {
  const t = e.target, f = t.dataset && t.dataset.f; if (!f) return;
  if (f === "modsel") S.draft.modsel = t.value;
  if (f === "ouvert") { S.reg.ouvert = t.checked; }
  if (f === "deplacer" && t.value) maj("forumSujets", S.sujet, { cat: t.value });
  if (f === "draft" && t.tagName === "SELECT") S.draft[t.dataset.k] = t.value;
}

export function forumOuvrir(id) { S.pending = id; }
export function forumDetach() { clearInterval(S.timer); S.timer = null; }
export default function forumMount(el, opts) {
  forumDetach();
  const pend = S.pending; S.pending = "";
  const garde = !!(opts.keep && S.o && S.vue); // remontage (page hébergée) : on garde la vue, le brouillon et les données déjà chargées
  if (garde) { Object.assign(S, { el, o: opts }); if (pend) Object.assign(S, { vue: "sujet", sujet: pend, edit: "", msg: "", chargé: false }); } else Object.assign(S, { el, o: opts, vue: opts.vueInit || "home", cat: "", sujet: "", chargé: false, draft: {}, edit: "", msg: "", users: null });
  if (el.__fo) { el.removeEventListener("click", el.__fo.c); el.removeEventListener("input", el.__fo.i); el.removeEventListener("change", el.__fo.h); el.removeEventListener("keydown", el.__fo.k); }
  const c = (e) => { const b = e.target.closest("[data-f]"); if (!b || !el.contains(b)) return; const f = b.dataset.f; if (["q", "draft", "cnom", "cico", "cdesc", "ouvert", "modsel", "deplacer"].includes(f) && b.tagName !== "BUTTON") return; clic(f, b, e); };
  const k = (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.matches('[role="button"][data-f]')) { e.preventDefault(); clic(e.target.dataset.f, e.target, e); } };
  el.__fo = { c, i: saisie, h: change, k };
  el.addEventListener("click", c); el.addEventListener("input", saisie); el.addEventListener("change", change); el.addEventListener("keydown", k);
  dessiner();
  if (garde) { charger(S.vue === "sujet" ? S.sujet : null).then(dessiner).catch(() => {}); }
  else charger().then(amorcer).then(() => { if (opts.sujetInit || pend) { const id = opts.sujetInit || pend; S.sujet = id; return aller("sujet", { sujet: id }); } dessiner(); }).catch((e) => { S.msg = "Impossible de charger le forum : " + (e.message || e.code) + ". Les règles de la base (collections forum…) sont peut-être à publier."; S.chargé = true; dessiner(); });
  ping();
  S.timer = setInterval(() => {
    if (el.isConnected) ping();
    if (!el.isConnected) return forumDetach();
    if (document.hidden || el.querySelector("textarea,input[data-f=draft]") && Object.values(S.draft).some((v) => v) || S.edit) return;
    charger(S.vue === "sujet" ? S.sujet : null).then(dessiner).catch(() => {});
  }, 45000);
}
