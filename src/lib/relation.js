import { db } from "../firebase";
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { listScenarios } from "./db";
import { rubriquesDe } from "./model";
import s1 from "../../seeds-relation/01-pere-accident.json";
import s2 from "../../seeds-relation/02-sinistree-chat.json";
import s3 from "../../seeds-relation/03-alcool-voie-publique.json";
import s4 from "../../seeds-relation/04-arret-cardiaque-epouse.json";
import s5 from "../../seeds-relation/05-conducteur-refus.json";
import s6 from "../../seeds-relation/06-mari-match.json";
import s7 from "../../seeds-relation/07-gerant-sans-abri.json";
import s8 from "../../seeds-relation/08-frere-aidant.json";

import { listCalculs } from "./calculs";
import { listQuiz } from "./quiz";
export * from "./relationCore";
const col = () => collection(db, "exercicesRelation");
const clean = (o) => JSON.parse(JSON.stringify(o));
export async function listRelations(toutes) {
  const snap = await getDocs(col());
  const l = snap.docs.map((d) => ({ id: d.id, kind: "rel", ...d.data() }));
  return l.filter((x) => toutes || x.publie).sort((a, b) => (a.o || 0) - (b.o || 0) || (a.titre || "").localeCompare(b.titre || "", "fr"));
}
export const saveRelation = (id, d) => {
  const { kind, ...r } = d;
  const ref = id ? doc(db, "exercicesRelation", id) : doc(col());
  return setDoc(ref, clean({ ...r, o: r.o || Date.now() })).then(() => ref.id);
};
export const deleteRelation = (id) => deleteDoc(doc(db, "exercicesRelation", id));
export const dupRelation = (x) => { const { id, kind, ...d } = x; return saveRelation("", { ...d, titre: d.titre + " (copie)", publie: false, o: Date.now() }); };
export const SEEDS_REL = [s1, s2, s3, s4, s5, s6, s7, s8];
// Importe uniquement les exercices manquants (ids rel1…rel8) : ne remplace jamais une version modifiée.
export const seedRelations = (existants = []) => Promise.all(SEEDS_REL.map((x, i) => (existants.includes("rel" + (i + 1)) ? null : saveRelation("rel" + (i + 1), { ...x, o: i + 1 }))));

// Exercices de calcul + relationnels (hors scénarios). ctx = { uid, equipeId } : applique la visibilité « réservé à un gestionnaire ».
export async function listExercices(toutes, ctx) {
  const [a, b, c] = await Promise.all([listCalculs(toutes).catch(() => []), listRelations(toutes).catch(() => []), listQuiz(toutes).catch(() => [])]);
  const l = [...a.map((x) => ({ ...x, kind: "calc" })), ...b, ...c];
  if (toutes || !ctx) return l;
  const owners = new Set();
  for (const id of ctx.equipeIds || (ctx.equipeId ? [ctx.equipeId] : [])) { const t = await getDoc(doc(db, "teams", id)).catch(() => null); if (t?.exists()) owners.add(t.data().owner); }
  return l.filter((x) => !x.reserveA || x.reserveA === ctx.uid || owners.has(x.reserveA));
}
export const typeExercice = (e) => (e && e.kind === "rel" ? "Relationnel" : e && e.kind === "quiz" ? (e.format === "quiz" ? "Quiz" : "QCM") : "Calcul LIF");
export const lienExercice = (e) => (e.kind === "rel" ? `/relation/${e.id}` : e.kind === "quiz" ? `/quiz/${e.id}` : `/calculs/${e.id}`);
export const lienAdminExercice = (e) => (e.kind === "rel" ? `/admin/relation/${e.id}` : e.kind === "quiz" ? `/admin/quiz/${e.id}` : `/admin/calcul/${e.id}`);
const colExercice = (k) => (k === "rel" ? "exercicesRelation" : k === "quiz" ? "exercicesQuiz" : "exercicesCalcul");
export const setReserveExercice = (e, uid) => updateDoc(doc(db, colExercice(e.kind), e.id), { reserveA: uid || null });
// Catalogue complet (scénarios + exercices) visible pour l'utilisateur.
export async function listCatalogue(ctx) {
  const [sc, ex] = await Promise.all([listScenarios(true, ctx).catch(() => []), listExercices(false, ctx)]);
  return [...sc.map((x) => ({ ...x, kind: "sc" })), ...ex];
}
// Rubriques : liste de base + toutes celles utilisées par un scénario ou un exercice.
export async function toutesRubriques() {
  const [sc, ex] = await Promise.all([listScenarios(false).catch(() => []), listExercices(true)]);
  return rubriquesDe([...sc, ...ex]);
}
