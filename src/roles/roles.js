// Jeu de rôle en salle : module vanilla partagé (monté dans React et dans la page hébergée).
// Postes : équipier (2), chef d'équipe (2), conducteur, chef d'agrès, chef de groupe. Aucun poste n'est obligatoire.
export const POSTES = [
  { id: "eq1", type: "equipier", nom: "Équipier 1" }, { id: "eq2", type: "equipier", nom: "Équipier 2" },
  { id: "ce1", type: "chefEquipe", nom: "Chef d'équipe 1" }, { id: "ce2", type: "chefEquipe", nom: "Chef d'équipe 2" },
  { id: "cond", type: "conducteur", nom: "Conducteur" }, { id: "ca", type: "chefAgres", nom: "Chef d'agrès" }, { id: "cg", type: "chefGroupe", nom: "Chef de groupe" },
];
export const TYPES = { equipier: "Équipier", chefEquipe: "Chef d'équipe", conducteur: "Conducteur", chefAgres: "Chef d'agrès", chefGroupe: "Chef de groupe" };
const posteDe = (id) => POSTES.find((p) => p.id === id);
const MODES = { info: "Information", qcm: "Décision (choix)", libre: "Réponse libre" };

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const br = (s) => esc(s).replace(/\n/g, "<br>");
const rid = () => Math.random().toString(36).slice(2, 9);
const hhmm = (t) => new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const cibleTxt = (c) => (!c || !c.length ? "Tous" : c.map((t) => TYPES[t]).join(", "));
const vise = (inj, type) => !inj.cibles || !inj.cibles.length || (type && inj.cibles.includes(type));

export const nouveau = () => ({ titre: "", lieu: "", duree: 20, contexte: "", fiches: { equipier: "", chefEquipe: "", conducteur: "", chefAgres: "", chefGroupe: "" }, injects: [], publie: false });

