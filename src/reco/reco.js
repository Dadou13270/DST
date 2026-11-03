// Situations en images (reconnaissance) : photo ou plan avec zones cliquables à observer, puis décisions.
// Module autonome : recoMount(element, opts). Utilisé tel quel par l'application React et la page hébergée.
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const br = (s) => esc(s).replace(/\n/g, "<br>");
const rid = () => Math.random().toString(36).slice(2, 9);
const clone = (x) => JSON.parse(JSON.stringify(x));
const TYPES = { essentielle: "Essentielle", utile: "Utile", piege: "Sans intérêt (piège)" };
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export const nouveau = () => ({ titre: "", contexte: "", image: "", temps: 0, zones: [], decisions: [], publie: false });
const Z = (x, y, w, h, titre, texte, type) => ({ id: rid(), x, y, w, h, titre, texte, type });
const Q = (t, pts, retour) => ({ t, pts, retour });
export const EXEMPLE = (image) => ({
  titre: "Feu d'appartement au 1er étage d'un immeuble de trois étages",
  contexte: "Vous arrivez en tête sur les lieux d'un feu signalé dans un immeuble d'habitation. Observez la façade et les abords, puis prenez vos décisions.",
  image: image || "", temps: 90, publie: false,
  zones: [
    Z(36, 42, 38, 16, "Fumées noires épaisses au 1er étage", "Fumées denses et noires sortant de la loggia : feu développé dans le logement du 1er étage, ventilation insuffisante.", "essentielle"),
    Z(38, 19, 32, 22, "Fumées aux balcons des étages supérieurs", "La fumée monte le long de la façade : risque de propagation et d'enfumage des logements du dessus.", "essentielle"),
    Z(43, 62, 40, 7, "Canalisation de gaz (jaune)", "Conduite de gaz apparente sous le balcon sinistré : risque d'explosion ou d'aggravation. À signaler, couper l'alimentation si possible.", "essentielle"),
    Z(84, 68, 14, 10, "Entrée du bâtiment", "Porte d'accès à la cage d'escalier : cheminement d'attaque et d'évacuation.", "essentielle"),
    Z(0, 0, 40, 36, "Panache de fumée vers la gauche", "Le vent rabat la fumée vers la gauche : à prendre en compte pour le positionnement des engins et du personnel.", "utile"),
    Z(0, 70, 18, 15, "Véhicules en stationnement", "Véhicules garés près de l'accès : peuvent gêner la mise en place des engins.", "utile"),
    Z(27, 68, 13, 13, "Rideau métallique de garage", "Garage en rez-de-chaussée sous le logement sinistré.", "utile"),
    Z(27, 5, 11, 78, "Lampadaire", "Mobilier urbain sans incidence sur l'intervention.", "piege"),
    Z(16, 34, 6, 24, "Hublots en façade", "Ouvertures décoratives de la façade : sans rapport avec le sinistre.", "piege"),
  ],
  decisions: [
    { id: rid(), texte: "Votre première action de commandement à l'arrivée ?", choix: [
      Q("Faire le point sur les victimes et les personnes à évacuer, demander les moyens complémentaires et engager la reconnaissance du logement sinistré", 10, "Priorité à la vie, anticipation des moyens, reconnaissance en sécurité."),
      Q("Attaquer immédiatement le feu sans reconnaissance", 4, "Sans reconnaissance ni appréciation des risques, l'attaque est engagée à l'aveugle."),
      Q("Attendre l'arrivée d'un chef supérieur", 1, "Aucune action alors qu'une situation évolutive est en cours."),
      Q("Évacuer uniquement les passants dans la rue", 3, "Les occupants de l'immeuble sont les premiers exposés.")] },
    { id: rid(), texte: "La canalisation de gaz est visible sous les balcons. Que décidez-vous ?", choix: [
      Q("Demander la coupure du gaz au gestionnaire du réseau, interdire toute source d'ignition et établir un périmètre de sécurité", 10, "Mesure conservatoire adaptée au risque d'explosion."),
      Q("Ne rien faire, la conduite n'est pas touchée par le feu", 1, "La chaleur peut fragiliser la conduite : le risque doit être traité."),
      Q("Refroidir la conduite à la lance sans autre précaution", 5, "Refroidir peut aider, mais sans coupure ni périmètre la mesure est incomplète."),
      Q("Évacuer toute la rue sans informer personne", 3, "Évacuation sans information ni consigne claire.")] },
    { id: rid(), texte: "De la fumée atteint les balcons des étages supérieurs. Quelle priorité ?", choix: [
      Q("Faire évacuer ou confiner les occupants des étages supérieurs selon la situation de l'escalier, et demander un engin échelle", 10, "Protection des occupants exposés et moyens aériens anticipés."),
      Q("Attendre que le feu soit éteint avant de s'occuper des étages", 2, "Le temps joue contre les occupants au-dessus du sinistre."),
      Q("Casser les vitres des balcons pour ventiler", 1, "Ventiler sans coordination peut aggraver la propagation."),
      Q("Envoyer tous les sapeurs au dernier étage", 4, "Dispersion des moyens sans objectif précis.")] },
  ],
});

