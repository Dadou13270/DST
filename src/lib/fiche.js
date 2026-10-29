import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import { fmtDate } from "./users";

// Fiche d'évaluation Incendie : une seule fiche pour tous les cadres d'emploi.
// Niveaux : 0 non acquis · 1 en cours · 2 acquis · 3 maîtrisé. Coefficient 1 à 3. « e » = éliminatoire.
export const NIVEAUX = ["Non acquis", "En cours", "Acquis", "Maîtrisé"];
const C = (id, n, d, k, e = 0) => ({ id, n, d, k, e });
export const FICHE_BASE = [
  { id: "s1", t: "1. Réactions immédiates et message d'ambiance", c: [
    C("a1", "Message d'ambiance complet et structuré", "Je suis / Je vois / Je demande : lieu, constat, besoins en moyens. Message clair, court et dans l'ordre.", 2),
    C("a2", "Premières actions pertinentes", "Sauvetage ou mise en sécurité avant tout, protection, alimentation, engagement des personnels adapté.", 3, 1),
    C("a3", "Sécurité de l'équipe", "Équipements, binôme, ARI, zone de danger identifiée et respectée.", 3, 1)] },
  { id: "s2", t: "2. Reconnaissance et recueil d'informations", c: [
    C("b1", "Questions essentielles posées", "Personnes en danger, nature et étendue du feu, risques particuliers, accès et ressource en eau.", 3, 1),
    C("b2", "Bons interlocuteurs sollicités", "Le stagiaire interroge les bonnes personnes et reformule les réponses reçues.", 1),
    C("b3", "Prise en compte des évolutions", "Réaction adaptée aux changements de situation annoncés pendant l'exercice.", 2)] },
  { id: "s3", t: "3. Analyse et décision (SOIEC)", c: [
    C("c1", "Situation (S)", "Description fidèle : feu, bâtiment, victimes, exposés, conditions.", 2),
    C("c2", "Objectifs (O)", "Objectifs classés par priorité : sauver, protéger, éteindre, limiter les dégâts.", 2, 1),
    C("c3", "Idée de manœuvre (I)", "Choix tactique cohérent avec les objectifs, établissements et attaque justifiés.", 3, 1),
    C("c4", "Exécution (E)", "Missions précises par engin ou binôme, ordres clairs, moyens hydrauliques adaptés.", 2),
    C("c5", "Commandement et transmissions (C)", "Position du chef, liaisons, demande de renforts justifiée, point de situation.", 2)] },
  { id: "s4", t: "4. Compte rendu et communication", c: [
    C("d1", "Compte rendu au CODIS", "Je suis / Je vois / Je fais / Je demande : informations exactes, moyens demandés justes.", 2),
    C("d2", "Expression et vocabulaire opérationnel", "Vocabulaire précis, ton assuré, phrases courtes.", 1),
    C("d3", "Gestion du temps", "Respect de la durée conseillée, rythme tenu sans précipitation.", 1)] },
];
export const FICHE_SMES = { id: "smes", t: "5. Ordre de mission (SMES)", c: [
  C("m1", "Situation transmise", "Ce qui se passe, où, qui est concerné, éléments connus et inconnus, en peu de mots.", 2),
  C("m2", "Mission claire", "Objectif à atteindre précis, mesurable, adapté aux moyens du binôme ou de l'équipe.", 3, 1),
  C("m3", "Exécution", "Actions, moyens et enchaînement détaillés ; l'exécutant peut répéter l'ordre sans ambiguïté.", 2),
  C("m4", "Sécurité", "Risques, périmètre, EPI et conduite à tenir en cas de danger annoncés avant le départ.", 3, 1)] };

const copie = (x) => JSON.parse(JSON.stringify(x));
// Fiche de référence du gestionnaire (modifiable) : users/{uid}/perso/fiche
export async function chargerModele(uid) {
  try {
    const s = await getDoc(doc(db, "users", uid, "perso", "fiche"));
    if (s.exists() && Array.isArray(s.data().sections) && s.data().sections.length) return s.data().sections;
  } catch { /* défaut */ }
  return copie([...FICHE_BASE, FICHE_SMES]);
}
export const enregistrerModele = (uid, sections) =>
  setDoc(doc(db, "users", uid, "perso", "fiche"), { sections: sections.map((s) => ({ id: s.id, t: s.t, c: s.c.map(({ v, ...r }) => r) })), maj: Date.now() }); // eslint-disable-line no-unused-vars
export const modeleDefaut = () => copie([...FICHE_BASE, FICHE_SMES]);
export const sansSmes = (sections) => sections.filter((s) => s.id !== "smes");

