import { db, auth } from "../firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { mettreEssai } from "./calculs";
import { ajouterXp, ptsExercice, annonceXp } from "./xp";

// Situations en images (reconnaissance) : scenariosReco/{id}.
const col = () => collection(db, "scenariosReco");
const clean = (o) => JSON.parse(JSON.stringify(o));
export async function listReco(uid, admin) {
  // Les règles autorisent : tout pour l'admin ; sinon les scénarios publiés + les siens.
  const snaps = admin ? [await getDocs(col())] : [await getDocs(query(col(), where("publie", "==", true))), ...(uid ? [await getDocs(query(col(), where("auteur", "==", uid)))] : [])];
  const m = new Map();
  snaps.forEach((s) => s.docs.forEach((d) => m.set(d.id, { id: d.id, ...d.data() })));
  return [...m.values()].sort((a, b) => (a.o || 0) - (b.o || 0));
}
export const saveReco = (id, d) => {
  const { id: _i, ...r } = d; // eslint-disable-line no-unused-vars
  const ref = id ? doc(db, "scenariosReco", id) : doc(col());
  return setDoc(ref, clean(r)).then(() => ref.id);
};
export const deleteReco = (id) => deleteDoc(doc(db, "scenariosReco", id));
// Résultat : stocké comme un essai d'exercice (users.calculs[id]) + XP.
export async function saveResultReco(uid, profil, sc, essai, refresh) {
  const g = ajouterXp(profil?.xp, "reco_" + sc.id, ptsExercice(essai.ok, essai.tot));
  await updateDoc(doc(db, "users", uid), { calculs: mettreEssai(profil?.calculs, sc.id, essai), xp: g.xp });
  annonceXp(g.gain);
  if (refresh) refresh();
  return { gain: g.gain };
}

// Image d'exemple (photo fournie avec l'application) → data URL.
export async function imageExemple() {
  const r = await fetch("/reco-exemple.jpg");
  const b = await r.blob();
  return new Promise((ok, ko) => { const f = new FileReader(); f.onload = () => ok(f.result); f.onerror = ko; f.readAsDataURL(b); });
}
// Espace d'où l'on vient (?esp=admin|gestion) ; sinon stagiaire si une situation est ouverte, sinon l'espace du compte.
export function espaceReco(pathname, search, isAdmin, gestionnaire) {
  const esp = new URLSearchParams(search || "").get("esp");
  if (esp === "admin" && isAdmin) return "admin";
  if (esp === "gestion" && (gestionnaire || isAdmin)) return "gestion";
  if (esp === "stagiaire" || /^\/reco\/./.test(pathname)) return "stagiaire";
  return isAdmin ? "admin" : gestionnaire ? "gestion" : "stagiaire";
}
