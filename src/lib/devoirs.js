import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

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
export const statutDevoir = (d, bilans, now = Date.now()) =>
  (bilans || {})[d.scId] ? "ok" : d.limite && d.limite < now ? "retard" : "attente";
export const fmtLimite = (ms) => (ms ? new Date(ms).toLocaleDateString("fr-FR") : "—");
// Date saisie (aaaa-mm-jj) -> fin de journée locale
export const limiteDepuisInput = (v) => (v ? new Date(v + "T23:59:59").getTime() : 0);

// Parcours : ajoute en une fois les exercices d'un parcours (sans doublon) avec la même échéance.
export const assignerParcours = (team, pc, scs, limite) => {
  const have = new Set((team.devoirs || []).map((d) => d.scId));
  const add = [];
  (pc.scIds || []).forEach((scId, i) => {
    const x = scs.find((y) => y.id === scId);
    if (x && !have.has(scId)) add.push({ scId, titre: x.titre, limite, pc: pc.id, pcT: pc.titre, rg: i, pcO: pc.ordre ? 1 : 0 });
  });
  if (!add.length) return Promise.resolve(0);
  return updateDoc(doc(db, "teams", team.id), { devoirs: [...(team.devoirs || []), ...add] }).then(() => add.length);
};
export const retirerParcours = (team, pcId) =>
  updateDoc(doc(db, "teams", team.id), { devoirs: (team.devoirs || []).filter((x) => x.pc !== pcId) });