// ---- Scénario d'exemple : feu d'appartement au premier étage d'un immeuble de trois étages ----
const Q = (t, pts, retour) => ({ t, pts, retour });
export const EXEMPLE = () => ({
  titre: "Feu d'appartement au 1er étage d'un immeuble de trois étages",
  lieu: "12 rue des Lilas — immeuble d'habitation de trois étages",
  duree: 25, publie: false,
  contexte: "Départ réflexe d'un fourgon pompe tonne (FPT) puis d'un chef de groupe. Appel de 14 h 20 : feu d'appartement au premier étage d'un immeuble d'habitation de trois étages, escalier commun unique. Des fumées noires sortent par les fenêtres du logement. Un riverain signale une personne au balcon du deuxième étage. Un poteau d'incendie se trouve à environ 80 m.",
  fiches: {
    equipier: "Vous êtes équipier au sein d'un binôme. Vous exécutez les ordres de votre chef d'équipe, contrôlez votre matériel (ARI, EPI) et rendez compte immédiatement de tout changement (chaleur, visibilité, état de l'ARI).",
    chefEquipe: "Vous commandez votre binôme. Vous recevez les ordres du chef d'agrès, adaptez la conduite de la manœuvre, assurez la sécurité de votre équipier et rendez compte par radio (situation, actions, besoins).",
    conducteur: "Vous conduisez et mettez en œuvre l'engin : positionnement, alimentation en eau, pompe. Vous restez en liaison avec le chef d'agrès et anticipez l'arrivée des renforts.",
    chefAgres: "Vous commandez l'engin (FPT) et son équipage. Vous réalisez la reconnaissance, donnez les ordres initiaux, transmettez le message d'arrivée sur les lieux et rendez compte au chef de groupe.",
    chefGroupe: "Vous arrivez après le premier engin. Vous prenez le commandement des opérations, appréciez la situation, demandez les moyens complémentaires et assurez la sécurité d'ensemble.",
  },
  injects: [
    { id: rid(), delai: 0, titre: "Alerte et départ", mode: "info", cibles: [], texte: "Départ réflexe pour feu d'appartement au premier étage, 12 rue des Lilas. Immeuble de trois étages, fumées visibles. Une personne signalée au balcon du deuxième étage. Trajet : 6 minutes." },
    { id: rid(), delai: 3, titre: "Arrivée : positionnement de l'engin", mode: "qcm", cibles: ["conducteur"], texte: "La rue est étroite, la façade est fumante. D'autres engins vont arriver (échelle, renfort). Où positionnez-vous le FPT ?", choix: [
      Q("En avant de l'immeuble, en laissant la voie et l'accès à la façade libres pour l'engin échelle, hors zone de chute de vitres", 10, "Bon choix : accès dégagé pour les renforts et protection de l'équipage."),
      Q("Au plus près de la façade, sous les fenêtres du logement sinistré", 3, "Risque de chute de vitres et de matériaux enflammés, et accès bloqué pour l'échelle."),
      Q("À 100 m de l'immeuble par prudence", 2, "Trop loin : perte de temps et de longueur d'établissement."),
      Q("Devant le portail, en bloquant la voie d'accès", 0, "Les renforts ne pourront pas accéder à la façade.")] },
    { id: rid(), delai: 3, titre: "Message d'arrivée sur les lieux", mode: "libre", cibles: ["chefAgres"], texte: "Rédigez en quelques lignes votre message d'arrivée sur les lieux à destination du CODIS : renseignements (feu d'appartement, niveau, étendue, victime), actions engagées, moyens complémentaires demandés.", consigne: "Message court, structuré, sans ambiguïté." },
    { id: rid(), delai: 4, titre: "Ordre initial du chef d'agrès", mode: "qcm", cibles: ["chefAgres"], texte: "Vous observez un feu au premier étage, fumées denses, une personne appelle au balcon du deuxième. Deux binômes sont disponibles. Quel ordre initial donnez-vous ?", choix: [
      Q("Binôme 1 : attaque du feu avec une lance par l'escalier ; binôme 2 : mise en sécurité de la personne au balcon par l'échelle puis reconnaissance du deuxième étage", 10, "Excellent : sauvetage et attaque menés en parallèle, priorité à la vie."),
      Q("Binôme 1 au sauvetage, pas d'attaque tant que la victime n'est pas évacuée", 5, "Le feu progresse et menace l'escalier : l'attaque ne peut pas attendre."),
      Q("Les quatre sapeurs en attaque du feu pour l'éteindre avant tout sauvetage", 3, "La personne reste exposée aux fumées : le sauvetage est prioritaire."),
      Q("Attendre l'arrivée du chef de groupe avant toute action", 0, "Aucune action immédiate alors qu'une vie est menacée.")] },
    { id: rid(), delai: 4, titre: "Devant la porte du logement", mode: "qcm", cibles: ["chefEquipe"], texte: "Vous êtes sur le palier du premier étage avec votre équipier. La porte palière est fermée, chaude, de la fumée noire passe en dessous. Que faites-vous ?", choix: [
      Q("Équipement complet et ARI en marche, lance prête et chargée, ouverture progressive de la porte en position basse, contrôle de la fumée avant de progresser", 10, "Conduite conforme : protection, eau prête, ouverture maîtrisée."),
      Q("Ouvrir en grand et entrer immédiatement pour gagner du temps", 2, "Risque d'embrasement généralisé (appel d'air)."),
      Q("Enfoncer la porte et attaquer à jet droit depuis le palier", 1, "Pas de reconnaissance ni de protection, jet droit inadapté."),
      Q("Attendre que la lance soit chargée sans équiper l'ARI", 0, "L'ARI doit être porté et en marche avant toute exposition.")] },
    { id: rid(), delai: 4, titre: "Avant de franchir la porte", mode: "qcm", cibles: ["equipier"], texte: "Votre chef d'équipe vous demande d'être prêt à engager. Que faites-vous avant de franchir la porte ?", choix: [
      Q("Contrôle mutuel de l'ARI et des EPI, vérification de la pression, transmission de l'heure d'engagement", 10, "Réflexe de sécurité complet."),
      Q("Je laisse mon chef contrôler seul et je prends la lance", 4, "Le contrôle est mutuel, il engage la sécurité du binôme."),
      Q("Je mets l'ARI en marche seulement une fois dans la fumée", 0, "Dangereux : l'ARI doit être en marche avant l'exposition."),
      Q("Je pars devant pour reconnaître les lieux", 2, "On reste en binôme, sous les ordres du chef d'équipe.")] },
    { id: rid(), delai: 6, titre: "Évolution : éclatement d'une fenêtre", mode: "info", cibles: [], texte: "Une fenêtre du logement éclate, des flammes lèchent la façade et menacent le balcon du deuxième étage. L'escalier commun se remplit de fumée." },
    { id: rid(), delai: 6, titre: "Compte rendu radio", mode: "libre", cibles: ["chefEquipe"], texte: "Rendez compte par radio à votre chef d'agrès : votre situation, vos actions en cours, vos besoins.", consigne: "Trois éléments : situation, actions, besoins." },
    { id: rid(), delai: 7, titre: "Prise de commandement", mode: "qcm", cibles: ["chefGroupe"], texte: "Vous arrivez : feu de logement non maîtrisé, une victime en cours de sauvetage, un FPT engagé. Quelles demandes formulez-vous ?", choix: [
      Q("Renfort (échelle et second engin), secours à personne (VSAV, médecin), alimentation supplémentaire, police pour la circulation, secteurs et point de rassemblement", 10, "Appréciation complète et anticipation des moyens."),
      Q("Seulement un second engin", 5, "Insuffisant : il manque secours à personne et accès par échelle."),
      Q("Aucune demande, le FPT suffit", 0, "Situation évolutive avec victime : renforts indispensables."),
      Q("Évacuer tout l'immeuble sans moyens supplémentaires", 3, "L'évacuation doit être organisée avec des moyens et des ordres.")] },
    { id: rid(), delai: 8, titre: "Alimentation en eau", mode: "qcm", cibles: ["conducteur"], texte: "La tonne du FPT se vide. Un poteau d'incendie est à 80 m. Que faites-vous ?", choix: [
      Q("Établir l'alimentation du FPT depuis le poteau d'incendie sans entraver la voie, tout en surveillant la pompe", 10, "Alimentation continue assurée."),
      Q("Rester sur la tonne en attendant", 3, "Risque de rupture d'eau en pleine attaque."),
      Q("Quitter l'engin pour aider à l'attaque", 0, "L'engin ne doit pas être abandonné : l'eau est vitale."),
      Q("Alimenter depuis le poteau en traversant la chaussée sans protection", 4, "Établissement dangereux pour la circulation et les tuyaux.")] },
    { id: rid(), delai: 9, titre: "Victime sauvée", mode: "qcm", cibles: ["chefAgres"], texte: "La personne du balcon est mise en sécurité, consciente, toux importante, traces de suie. Quelles demandes ?", choix: [
      Q("Demander un VSAV et un médecin, bilan et oxygénothérapie, maintien à l'écart des fumées", 10, "Prise en charge adaptée à l'intoxication par fumées."),
      Q("La laisser rentrer chez elle", 0, "Danger : risque d'aggravation et de fumées."),
      Q("Aucune demande, elle semble aller bien", 2, "Une intoxication peut s'aggraver : bilan indispensable."),
      Q("La confier à un voisin", 1, "Pas de prise en charge médicale.")] },
    { id: rid(), delai: 10, titre: "Une victime dans la chambre", mode: "qcm", cibles: ["chefEquipe"], texte: "Dans la chambre du logement, vous découvrez un occupant inconscient près du lit. Le feu est en partie contenu. Que faites-vous ?", choix: [
      Q("Dégager immédiatement la victime vers le palier, poursuivre la protection avec la lance, transmettre « urgence vitale »", 10, "Priorité à la vie, avec message radio adapté."),
      Q("Poursuivre l'extinction avant de dégager", 3, "La victime reste exposée aux gaz chauds."),
      Q("Attendre un ordre du chef de groupe", 2, "L'urgence justifie de dégager sans attendre."),
      Q("Quitter le logement pour chercher du renfort", 1, "Perte de temps et abandon de la victime.")] },
    { id: rid(), delai: 12, titre: "Feu maîtrisé", mode: "info", cibles: [], texte: "Le feu est maîtrisé dans le logement. La victime est prise en charge par le VSAV. L'escalier reste enfumé." },
    { id: rid(), delai: 12, titre: "Message de fin d'intervention", mode: "libre", cibles: ["chefGroupe"], texte: "Rédigez votre message de situation : feu maîtrisé, bilan des victimes, moyens engagés, actions restantes (déblai, ventilation, surveillance).", consigne: "Message de synthèse pour le CODIS." },
    { id: rid(), delai: 14, titre: "Débriefing à chaud", mode: "libre", cibles: [], texte: "Indiquez en deux phrases : ce qui a bien fonctionné dans votre équipe, et un point à améliorer.", consigne: "Soyez factuel." },
  ],
});

