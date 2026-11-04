import { db } from "../firebase";
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, deleteField, query, where, serverTimestamp, writeBatch, arrayUnion, increment } from "firebase/firestore";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I
const genCode = () => Array.from({ length: 6 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("");
export const normCode = (c) => (c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

// --- gestionnaire ---
export const setGestionnaire = (uid, on) => updateDoc(doc(db, "users", uid), { gestionnaire: on });

export async function listMesEquipes(uid) {
  const [a, b] = await Promise.all([
    getDocs(query(collection(db, "teams"), where("owner", "==", uid))),
    getDocs(query(collection(db, "teams"), where("co", "array-contains", uid))).catch(() => ({ docs: [] })),
  ]);
  return [...a.docs, ...b.docs].map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.nom || "").localeCompare(b.nom || "", "fr"));
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

export async function createEquipe(owner, ownerNom, nom, departement = "") {
  const ref = doc(collection(db, "teams"));
  await setDoc(ref, { nom, owner, ownerNom, code: "", departement, creeLe: serverTimestamp() });
  const code = await reserveCode(ref.id, owner, nom, ownerNom);
  await updateDoc(ref, { code });
  return { id: ref.id, nom, owner, ownerNom, code };
}

// Co-formateurs : gestionnaires du même CIS qui pilotent aussi l'équipe (ou la salle).
export async function listGestionnairesCis(profil, exclureUid) {
  if (!profil?.cis) return [];
  const l = await listUtilisateursCis(profil.departement, profil.cis);
  return l.filter((u) => u.gestionnaire && u.id !== exclureUid);
}
export const coAjouter = (col, id, obj, g) =>
  updateDoc(doc(db, col, id), { co: arrayUnion(g.id), coNoms: { ...(obj.coNoms || {}), [g.id]: g.nom || "Gestionnaire" } });
export const coRetirer = (col, id, obj, uid) => {
  const noms = { ...(obj.coNoms || {}) }; delete noms[uid];
  return updateDoc(doc(db, col, id), { co: (obj.co || []).filter((x) => x !== uid), coNoms: noms });
};

export async function regenCode(team) {
  const code = await reserveCode(team.id, team.owner, team.nom, team.ownerNom);
  await updateDoc(doc(db, "teams", team.id), { code });
  if (team.code) await deleteDoc(doc(db, "codes", team.code)).catch(() => {});
  return code;
}

// Un stagiaire peut appartenir à 4 équipes au plus : equipeId (principale), equipeId2, equipeId3, equipeId4.
// Les noms, codes et gestionnaires sont dans users/{uid}.equipes[teamId] ; equipeNom/equipeCode/equipeGest décrivent l'équipe principale.
export const SLOTS_EQ = ["equipeId", "equipeId2", "equipeId3", "equipeId4"];
export const MAX_EQUIPES = SLOTS_EQ.length;
export const idsEquipes = (p) => SLOTS_EQ.map((k) => p?.[k]).filter(Boolean);
export const estMembre = (p, tid) => !!tid && idsEquipes(p).includes(tid);
export const equipesDe = (p) => idsEquipes(p).map((id) => {
  const i = (p.equipes || {})[id] || (id === p.equipeId ? { nom: p.equipeNom, code: p.equipeCode, gest: p.equipeGest } : {});
  return { id, nom: i.nom || "Équipe", code: i.code || "", gest: i.gest || "", le: i.le || 0 };
});
// Champs à écrire pour que le profil contienne exactement cette liste d'équipes (la première devient la principale).
const champsEquipes = (l) => {
  const o = {};
  SLOTS_EQ.forEach((k, i) => { o[k] = l[i] ? l[i].id : deleteField(); });
  o.equipeNom = l[0] ? l[0].nom : deleteField();
  o.equipeCode = l[0] ? l[0].code || "" : deleteField();
  o.equipeGest = l[0] ? l[0].gest || "" : deleteField();
  o.equipes = l.length ? Object.fromEntries(l.map((t) => [t.id, { nom: t.nom, code: t.code || "", gest: t.gest || "", le: t.le || 0 }])) : deleteField();
  return o;
};
const infoEquipe = (t) => ({ id: t.id, nom: t.nom, code: t.code || "", gest: t.ownerNom || "", le: Date.now() });

export async function listMembres(teamId) {
  const snaps = await Promise.all(SLOTS_EQ.map((k) => getDocs(query(collection(db, "users"), where(k, "==", teamId))).catch(() => ({ docs: [] }))));
  const m = new Map();
  snaps.forEach((s) => s.docs.forEach((d) => m.set(d.id, { id: d.id, ...d.data() })));
  return [...m.values()].sort((a, b) => (a.nom || "").localeCompare(b.nom || "", "fr"));
}

// Le gestionnaire retire un membre de CETTE équipe (ses autres équipes sont conservées). u = profil du membre.
export const retirerMembre = (u, teamId) => updateDoc(doc(db, "users", u.id), champsEquipes(equipesDe(u).filter((t) => t.id !== teamId)));

// Archivage en fin de formation : le code d'accès est libéré (plus d'inscription), membres et suivi conservés.
export async function archiverEquipe(team) {
  await updateDoc(doc(db, "teams", team.id), { archivee: true, archiveeLe: Date.now(), code: "" });
  if (team.code) await deleteDoc(doc(db, "codes", team.code)).catch(() => {});
}
export async function restaurerEquipe(team) {
  const code = await reserveCode(team.id, team.owner, team.nom, team.ownerNom);
  await updateDoc(doc(db, "teams", team.id), { archivee: false, archiveeLe: deleteField(), code });
}
// Duplication : nouvelle équipe (nouveau code), mêmes exercices à rendre, sans les membres.
// decalage (jours) : décale les échéances copiées.
export async function dupliquerEquipe(team, nom, decalage = 0) {
  const n = await createEquipe(team.owner, team.ownerNom, nom, team.departement || "");
  const dev = (team.devoirs || []).map((d) => ({ ...d, limite: d.limite ? d.limite + decalage * 86400000 : d.limite }));
  if (dev.length) await updateDoc(doc(db, "teams", n.id), { devoirs: dev });
  return n;
}

export async function supprimerEquipe(team) {
  const m = await listMembres(team.id);
  const b = writeBatch(db);
  m.forEach((u) => b.update(doc(db, "users", u.id), champsEquipes(equipesDe(u).filter((t) => t.id !== team.id))));
  await b.commit();
  if (team.code) await deleteDoc(doc(db, "codes", team.code)).catch(() => {});
  await deleteDoc(doc(db, "teams", team.id));
}

// --- stagiaire ---
export async function rejoindre(uid, codeSaisi, profil) {
  const code = normCode(codeSaisi);
  if (code.length < 4) throw new Error("Code invalide.");
  const c = await getDoc(doc(db, "codes", code)).catch(() => null);
  if (!c || !c.exists()) throw new Error("Code inconnu.");
  const nom = c.data().nom || "Équipe", l = equipesDe(profil || {});
  if (l.some((t) => t.id === c.data().teamId)) throw new Error("Tu es déjà membre de cette équipe.");
  if (l.length >= MAX_EQUIPES) throw new Error(`Tu peux appartenir à ${MAX_EQUIPES} équipes au maximum : quitte-en une d'abord.`);
  const n = [...l, { id: c.data().teamId, nom, code, gest: c.data().ownerNom || "", le: Date.now() }];
  await updateDoc(doc(db, "users", uid), { ...champsEquipes(n), equipeCodeAjout: code });
  majNb(c.data().teamId, 1);
  return { equipeId: c.data().teamId, equipeNom: nom };
}
// Compteur d'inscrits stocké sur l'équipe (lisible par les membres, qui ne peuvent pas lister les autres comptes).
export const majNb = (teamId, d) => updateDoc(doc(db, "teams", teamId), { nb: increment(d) }).catch(() => {});
export const syncNb = (team, n) => { if (team?.id && team.nb !== n) updateDoc(doc(db, "teams", team.id), { nb: n }).catch(() => {}); };
export const nbEquipes = async (ids) => {
  const r = {};
  await Promise.all(ids.map((id) => getDoc(doc(db, "teams", id)).then((d) => { if (d.exists() && typeof d.data().nb === "number") r[id] = Math.max(0, d.data().nb); }).catch(() => {})));
  return r;
};
export const quitterEquipe = async (uid, profil, teamId) => { await majNb(teamId, -1); return updateDoc(doc(db, "users", uid), champsEquipes(equipesDe(profil).filter((t) => t.id !== teamId))); };

// Le gestionnaire ajoute un membre à l'une de ses équipes (les autres équipes du stagiaire sont conservées)
export const affecterMembre = (u, team) => {
  const l = equipesDe(u);
  if (l.some((t) => t.id === team.id)) return Promise.resolve();
  if (l.length >= MAX_EQUIPES) return Promise.reject(new Error(`déjà dans ${MAX_EQUIPES} équipes`));
  return updateDoc(doc(db, "users", u.id), champsEquipes([...l, infoEquipe(team)]));
};
// Le gestionnaire déplace un membre de l'équipe « de » vers une autre de ses équipes.
export const deplacerMembre = (u, de, team) => {
  const l = equipesDe(u).filter((t) => t.id !== de);
  return updateDoc(doc(db, "users", u.id), champsEquipes(l.some((t) => t.id === team.id) ? l : [...l, infoEquipe(team)]));
};

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
