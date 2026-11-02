import { db, auth } from "../firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { mettreEssai } from "./calculs";
import { ajouterXp, ptsExercice, annonceXp } from "./xp";

// Scénarios « Décision » (chef d'équipe) : scenariosDecision/{id}.
const col = () => collection(db, "scenariosDecision");
const clean = (o) => JSON.parse(JSON.stringify(o));
export async function listDecision(uid, admin) {
  // Les règles autorisent : tout pour l'admin ; sinon les scénarios publiés + les siens.
  const snaps = admin ? [await getDocs(col())] : [await getDocs(query(col(), where("publie", "==", true))), ...(uid ? [await getDocs(query(col(), where("auteur", "==", uid)))] : [])];
  const m = new Map();
  snaps.forEach((s) => s.docs.forEach((d) => m.set(d.id, { id: d.id, ...d.data() })));
  return [...m.values()].sort((a, b) => (a.o || 0) - (b.o || 0));
}
export const saveDecision = (id, d) => {
  const { id: _i, ...r } = d; // eslint-disable-line no-unused-vars
  const ref = id ? doc(db, "scenariosDecision", id) : doc(col());
  return setDoc(ref, clean(r)).then(() => ref.id);
};
export const deleteDecision = (id) => deleteDoc(doc(db, "scenariosDecision", id));
// Résultat : stocké comme un essai d'exercice (users.calculs[id]) + XP.
export async function saveResultDecision(uid, profil, sc, essai, refresh) {
  const g = ajouterXp(profil?.xp, "dec_" + sc.id, ptsExercice(essai.ok, essai.tot));
  await updateDoc(doc(db, "users", uid), { calculs: mettreEssai(profil?.calculs, sc.id, essai), xp: g.xp });
  annonceXp(g.gain);
  if (refresh) refresh();
  return { gain: g.gain };
}

// Pour le catalogue des exercices (accueil, suivi, parcours) : kind "dec". toutes = brouillons inclus (admin ; sinon les siens).
export async function listDecisionExercices(toutes) {
  const uid = auth?.currentUser?.uid || "";
  let l = [];
  if (toutes) { try { l = (await getDocs(col())).docs.map((d) => ({ id: d.id, ...d.data() })); } catch (e) { l = []; } }
  if (!l.length) {
    const qs = [getDocs(query(col(), where("publie", "==", true)))];
    if (toutes && uid) qs.push(getDocs(query(col(), where("auteur", "==", uid))));
    const m = new Map();
    (await Promise.all(qs.map((p) => p.catch(() => ({ docs: [] }))))).forEach((s) => s.docs.forEach((d) => m.set(d.id, { id: d.id, ...d.data() })));
    l = [...m.values()];
  }
  return l.filter((x) => toutes || x.publie).map((x) => ({ ...x, kind: "dec", description: x.contexte || "", cadres: x.cadres && x.cadres.length ? x.cadres : ["cet"] })).sort((a, b) => (a.o || 0) - (b.o || 0));
}