const CSS = `.rj{width:100%;font:inherit}.rj *{box-sizing:border-box}
.rj .cd{background:var(--card,#fff);border:1px solid var(--line,#d8dde1);border-radius:12px;padding:14px;margin:10px 0}
.rj .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.rj .bt{justify-content:space-between}.rj .m{color:var(--mut,#6b7280)}
.rj h2,.rj h3{margin:0 0 6px}.rj label{display:block;font-weight:600;margin:10px 0 4px}
.rj input:not(.grow),.rj select,.rj textarea{width:100%;font:inherit;padding:8px 10px;border:1px solid var(--line,#d8dde1);border-radius:8px;background:var(--card,#fff);color:inherit}
.rj input[type=checkbox],.rj input[type=radio]{width:auto}.rj textarea{min-height:70px;resize:vertical}
.rj .b{font:inherit;font-weight:600;padding:8px 14px;border-radius:10px;border:1px solid var(--line,#d8dde1);background:var(--card,#fff);color:inherit;cursor:pointer}
.rj .b.p{background:var(--red,#c42a1c);border-color:var(--red,#c42a1c);color:#fff}.rj .b.x{color:#b3261e;border-color:#b3261e}.rj .b.s{padding:5px 10px;font-size:.88em}.rj .btn.sm{padding:5px 10px;font-size:.88em}.rj .btn:disabled{opacity:.5;cursor:default}
.rj .tg{display:inline-block;padding:2px 10px;border-radius:99px;font-size:.78rem;font-weight:700;border:1px solid var(--line,#d8dde1);white-space:nowrap}.rj .tg.r{background:var(--red,#c42a1c);color:#fff;border-color:var(--red,#c42a1c)}.rj .tg.v{background:#1f8a4c;color:#fff;border-color:#1f8a4c}
.rj .pg{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}.rj .po{border:1px solid var(--line,#d8dde1);border-radius:10px;padding:8px 10px}.rj .po.me{border-color:var(--red,#c42a1c);box-shadow:0 0 0 2px rgba(196,42,28,.2)}.rj .po.pris{opacity:.75}
.rj .ij{border:1px solid var(--line,#d8dde1);border-radius:10px;padding:10px;margin:8px 0}.rj .ij.env{background:rgba(31,138,76,.08)}
.rj .ch{display:block;width:100%;text-align:left;margin:6px 0}.rj .ch.sel{border-color:var(--red,#c42a1c);background:rgba(196,42,28,.1)}
.rj .code{font-size:2.2rem;letter-spacing:.2em;font-weight:800}.rj .rad{max-height:260px;overflow:auto;border:1px solid var(--line,#d8dde1);border-radius:10px;padding:6px 10px}.rj .rad p{margin:4px 0}
.rj .err{color:#b3261e;font-weight:600}.rj .fc{border-left:4px solid var(--red,#c42a1c);background:rgba(127,127,127,.08);padding:8px 12px;border-radius:0 8px 8px 0;margin:8px 0}
.rj .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:700px){.rj .g2{grid-template-columns:1fr}}`;
function css() { if (!document.getElementById("rj-css")) { const s = document.createElement("style"); s.id = "rj-css"; s.textContent = CSS; document.head.appendChild(s); } }

// Saisie conservée entre deux rendus (les données en direct réaffichent la page sans perdre ce qu'on tape).
function garder(ST, el) {
  el.addEventListener("input", (e) => { const t = e.target; if (t.dataset && t.dataset.t) ST.txt[t.dataset.t] = t.value; });
  el.addEventListener("focusout", () => setTimeout(() => { if (ST.sale && ST.live && !el.contains(document.activeElement)) { ST.sale = false; ST.rend(); } }, 50));
}
const val = (ST, k, d = "") => (ST.txt[k] != null ? ST.txt[k] : d);
const enSaisie = (el) => { const a = document.activeElement; return !!(a && el.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); };

// Scores : somme des points des choix retenus (côté formateur, d'après le scénario).
function scoreDe(sc, j) {
  let pts = 0, max = 0;
  (sc?.injects || []).forEach((i) => { if (i.mode !== "qcm") return; max += 10; const r = (j.rep || {})[i.id]; if (r && r.c != null && i.choix[r.c]) pts += Number(i.choix[r.c].pts) || 0; });
  return { pts, max };
}

// =============================================================== GESTIONNAIRE : liste, éditeur, pilotage de la séance
let CACHE = { uid: "", list: [], seances: [] }; // dernière liste connue : affichée tout de suite, puis rafraîchie
let G = null, KG = null, KJ = null; // KG/KJ : état conservé quand la page est réaffichée (données en direct)
function rolesSoft() { [G, J].forEach((x) => { if (x && x.unsub) { x.unsub(); x.unsub = null; } }); G = null; J = null; }
export function rolesDetach() { rolesSoft(); KG = null; KJ = null; }

