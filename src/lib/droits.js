import { useEffect, useState } from "react";
import { collection, doc, getDocs, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { db } from "../firebase";

// Droits d'accès : doc site/droits = { mode: "aucun" | "tous" | "choix", deps: [départements autorisés] }
// Éditeur de scénarios ouvert aux gestionnaires : « tous », ou seulement ceux des départements listés (mode « choix »).
export const DROITS_DEFAUT = { mode: "aucun", deps: [], quiz: { mode: "aucun", deps: [] }, evt: { mode: "aucun", deps: [] } };

export function useDroits() {
  const [d, setD] = useState(null);
  useEffect(() => {
    if (!db) { setD(DROITS_DEFAUT); return; }
    return onSnapshot(doc(db, "site", "droits"), (s) => setD({ ...DROITS_DEFAUT, ...(s.exists() ? s.data() : {}), quiz: { ...DROITS_DEFAUT.quiz, ...(s.exists() ? s.data().quiz || {} : {}) }, evt: { ...DROITS_DEFAUT.evt, ...(s.exists() ? s.data().evt || {} : {}) } }), () => setD(DROITS_DEFAUT));
  }, []);
  return d;
}

// quoi : "scenario" (éditeur de scénarios) ou "quiz" (quiz et QCM)
export const editeurAutorise = (droits, profil, quoi = "scenario") => {
  if (!droits || !profil?.gestionnaire) return false;
  const r = quoi === "quiz" ? droits.quiz : quoi === "evt" ? droits.evt : droits;
  if (!r) return false;
  if (r.mode === "tous") return true;
  return r.mode === "choix" && (r.deps || []).includes(profil.departement || "");
};

export const sauverDroits = (d) => setDoc(doc(db, "site", "droits"), { mode: d.mode, deps: d.deps || [], quiz: { mode: d.quiz?.mode || "aucun", deps: d.quiz?.deps || [] }, evt: { mode: d.evt?.mode || "aucun", deps: d.evt?.deps || [] } });

// Départements où il y a au moins un gestionnaire (+ nombre), pour l'écran d'administration.
export async function departementsGest() {
  const s = await getDocs(query(collection(db, "users"), where("gestionnaire", "==", true)));
  const m = {};
  s.docs.forEach((d) => { const dep = d.data().departement || ""; if (dep) m[dep] = (m[dep] || 0) + 1; });
  return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0], "fr", { numeric: true }));
}
