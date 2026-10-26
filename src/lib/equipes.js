import { db } from "../firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, deleteField, query, where, serverTimestamp, writeBatch, arrayUnion } from "firebase/firestore";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I
const genCode = () => Array.from({ length: 6 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("");
export const normCode = (c) => (c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

// --- gestionnaire ---
export const setGestionnaire = (uid, on) => updateDoc(doc(db, "users", uid), { gestionnaire: on });

export async function listMesEquipes(uid) {
  const s = await getDocs(query(collection(db, "teams"), where("owner", "==", uid)));
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.nom || "").localeCompare(b.nom || "", "fr"));
}

async function reserveCode(teamId, owner, nom, ownerNom) {
  for (let i = 0; i < 8; i++) {
    const code = genCode();
    const ref = doc(db, "codes", code);
    if ((await getDoc(ref).catch(() => null))?.exists()) continue;
    await setDoc(ref, { teamId, owner, nom, ownerNom });
    return code;
  }
  throw new Error("Impossible de générer un code, réessaie.");
}

export async function createEquipe(owner, ownerNom, nom) {
  const ref = doc(collection(db, "teams"));
  await setDoc(ref, { nom, owner, ownerNom, code: "", creeLe: serverTimestamp() });
  const code = await reserveCode(ref.id, owner, nom, ownerNom);
  await updateDoc(ref, { code });
  return { id: ref.id, nom, owner, ownerNom, code };
}

export async function regenCode(team) {
  const code = await reserveCode(team.id, team.owner, team.nom, team.ownerNom);
  await updateDoc(doc(db, "teams", team.id), { code });
  if (team.code) await deleteDoc(doc(db, "codes", team.code)).catch(() => {});
  return code;
}

export async function listMembres(teamId) {
  const s = await getDocs(query(collection(db, "users"), where("equipeId", "==", teamId)));
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.nom || "").localeCompare(b.nom || "", "fr"));
}

const quitter = { equipeId: deleteField(), equipeNom: deleteField(), equipeCode: deleteField(), equipeGest: deleteField() };
export const retirerMembre = (uid) => updateDoc(doc(db, "users", uid), quitter);

export async function supprimerEquipe(team) {
  const m = await listMembres(team.id);
  const b = writeBatch(db);
  m.forEach((u) => b.update(doc(db, "users", u.id), quitter));
  await b.commit();
  if (team.code) await deleteDoc(doc(db, "codes", team.code)).catch(() => {});
  await deleteDoc(doc(db, "teams", team.id));
}

// --- stagiaire ---
export async function rejoindre(uid, codeSaisi) {
  const code = normCode(codeSaisi);
  if (code.length < 4) throw new Error("Code invalide.");
  const c = await getDoc(doc(db, "codes", code)).catch(() => null);
  if (!c || !c.exists()) throw new Error("Code inconnu.");
  const nom = c.data().nom || "Équipe";
  await updateDoc(doc(db, "users", uid), { equipeId: c.data().teamId, equipeNom: nom, equipeCode: code, equipeGest: c.data().ownerNom || "" });
  return { equipeId: c.data().teamId, equipeNom: nom };
}
export const quitterEquipe = (uid) => updateDoc(doc(db, "users", uid), quitter);

// Le gestionnaire déplace un membre vers une autre de ses équipes.
export const deplacerMembre = (uid, team) =>
  updateDoc(doc(db, "users", uid), { equipeId: team.id, equipeNom: team.nom, equipeCode: team.code, equipeGest: team.ownerNom || "" });

// Commentaire du formateur sur un exercice d'un stagiaire : users/{uid}.commentaires[scId]
// Fil de discussion formateur ↔ stagiaire sur un exercice.
// Formateur : users/{uid}.commentaires[scId] = { texte, auteur, le, fil: [{texte, auteur, le}], vu }
// Stagiaire : users/{uid}.reponses[scId] = [{ texte, le }]
export const envoyerMessageFormateur = (u, scId, texte, auteur) => {
  const c = (u.commentaires || {})[scId], now = Date.now(), t = texte.trim();
  const val = c ? { ...c, fil: [...(c.fil || []), { texte: t, auteur, le: now }], vu: now } : { texte: t, auteur, le: now, vu: now };
  return updateDoc(doc(db, "users", u.id), { ["commentaires." + scId]: val });
};
export const marquerFilLu = (u, scId) => {
  const c = (u.commentaires || {})[scId];
  return c ? updateDoc(doc(db, "users", u.id), { ["commentaires." + scId]: { ...c, vu: Date.now() } }) : Promise.resolve();
};
export const effacerFil = (uid, scId) =>
  updateDoc(doc(db, "users", uid), { ["commentaires." + scId]: deleteField(), ["reponses." + scId]: deleteField() });
export const repondreFormateur = (uid, scId, texte) =>
  updateDoc(doc(db, "users", uid), { ["reponses." + scId]: arrayUnion({ texte: texte.trim(), le: Date.now() }) });

export const setCommentaire = (uid, scId, texte, auteur) =>
  updateDoc(doc(db, "users", uid), {
    ["commentaires." + scId]: texte.trim() ? { texte: texte.trim(), auteur, le: Date.now() } : deleteField(),
  });

// Utilisateurs du même CIS (et département) que le gestionnaire : pour les affecter à une équipe.
export async function listUtilisateursCis(departement, cis) {
  if (!cis) return [];
  const s = await getDocs(query(collection(db, "users"), where("departement", "==", departement || ""), where("cis", "==", cis)));
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.statut !== "suspendu").sort((a, b) => (a.nom || "").localeCompare(b.nom || "", "fr"));
}
export const affecterMembre = deplacerMembre;
