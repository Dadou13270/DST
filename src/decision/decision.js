// Scénarios « Décision » (niveau chef d'équipe) : arbre de décisions avec conséquences et injects.
// Module autonome : decisionMount(element, opts). Utilisé tel quel par l'application React et la page hébergée.
// opts : { list(), save(id, doc), del(id), saveResult(sc, essai) -> Promise<{gain}>, canEdit, isAdmin, uid, nom, dept, initial }

const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nl = (t) => esc(t).replace(/\n/g, "<br>");

export const NIVEAU = "Chef d'équipe";

// ---- Logique de l'arbre ------------------------------------------------------------------
export const etape = (sc, id) => (sc.etapes || []).find((e) => e.id === id) || null;
const pts = (c) => Math.max(0, Math.min(10, Number(c.pts) || 0));
// Meilleur parcours (somme maximale des points) ; garde-fou contre les boucles.
export function meilleur(sc) {
  const memo = {};
  const rec = (id, vus) => {
    const e = etape(sc, id);
    if (!e || vus.includes(id)) return { pts: 0, chemin: [] };
    if (memo[id] && !vus.length) return memo[id];
    let best = { pts: 0, chemin: [] };
    (e.choix || []).forEach((c, i) => {
      const suite = !c.fin && c.suite ? rec(c.suite, [...vus, id]) : { pts: 0, chemin: [] };
      const tot = pts(c) + suite.pts;
      if (tot > best.pts || !best.chemin.length) best = { pts: tot, chemin: [{ e: id, i }, ...suite.chemin] };
    });
    if (!vus.length) memo[id] = best;
    return best;
  };
  return rec(sc.depart || (sc.etapes && sc.etapes[0] && sc.etapes[0].id), []);
}
export function verifier(sc) {
  const err = [];
  if (!(sc.titre || "").trim()) err.push("Titre manquant.");
  if (!(sc.etapes || []).length) err.push("Ajoute au moins une étape.");
  const ids = new Set((sc.etapes || []).map((e) => e.id));
  if (!ids.has(sc.depart)) err.push("L'étape de départ n'existe pas.");
  (sc.etapes || []).forEach((e) => {
    if (!(e.titre || "").trim() && !(e.texte || "").trim()) err.push("Une étape est vide.");
    if (!(e.choix || []).length) err.push("L'étape « " + (e.titre || e.id) + " » n'a aucun choix (elle sera une fin).");
    (e.choix || []).forEach((c) => {
      if (!(c.t || "").trim()) err.push("Un choix de « " + (e.titre || e.id) + " » est vide.");
      if (!c.fin && c.suite && !ids.has(c.suite)) err.push("Un choix de « " + (e.titre || e.id) + " » mène à une étape supprimée.");
    });
  });
  return err.filter((x) => !x.includes("sera une fin"));
}
export const nouveau = (uid, nom, dept) => ({
  titre: "", niveau: NIVEAU, rubrique: "Incendie", contexte: "", equipe: "", materiel: "", meteo: "", heure: "", publie: false,
  depart: "e1", etapes: [{ id: "e1", titre: "Arrivée sur les lieux", texte: "", injects: [], choix: [{ t: "", suite: "", pts: 5, fin: false, retour: "" }] }],
  auteur: uid || "", auteurNom: nom || "", departement: dept || "",
});
export const EXEMPLE = {
  titre: "Feu d'appartement au 3e étage", niveau: NIVEAU, rubrique: "Incendie",
  contexte: "Vous arrivez en FPT pour un feu d'appartement supposé au 3e étage d'un immeuble d'habitation. De la fumée noire s'échappe d'une fenêtre. Vous êtes chef d'équipe.",
  equipe: "Vous + 1 équipier (binôme ARI), chef d'agrès sur le FPT, conducteur", materiel: "FPT, 1 lance 45 sur dévidoir, 2 ARI, caméra thermique, échelle à coulisses", meteo: "Sec, vent faible", heure: "02 h 40", publie: true, depart: "e1",
  etapes: [
    { id: "e1", titre: "Arrivée sur les lieux", texte: "Fumée noire importante à la fenêtre du 3e. Personne n'est encore venu vous voir. Que décidez-vous de faire en premier ?", injects: [{ delai: 40, texte: "Un voisin vous fait de grands signes depuis le hall." }], choix: [
      { t: "Établir tout de suite une lance en reconnaissance offensive avec votre équipier", suite: "e2", pts: 3, retour: "Vous progressez vite, mais sans information sur les occupants ni sur le cheminement." },
      { t: "Faire le tour de l'arrière du bâtiment et demander un renfort avant d'engager", suite: "e4", pts: 6, retour: "Le renfort est utile, mais vous n'avez toujours pas cherché à savoir s'il y a des personnes à l'intérieur." },
      { t: "Interroger le voisin pour savoir s'il y a des personnes à l'intérieur", suite: "e3", pts: 9, retour: "Bon réflexe : l'information sur les occupants conditionne la mission (sauvetage, reconnaissance)." }] },
    { id: "e2", titre: "Porte palière chaude", texte: "Au 3e, la porte du logement est chaude, de la fumée s'échappe par le haut de l'huisserie.", injects: [], choix: [
      { t: "Ouvrir franchement la porte pour voir", suite: "", fin: true, pts: 0, retour: "Risque de coup de feu / explosion de fumées. L'ouverture doit être maîtrisée." },
      { t: "Vous placer sur le côté, lance prête, ouvrir progressivement et refroidir les gaz", suite: "e5", pts: 10, retour: "Ouverture maîtrisée : vous limitez le risque thermique avant d'entrer." },
      { t: "Attendre devant la porte sans agir", suite: "e5", pts: 2, retour: "Vous perdez du temps alors que le feu se développe." }] },
    { id: "e3", titre: "Le témoin parle", texte: "Le voisin vous apprend qu'une personne âgée est dans la chambre du logement sinistré.", injects: [{ delai: 20, texte: "Le voisin, paniqué, essaie de monter dans les étages." }], choix: [
      { t: "Engager la reconnaissance avec lance et ARI, transmettre un message d'ambiance et demander le renfort pour le sauvetage", suite: "e5", pts: 10, retour: "La mission s'adapte : sauvetage prioritaire, hiérarchie informée." },
      { t: "Envoyer votre équipier seul chercher la victime", suite: "", fin: true, pts: 0, retour: "Jamais seul en milieu hostile : vous exposez votre équipier." }] },
    { id: "e4", titre: "Tour arrière et renfort", texte: "À l'arrière, des flammes sortent désormais de la fenêtre. Le renfort est en route.", injects: [], choix: [
      { t: "Revenir et engager avec la lance", suite: "e5", pts: 7, retour: "Vous engagez avec le renfort annoncé." },
      { t: "Rester dehors et attendre le renfort", suite: "", fin: true, pts: 1, retour: "L'attente aggrave la situation et laisse une éventuelle victime exposée." }] },
    { id: "e5", titre: "Progression dans le logement", texte: "Vous progressez dans le couloir, visibilité nulle, chaleur importante.", injects: [{ delai: 15, texte: "L'alarme de fin de charge de l'ARI de votre équipier se déclenche." }], choix: [
      { t: "Faire sortir votre équipier avec vous, en binôme, et informer le chef d'agrès", suite: "", fin: true, pts: 10, retour: "Réaction correcte : le binôme reste uni et la hiérarchie est informée." },
      { t: "Continuer seul la reconnaissance", suite: "", fin: true, pts: 0, retour: "Vous quittez le binôme et vous exposez gravement." },
      { t: "Renvoyer votre équipier seul à l'extérieur", suite: "", fin: true, pts: 2, retour: "Vous le laissez seul en difficulté sans vous coordonner." }] },
  ],
};