const CSS = `.rc{width:100%;font:inherit}.rc *{box-sizing:border-box}
.rc .cd{background:var(--card,#fff);border:1px solid var(--line,#d8dde1);border-radius:12px;padding:14px;margin:10px 0}
.rc .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.rc .bt{justify-content:space-between}.rc .m{color:var(--mut,#6b7280)}
.rc h2,.rc h3{margin:0 0 6px}.rc label{display:block;font-weight:600;margin:10px 0 4px}
.rc input,.rc select,.rc textarea{width:100%;font:inherit;padding:8px 10px;border:1px solid var(--line,#d8dde1);border-radius:8px;background:var(--card,#fff);color:inherit}.rc input[type=checkbox]{width:auto}.rc textarea{min-height:70px;resize:vertical}
.rc .b{font:inherit;font-weight:600;padding:8px 14px;border-radius:10px;border:1px solid var(--line,#d8dde1);background:var(--card,#fff);color:inherit;cursor:pointer}.rc .b.p{background:var(--red,#c42a1c);border-color:var(--red,#c42a1c);color:#fff}.rc .b.x{color:#b3261e;border-color:#b3261e}.rc .b.s{padding:5px 10px;font-size:.88em}
.rc .tg{display:inline-block;padding:2px 10px;border-radius:99px;font-size:.78rem;font-weight:700;border:1px solid var(--line,#d8dde1);white-space:nowrap}.rc .tg.v{background:#1f8a4c;color:#fff;border-color:#1f8a4c}.rc .tg.r{background:var(--red,#c42a1c);color:#fff;border-color:var(--red,#c42a1c)}
.rc .g2{display:grid;grid-template-columns:2fr 1fr;gap:12px}@media(max-width:800px){.rc .g2{grid-template-columns:1fr}}
.rc .stage{position:relative;touch-action:none;user-select:none;-webkit-user-select:none;line-height:0;border-radius:10px;overflow:hidden;border:1px solid var(--line,#d8dde1)}.rc .stage img{width:100%;display:block;pointer-events:none}
.rc .zn{position:absolute;border:2px solid #ffd400;background:rgba(255,212,0,.15);border-radius:4px;cursor:pointer}.rc .zn.sel{border-color:#c42a1c;background:rgba(196,42,28,.2)}
.rc .zn.ok{border-color:#1f8a4c;background:rgba(31,138,76,.22)}.rc .zn.ko{border:2px dashed #c42a1c;background:rgba(196,42,28,.14)}.rc .zn.ot{border-color:#8a8f98;background:rgba(138,143,152,.15)}
.rc .zn .n{position:absolute;left:2px;top:2px;background:#000a;color:#fff;font:700 11px/1 system-ui;padding:2px 5px;border-radius:6px}
.rc .miss{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:2px solid #fff;background:#c42a1ccc;color:#fff;font:700 13px/18px system-ui;text-align:center;pointer-events:none}
.rc .pin{position:absolute;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid #fff;background:#1f8a4c;pointer-events:none}
.rc .ob{border-left:4px solid #1f8a4c;background:rgba(127,127,127,.08);padding:8px 12px;border-radius:0 8px 8px 0;margin:8px 0;line-height:1.4}
.rc .ch{display:block;width:100%;text-align:left;margin:6px 0}.rc .fc{border-left:4px solid var(--red,#c42a1c);background:rgba(127,127,127,.08);padding:8px 12px;border-radius:0 8px 8px 0;margin:8px 0}
.rc .thumb{width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:8px;display:block}.rc .ph{height:150px;border-radius:10px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:2.4rem;background:rgba(127,127,127,.15)}
.rc .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}.rc .err{color:#b3261e;font-weight:600}
.rc .lib{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;max-height:300px;overflow:auto;margin-top:8px}.rc .lib button{padding:0;border:2px solid var(--line,#d8dde1);border-radius:8px;background:none;cursor:pointer;overflow:hidden}.rc .lib img{width:100%;height:76px;object-fit:cover;display:block}`;
function css() { if (!document.getElementById("rc-css")) { const s = document.createElement("style"); s.id = "rc-css"; s.textContent = CSS; document.head.appendChild(s); } }

