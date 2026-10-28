// Moteur des exercices relationnels (gestion du conflit) — pur, sans dépendance.
export const TECH = {
  ecoute: { l: "Écoute active", t: "bon" },
  empathie: { l: "Empathie / compassion", t: "bon" },
  reformulation: { l: "Reformulation", t: "bon" },
  validation: { l: "Validation de l'émotion", t: "bon" },
  question: { l: "Question ouverte", t: "bon" },
  voix: { l: "Voix posée / posture", t: "bon" },
  choix: { l: "Choix limité / rôle donné", t: "bon" },
  info: { l: "Information claire", t: "bon" },
  limite: { l: "Limite cadrée", t: "bon" },
  securite: { l: "Sécurité / distance", t: "bon" },
  renfort: { l: "Demande de renfort", t: "renfort" },
  contre: { l: "Contre-argumenter / se justifier", t: "piege" },
  ordre: { l: "Ordre sec / menace", t: "piege" },
  minimise: { l: "Minimiser", t: "piege" },
  promesse: { l: "Promesse intenable", t: "piege" },
  contact: { l: "Contact physique / contournement", t: "piege" },
};
export const ETATS = { colere: "Colère", peur: "Peur", "sidération": "Sidération", deni: "Déni", culpabilite: "Culpabilité", deuil: "Deuil / perte" };
export const BESOINS = { information: "Être informé", controle: "Retrouver du contrôle", reconnaissance: "Être reconnu(e)", proche: "Rester près d'un proche", securite: "Se sentir en sécurité" };
export const TYPES_INTER = ["Secours à personne", "Secours routier", "Incendie", "Opérations diverses", "Risques industriels"];
export const FINS = { apaise: "Fin : victime apaisée", echec: "Fin : échec (escalade)", renfort: "Fin : renfort demandé" };

const cl = (v) => Math.max(0, Math.min(100, Math.round(v)));

export function newRelation() {
  return {
    titre: "", description: "", rubrique: "Gestion du conflit", niveau: "Intermédiaire", publie: false, jaugesMasquees: false, photo: "", vignette: "",
    contexte: { texte: "", type: "Secours à personne", objectif: "", gravite: 3, tempsMax: 8, effectifs: 3, lieu: "", public: "aucun", alcool: false, arme: false, seuilRenfort: 70 },
    victime: { nom: "La victime", etat: "colere", tension: 60, confiance: 20, besoin: "information", besoinTexte: "", declencheurs: [], apaisants: [] },
    debut: "n1",
    noeuds: [{ id: "n1", victime: "", choix: [] }],
    debrief: { points: [], erreurs: [], principes: [] },
  };
}

export function initEtat(ex) {
  const v = ex.victime || {};
  return { noeud: ex.debut || (ex.noeuds[0] || {}).id, tension: cl(v.tension ?? 50), confiance: cl(v.confiance ?? 20), besoin: 0, temps: 0, tours: [], fin: null, alerte: false };
}