// Image du scénario : redimensionnée (900 px max) et compressée en JPEG pour tenir dans le document.
function imageChoisie(f) {
  if (!f || !ST || !ST.ed) return;
  if (!/^image\//.test(f.type)) { ST.msg = "Le fichier doit être une image."; dessiner(); return; }
  const r = new FileReader();
  r.onload = () => {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 900 / Math.max(im.width, im.height)), c = document.createElement("canvas");
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      if (ST && ST.ed) { ST.ed.image = c.toDataURL("image/jpeg", 0.78); ST.msg = ""; dessiner(); }
    };
    im.onerror = () => { if (ST) { ST.msg = "Image illisible."; dessiner(); } };
    im.src = r.result;
  };
  r.readAsDataURL(f);
}

const libGrille = () => {
  const q = String(ST.lq || "").toLowerCase().trim(), l = (ST.lib || []).filter((x) => !q || (String(x.titre || "") + " " + String(x.tags || "")).toLowerCase().includes(q));
  return l.length ? l.map((x) => `<button type="button" data-d="libuse" data-id="${esc(x.id)}" title="${esc(x.titre)}"><img src="${esc(x.vignette || x.photo)}" alt="" loading="lazy"><span>${esc(x.titre || "")}</span></button>`).join("") : `<span class="m">Aucune image.</span>`;
};

