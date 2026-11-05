import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { setGestionnaire } from "./equipes";
import { setAdminDept } from "./users";

// Inscription d'un SDIS : sdis/{uid du référent}. L'admin valide puis attribue le rôle au référent.
export const getMonSdis = async (uid) => {
  const s = await getDoc(doc(db, "sdis", uid)).catch(() => null);
  return s?.exists() ? { id: s.id, ...s.data() } : null;
};
const t = (v, n) => String(v || "").trim().slice(0, n);
export const inscrireSdis = (uid, f) =>
  setDoc(doc(db, "sdis", uid), {
    uid, nom: t(f.nom, 120), departement: t(f.departement, 60), ville: t(f.ville, 120),
    refNom: t(f.refNom, 100), refFonction: t(f.refFonction, 100), email: t(f.email, 120), tel: t(f.tel, 30),
    nbCis: Number(f.nbCis) || 0, nbStagiaires: Number(f.nbStagiaires) || 0, message: t(f.message, 1000),
    statut: "attente", le: Date.now(),
  });
export const listSdis = async () => {
  const s = await getDocs(collection(db, "sdis"));
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.le || 0) - (a.le || 0));
};
// role : "" | "gestionnaire" | "dept"
export async function attribuerRoleSdis(s, role) {
  await setGestionnaire(s.uid, role === "gestionnaire");
  await setAdminDept(s.uid, role === "dept" ? s.departement : "");
  await updateDoc(doc(db, "sdis", s.id), { statut: "valide", role, traiteLe: Date.now() });
}
export const refuserSdis = (s, raison = "") =>
  updateDoc(doc(db, "sdis", s.id), { statut: "refuse", raison: raison.trim().slice(0, 300), traiteLe: Date.now() });
export const supprimerSdis = (s) => deleteDoc(doc(db, "sdis", s.id));