let S = null; // état conservé entre deux affichages de la page
export function recoDetach() { if (S) { if (S.tm) clearInterval(S.tm); S = null; } }

function reduire(file, max = 1000) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej(new Error("Lecture de l'image impossible."));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => rej(new Error("Image non reconnue."));
      im.onload = () => {
        const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas");
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.8));
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
const pct = (e, st) => { const r = st.getBoundingClientRect(); return { x: Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)), y: Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100)) }; };
const dedans = (z, p) => p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h;
const zoneCss = (z) => `left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%`;

export default function recoMount(el, o) {
  css(); if (S && S.tm) clearInterval(S.tm);
  if (!S || S.uid !== o.uid) S = { uid: o.uid, vue: "liste", liste: null, dr: null, id: null, sel: null, msg: "", err: "", txt: {}, P: null, libOuv: false, lib: null, lq: "", conf: null };
  const ST = S;
  ST.o = o;

  const charger = () => o.list().then((l) => { ST.liste = l; rend(); }).catch((e) => { ST.liste = []; ST.err = "Lecture impossible : " + (e.message || e.code); rend(); });
  const peut = (s) => o.isAdmin || s.auteur === o.uid;

  // ---------- liste
  function vueListe() {
    const l = ST.liste;
    let h = `<h2>🖼️ Situations en images</h2><p class="m">Observe l'image, touche les zones qui te paraissent importantes, puis prends tes décisions. Plus tu repères d'éléments essentiels, meilleur est ton bilan.</p>${ST.msg ? `<p class="m">${esc(ST.msg)}</p>` : ""}${ST.err ? `<p class="err">${esc(ST.err)}</p>` : ""}`;
    if (o.canEdit) h += `<div class="row"><button class="b p" data-a="new">➕ Nouvelle situation</button><button class="b" data-a="ex">✨ Ajouter l'exemple (feu d'appartement)</button></div>`;
    if (!l) return h + `<p class="m">Chargement…</p>`;
    if (!l.length) return h + `<div class="cd"><p class="m">Aucune situation pour le moment.</p></div>`;
    return h + `<div class="grid" style="margin-top:12px">${l.map((s) => `<div class="cd" style="margin:0">${s.image ? `<img class="thumb" src="${esc(s.image)}" alt="">` : '<div class="ph">🖼️</div>'}<b>${esc(s.titre || "Sans titre")}</b>${o.canEdit ? (s.publie ? ' <span class="tg v">Publié</span>' : ' <span class="tg">Brouillon</span>') : ""}<div class="m">${(s.zones || []).length} zone(s) · ${(s.decisions || []).length} décision(s)${s.temps ? " · " + mmss(s.temps) : ""}</div>
      <div class="row" style="margin-top:8px"><button class="b p s" data-a="play" data-i="${esc(s.id)}">▶ Jouer</button>${o.canEdit && peut(s) ? `<button class="b s ${s.publie ? "" : "p"}" data-a="pub" data-i="${esc(s.id)}">${s.publie ? "Retirer la publication" : "Publier"}</button><button class="b s" data-a="edit" data-i="${esc(s.id)}">✏️ Modifier</button><button class="b s" data-a="dup" data-i="${esc(s.id)}">Dupliquer</button>${ST.conf === s.id ? `<button class="b s x" data-a="delok" data-i="${esc(s.id)}">Confirmer</button><button class="b s" data-a="delno">Annuler</button>` : `<button class="b s x" data-a="del" data-i="${esc(s.id)}">Supprimer</button>`}` : ""}</div></div>`).join("")}</div>`;
  }

  // ---------- éditeur
  function lire() {
    if (!ST.dr) return;
    el.querySelectorAll("[data-k]").forEach((x) => {
      const k = x.dataset.k.split("."); let t = ST.dr;
      for (let i = 0; i < k.length - 1; i++) { t = t[/^\d+$/.test(k[i]) ? +k[i] : k[i]]; if (t == null) return; }
      const last = /^\d+$/.test(k[k.length - 1]) ? +k[k.length - 1] : k[k.length - 1];
      if (x.type === "checkbox") t[last] = x.checked;
      else if (["temps", "pts"].includes(last)) t[last] = Math.max(0, Number(x.value) || 0);
      else t[last] = x.value;
    });
  }
  function vueEdit() {
    const d = ST.dr, zs = d.zones, sel = zs.find((z) => z.id === ST.sel);
    const inp = (k, v, ex = "") => `<input data-k="${k}" value="${esc(v)}" ${ex}>`;
    return `<h2>${ST.id ? "Modifier" : "Nouvelle"} situation en images</h2>${ST.err ? `<p class="err">${esc(ST.err)}</p>` : ""}
    <div class="cd"><label>Titre</label>${inp("titre", d.titre)}<label>Contexte (ce que le stagiaire sait en arrivant)</label><textarea data-k="contexte" rows="3">${esc(d.contexte)}</textarea>
    <div class="row" style="align-items:flex-end"><div style="flex:1;min-width:160px"><label>Temps d'observation (secondes, 0 = libre)</label>${inp("temps", d.temps, 'type="number" min="0"')}</div><label style="margin:0;font-weight:400"><input type="checkbox" data-k="publie" ${d.publie ? "checked" : ""}> Visible par les stagiaires</label></div></div>
    <div class="cd"><h3>Image</h3><div class="row"><input type="file" accept="image/*" data-img="1" style="width:auto;max-width:100%">${o.illus ? `<button class="b s" data-a="lib">${ST.libOuv ? "Fermer la bibliothèque" : "📚 Bibliothèque d'images"}</button>` : ""}${d.image ? '<button class="b s x" data-a="delimg">Retirer l\'image</button>' : ""}</div>
    ${ST.libOuv ? `<input data-lq="1" placeholder="Rechercher une image…" value="${esc(ST.lq)}" style="margin-top:8px">${ST.lib ? `<div class="lib">${ST.lib.filter((x) => !ST.lq || (x.titre || "").toLowerCase().includes(ST.lq.toLowerCase())).slice(0, 60).map((x) => `<button data-a="libuse" data-i="${esc(x.id)}" title="${esc(x.titre || "")}"><img src="${esc(x.image || x.data || x.url || "")}" alt=""></button>`).join("")}</div>` : '<p class="m">Chargement…</p>'}` : ""}</div>
    ${d.image ? `<div class="cd"><h3>Zones à observer</h3><p class="m">Trace un rectangle sur l'image (glisser). Touche une zone pour la sélectionner et renseigner son contenu.</p>
    <div class="g2"><div><div class="stage" id="rc-ed"><img src="${esc(d.image)}" alt="">${zs.map((z, i) => `<div class="zn ${z.id === ST.sel ? "sel" : ""}" data-z="${esc(z.id)}" style="${zoneCss(z)}"><span class="n">${i + 1}</span></div>`).join("")}<div class="zn sel" id="rc-prev" style="display:none"></div></div></div>
    <div>${sel ? `<h3>Zone ${zs.indexOf(sel) + 1}</h3><label>Titre</label>${inp(`zones.${zs.indexOf(sel)}.titre`, sel.titre)}<label>Ce que le stagiaire découvre</label><textarea data-k="zones.${zs.indexOf(sel)}.texte" rows="4">${esc(sel.texte)}</textarea><label>Importance</label><select data-k="zones.${zs.indexOf(sel)}.type">${Object.keys(TYPES).map((t) => `<option value="${t}"${sel.type === t ? " selected" : ""}>${TYPES[t]}</option>`).join("")}</select><div style="margin-top:8px"><button class="b s x" data-a="delzone">Supprimer la zone</button></div>` : '<p class="m">Aucune zone sélectionnée.</p>'}</div></div>
    <p class="m">${zs.filter((z) => z.type === "essentielle").length} essentielle(s) sur ${zs.length} zone(s).</p></div>` : ""}
    <div class="cd"><div class="row bt"><h3>Décisions (${d.decisions.length})</h3><button class="b s" data-a="adddec">➕ Ajouter une décision</button></div>
    ${d.decisions.map((x, n) => `<div class="cd" style="margin:8px 0"><div class="row bt"><b>${n + 1}.</b><span class="row"><button class="b s" data-a="decup" data-n="${n}">↑</button><button class="b s" data-a="decdn" data-n="${n}">↓</button><button class="b s x" data-a="decdel" data-n="${n}">Supprimer</button></span></div>
      <label>Question</label><textarea data-k="decisions.${n}.texte" rows="2">${esc(x.texte)}</textarea><label>Choix (points de 0 à 10)</label>
      ${x.choix.map((c, k) => `<div style="margin:6px 0"><input data-k="decisions.${n}.choix.${k}.t" value="${esc(c.t)}" placeholder="Réponse"><div class="row" style="margin-top:4px"><input data-k="decisions.${n}.choix.${k}.pts" type="number" min="0" max="10" value="${esc(c.pts)}" style="width:80px"><input data-k="decisions.${n}.choix.${k}.retour" value="${esc(c.retour || "")}" placeholder="Retour pédagogique" style="flex:1"><button class="b s x" data-a="chdel" data-n="${n}" data-c="${k}">✕</button></div></div>`).join("")}<button class="b s" data-a="chadd" data-n="${n}">➕ Ajouter un choix</button></div>`).join("") || '<p class="m">Aucune décision.</p>'}</div>
    <div class="row"><button class="b p" data-a="save">💾 Enregistrer</button><button class="b" data-a="cancel">Annuler</button></div>`;
  }

  // ---------- jeu
  function demarrer(sc) {
    ST.P = { sc, phase: "obs", trouvees: new Set(), rates: [], t0: Date.now(), reste: sc.temps || 0, i: 0, choix: [], fb: null, fini: false };
    ST.vue = "jeu"; ST.err = ""; rend(); lancerChrono();
  }
  function lancerChrono() {
    if (ST.tm) clearInterval(ST.tm); ST.tm = null;
    const P = ST.P; if (!P || P.phase !== "obs" || !P.sc.temps) return;
    ST.tm = setInterval(() => {
      if (!el.isConnected || ST.P !== P || P.phase !== "obs") { clearInterval(ST.tm); ST.tm = null; return; }
      P.reste = Math.max(0, P.sc.temps - Math.round((Date.now() - P.t0) / 1000));
      const c = el.querySelector("#rc-chrono"); if (c) c.textContent = mmss(P.reste);
      if (P.reste <= 0) { clearInterval(ST.tm); ST.tm = null; versDecisions(); }
    }, 500);
  }
  function versDecisions() { const P = ST.P; if (!P || P.phase !== "obs") return; P.phase = (P.sc.decisions || []).length ? "dec" : "bilan"; if (P.phase === "bilan") terminer(); rend(); }
  function terminer() {
    const P = ST.P; if (P.fini) return; P.fini = true; P.phase = "bilan";
    const sc = P.sc, ess = (sc.zones || []).filter((z) => z.type === "essentielle"), nbDec = (sc.decisions || []).length;
    const trouv = ess.filter((z) => P.trouvees.has(z.id)).length, obs = ess.length ? (trouv / ess.length) * 10 : 10;
    const pts = P.choix.reduce((a, c) => a + (c ? c.pts : 0), 0);
    P.score = { pts, obs: Math.round(obs * 10) / 10, trouv, ess: ess.length };
    const essai = { le: Date.now(), duree: Math.round((Date.now() - P.t0) / 1000), ok: Math.round(pts + obs), tot: 10 * (nbDec + 1), reco: { trouvees: trouv, essentielles: ess.length, pct: Math.round(((pts + obs) / (10 * (nbDec + 1))) * 100) } };
    P.essai = essai;
    Promise.resolve(o.saveResult(sc, essai)).then((r) => { if (ST.P === P) { P.gain = r && r.gain; P.err = ""; rend(); } }).catch((e) => { if (ST.P === P) { P.err = "Résultat non enregistré : " + (e.message || e.code); rend(); } });
  }
  function vueJeu() {
    const P = ST.P, sc = P.sc, zs = sc.zones || [];
    const stage = (mode) => `<div class="stage" id="rc-st"><img src="${esc(sc.image)}" alt="">${mode === "bilan" ? zs.map((z) => `<div class="zn ${P.trouvees.has(z.id) ? "ok" : z.type === "essentielle" ? "ko" : "ot"}" style="${zoneCss(z)}"></div>`).join("") : ""}${mode === "obs" ? [...P.trouvees].map((id) => { const z = zs.find((x) => x.id === id); return z ? `<div class="pin" style="left:${z.x + z.w / 2}%;top:${z.y + z.h / 2}%"></div>` : ""; }).join("") + P.rates.map((m) => `<div class="miss" style="left:${m.x}%;top:${m.y}%">✕</div>`).join("") : ""}</div>`;
    const head = `<div class="row bt"><h2>${esc(sc.titre)}</h2><button class="b" data-a="quitter">Quitter</button></div>`;
    if (P.phase === "obs") {
      const tr = zs.filter((z) => P.trouvees.has(z.id));
      return `${head}<p class="m">${br(sc.contexte || "")}</p><div class="row bt"><b>Observation : touche les éléments importants de l'image</b>${sc.temps ? `<span class="tg r" id="rc-chrono">${mmss(P.reste)}</span>` : ""}</div>
      <div class="g2"><div>${stage("obs")}</div><div class="cd" style="margin:0"><h3>Ce que j'ai observé (${tr.length})</h3>${tr.map((z) => `<div class="ob"><b>${esc(z.titre)}</b><br>${br(z.texte)}</div>`).join("") || '<p class="m">Touche l\'image pour commencer.</p>'}<div style="margin-top:10px"><button class="b p" data-a="vers">Passer aux décisions →</button></div></div></div>`;
    }
    if (P.phase === "dec") {
      const d = sc.decisions[P.i], tr = zs.filter((z) => P.trouvees.has(z.id));
      return `${head}<div class="g2"><div><div class="cd" style="margin:0"><span class="m">Décision ${P.i + 1} / ${sc.decisions.length}</span><h3>${esc(d.texte)}</h3>${P.fb ? `<div class="fc"><b>${P.fb.pts}/10</b> — ${esc(P.fb.retour || "")}</div><button class="b p" data-a="suite">${P.i + 1 < sc.decisions.length ? "Décision suivante →" : "Voir le bilan →"}</button>` : d.choix.map((c, k) => `<button class="b ch" data-a="choix" data-c="${k}">${esc(c.t)}</button>`).join("")}</div></div>
      <div class="cd" style="margin:0"><h3>Mes observations (${tr.length})</h3>${tr.map((z) => `<div class="ob"><b>${esc(z.titre)}</b><br>${br(z.texte)}</div>`).join("") || '<p class="m">Aucune zone repérée.</p>'}</div></div>`;
    }
    const S2 = P.score, tot = Math.round((S2.pts + S2.obs) * 10) / 10, max = 10 * (sc.decisions.length + 1);
    return `${head}<div class="cd"><h3>Bilan : ${tot} / ${max}</h3><p>Observation : <b>${S2.trouv} / ${S2.ess}</b> zone(s) essentielle(s) repérée(s) (${S2.obs}/10). Décisions : <b>${S2.pts} / ${10 * sc.decisions.length}</b>.</p>${P.gain != null ? `<p class="m">⭐ +${P.gain} XP</p>` : ""}${P.err ? `<p class="err">${esc(P.err)}</p>` : ""}</div>
    <div class="g2"><div>${stage("bilan")}<p class="m">Vert : repérée · Rouge pointillé : essentielle manquée · Gris : autre.</p></div><div class="cd" style="margin:0"><h3>Les zones</h3>${zs.map((z) => `<div class="ob" style="border-color:${P.trouvees.has(z.id) ? "#1f8a4c" : z.type === "essentielle" ? "#c42a1c" : "#8a8f98"}"><b>${esc(z.titre)}</b> <span class="tg ${z.type === "essentielle" ? "r" : ""}">${TYPES[z.type]}</span> ${P.trouvees.has(z.id) ? '<span class="tg v">Repérée</span>' : ""}<br>${br(z.texte)}</div>`).join("")}</div></div>
    <div class="cd"><h3>Mes décisions</h3>${sc.decisions.map((d, n) => { const c = P.choix[n]; return `<div class="ob"><b>${n + 1}. ${esc(d.texte)}</b><br>${c ? esc(c.t) + ` <b>(${c.pts}/10)</b><br><span class="m">${esc(c.retour || "")}</span>` : "—"}</div>`; }).join("")}</div>
    <div class="row"><button class="b p" data-a="rejouer" data-i="${esc(sc.id)}">Rejouer</button><button class="b" data-a="quitter">Retour à la liste</button></div>`;
  }

  function rend() {
    if (!el.isConnected) return;
    el.className = "rc";
    el.innerHTML = ST.vue === "liste" ? vueListe() : ST.vue === "edit" ? vueEdit() : vueJeu();
    el.querySelectorAll("[data-t]").forEach((x) => { if (ST.txt[x.dataset.t] != null) x.value = ST.txt[x.dataset.t]; });
    if (ST.vue === "edit") brancherEditeur();
    if (ST.vue === "jeu" && ST.P.phase === "obs") brancherJeu();
  }
  function brancherEditeur() {
    const st = el.querySelector("#rc-ed"); if (!st) return;
    let d0 = null; const prev = el.querySelector("#rc-prev");
    st.onpointerdown = (e) => { if (e.target.closest("[data-z]")) return; d0 = pct(e, st); try { st.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } };
    st.onpointermove = (e) => { if (!d0) return; const p = pct(e, st); Object.assign(prev.style, { display: "block", left: Math.min(d0.x, p.x) + "%", top: Math.min(d0.y, p.y) + "%", width: Math.abs(p.x - d0.x) + "%", height: Math.abs(p.y - d0.y) + "%" }); };
    st.onpointerup = (e) => {
      if (!d0) return; const p = pct(e, st), a = d0; d0 = null; prev.style.display = "none";
      const w = Math.abs(p.x - a.x), h = Math.abs(p.y - a.y); if (w < 2 || h < 2) return;
      lire(); const z = { id: rid(), x: Math.round(Math.min(a.x, p.x) * 10) / 10, y: Math.round(Math.min(a.y, p.y) * 10) / 10, w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10, titre: "", texte: "", type: "utile" };
      ST.dr.zones.push(z); ST.sel = z.id; rend();
    };
    st.onclick = (e) => { const z = e.target.closest("[data-z]"); if (z) { lire(); ST.sel = z.dataset.z; rend(); } };
  }
  function brancherJeu() {
    const st = el.querySelector("#rc-st"); if (!st) return;
    st.onclick = (e) => {
      const P = ST.P, p = pct(e, st);
      const hits = (P.sc.zones || []).filter((z) => dedans(z, p)).sort((a, b) => a.w * a.h - b.w * b.h);
      if (hits.length) hits.forEach((z) => P.trouvees.add(z.id)); else P.rates.push({ x: p.x, y: p.y });
      rend();
    };
  }

  // ---------- actions
  el.onclick = async (e) => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const a = b.dataset.a, d = b.dataset; ST.err = ""; ST.msg = "";
    try {
      if (a === "new") { ST.id = null; ST.dr = nouveau(); ST.sel = null; ST.vue = "edit"; }
      else if (a === "ex") { const img = o.imageExemple ? await o.imageExemple() : ""; const sc = EXEMPLE(img); sc.auteur = o.uid; sc.auteurNom = o.nom || ""; sc.departement = o.dept || ""; sc.o = Date.now(); await o.save("", sc); ST.liste = null; charger(); ST.msg = "Exemple ajouté."; }
      else if (a === "edit") { const s = ST.liste.find((x) => x.id === d.i); ST.id = s.id; ST.dr = { ...nouveau(), ...clone(s) }; ST.sel = null; ST.vue = "edit"; }
      else if (a === "pub") { const s0 = ST.liste.find((x) => x.id === d.i), { id, ...r } = clone(s0); await o.save(d.i, { ...r, publie: !s0.publie }); ST.liste = null; charger(); ST.msg = s0.publie ? "Situation retirée de la publication (brouillon)." : "Situation publiée : visible par les stagiaires."; }
      else if (a === "dup") { const s = ST.liste.find((x) => x.id === d.i), { id, ...r } = clone(s); await o.save("", { ...r, titre: r.titre + " (copie)", publie: false, auteur: o.uid, auteurNom: o.nom || "", o: Date.now() }); ST.liste = null; charger(); }
      else if (a === "del") ST.conf = d.i;
      else if (a === "delno") ST.conf = null;
      else if (a === "delok") { await o.del(d.i); ST.conf = null; ST.liste = null; charger(); ST.msg = "Situation supprimée."; }
      else if (a === "cancel") { ST.vue = "liste"; ST.dr = null; }
      else if (a === "save") { lire(); if (!ST.dr.titre.trim()) throw new Error("Donne un titre à la situation."); if (!ST.dr.image) throw new Error("Ajoute une image."); const r = ST.dr; r.auteur = r.auteur || o.uid; r.auteurNom = r.auteurNom || o.nom || ""; r.departement = r.departement || o.dept || ""; r.o = r.o || Date.now(); await o.save(ST.id || "", r); ST.vue = "liste"; ST.dr = null; ST.liste = null; charger(); ST.msg = "Situation enregistrée."; }
      else if (a === "delimg") { lire(); ST.dr.image = ""; ST.dr.zones = []; ST.sel = null; }
      else if (a === "delzone") { lire(); ST.dr.zones = ST.dr.zones.filter((z) => z.id !== ST.sel); ST.sel = null; }
      else if (a === "adddec") { lire(); ST.dr.decisions.push({ id: rid(), texte: "", choix: [{ t: "", pts: 10, retour: "" }, { t: "", pts: 0, retour: "" }] }); }
      else if (a === "decdel") { lire(); ST.dr.decisions.splice(+d.n, 1); }
      else if (a === "decup" || a === "decdn") { lire(); const n = +d.n, m = a === "decup" ? n - 1 : n + 1, l = ST.dr.decisions; if (m >= 0 && m < l.length) [l[n], l[m]] = [l[m], l[n]]; }
      else if (a === "chadd") { lire(); ST.dr.decisions[+d.n].choix.push({ t: "", pts: 0, retour: "" }); }
      else if (a === "chdel") { lire(); ST.dr.decisions[+d.n].choix.splice(+d.c, 1); }
      else if (a === "lib") { lire(); ST.libOuv = !ST.libOuv; if (ST.libOuv && !ST.lib && o.illus) o.illus().then((l) => { ST.lib = l; rend(); }).catch((x) => { ST.libOuv = false; ST.err = "Bibliothèque inaccessible : " + (x.message || x.code); rend(); }); }
      else if (a === "libuse") { lire(); const x = (ST.lib || []).find((y) => y.id === d.i); if (x) { ST.dr.image = x.image || x.data || x.url || ""; ST.libOuv = false; } }
      else if (a === "play" || a === "rejouer") { const s = ST.liste.find((x) => x.id === d.i); if (s && s.image) { demarrer(s); return; } }
      else if (a === "quitter") { if (ST.tm) clearInterval(ST.tm); ST.tm = null; ST.P = null; ST.vue = "liste"; }
      else if (a === "vers") { versDecisions(); return; }
      else if (a === "choix") { const P = ST.P, dd = P.sc.decisions[P.i], c = dd.choix[+d.c]; P.choix[P.i] = { t: c.t, pts: Number(c.pts) || 0, retour: c.retour || "" }; P.fb = P.choix[P.i]; }
      else if (a === "suite") { const P = ST.P; P.fb = null; if (P.i + 1 < P.sc.decisions.length) P.i++; else terminer(); }
    } catch (x) { ST.err = x.message || String(x); }
    rend();
  };
  el.onchange = async (e) => {
    const t = e.target;
    if (t.dataset.img && t.files && t.files[0]) { lire(); try { ST.dr.image = await reduire(t.files[0]); } catch (x) { ST.err = x.message; } rend(); }
    else if (t.dataset.k && /\.type$/.test(t.dataset.k)) { lire(); rend(); }
  };
  el.oninput = (e) => { const t = e.target; if (t.dataset && t.dataset.lq) { ST.lq = t.value; const g = el.querySelector(".lib"); if (g) { lire(); rend(); const n = el.querySelector("[data-lq]"); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } } } };

  if (o.initial) { charger().then(() => { const s = (ST.liste || []).find((x) => x.id === o.initial); if (s && s.image) demarrer(s); }); }
  else if (ST.liste && ST.vue === "liste") { rend(); charger(); } else if (ST.vue === "jeu" && ST.P) { rend(); lancerChrono(); } else if (ST.vue === "edit") rend(); else charger();
}
