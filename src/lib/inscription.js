import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { cfg } from "../firebase";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
export const genMdp = () => Array.from({ length: 10 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Lignes « Nom ; e-mail ; mot de passe (facultatif) » -> [{nom,email,mdp}]
export function parseLignes(txt) {
  return txt.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const [nom, email, mdp] = l.split(/[;\t]/).map((x) => (x || "").trim());
    return { nom, email: (email || "").toLowerCase(), mdp: mdp || genMdp() };
  });
}

// Crée le compte avec une 2e instance Firebase (la session du gestionnaire n'est pas touchée),
// puis le profil rattaché à l'équipe (validé par le code d'équipe dans les règles).
export async function inscrireStagiaire({ nom, email, mdp }, team, gestUid) {
  if (nom.length < 2) throw new Error("Nom manquant.");
  if (!EMAIL.test(email)) throw new Error("E-mail invalide.");
  if (mdp.length < 6) throw new Error("Mot de passe trop court (6 caractères minimum).");
  const sec = initializeApp(cfg, "inscription-" + Date.now() + Math.random());
  try {
    const a = getAuth(sec);
    let c;
    try { c = await createUserWithEmailAndPassword(a, email, mdp); }
    catch (e) { throw new Error(e.code === "auth/email-already-in-use" ? "E-mail déjà inscrit (le stagiaire peut rejoindre l'équipe avec le code)." : e.code === "auth/weak-password" ? "Mot de passe trop faible." : e.message); }
    await updateProfile(c.user, { displayName: nom }).catch(() => {});
    await setDoc(doc(getFirestore(sec), "users", c.user.uid), {
      email, nom, statut: "actif", creeLe: serverTimestamp(), derniereConnexion: serverTimestamp(),
      creePar: gestUid, mdpProvisoire: true,
      equipeId: team.id, equipeNom: team.nom, equipeCode: team.code, equipeGest: team.ownerNom || "",
    });
    await signOut(a);
  } finally {
    await deleteApp(sec).catch(() => {});
  }
}

// Création d'un compte par l'administrateur (sans équipe) ; la session de l'admin n'est pas touchée.
export async function creerUtilisateur({ nom, email, mdp }, adminUid) {
  if (nom.length < 2) throw new Error("Nom manquant.");
  if (!EMAIL.test(email)) throw new Error("E-mail invalide.");
  if (mdp.length < 6) throw new Error("Mot de passe trop court (6 caractères minimum).");
  const sec = initializeApp(cfg, "creation-" + Date.now() + Math.random());
  try {
    const a = getAuth(sec);
    let c;
    try { c = await createUserWithEmailAndPassword(a, email, mdp); }
    catch (e) { throw new Error(e.code === "auth/email-already-in-use" ? "E-mail déjà inscrit." : e.code === "auth/weak-password" ? "Mot de passe trop faible." : e.message); }
    await updateProfile(c.user, { displayName: nom }).catch(() => {});
    await setDoc(doc(getFirestore(sec), "users", c.user.uid), {
      email, nom, statut: "actif", creeLe: serverTimestamp(), derniereConnexion: serverTimestamp(),
      creePar: adminUid, mdpProvisoire: true,
    });
    await signOut(a);
    return c.user.uid;
  } finally {
    await deleteApp(sec).catch(() => {});
  }
}
