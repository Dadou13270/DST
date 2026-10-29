import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { setGestionnaire } from "./equipes";

// Demande « devenir gestionnaire » : demandesGest/{uid}, traitée par l'admin (accepter = droit gestionnaire accordé).
export const getMaDemandeGest = async (uid) => {
  const s = await getDoc(doc(db, "demandesGest", uid)).catch(() => null);
  return s?.exists() ? { id: s.id, ...s.data() } : null;
};
export const envoyerDemandeGest = (uid, profil, email, motif) =>
  setDoc(doc(db, "demandesGest", uid), {
    uid, nom: profil.nom || "", email: email || profil.email || "", grade: profil.grade || "", cis: profil.cis || "", departement: profil.departement || "",
    motif: motif.trim().slice(0, 1000), statut: "attente", le: Date.now(),
  });
export const listDemandesGest = async () => {
  const s = await getDocs(collection(db, "demandesGest"));
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.le || 0) - (a.le || 0));
};
export async function traiterDemandeGest(d, accepte, par, raison = "") {
  if (accepte) await setGestionnaire(d.uid, true);
  await updateDoc(doc(db, "demandesGest", d.id), { statut: accepte ? "acceptee" : "refusee", raison: raison.trim().slice(0, 300), traiteLe: Date.now(), traitePar: par || "" });
}