// ---- Styles ------------------------------------------------------------------------------
const CSS = `.dc{max-width:980px;margin:0 auto;font:inherit}.dc *{box-sizing:border-box}
.dc .bx{background:var(--card,#fff);border:1px solid var(--line,#d8dde1);border-radius:12px;padding:16px;margin:12px 0;color:var(--ink,#1b2127)}
.dc h2,.dc h3{margin:0 0 8px}.dc .m{opacity:.75;font-size:.9em}
.dc button.b{padding:9px 14px;border-radius:10px;border:1px solid var(--line,#d8dde1);background:var(--card,#fff);color:var(--ink,#1b2127);font:inherit;font-weight:600;cursor:pointer}
.dc button.b.p{background:var(--red,#c42a1c);border-color:var(--red,#c42a1c);color:#fff}.dc button.b.s{padding:5px 9px;font-size:.85em}.dc button.b.x{color:#b3261e}
.dc .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.dc .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.dc input,.dc textarea,.dc select{width:100%;padding:8px 10px;border-radius:8px;border:1px solid var(--line,#d8dde1);background:var(--card,#fff);color:var(--ink,#1b2127);font:inherit}
.dc textarea{min-height:70px;resize:vertical}.dc label{display:block;font-size:.85em;font-weight:600;margin:8px 0 3px}
.dc .tag{display:inline-block;padding:2px 9px;border-radius:99px;font-size:.78em;font-weight:700;background:rgba(127,127,127,.18)}
.dc .opt{display:block;width:100%;text-align:left;margin:8px 0;padding:12px 14px;border-radius:10px;border:2px solid var(--line,#d8dde1);background:var(--card,#fff);color:var(--ink,#1b2127);font:inherit;cursor:pointer}
.dc .opt:hover{border-color:var(--red,#c42a1c)}.dc .inj{margin:10px 0;padding:10px 12px;border-radius:10px;background:rgba(229,169,18,.18);border-left:5px solid #e5a912;font-weight:600}
.dc .ctx{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;font-size:.9em}.dc .ctx div{padding:8px 10px;border-radius:8px;background:rgba(127,127,127,.12)}
.dc .fb{margin:12px 0;padding:12px 14px;border-radius:10px;border-left:5px solid #2e9d5b;background:rgba(46,157,91,.12)}.dc .fb.lo{border-color:#d93a2b;background:rgba(217,58,43,.12)}.dc .fb.mid{border-color:#e5a912;background:rgba(229,169,18,.14)}
.dc .et{border:1px solid var(--line,#d8dde1);border-radius:10px;padding:12px;margin:10px 0}.dc .ch{border:1px dashed var(--line,#d8dde1);border-radius:8px;padding:10px;margin:8px 0}
.dc .bar{height:12px;border-radius:99px;background:rgba(127,127,127,.25);overflow:hidden}.dc .bar i{display:block;height:100%;background:linear-gradient(90deg,#e5a912,#2e9d5b)}
.dc .img{width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:8px;display:block}.dc .ph{width:100%;height:150px;border-radius:10px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:2.4rem;background:rgba(127,127,127,.15)}.dc .ill{max-width:100%;max-height:260px;border-radius:10px;display:block;margin:10px 0}.dc .lib{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;max-height:320px;overflow:auto;margin-top:8px}.dc .lib button{padding:0;border:2px solid var(--line,#d8dde1);border-radius:8px;background:none;cursor:pointer;overflow:hidden;color:inherit;font:inherit;font-size:.75em}.dc .lib button:hover{border-color:var(--red,#c42a1c)}.dc .lib img{width:100%;height:80px;object-fit:cover;display:block}.dc .acts{gap:6px}.dc .acts button.b{flex:1 1 auto;padding:8px 10px;font-size:.88em;white-space:nowrap}.dc ol{padding-left:20px}.dc .err{color:#b3261e;font-weight:600}`;

