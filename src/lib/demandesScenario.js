import { db } from "../firebase";
import { collection, doc, getDocs, addDoc, updateDoc, query, where, serverTimestamp } from "firebase/firestore";

// Demandes de scénarios faites par les gestionnaires, traitées par l'admin (Paramètres).
export const STATUTS = { nouvelle: "Nouvelle", en_cours: "En cours", livree: "Livrée", refusee: "Refusée" };

export const creerDemande = (uid, nom, { titre, rubrique, details }) =>
  addDoc(collection(db, "demandesScenario"), {
    demandeur: uid, demandeurNom: nom || "", titre, rubrique: rubrique || "", details: details || "",
    statut: "nouvelle", scenarioId: "", creeLe: serverTimestamp(),
  });

const tri = (a, b) => (b.creeLe?.seconds || 0) - (a.creeLe?.seconds || 0);

export async function listMesDemandes(uid) {
  const s = await getDocs(query(collection(db, "demandesScenario"), where("demandeur", "==", uid)));
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).sort(tri);
}

export async function listDemandes() {
  const s = await getDocs(collection(db, "demandesScenario"));
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).sort(tri);
}

export const majDemande = (id, patch) => updateDoc(doc(db, "demandesScenario", id), patch);

export async function listGestionnaires() {
  const s = await getDocs(query(collection(db, "users"), where("gestionnaire", "==", true)));
  return s.docs.map((d) => ({ id: d.id, nom: d.data().nom || d.data().email || d.id })).sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}
