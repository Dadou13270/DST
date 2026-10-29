import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { envoyer as envoyerMessage } from "./messages";

// Exercices à rendre par une équipe : teams/{id}.devoirs = [{ scId, titre, limite(ms) }]
export const getEquipe = async (id) => {
  const s = await getDoc(doc(db, "teams", id));
  return s.exists() ? { id: s.id, ...s.data() } : null;
};
export const ajouterDevoir = (team, d) =>
  updateDoc(doc(db, "teams", team.id), { devoirs: [...(team.devoirs || []), d] });
export const retirerDevoir = (team, scId) =>
  updateDoc(doc(db, "teams", team.id), { devoirs: (team.devoirs || []).filter((x) => x.scId !== scId) });

// "ok" terminé · "retard" échéance dépassée · "attente" à rendre
export const statutDevoir = (d, bilans, now = Date.now(), calculs) =>
  (bilans || {})[d.scId] || ((calculs || {})[d.scId] || []).length ? "ok" : d.limite && d.limite < now ? "retard" : "attente";
export const fmtLimite = (ms) => (ms ? new Date(ms).toLocaleDateString("fr-FR") : "—");
// Date saisie (aaaa-mm-jj) -> fin de journée locale
export const limiteDepuisInput = (v) => (v ? new Date(v + "T23:59:59").getTime() : 0);

// Parcours : ajoute en une fois les exercices d'un parcours (sans doublon) avec la même échéance.
export const assignerParcours = (team, pc, scs, limite) => {
  const have = new Set((team.devoirs || []).map((d) => d.scId));
  const add = [];
  (pc.scIds || []).forEach((scId, i) => {
    const x = scs.find((y) => y.id === scId);
    if (x && !have.has(scId)) add.push({ scId, titre: x.titre, limite, pc: pc.id, pcT: pc.titre, rg: i, pcO: pc.ordre ? 1 : 0, ...(x.kind && x.kind !== "sc" ? { k: x.kind } : {}) });
  });
  if (!add.length) return Promise.resolve(0);
  return updateDoc(doc(db, "teams", team.id), { devoirs: [...(team.devoirs || []), ...add] }).then(() => add.length);
};
export const retirerParcours = (team, pcId) =>
  updateDoc(doc(db, "teams", team.id), { devoirs: (team.devoirs || []).filter((x) => x.pc !== pcId) });

// Modifier l'échéance d'un exercice à rendre, ou décaler tout un parcours (nouvelle date commune).
export const modifierLimite = (team, scId, limite) =>
  updateDoc(doc(db, "teams", team.id), { devoirs: (team.devoirs || []).map((x) => (x.scId === scId ? { ...x, limite } : x)) });
export const modifierLimiteParcours = (team, pcId, limite) =>
  updateDoc(doc(db, "teams", team.id), { devoirs: (team.devoirs || []).map((x) => (x.pc === pcId ? { ...x, limite } : x)) });
// Date -> valeur d'un <input type="date">
export const inputDepuisLimite = (ms) => (ms ? new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 10) : "");

// Relances : message privé aux stagiaires en retard (un message par stagiaire, quel que soit le nombre d'exercices en retard).
export const MODELE_RELANCE = "Bonjour {nom}, l'exercice {exercice} devait être rendu au plus tard le {date}. Peux-tu le faire dès que possible ? Merci.";
export const texteRelance = (modele, u, ds) =>
  modele
    .replaceAll("{nom}", (u.nom || "").split(" ")[0] || "")
    .replaceAll("{exercice}", ds.map((d) => `« ${d.titre} »`).join(", "))
    .replaceAll("{date}", fmtLimite(Math.min(...ds.map((d) => d.limite || Infinity))));
// lignes : [{ u, d }] ; retourne le nombre de stagiaires relancés
export async function relancer(team, gest, lignes, modele) {
  const par = new Map();
  lignes.forEach(({ u, d }) => par.set(u.id, { u, ds: [...(par.get(u.id)?.ds || []), d] }));
  const maj = {};
  for (const { u, ds } of par.values()) {
    await envoyerMessage({ stagId: u.id, stagNom: u.nom || "Stagiaire", gestId: gest.uid, gestNom: gest.nom || "Formateur", de: gest.uid, texte: texteRelance(modele, u, ds) });
    ds.forEach((d) => { maj[`relances.${u.id}_${d.scId}`] = Date.now(); });
  }
  if (Object.keys(maj).length) await updateDoc(doc(db, "teams", team.id), maj);
  return par.size;
}
