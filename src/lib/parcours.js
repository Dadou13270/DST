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

// Séquence effective : l'exercice diagnostic (s'il y en a un) ouvre le parcours.
export const sequenceParcours = (p) => (p.diag && p.diagId ? [p.diagId, ...(p.scIds || []).filter((x) => x !== p.diagId)] : p.scIds || []);

// Objectifs intermédiaires : une « marche » par ligne (8 max, 160 caractères chacune).
export const lignesObjectifs = (t) => String(t || "").split("\n").map((x) => x.trim().slice(0, 160)).filter(Boolean).slice(0, 8);
export async function saveParcours(id, data, uid, nom) {
  const nObj = lignesObjectifs(data.objTxt !== undefined ? data.objTxt : (data.objectifs || []).join("\n")).length;
  const liens = {}; Object.entries(data.objLiens || {}).forEach(([k, v]) => { if ((data.scIds || []).includes(k) && Number.isInteger(v) && v >= 0 && v < nObj) liens[k] = v; });
  const ref = id ? doc(db, "parcours", id) : doc(col());
  await setDoc(ref, {
    titre: data.titre.trim(), objectif: (data.objectif || "").trim(), prerequis: (data.prerequis || "").trim().slice(0, 400), objLiens: liens, objectifs: lignesObjectifs(data.objTxt !== undefined ? data.objTxt : (data.objectifs || []).join("\n")), description: (data.description || "").trim(), scIds: data.scIds,
    ordre: !!data.ordre, partage: !!data.partage, diag: !!(data.diag && data.diagId), diagId: data.diag && data.diagId ? data.diagId : "",
    owner: data.owner || uid, ownerNom: data.ownerNom || nom || "", maj: Date.now(),
  });
  return ref.id;
}
export const supprimerParcours = (id) => deleteDoc(doc(db, "parcours", id));
export const dupliquerParcours = (p, uid, nom) =>
  saveParcours(null, { ...p, titre: p.titre + " (copie)", partage: false, owner: uid, ownerNom: nom }, uid, nom);