// ---- Module ------------------------------------------------------------------------------
let ST = null;
const clone = (o) => JSON.parse(JSON.stringify(o));
const uidE = (sc) => { let n = 1; const ids = new Set((sc.etapes || []).map((e) => e.id)); while (ids.has("e" + n)) n++; return "e" + n; };
const setPath = (o, path, v) => { const p = path.split("."); let c = o; for (let i = 0; i < p.length - 1; i++) c = c[p[i]]; c[p[p.length - 1]] = v; };

export function decisionDetach() { if (ST && ST.timer) clearInterval(ST.timer); ST = null; }

export default function decisionMount(el, o) {
  decisionDetach();
  ST = { el, o, vue: "liste", liste: null, ed: null, P: null, msg: "", timer: null };
  if (!el.__dc) {
    el.__dc = true;
    el.addEventListener("click", (e) => { const b = e.target.closest("[data-d]"); if (b && ST && ST.el === el) agir(b.dataset.d, b, e); });
    el.addEventListener("input", (e) => { const t = e.target; if (t.dataset && t.dataset.lq !== undefined) { ST.lq = t.value; const z = el.querySelector("#dc-lib"); if (z) z.innerHTML = libGrille(); return; } if (ST && ST.ed && t.dataset && t.dataset.p) { setPath(ST.ed, t.dataset.p, t.type === "checkbox" ? t.checked : t.dataset.n ? Number(t.value) : t.value); } });
    el.addEventListener("change", (e) => { const t = e.target; if (t.dataset && t.dataset.img) { imageChoisie(t.files && t.files[0]); return; } if (ST && ST.ed && t.dataset && t.dataset.p) { setPath(ST.ed, t.dataset.p, t.type === "checkbox" ? t.checked : t.dataset.n ? Number(t.value) : t.value); if (t.dataset.r) dessiner(); } });
  }
  charger().then(() => { if (o.initial && ST) { const sc = ST.liste.find((x) => x.id === o.initial); if (sc) jouer(sc); } });
  dessiner();
}
const charger = () => ST.o.list().then((l) => { if (ST) ST.liste = l; dessiner(); }).catch((e) => { if (ST) { ST.liste = []; ST.msg = "Lecture impossible : " + (e.message || e.code); dessiner(); } });

function dessiner() {
  if (!ST) return;
  const { el } = ST;
  let h = `<style>${CSS}</style><div class="dc">`;
  if (ST.vue === "liste") h += vueListe();
  else if (ST.vue === "edit") h += vueEdit();
  else if (ST.vue === "jeu") h += vueJeu();
  else if (ST.vue === "bilan") h += vueBilan();
  el.innerHTML = h + "</div>";
}

function vueListe() {
  const { o } = ST, l = ST.liste;
  let h = `<div class="bx"><div class="row" style="justify-content:space-between"><div><h2>🧭 Scénarios à décisions</h2><div class="m">Niveau « ${NIVEAU} » : à chaque étape, tu choisis une action ; ses conséquences déterminent la suite. Des événements imprévus (injects) surviennent en cours de route.</div></div>${o.canEdit ? `<button class="b p" data-d="new">+ Nouveau scénario</button>` : ""}</div>${ST.msg ? `<p class="err">${esc(ST.msg)}</p>` : ""}</div>`;
  if (!l) return h + `<p>Chargement…</p>`;
  const vis = l.filter((x) => o.canEdit ? (o.isAdmin || x.auteur === o.uid || x.publie) : x.publie);
  if (!vis.length) h += `<div class="bx">Aucun scénario à décisions pour le moment.${o.canEdit ? ` <button class="b" data-d="exemple">Ajouter l'exemple « Feu d'appartement »</button>` : ""}</div>`;
  h += `<div class="grid">` + vis.map((x) => {
    const mien = o.canEdit && (o.isAdmin || x.auteur === o.uid), fait = o.faits && o.faits[x.id];
    return `<div class="bx" style="margin:0">${x.image ? `<img class="img" src="${esc(x.image)}" alt="" loading="lazy">` : `<div class="ph" aria-hidden="true">🧭</div>`}<div class="row"><span class="tag">${esc(x.niveau || NIVEAU)}</span><span class="tag">${esc(x.rubrique || "")}</span>${x.publie ? "" : `<span class="tag" style="background:#e5a91233">Brouillon</span>`}</div><h3 style="margin-top:8px">${esc(x.titre)}</h3><div class="m">${(x.etapes || []).length} étapes${x.auteurNom ? " · " + esc(x.auteurNom) : ""}${fait ? ` · meilleur : ${fait}` : ""}</div><div class="row acts" style="margin-top:10px"><button class="b p" data-d="play" data-id="${esc(x.id)}">▶ Jouer</button>${mien ? `<button class="b" data-d="edit" data-id="${esc(x.id)}">Modifier</button><button class="b" data-d="dup" data-id="${esc(x.id)}">Dupliquer</button><button class="b x" data-d="del" data-id="${esc(x.id)}">Supprimer</button>` : ""}</div></div>`;
  }).join("") + `</div>`;
  return h;
}