export function calculer(sections) {
  let total = 0, max = 0, rep = 0, nb = 0, e0 = 0, e1 = 0;
  sections.forEach((s) => s.c.forEach((c) => {
    nb++; max += 3 * c.k;
    if (c.v !== undefined && c.v !== null) { rep++; total += c.v * c.k; if (c.e && c.v === 0) e0++; if (c.e && c.v === 1) e1++; }
  }));
  const pct = max ? Math.round((total / max) * 100) : 0;
  let decision = "À compléter", cls = "", raison = "Notez tous les critères pour obtenir la décision.";
  if (nb && rep === nb) {
    if (e0 || pct < 50) { decision = "Non validé"; cls = "ko"; raison = e0 ? "Au moins un critère éliminatoire n'est pas acquis." : "Moins de 50 % des points."; }
    else if (pct < 70 || e1 > 0) { decision = "À consolider"; cls = "mid"; raison = pct < 70 ? "Entre 50 % et 70 % des points." : "Un critère éliminatoire est seulement en cours d'acquisition."; }
    else { decision = "Validé"; cls = "ok"; raison = "Seuil de 70 % atteint, aucun critère éliminatoire en échec."; }
  }
  return { total, max, rep, nb, pct, decision, cls, raison };
}

// Évaluations : collection « evaluations » (une par gestionnaire, stagiaire et exercice)
export const idEval = (stagId, scId, gestId) => `${stagId}_${scId}_${gestId}`;
export async function sauverEvaluation(e) {
  const r = calculer(e.sections);
  const data = { ...e, total: r.total, max: r.max, pct: r.pct, decision: r.decision, maj: Date.now() };
  await setDoc(doc(db, "evaluations", idEval(e.stagId, e.scId, e.gestId)), data);
  return data;
}
export const supprimerEvaluation = (e) => deleteDoc(doc(db, "evaluations", idEval(e.stagId, e.scId, e.gestId)));
export async function evaluationsDe(stagId, gestId) {
  const q = gestId ? query(collection(db, "evaluations"), where("stagId", "==", stagId), where("gestId", "==", gestId)) : query(collection(db, "evaluations"), where("stagId", "==", stagId));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.maj || 0) - (a.maj || 0));
}
export async function evaluationsDeGest(gestId) {
  return (await getDocs(query(collection(db, "evaluations"), where("gestId", "==", gestId)))).docs.map((d) => ({ id: d.id, ...d.data() }));
}
export const evaluationExistante = async (stagId, scId, gestId) => {
  const s = await getDoc(doc(db, "evaluations", idEval(stagId, scId, gestId)));
  return s.exists() ? { id: s.id, ...s.data() } : null;
};

// Export PDF d'une fiche remplie
export async function pdfFiche(e) {
  const { jsPDF } = await import("jspdf");
  const at = await import("jspdf-autotable");
  const autoTable = [at.default, at.default?.default, at.autoTable].find((f) => typeof f === "function");
  const { nomApp, rvbCharte } = await import("./charte");
  const doc0 = new jsPDF({ unit: "mm", format: "a4" });
  doc0.setFillColor(...rvbCharte()); doc0.rect(0, 0, 210, 18, "F");
  doc0.setTextColor(255); doc0.setFontSize(14); doc0.text(nomApp(), 14, 12);
  doc0.setTextColor(30); doc0.setFontSize(16); doc0.text("Fiche d'évaluation", 14, 30);
  doc0.setFontSize(10); doc0.setTextColor(100);
  doc0.text(`${e.stagNom || "Stagiaire"} · ${e.scTitre || ""}`, 14, 37);
  doc0.text(`Évaluateur : ${e.gestNom || "—"} · ${fmtDate(e.maj || Date.now())}`, 14, 42);
  doc0.setTextColor(30);
  const r = calculer(e.sections);
  autoTable(doc0, { startY: 47, body: [["Résultat", `${r.total} / ${r.max} points (${r.pct} %)`], ["Décision", r.decision]], theme: "plain", styles: { fontSize: 11 }, columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } } });
  e.sections.forEach((s) => {
    autoTable(doc0, {
      startY: (doc0.lastAutoTable?.finalY || 50) + 6,
      head: [[s.t, "Coef.", "Niveau"]],
      body: s.c.map((c) => [`${c.n}${c.e ? "  (éliminatoire)" : ""}`, String(c.k), c.v === undefined || c.v === null ? "—" : `${c.v} · ${NIVEAUX[c.v]}`]),
      styles: { fontSize: 9 }, headStyles: { fillColor: rvbCharte() }, columnStyles: { 1: { cellWidth: 16 }, 2: { cellWidth: 36 } },
    });
  });
  autoTable(doc0, { startY: (doc0.lastAutoTable?.finalY || 50) + 6, head: [["Points forts", "Axes de progrès"]], body: [[e.forts || "—", e.progres || "—"]], styles: { fontSize: 9 }, headStyles: { fillColor: rvbCharte() } });
  const n = doc0.getNumberOfPages();
  for (let i = 1; i <= n; i++) { doc0.setPage(i); doc0.setFontSize(8); doc0.setTextColor(120); doc0.text(`Page ${i}/${n}`, 196, 290, { align: "right" }); }
  doc0.save(`fiche-${(e.stagNom || "stagiaire").replace(/\W+/g, "-")}-${(e.scTitre || "exercice").replace(/\W+/g, "-").slice(0, 30)}.pdf`);
}