export default function rolesGestMount(el, o) {
  css(); rolesSoft();
  if (CACHE.uid !== o.uid) CACHE = { uid: o.uid, list: [], seances: [] };
  const ST = (G = KG || (KG = { view: "liste", list: CACHE.list, seances: CACHE.seances, dr: null, id: null, msg: "", err: "", txt: {}, conf: null, live: null, code: null, sc: null, unsub: null }));
  const a = o.api;
  const peutModifier = (s) => o.isAdmin || s.auteur === o.uid;
  const charger = async () => {
    if (!ST.list.length && !ST.seances.length) { ST.chargement = true; rend(); } else rend();
    await Promise.all([
      a.list().then((l) => { ST.list = CACHE.list = l; }).catch((e) => { ST.err = e.message; }),
      a.mesSeances().then((l) => { ST.seances = CACHE.seances = l; }).catch(() => {}),
    ]);
    ST.chargement = false;
    rend();
  };

  function lire() { // recopie le formulaire de l'éditeur dans le brouillon
    if (!ST.dr) return;
    el.querySelectorAll("[data-k]").forEach((x) => {
      const k = x.dataset.k.split(".");
      if (x.type === "checkbox" && x.dataset.v) { const inj = ST.dr.injects[+k[1]]; if (!inj) return; inj.cibles = inj.cibles || []; const i = inj.cibles.indexOf(x.dataset.v); if (x.checked && i < 0) inj.cibles.push(x.dataset.v); if (!x.checked && i >= 0) inj.cibles.splice(i, 1); return; }
      if (x.type === "checkbox") { ST.dr[k[0]] = x.checked; return; }
      let t = ST.dr; for (let i = 0; i < k.length - 1; i++) { const n = /^\d+$/.test(k[i]) ? +k[i] : k[i]; if (k[i] === "inj") { t = t.injects; } else if (k[i] === "choix") { t = t.choix; } else t = t[n]; if (t == null) return; }
      let last = k[k.length - 1]; if (/^\d+$/.test(last)) last = +last;
      let v = x.value; if (["delai", "duree", "pts"].includes(last)) v = Number(v) || 0;
      if (last === "c") return;
      t[last] = v;
    });
  }

  function vueListe() {
    const mes = ST.list;
    if (ST.chargement) return `<h2>Jeu de rôle</h2><p class="muted">Chargement…</p>`;
    return `<h2>Jeu de rôle</h2><p class="muted">Chaque stagiaire tient un poste (équipier, chef d'équipe, conducteur, chef d'agrès, chef de groupe). Il n'est pas obligatoire d'occuper tous les postes. Tu déclenches les injects, ils répondent en direct.</p>
    ${ST.msg ? `<p class="muted">${esc(ST.msg)}</p>` : ""}${ST.err ? `<p class="err">${esc(ST.err)}</p>` : ""}
    <div class="row"><button class="btn pri primary" data-a="new">➕ Nouveau scénario</button><button class="btn" data-a="ex">✨ Ajouter le scénario d'exemple (feu d'appartement)</button></div>
    ${ST.seances.length ? `<div class="card"><h3>Séances en cours</h3>${ST.seances.map((s) => `<div class="row bt" style="margin:6px 0"><span><b>${esc(s.code)}</b> · ${esc(s.titre)} <span class="tg ${s.ouverte === false ? "" : "v"}">${s.ouverte === false ? "Clôturée" : "Ouverte"}</span></span><span class="row"><button class="btn sm" data-a="reprendre" data-c="${esc(s.code)}">Ouvrir</button><button class="btn sm danger" data-a="delseance" data-c="${esc(s.code)}">Supprimer</button></span></div>`).join("")}</div>` : ""}
    <h3 style="margin-top:14px">Scénarios de jeu de rôle (${mes.length})</h3>
    ${mes.length ? mes.map((s) => `<div class="card"><div class="row bt"><div><b>${esc(s.titre || "Sans titre")}</b> ${s.publie ? '<span class="tg">Partagé</span>' : ""}<div class="muted">${esc(s.lieu || "")} · ${(s.injects || []).length} inject(s) · ${s.duree || "?"} min${s.auteurNom && s.auteur !== o.uid ? " · par " + esc(s.auteurNom) : ""}</div></div>
      <div class="row"><button class="btn pri primary sm" data-a="ouvrir" data-i="${esc(s.id)}">▶ Ouvrir une séance</button>${peutModifier(s) ? `<button class="btn sm" data-a="edit" data-i="${esc(s.id)}">✏️ Modifier</button>` : ""}${ST.conf === s.id ? `<button class="btn sm danger" data-a="delok" data-i="${esc(s.id)}">Confirmer la suppression</button><button class="btn sm" data-a="delno">Annuler</button>` : peutModifier(s) ? `<button class="btn sm danger" data-a="del" data-i="${esc(s.id)}">🗑 Supprimer</button>` : ""}</div></div></div>`).join("")
      : `<div class="card"><p class="muted">Aucun scénario pour le moment. Utilise « Ajouter le scénario d'exemple » pour démarrer.</p></div>`}`;
  }

  function vueEdit() {
    const d = ST.dr;
    const inp = (k, v, ex = "") => `<input data-k="${k}" value="${esc(v)}" ${ex}>`;
    return `<h2>${ST.id ? "Modifier" : "Nouveau"} scénario de jeu de rôle</h2>${ST.err ? `<p class="err">${esc(ST.err)}</p>` : ""}
    <div class="card"><label>Titre</label>${inp("titre", d.titre)}<div class="g2"><div><label>Lieu</label>${inp("lieu", d.lieu)}</div><div><label>Durée indicative (minutes)</label>${inp("duree", d.duree, 'type="number" min="1"')}</div></div>
    <label>Situation de départ (alerte, contexte, ce que tout le monde sait)</label><textarea data-k="contexte" rows="5">${esc(d.contexte)}</textarea>
    <label><input type="checkbox" data-k="publie" ${d.publie ? "checked" : ""}> Partager avec les autres gestionnaires</label></div>
    <div class="card"><h3>Fiches de poste</h3><p class="muted">Ce que chaque stagiaire lit selon son poste. Les deux équipiers partagent la même fiche, de même que les deux chefs d'équipe.</p>
    ${Object.keys(TYPES).map((t) => `<label>${TYPES[t]}</label><textarea data-k="fiches.${t}" rows="3">${esc(d.fiches[t])}</textarea>`).join("")}</div>
    <div class="card"><div class="row bt"><h3>Injects (${d.injects.length})</h3><button class="btn sm" data-a="addinj">➕ Ajouter un inject</button></div>
    ${d.injects.map((x, n) => `<div class="ij"><div class="row bt"><b>${n + 1}.</b><span class="row"><button class="btn sm" data-a="up" data-n="${n}">↑</button><button class="btn sm" data-a="dn" data-n="${n}">↓</button><button class="btn sm danger" data-a="delinj" data-n="${n}">Supprimer</button></span></div>
      <div class="g2"><div><label>Titre</label>${inp(`inj.${n}.titre`, x.titre)}</div><div><label>Délai indicatif (min)</label>${inp(`inj.${n}.delai`, x.delai, 'type="number" min="0"')}</div></div>
      <label>Message</label><textarea data-k="inj.${n}.texte" rows="3">${esc(x.texte)}</textarea>
      <label>Destinataires <span class="muted">(aucun coché = tous)</span></label><div class="row">${Object.keys(TYPES).map((t) => `<label style="margin:0;font-weight:400"><input type="checkbox" data-k="inj.${n}.cib" data-v="${t}" ${(x.cibles || []).includes(t) ? "checked" : ""}> ${TYPES[t]}</label>`).join("")}</div>
      <label>Type</label><select data-k="inj.${n}.mode" data-mode="${n}">${Object.keys(MODES).map((m) => `<option value="${m}"${x.mode === m ? " selected" : ""}>${MODES[m]}</option>`).join("")}</select>
      ${x.mode === "libre" ? `<label>Consigne</label>${inp(`inj.${n}.consigne`, x.consigne || "")}` : ""}
      ${x.mode === "qcm" ? `<label>Choix de réponse (points de 0 à 10)</label>${(x.choix || []).map((c, k) => `<div class="g2" style="margin:6px 0"><div>${inp(`inj.${n}.choix.${k}.t`, c.t, 'placeholder="Réponse"')}</div><div class="row"><input data-k="inj.${n}.choix.${k}.pts" type="number" min="0" max="10" value="${esc(c.pts)}" style="width:80px"><input data-k="inj.${n}.choix.${k}.retour" value="${esc(c.retour || "")}" placeholder="Retour pédagogique" style="flex:1"><button class="btn sm danger" data-a="delch" data-n="${n}" data-c="${k}">✕</button></div></div>`).join("")}<button class="btn sm" data-a="addch" data-n="${n}">➕ Ajouter un choix</button>` : ""}</div>`).join("") || '<p class="muted">Aucun inject.</p>'}</div>
    <div class="row"><button class="btn pri primary" data-a="save">💾 Enregistrer</button><button class="btn" data-a="cancel">Annuler</button></div>`;
  }

  // ---- Pilotage de la séance
  function vueSeance() {
    const L = ST.live;
    if (!L || !L.s) return `<p class="muted">Chargement de la séance…</p><button class="btn" data-a="retour">Retour</button>`;
    const s = L.s, sc = ST.sc, env = new Map((s.envoyes || []).map((x) => [x.id, x]));
    const pos = new Map((L.postes || []).map((p) => [p.poste, p]));
    const libres = (L.joueurs || []).filter((j) => ![...pos.values()].some((p) => p.uid === j.uid));
    const prevus = (sc?.injects || []).slice().sort((x, y) => (Number(x.delai) || 0) - (Number(y.delai) || 0));
    const reps = (inj) => (L.joueurs || []).filter((j) => (j.rep || {})[inj.id]).map((j) => { const r = j.rep[inj.id], p = [...pos.values()].find((q) => q.uid === j.uid); const lab = esc(j.nom) + (p ? ` (${esc(posteDe(p.poste)?.nom || "")})` : ""); const c = inj.mode === "qcm" && r.c != null ? esc(inj.choix?.[r.c]?.t || "") + ` <span class="tg ${inj.choix?.[r.c]?.pts >= 7 ? "v" : ""}">${inj.choix?.[r.c]?.pts ?? "?"}/10</span>` : br(r.texte || ""); return `<p style="margin:4px 0"><b>${lab}</b> : ${c}</p>`; }).join("");
    const carteInj = (inj, prevu) => { const e = env.get(inj.id); return `<div class="ij ${e ? "env" : ""}"><div class="row bt"><span><b>${esc(inj.titre)}</b> <span class="muted">· T+${inj.delai || 0} min · ${esc(cibleTxt(inj.cibles))} · ${MODES[inj.mode] || ""}</span></span>${e ? `<span class="tg v">Envoyé ${hhmm(e.le)}</span>` : s.termine ? "" : `<button class="btn sm pri primary" data-a="envoyer" data-i="${esc(inj.id)}">📤 Envoyer</button>`}</div><div class="muted">${br(inj.texte)}</div>${e ? reps(inj) : ""}</div>`; };
    const enjeu = (L.joueurs || []);
    return `<div class="row bt"><h2>${esc(s.titre)}</h2><span class="row"><button class="btn" data-a="retour">← Retour</button>${s.ouverte === false ? `<button class="btn" data-a="rouvrir">Rouvrir la salle</button>` : `<button class="btn" data-a="clore">Clore la salle</button>`}${s.termine ? '<span class="tg v">Corrigé publié</span>' : `<button class="btn pri primary" data-a="terminer">🏁 Terminer et publier le corrigé</button>`}</span></div>
    ${ST.err ? `<p class="err">${esc(ST.err)}</p>` : ""}
    <div class="card"><div class="row bt"><div><div class="muted">Code à donner aux stagiaires (page « Séance en salle »)</div><div class="code">${esc(s.code)}</div></div><div class="muted" style="max-width:420px">${br(s.contexte || "")}</div></div></div>
    <div class="card"><h3>Postes (${pos.size}/7 occupés)</h3><div class="pg">${POSTES.map((p) => { const q = pos.get(p.id); return `<div class="po ${q ? "pris" : ""}"><b>${p.nom}</b><div>${q ? esc(q.nom) : '<span class="muted">libre</span>'}</div>${q ? `<button class="btn sm danger" data-a="liberer" data-p="${p.id}">Libérer</button>` : libres.length ? `<select data-aff="${p.id}"><option value="">Affecter…</option>${libres.map((j) => `<option value="${esc(j.uid)}">${esc(j.nom)}</option>`).join("")}</select>` : ""}</div>`; }).join("")}</div>
    ${libres.length ? `<p class="muted">Sans poste : ${libres.map((j) => esc(j.nom)).join(", ")}</p>` : ""}</div>
    <div class="g2"><div class="card"><h3>Injects prévus</h3>${prevus.map((i) => carteInj(i, true)).join("") || '<p class="muted">Aucun inject prévu.</p>'}</div>
    <div><div class="card"><h3>Inject libre</h3><label>Titre</label><input data-t="lt" value="${esc(val(ST, "lt"))}"><label>Message</label><textarea data-t="lx" rows="3">${esc(val(ST, "lx"))}</textarea><label>Destinataires</label><div class="row">${Object.keys(TYPES).map((t) => `<label style="margin:0;font-weight:400"><input type="checkbox" data-lc="${t}"${ST.lc && ST.lc[t] ? " checked" : ""}> ${TYPES[t]}</label>`).join("")}</div><label>Type</label><select data-t="lm"><option value="info"${val(ST, "lm", "info") === "info" ? " selected" : ""}>Information</option><option value="libre"${val(ST, "lm") === "libre" ? " selected" : ""}>Réponse libre</option></select><div style="margin-top:8px"><button class="btn pri primary" data-a="libre">📤 Envoyer</button></div></div>
    <div class="card"><h3>Radio / échanges</h3><div class="rad">${(L.radio || []).map((r) => `<p><span class="muted">${hhmm(r.le)}</span> <b>${esc(r.role || r.nom)}</b> : ${esc(r.texte)}</p>`).join("") || '<p class="muted">Aucun message.</p>'}</div><div class="row" style="margin-top:6px"><input data-t="rx" value="${esc(val(ST, "rx"))}" maxlength="400" placeholder="Message du formateur…" style="flex:1"><button class="btn" data-a="radio">Envoyer</button></div></div></div></div>
    <div class="card"><h3>Résultats (${enjeu.length} participant(s))</h3>${enjeu.length ? `<table style="width:100%;border-collapse:collapse"><tr><th align="left">Participant</th><th align="left">Poste</th><th align="left">Réponses</th><th align="left">Points décisions</th></tr>${enjeu.map((j) => { const p = [...pos.values()].find((q) => q.uid === j.uid), sco = scoreDe(sc, j), n = Object.keys(j.rep || {}).length; return `<tr><td>${esc(j.nom)}</td><td>${p ? esc(posteDe(p.poste)?.nom || "") : "—"}</td><td>${n}</td><td>${sco.pts} / ${sco.max}</td></tr>`; }).join("")}</table>` : '<p class="muted">Personne n’a encore rejoint la séance.</p>'}</div>`;
  }

  function rend() {
    if (!el.isConnected) return;
    el.className = "rj";
    el.innerHTML = ST.view === "liste" ? vueListe() : ST.view === "edit" ? vueEdit() : vueSeance();
    el.querySelectorAll("[data-t]").forEach((x) => { if (ST.txt[x.dataset.t] != null) x.value = ST.txt[x.dataset.t]; });
  }
  ST.rend = rend;
  garder(ST, el);

  const suivre = (code) => {
    ST.code = code; ST.view = "seance"; ST.live = null; ST.sc = null;
    if (ST.unsub) ST.unsub();
    ST.unsub = a.watch(code, (L) => {
      ST.live = L;
      if (L.s && (!ST.sc || ST.sc.id !== L.s.scId)) { const f = ST.list.find((x) => x.id === L.s.scId); if (f) ST.sc = f; else a.list().then((l) => { ST.list = l; ST.sc = l.find((x) => x.id === L.s.scId) || null; rend(); }).catch(() => {}); }
      if (enSaisie(el)) ST.sale = true; else rend();
    });
    rend();
  };

  el.onclick = async (e) => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const act = b.dataset.a; ST.err = ""; ST.msg = "";
    try {
      if (act === "new") { ST.id = null; ST.dr = nouveau(); ST.view = "edit"; }
      else if (act === "ex") { const sc = EXEMPLE(); sc.auteur = o.uid; sc.auteurNom = o.nom; sc.departement = o.dept || ""; sc.o = Date.now(); await a.save(null, sc); await charger(); ST.msg = "Scénario d'exemple ajouté."; }
      else if (act === "edit") { const s = ST.list.find((x) => x.id === b.dataset.i); ST.id = s.id; ST.dr = JSON.parse(JSON.stringify(s)); ST.dr.injects = ST.dr.injects || []; ST.dr.fiches = { ...nouveau().fiches, ...(ST.dr.fiches || {}) }; ST.view = "edit"; }
      else if (act === "cancel") { ST.view = "liste"; ST.dr = null; }
      else if (act === "save") { lire(); if (!ST.dr.titre.trim()) throw new Error("Donne un titre au scénario."); const d = ST.dr; d.auteur = d.auteur || o.uid; d.auteurNom = d.auteurNom || o.nom; d.departement = d.departement || o.dept || ""; d.o = d.o || Date.now(); d.maj = Date.now(); await a.save(ST.id, d); ST.view = "liste"; ST.dr = null; await charger(); ST.msg = "Scénario enregistré."; }
      else if (act === "del") ST.conf = b.dataset.i;
      else if (act === "delno") ST.conf = null;
      else if (act === "delok") { await a.del(b.dataset.i); ST.conf = null; await charger(); ST.msg = "Scénario supprimé."; }
      else if (act === "addinj") { lire(); ST.dr.injects.push({ id: rid(), delai: 0, titre: "", texte: "", cibles: [], mode: "info", choix: [] }); }
      else if (act === "delinj") { lire(); ST.dr.injects.splice(+b.dataset.n, 1); }
      else if (act === "up" || act === "dn") { lire(); const n = +b.dataset.n, m = act === "up" ? n - 1 : n + 1, l = ST.dr.injects; if (m >= 0 && m < l.length) [l[n], l[m]] = [l[m], l[n]]; }
      else if (act === "addch") { lire(); const i = ST.dr.injects[+b.dataset.n]; i.choix = i.choix || []; i.choix.push({ t: "", pts: 0, retour: "" }); }
      else if (act === "delch") { lire(); ST.dr.injects[+b.dataset.n].choix.splice(+b.dataset.c, 1); }
      else if (act === "ouvrir") { const sc = ST.list.find((x) => x.id === b.dataset.i); const code = await a.ouvrir(sc); ST.sc = sc; ST.seances = await a.mesSeances().catch(() => ST.seances); suivre(code); return; }
      else if (act === "reprendre") { suivre(b.dataset.c); return; }
      else if (act === "delseance") { if (ST.conf !== "s" + b.dataset.c) { ST.conf = "s" + b.dataset.c; ST.msg = "Clique à nouveau sur Supprimer pour confirmer."; } else { await a.supprimer(b.dataset.c); ST.conf = null; await charger(); ST.msg = "Séance supprimée."; } }
      else if (act === "retour") { if (ST.unsub) ST.unsub(); ST.unsub = null; ST.view = "liste"; await charger(); return; }
      else if (act === "envoyer") { const inj = (ST.sc?.injects || []).find((x) => x.id === b.dataset.i); await a.envoyer(ST.code, inj); }
      else if (act === "libre") { const t = val(ST, "lt").trim(), x = val(ST, "lx").trim(); if (!t && !x) throw new Error("Saisis un titre ou un message."); const cib = Object.keys(TYPES).filter((k) => ST.lc && ST.lc[k]); await a.envoyer(ST.code, { id: rid(), titre: t || "Information", texte: x, cibles: cib, mode: val(ST, "lm", "info") === "libre" ? "libre" : "info" }); ST.txt.lt = ""; ST.txt.lx = ""; ST.lc = {}; }
      else if (act === "radio") { const t = val(ST, "rx").trim(); if (t) { await a.radio(ST.code, { uid: o.uid, nom: o.nom || "Formateur", role: "Formateur", texte: t }); ST.txt.rx = ""; } }
      else if (act === "liberer") await a.liberer(ST.code, b.dataset.p, null);
      else if (act === "clore") await a.setEtat(ST.code, { ouverte: false });
      else if (act === "rouvrir") await a.setEtat(ST.code, { ouverte: true });
      else if (act === "terminer") { const corrige = {}; (ST.sc?.injects || []).forEach((i) => { if (i.mode === "qcm") corrige[i.id] = (i.choix || []).map((c) => ({ t: c.t, pts: Number(c.pts) || 0, retour: c.retour || "" })); }); await a.setEtat(ST.code, { termine: true, corrige }); }
    } catch (x) { ST.err = x.message || String(x); }
    rend();
  };
  el.onchange = async (e) => {
    const t = e.target;
    if (t.dataset.mode != null) { lire(); const i = ST.dr.injects[+t.dataset.mode]; if (i.mode === "qcm" && (!i.choix || !i.choix.length)) i.choix = [{ t: "", pts: 10, retour: "" }, { t: "", pts: 0, retour: "" }]; rend(); }
    else if (t.dataset.aff) { if (t.value) { const j = (ST.live.joueurs || []).find((x) => x.uid === t.value); try { await a.liberer(ST.code, t.dataset.aff, null); await a.affecter(ST.code, t.dataset.aff, j.uid, j.nom); } catch (x) { ST.err = x.message; rend(); } } }
    else if (t.dataset.lc) { ST.lc = ST.lc || {}; ST.lc[t.dataset.lc] = t.checked; }
  };
  if (ST.view === "seance" && ST.code) suivre(ST.code); else charger();
}