// ---- Éditeur -----------------------------------------------------------------------------
function vueEdit() {
  const sc = ST.ed;
  const opts = (sel, avecFin) => (avecFin ? `<option value="">— Fin de l'exercice —</option>` : "") + sc.etapes.map((e) => `<option value="${esc(e.id)}"${e.id === sel ? " selected" : ""}>${esc(e.id)} · ${esc(e.titre || "(sans titre)")}</option>`).join("");
  let h = `<div class="bx"><div class="row" style="justify-content:space-between"><h2>${sc.id ? "Modifier" : "Nouveau"} scénario à décisions</h2><span class="row"><button class="b" data-d="cancel">Annuler</button><button class="b p" data-d="save">Enregistrer</button></span></div>${ST.msg ? `<p class="err">${nl(ST.msg)}</p>` : ""}
  <label>Titre</label><input data-p="titre" value="${esc(sc.titre)}">
  <div class="grid"><div><label>Rubrique</label><input data-p="rubrique" value="${esc(sc.rubrique)}"></div><div><label>Heure</label><input data-p="heure" value="${esc(sc.heure)}" placeholder="ex. 02 h 40"></div><div><label>Météo</label><input data-p="meteo" value="${esc(sc.meteo)}"></div></div>
  <label>Image du scénario (affichée dans la liste)</label>${sc.image ? `<img class="ill" src="${esc(sc.image)}" alt="">` : ""}<div class="row"><input type="file" accept="image/*" data-img="1" style="width:auto;max-width:100%">${ST.o.illus ? `<button class="b s" data-d="lib">${ST.libOuv ? "Fermer la bibliothèque" : "📚 Bibliothèque d'images"}</button>` : ""}${sc.image ? `<button class="b s x" data-d="delimg">Retirer l'image</button>` : ""}</div>${ST.libOuv ? `<div class="bx"><input data-lq="1" placeholder="Rechercher une image…" value="${esc(ST.lq || "")}">${ST.lib ? `<div class="lib" id="dc-lib">${libGrille()}</div>` : `<p class="m">Chargement…</p>`}</div>` : ""}
  <label>Alerte initiale (point de départ)</label><textarea data-p="contexte">${esc(sc.contexte)}</textarea>
  <label>Composition de l'équipe</label><input data-p="equipe" value="${esc(sc.equipe)}"><label>Matériel disponible</label><input data-p="materiel" value="${esc(sc.materiel)}">
  <label>Étape de départ</label><select data-p="depart">${opts(sc.depart, false)}</select>
  <label><input type="checkbox" data-p="publie" ${sc.publie ? "checked" : ""} style="width:auto"> Publié (visible des stagiaires)</label></div>`;
  sc.etapes.forEach((e, i) => {
    h += `<div class="et"><div class="row" style="justify-content:space-between"><b>Étape ${esc(e.id)}</b><button class="b s x" data-d="delet" data-i="${i}">Supprimer l'étape</button></div>
    <label>Titre</label><input data-p="etapes.${i}.titre" value="${esc(e.titre)}"><label>Situation / question posée au chef d'équipe</label><textarea data-p="etapes.${i}.texte">${esc(e.texte)}</textarea>
    <label>Injects (événements imprévus, après un délai en secondes)</label>`;
    (e.injects || []).forEach((n, k) => { h += `<div class="row" style="margin:4px 0"><input style="width:90px" type="number" min="0" data-n="1" data-p="etapes.${i}.injects.${k}.delai" value="${esc(n.delai)}" aria-label="Délai en secondes"><input style="flex:1" data-p="etapes.${i}.injects.${k}.texte" value="${esc(n.texte)}" placeholder="ex. Baisse de pression de l'ARI"><button class="b s x" data-d="delinj" data-i="${i}" data-k="${k}">✕</button></div>`; });
    h += `<button class="b s" data-d="addinj" data-i="${i}">+ Inject</button><label style="margin-top:12px">Choix proposés</label>`;
    (e.choix || []).forEach((c, k) => {
      h += `<div class="ch"><label>Choix ${k + 1}</label><input data-p="etapes.${i}.choix.${k}.t" value="${esc(c.t)}" placeholder="Action du chef d'équipe">
      <div class="grid"><div><label>Mène à</label><select data-r="1" data-p="etapes.${i}.choix.${k}.suite">${opts(c.fin ? "" : c.suite, true)}</select></div><div><label>Qualité (0 = dangereux, 10 = idéal)</label><input type="number" min="0" max="10" data-n="1" data-p="etapes.${i}.choix.${k}.pts" value="${esc(c.pts)}"></div></div>
      <label>Conséquence / retour pédagogique</label><textarea data-p="etapes.${i}.choix.${k}.retour">${esc(c.retour)}</textarea><button class="b s x" data-d="delch" data-i="${i}" data-k="${k}">Supprimer ce choix</button></div>`;
    });
    h += `<button class="b s" data-d="addch" data-i="${i}">+ Choix</button></div>`;
  });
  return h + `<div class="row"><button class="b" data-d="addet">+ Ajouter une étape</button><button class="b p" data-d="save">Enregistrer</button></div>`;
}

// ---- Jeu ---------------------------------------------------------------------------------
function jouer(sc) {
  ST.P = { sc, id: sc.depart || (sc.etapes[0] && sc.etapes[0].id), t0: Date.now(), tEtape: Date.now(), histo: [], choisi: null, saved: false };
  ST.vue = "jeu";
  clearInterval(ST.timer);
  ST.timer = setInterval(tick, 1000);
  dessiner();
}
const injVisibles = () => {
  const P = ST.P, e = etape(P.sc, P.id);
  if (!e || P.choisi) return [];
  const s = (Date.now() - P.tEtape) / 1000;
  return (e.injects || []).filter((n) => (Number(n.delai) || 0) <= s);
};
const injHtml = () => injVisibles().map((n) => `<div class="inj" role="alert">⚠ ${nl(n.texte)}</div>`).join("");
function tick() {
  if (!ST || ST.vue !== "jeu") return;
  const z = ST.el.querySelector("#dc-inj");
  if (z) { const h = injHtml(); if (z.innerHTML !== h) { z.innerHTML = h; try { navigator.vibrate && navigator.vibrate(120); } catch (e) { /* ignore */ } } }
}
function vueJeu() {
  const P = ST.P, sc = P.sc, e = etape(sc, P.id);
  let h = `<div class="bx"><div class="row" style="justify-content:space-between"><h2>${esc(sc.titre)}</h2><button class="b s" data-d="quit">Quitter</button></div>`;
  if (!P.histo.length) {
    h += `${sc.image ? `<img class="ill" src="${esc(sc.image)}" alt="">` : ""}<p>${nl(sc.contexte)}</p><div class="ctx">${[["Équipe", sc.equipe], ["Matériel", sc.materiel], ["Météo", sc.meteo], ["Heure", sc.heure]].filter((x) => x[1]).map((x) => `<div><b>${x[0]}</b><br>${esc(x[1])}</div>`).join("")}</div>`;
  }
  h += `</div>`;
  if (!e) return h + `<div class="bx">Étape introuvable. <button class="b" data-d="quit">Retour</button></div>`;
  h += `<div class="bx"><div class="m">Étape ${P.histo.length + 1}</div><h3>${esc(e.titre)}</h3><p>${nl(e.texte)}</p><div id="dc-inj">${injHtml()}</div>`;
  if (!P.choisi) h += (e.choix || []).map((c, i) => `<button class="opt" data-d="choix" data-i="${i}">${esc(c.t)}</button>`).join("");
  else {
    const c = P.choisi, q = pts(c), cl = q >= 8 ? "" : q >= 4 ? "mid" : "lo", fin = c.fin || !c.suite || !etape(sc, c.suite);
    h += `<div class="opt" style="cursor:default">${esc(c.t)}</div><div class="fb ${cl}"><b>Conséquence</b> (${q}/10)<br>${nl(c.retour || "—")}</div><button class="b p" data-d="suite">${fin ? "Voir le bilan" : "Continuer"}</button>`;
  }
  return h + `</div>`;
}
function choisir(i) {
  const P = ST.P, e = etape(P.sc, P.id), c = e && e.choix[i];
  if (!c || P.choisi) return;
  P.choisi = c;
  P.histo.push({ e: P.id, i, titre: e.titre, t: c.t, pts: pts(c), retour: c.retour || "", inj: injVisibles().length });
  dessiner();
}
function suite() {
  const P = ST.P, c = P.choisi;
  if (!c) return;
  if (c.fin || !c.suite || !etape(P.sc, c.suite)) { terminerJeu(); return; }
  P.id = c.suite; P.tEtape = Date.now(); P.choisi = null; dessiner();
}
function terminerJeu() {
  const P = ST.P, b = meilleur(P.sc);
  P.ok = P.histo.reduce((n, x) => n + x.pts, 0);
  P.tot = Math.max(b.pts, P.ok, 1);
  P.duree = Math.round((Date.now() - P.t0) / 1000);
  P.ideal = b.chemin;
  clearInterval(ST.timer);
  ST.vue = "bilan";
  dessiner();
  if (!P.saved && ST.o.saveResult) {
    P.saved = true;
    const essai = { le: Date.now(), duree: P.duree, ok: P.ok, tot: P.tot, dec: { pct: Math.round((100 * P.ok) / P.tot), chemin: P.histo.map((x) => ({ e: x.e, i: x.i, p: x.pts })) } };
    Promise.resolve(ST.o.saveResult(P.sc, essai)).then((r) => { if (ST && ST.P === P) { P.gain = r && r.gain; P.err = ""; dessiner(); } }).catch((e) => { if (ST && ST.P === P) { P.err = "Résultat non enregistré : " + (e.message || e.code); dessiner(); } });
  }
}
function vueBilan() {
  const P = ST.P, sc = P.sc, pct = Math.round((100 * P.ok) / P.tot);
  const mention = pct >= 85 ? "Excellent : décisions quasi optimales." : pct >= 60 ? "Correct : quelques choix à améliorer." : "À retravailler : relis les conséquences ci-dessous.";
  let h = `<div class="bx"><h2>Bilan : ${esc(sc.titre)}</h2><div class="row"><b style="font-size:1.6em">${pct} %</b><span class="m">${P.ok} / ${P.tot} points · ${Math.floor(P.duree / 60)} min ${P.duree % 60} s${P.gain ? ` · ⭐ +${P.gain} XP` : ""}</span></div><div class="bar" style="margin:8px 0"><i style="width:${pct}%"></i></div><p>${mention}</p>${P.err ? `<p class="err">${esc(P.err)}</p>` : ""}</div>`;
  h += `<div class="bx"><h3>Ton parcours</h3><ol>${P.histo.map((x) => `<li><b>${esc(x.titre)}</b> : ${esc(x.t)} <span class="tag">${x.pts}/10</span>${x.inj ? ` <span class="tag">${x.inj} inject(s) vu(s)</span>` : ""}<br><span class="m">${nl(x.retour)}</span></li>`).join("")}</ol></div>`;
  h += `<div class="bx"><h3>Parcours idéal</h3><ol>${P.ideal.map((s) => { const e = etape(sc, s.e), c = e && e.choix[s.i]; return c ? `<li><b>${esc(e.titre)}</b> : ${esc(c.t)}<br><span class="m">${nl(c.retour)}</span></li>` : ""; }).join("")}</ol></div>`;
  return h + `<div class="row"><button class="b p" data-d="again">Rejouer</button><button class="b" data-d="quit">Retour à la liste</button></div>`;
}

// ---- Actions -----------------------------------------------------------------------------
function agir(a, b) {
  const o = ST.o, d = b.dataset;
  if (a === "play") { const sc = ST.liste.find((x) => x.id === d.id); if (sc && (sc.etapes || []).length) jouer(sc); }
  else if (a === "choix") choisir(Number(d.i));
  else if (a === "suite") suite();
  else if (a === "again") jouer(ST.P.sc);
  else if (a === "quit") { clearInterval(ST.timer); ST.vue = "liste"; ST.P = null; ST.msg = ""; dessiner(); }
  else if (a === "new") { ST.ed = nouveau(o.uid, o.nom, o.dept); ST.vue = "edit"; ST.msg = ""; dessiner(); }
  else if (a === "exemple") { ST.msg = ""; o.save("", { ...clone(EXEMPLE), auteur: o.uid, auteurNom: o.nom || "", departement: o.dept || "", o: Date.now() }).then(charger).catch((e) => { ST.msg = "Erreur : " + (e.message || e.code); dessiner(); }); }
  else if (a === "edit") { const sc = ST.liste.find((x) => x.id === d.id); if (sc) { ST.ed = clone(sc); ST.vue = "edit"; ST.msg = ""; dessiner(); } }
  else if (a === "dup") { const sc = ST.liste.find((x) => x.id === d.id); if (sc) { const { id, ...r } = clone(sc); o.save("", { ...r, titre: r.titre + " (copie)", publie: false, auteur: o.uid, auteurNom: o.nom || "", o: Date.now() }).then(charger).catch((e) => { ST.msg = "Erreur : " + (e.message || e.code); dessiner(); }); } }
  else if (a === "del") { const sc = ST.liste.find((x) => x.id === d.id); if (sc && window.confirm("Supprimer « " + sc.titre + " » ?")) o.del(d.id).then(charger).catch((e) => { ST.msg = "Erreur : " + (e.message || e.code); dessiner(); }); }
  else if (a === "cancel") { ST.vue = "liste"; ST.ed = null; ST.msg = ""; dessiner(); }
  else if (a === "addet") { const id = uidE(ST.ed); ST.ed.etapes.push({ id, titre: "", texte: "", injects: [], choix: [{ t: "", suite: "", pts: 5, fin: false, retour: "" }] }); dessiner(); }
  else if (a === "delet") { const e = ST.ed.etapes[Number(d.i)]; ST.ed.etapes.splice(Number(d.i), 1); ST.ed.etapes.forEach((x) => (x.choix || []).forEach((c) => { if (c.suite === e.id) { c.suite = ""; c.fin = true; } })); if (ST.ed.depart === e.id) ST.ed.depart = (ST.ed.etapes[0] || {}).id || ""; dessiner(); }
  else if (a === "addch") { ST.ed.etapes[Number(d.i)].choix.push({ t: "", suite: "", pts: 5, fin: false, retour: "" }); dessiner(); }
  else if (a === "delch") { ST.ed.etapes[Number(d.i)].choix.splice(Number(d.k), 1); dessiner(); }
  else if (a === "addinj") { const e = ST.ed.etapes[Number(d.i)]; (e.injects = e.injects || []).push({ delai: 20, texte: "" }); dessiner(); }
  else if (a === "delinj") { ST.ed.etapes[Number(d.i)].injects.splice(Number(d.k), 1); dessiner(); }
  else if (a === "lib") {
    ST.libOuv = !ST.libOuv; dessiner();
    if (ST.libOuv && !ST.lib) o.illus().then((l) => { if (ST) { ST.lib = l; dessiner(); } }).catch((e) => { if (ST) { ST.libOuv = false; ST.msg = "Bibliothèque inaccessible : " + (e.message || e.code); dessiner(); } });
  }
  else if (a === "libuse") { const x = (ST.lib || []).find((y) => y.id === d.id); if (x && ST.ed) { const p = x.photo && x.photo.length < 600000 ? x.photo : x.vignette || x.photo; ST.ed.image = p; ST.libOuv = false; ST.msg = ""; dessiner(); } }
  else if (a === "delimg") { ST.ed.image = ""; dessiner(); }
  else if (a === "save") enregistrer();
}
function enregistrer() {
  const sc = ST.ed;
  sc.etapes.forEach((e) => (e.choix || []).forEach((c) => { c.fin = !c.suite; c.pts = pts(c); }));
  const err = verifier(sc);
  if (err.length) { ST.msg = err.join("\n"); dessiner(); return; }
  const { id, ...r } = sc;
  ST.o.save(id || "", { ...r, niveau: NIVEAU, o: r.o || Date.now() }).then(() => { ST.vue = "liste"; ST.ed = null; ST.msg = ""; return charger(); }).catch((e) => { ST.msg = "Enregistrement impossible : " + (e.message || e.code); dessiner(); });
}