// Applique un choix : les paramètres d'intervention modulent les effets.
export function appliquer(ex, st, choix) {
  const c = ex.contexte || {};
  const seuil = c.seuilRenfort ?? 70;
  const avant = { t: st.tension, c: st.confiance, b: st.besoin };
  const alerteAvant = st.tension >= seuil;
  let dT = Number(choix.dT) || 0;
  if (c.alcool) dT = dT > 0 ? Math.round(dT * 1.3) : Math.round(dT * 0.7);   // alcool : s'embrase vite, s'apaise lentement
  const tps = Number(choix.temps) || 1;
  const pression = (c.public === "foule" ? 4 : c.public === "quelques" ? 2 : 0);   // regard du public
  const temps = st.temps + tps;
  const depasse = Math.max(0, temps - (c.tempsMax || 99)) - Math.max(0, st.temps - (c.tempsMax || 99));
  const hors = depasse * 2 * Math.max(1, (c.gravite || 3) - 1);                    // la mission se dégrade : la tension monte
  const tension = cl(st.tension + dT + pression + hors);
  const confiance = cl(st.confiance + (Number(choix.dC) || 0));
  const besoin = cl(st.besoin + (Number(choix.dB) || 0));
  const tech = TECH[choix.technique] || { l: choix.technique, t: "bon" };
  const justifie = choix.technique === "renfort" ? alerteAvant : null;
  let fin = null, noeud = st.noeud;
  const s = String(choix.suite || "");
  if (s.startsWith("fin:")) fin = s.slice(4);
  else if (ex.noeuds.some((n) => n.id === s)) noeud = s;
  else fin = "echec";
  if (tension >= 100 && fin !== "renfort") fin = "echec";
  const tour = {
    noeud: st.noeud, victime: (ex.noeuds.find((n) => n.id === st.noeud) || {}).victime || "",
    texte: choix.texte, technique: choix.technique, type: tech.t, conseil: choix.conseil || "", reaction: choix.reaction || "",
    avant, apres: { t: tension, c: confiance, b: besoin }, temps: tps, alerteAvant, justifie,
  };
  return { noeud, tension, confiance, besoin, temps, tours: [...st.tours, tour], fin, alerte: tension >= seuil };
}

export function bilan(ex, st) {
  const c = ex.contexte || {};
  const tM = c.tempsMax || 99;
  const desamorcage = cl(100 - st.tension) * (st.fin === "echec" ? 0.4 : 1);
  const besoin = st.besoin;
  let posture = 100;
  st.tours.forEach((t) => {
    if (t.technique === "contact") posture -= 35;
    else if (t.type === "piege") posture -= 8;
    if (t.alerteAvant && t.type === "piege") posture -= 10;
    if (t.technique === "renfort" && !t.justifie) posture -= 15;
  });
  if (st.fin === "echec") posture -= 20;
  const extra = Math.max(0, st.temps - tM);
  let mission = 100 - 12 * extra;
  if (st.fin === "echec") mission = Math.min(mission, 30);
  if (st.fin === "renfort") mission = Math.min(mission, 55);
  const sc = { desamorcage: cl(desamorcage), besoin: cl(besoin), posture: cl(posture), mission: cl(mission) };
  sc.global = Math.round((sc.desamorcage + sc.besoin + sc.posture + sc.mission) / 4);
  return sc;
}

// Contrôle de l'arbre : impasses, liens cassés, absence de fin « apaisée » atteignable.
export function controler(ex) {
  const p = [], ids = new Set((ex.noeuds || []).map((n) => n.id));
  if (!ids.has(ex.debut)) p.push("Le nœud de départ n'existe pas.");
  (ex.noeuds || []).forEach((n) => {
    if (!n.victime) p.push(`Nœud ${n.id} : réplique de la victime vide.`);
    if (!(n.choix || []).length) p.push(`Nœud ${n.id} : aucun choix.`);
    (n.choix || []).forEach((c, i) => {
      if (!c.texte) p.push(`Nœud ${n.id}, choix ${i + 1} : texte vide.`);
      if (!(String(c.suite).startsWith("fin:") || ids.has(c.suite))) p.push(`Nœud ${n.id}, choix ${i + 1} : suite invalide.`);
    });
  });
  const vu = new Set(), pile = [ex.debut]; let apaise = false;
  while (pile.length) {
    const id = pile.pop(); if (vu.has(id)) continue; vu.add(id);
    const n = (ex.noeuds || []).find((x) => x.id === id); if (!n) continue;
    (n.choix || []).forEach((c) => { if (c.suite === "fin:apaise") apaise = true; else if (ids.has(c.suite)) pile.push(c.suite); });
  }
  if (!apaise) p.push("Aucun chemin n'aboutit à « victime apaisée ».");
  (ex.noeuds || []).forEach((n) => { if (!vu.has(n.id)) p.push(`Nœud ${n.id} : inaccessible depuis le départ.`); });
  return p;
}