// =============================================================== STAGIAIRE : rejoindre, choisir un poste, jouer
let J = null;
export function rolesJoueMount(el, o) {
  css(); rolesSoft();
  const ST = (J = KJ || (KJ = { code: o.initial || "", live: null, err: "", txt: {}, unsub: null }));
  const a = o.api;
  const monPoste = () => ((ST.live && ST.live.postes) || []).find((p) => p.uid === o.uid);
  const moi = () => ((ST.live && ST.live.joueurs) || []).find((j) => j.uid === o.uid) || { rep: {} };

  function vueJoin() {
    return `<h1>Jeu de rôle</h1><p class="muted">Ton formateur te donne un code : saisis-le pour rejoindre le jeu de rôle, choisir ton poste et répondre aux injects depuis ton appareil.</p>${ST.err ? `<p class="err">${esc(ST.err)}</p>` : ""}
    <div class="card row" style="align-items:center"><input class="grow" data-t="cj" value="${esc(val(ST, "cj", ST.code))}" maxlength="8" placeholder="Code donné par le formateur (ex. K7M2P)" autocomplete="off" style="text-transform:uppercase"><button class="btn pri primary" data-a="join">Rejoindre</button>${o.versSalle ? '<button class="btn" data-a="salle">🏫 Séance en salle</button>' : ""}</div>`;
  }
  function vueJeu() {
    const L = ST.live;
    if (!L || !L.s) return `<p class="muted">Chargement…</p>`;
    const s = L.s, mp = monPoste(), poste = mp ? posteDe(mp.poste) : null, type = poste ? poste.type : null;
    const pris = new Map((L.postes || []).map((p) => [p.poste, p])), j = moi();
    const injs = (s.envoyes || []).filter((i) => vise(i, type)).sort((x, y) => (y.le || 0) - (x.le || 0));
    let tot = 0, max = 0;
    const carte = (i) => {
      const r = (j.rep || {})[i.id], cor = s.corrige && s.corrige[i.id];
      let corps = "";
      if (i.mode === "qcm") {
        if (r && r.c != null) { corps += `<p class="muted">Ta réponse : <b>${esc(i.choix?.[r.c]?.t || "")}</b></p>`; if (cor) { max += 10; tot += Number(cor[r.c]?.pts) || 0; corps += `<div class="fc"><b>${cor[r.c]?.pts ?? 0}/10</b> — ${esc(cor[r.c]?.retour || "")}</div>${cor.map((c) => `<div class="muted">• ${esc(c.t)} <b>(${c.pts}/10)</b></div>`).join("")}`; } else corps += '<span class="tg">Réponse enregistrée</span>'; }
        else if (!poste) corps += '<p class="muted">Choisis un poste pour répondre.</p>';
        else corps += (i.choix || []).map((c, k) => `<button class="btn ch" data-a="rep" data-i="${esc(i.id)}" data-c="${k}">${esc(c.t)}</button>`).join("");
      } else if (i.mode === "libre") {
        if (r && r.texte != null) corps += `<p class="muted">Ta réponse :</p><div class="fc">${br(r.texte)}</div>`;
        else if (!poste) corps += '<p class="muted">Choisis un poste pour répondre.</p>';
        else corps += `${i.consigne ? `<p class="muted">${esc(i.consigne)}</p>` : ""}<textarea data-t="r_${esc(i.id)}" rows="3" maxlength="900">${esc(val(ST, "r_" + i.id))}</textarea><div style="margin-top:6px"><button class="btn pri primary" data-a="replibre" data-i="${esc(i.id)}">Envoyer ma réponse</button></div>`;
      }
      return `<div class="ij ${i.mode !== "info" && !(r) ? "" : "env"}"><div class="row bt"><b>${esc(i.titre)}</b><span class="muted">${hhmm(i.le)} · ${esc(cibleTxt(i.cibles))}</span></div><div>${br(i.texte)}</div>${corps}</div>`;
    };
    const cartes = injs.map(carte).join("") || '<p class="muted">En attente du premier inject du formateur…</p>';
    return `<div class="row bt"><h1>${esc(s.titre)}</h1><button class="btn" data-a="quitter">Quitter</button></div>${ST.err ? `<p class="err">${esc(ST.err)}</p>` : ""}
    ${s.ouverte === false ? '<p class="muted">La salle est clôturée.</p>' : ""}
    <div class="card"><b>Situation</b><div>${br(s.contexte || "")}</div></div>
    <div class="card"><h3>Ton poste ${poste ? `: ${poste.nom}` : ""}</h3>${poste ? `<div class="fc">${br((s.fiches || {})[type] || "")}</div><button class="btn sm" data-a="liberer">Changer de poste</button>` : '<p class="muted">Choisis un poste libre (tu peux aussi observer sans poste).</p>'}
    <div class="pg" style="margin-top:8px">${POSTES.map((p) => { const q = pris.get(p.id), moi2 = q && q.uid === o.uid; return `<div class="po ${moi2 ? "me" : q ? "pris" : ""}"><b>${p.nom}</b><div>${q ? esc(q.nom) : '<span class="muted">libre</span>'}</div>${!q && !poste && s.ouverte !== false ? `<button class="btn sm pri primary" data-a="prendre" data-p="${p.id}">Prendre ce poste</button>` : ""}</div>`; }).join("")}</div></div>
    <div class="g2"><div class="card"><h3>Injects</h3>${cartes}${s.termine && max ? `<div class="fc"><b>Ton score aux décisions : ${tot} / ${max}</b></div>` : ""}</div>
    <div class="card"><h3>Radio / échanges</h3><div class="rad">${(L.radio || []).map((r) => `<p><span class="muted">${hhmm(r.le)}</span> <b>${esc(r.role || r.nom)}</b> : ${esc(r.texte)}</p>`).join("") || '<p class="muted">Aucun message.</p>'}</div><div class="row" style="margin-top:6px"><input data-t="rx" value="${esc(val(ST, "rx"))}" maxlength="400" placeholder="Ton message radio…" style="flex:1"><button class="btn" data-a="radio">Envoyer</button></div></div></div>`;
  }
  function rend() {
    if (!el.isConnected) return;
    el.className = "rj";
    el.innerHTML = ST.live || ST.joint ? vueJeu() : vueJoin();
    el.querySelectorAll("[data-t]").forEach((x) => { if (ST.txt[x.dataset.t] != null) x.value = ST.txt[x.dataset.t]; });
  }
  ST.rend = rend; ST.live2 = true;
  garder(ST, el);
  const suivre = (code) => {
    ST.code = code; ST.joint = true;
    if (ST.unsub) ST.unsub();
    ST.unsub = a.watch(code, (L) => { ST.live = L; ST.live2 = true; if (enSaisie(el)) { ST.sale = true; ST.live = L; } else rend(); });
    rend();
  };
  el.onclick = async (e) => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const act = b.dataset.a; ST.err = "";
    try {
      if (act === "salle") { o.versSalle(); return; }
      if (act === "join") { const c = val(ST, "cj").toUpperCase().replace(/[^A-Z0-9]/g, ""); if (!c) throw new Error("Saisis le code."); const s = await a.existe(c); if (!s) throw new Error("Code inconnu."); if (s.ouverte === false && !s.termine) throw new Error("Cette séance est clôturée."); await a.rejoindre(c, o.uid, o.nom); suivre(c); return; }
      if (act === "quitter") { if (ST.unsub) ST.unsub(); ST.unsub = null; ST.live = null; ST.joint = false; }
      else if (act === "prendre") await a.prendre(ST.code, b.dataset.p, o.uid, o.nom);
      else if (act === "liberer") { const mp = monPoste(); if (mp) await a.liberer(ST.code, mp.poste, o.uid); }
      else if (act === "rep") await a.repondre(ST.code, o.uid, b.dataset.i, { c: +b.dataset.c, le: Date.now() });
      else if (act === "replibre") { const t = val(ST, "r_" + b.dataset.i).trim(); if (!t) throw new Error("Écris ta réponse."); await a.repondre(ST.code, o.uid, b.dataset.i, { texte: t.slice(0, 900), le: Date.now() }); }
      else if (act === "radio") { const t = val(ST, "rx").trim(); if (t) { const mp = monPoste(); await a.radio(ST.code, { uid: o.uid, nom: o.nom || "Stagiaire", role: mp ? posteDe(mp.poste).nom : (o.nom || "Stagiaire"), texte: t }); ST.txt.rx = ""; } }
    } catch (x) { ST.err = x.message || String(x); }
    rend();
  };
  if (ST.joint && ST.code) suivre(ST.code);
  else if (o.initial) { a.existe(o.initial).then(async (s) => { if (s && (s.ouverte !== false || s.termine)) { await a.rejoindre(o.initial, o.uid, o.nom).catch(() => {}); suivre(o.initial); } else { ST.err = "Séance introuvable ou clôturée."; rend(); } }).catch(() => rend()); } else rend();
}
