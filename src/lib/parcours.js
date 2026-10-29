import { db } from "../firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from "firebase/firestore";

// Parcours = séquence ordonnée d'exercices (scIds) assignable à une équipe : parcours/{id}
// { titre, description, scIds[], ordre(bool), partage(bool), owner, ownerNom, maj }
const col = () => collection(db, "parcours");
const byTitre = (a, b) => (a.titre || "").localeCompare(b.titre || "", "fr");

export async function listParcours(uid, isAdmin) {
  const qs = isAdmin ? [col()] : [query(col(), where("owner", "==", uid)), query(col(), where("partage", "==", true))];
  const res = await Promise.all(qs.map((q) => getDocs(q)));
  const m = new Map();
  res.forEach((s) => s.docs.forEach((d) => m.set(d.id, { id: d.id, ...d.data() })));
  return [...m.values()].sort(byTitre);
}

export async function saveParcours(id, data, uid, nom) {
  const ref = id ? doc(db, "parcours", id) : doc(col());
  await setDoc(ref, {
    titre: data.titre.trim(), objectif: (data.objectif || "").trim(), description: (data.description || "").trim(), scIds: data.scIds,
    ordre: !!data.ordre, partage: !!data.partage,
    owner: data.owner || uid, ownerNom: data.ownerNom || nom || "", maj: Date.now(),
  });
  return ref.id;
}
export const supprimerParcours = (id) => deleteDoc(doc(db, "parcours", id));
export const dupliquerParcours = (p, uid, nom) =>
  saveParcours(null, { ...p, titre: p.titre + " (copie)", partage: false, owner: uid, ownerNom: nom }, uid, nom);
