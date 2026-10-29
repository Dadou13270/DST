import { db } from "../firebase";
import { collection, doc, addDoc, deleteDoc, getDocs, onSnapshot, updateDoc } from "firebase/firestore";

// Annonces globales : annonces/{id} = { texte, niveau: "info"|"alerte", cible: {type: "all"|"gest"|"dep"|"cis", dep, cis}, fin (ms|0), actif, le, par }
export const CIBLES = { all: "Tous les utilisateurs", gest: "Les gestionnaires", dep: "Un département", cis: "Un CIS" };
const norm = (v) => (v || "").toString().trim().toLowerCase();

export const creerAnnonce = (a, par, deptAuteur = "") =>
  addDoc(collection(db, "annonces"), { deptAuteur, texte: a.texte.trim().slice(0, 600), niveau: a.niveau, cible: a.cible, fin: a.fin || 0, actif: true, le: Date.now(), par: par || "" });
export const listAnnonces = async () => {
  const s = await getDocs(collection(db, "annonces"));
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.le || 0) - (a.le || 0));
};
export const majAnnonce = (id, patch) => updateDoc(doc(db, "annonces", id), patch);
export const supprimerAnnonce = (id) => deleteDoc(doc(db, "annonces", id));
export const watchAnnonces = (cb) => onSnapshot(collection(db, "annonces"), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => cb([]));

// Cette annonce concerne-t-elle ce profil ?
export const visiblePour = (a, profil, now = Date.now()) => {
  if (!a.actif || (a.fin && a.fin < now)) return false;
  const c = a.cible || { type: "all" };
  if (c.type === "gest") return !!profil?.gestionnaire;
  if (c.type === "dep") return norm(profil?.departement) === norm(c.dep);
  if (c.type === "cis") return norm(profil?.cis) === norm(c.cis) && (!c.dep || norm(profil?.departement) === norm(c.dep));
  return true;
};
