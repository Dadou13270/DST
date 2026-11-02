import { db } from "../firebase";
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { listUsers } from "./users";

// Forum d'entraide : accès Firestore pour le module partagé src/forum/forum.js.
const clean = (o) => JSON.parse(JSON.stringify(o));
export const forumLs = async (coll) => (await getDocs(collection(db, coll))).docs.map((d) => ({ ...d.data(), id: d.id }));
export async function forumPut(coll, id, data) {
  if (data === null) { await deleteDoc(doc(db, coll, id)); return id; }
  if (!id) { const r = doc(collection(db, coll)); await setDoc(r, clean(data)); return r.id; }
  const r = doc(db, coll, id);
  try { await updateDoc(r, clean(data)); } catch (e) { if (e && e.code === "not-found") await setDoc(r, clean(data)); else throw e; }
  return id;
}
export const forumDel = (coll, id) => deleteDoc(doc(db, coll, id));
export const forumUsers = async () => (await listUsers()).map((u) => ({ id: u.id, nom: u.nom || u.email || u.id }));
export const forumEstMod = async (uid) => { try { return (await getDoc(doc(db, "forumMods", uid))).exists(); } catch { return false; } };
// Activité de l'utilisateur sur le forum (sujets créés et réponses), du plus récent au plus ancien.
export async function forumActivite(uid) {
  const [suj, msgs] = await Promise.all([forumLs("forumSujets"), forumLs("forumMsgs")]);
  const titre = new Map(suj.map((s) => [s.id, s]));
  const a = suj.filter((s) => s.uid === uid && s.etat !== "masque").map((s) => ({ id: "s" + s.id, type: "Sujet", sujet: s.id, titre: s.titre, t: s.t || 0 }));
  const b = msgs.filter((m) => m.uid === uid && m.etat !== "masque" && titre.get(m.sujet) && titre.get(m.sujet).etat !== "masque").map((m) => ({ id: "m" + m.id, type: "Réponse", sujet: m.sujet, titre: titre.get(m.sujet).titre, extrait: String(m.texte || "").slice(0, 90), t: m.t || 0 }));
  return [...a, ...b].sort((x, y) => y.t - x.t);
}
export async function forumGet(coll, id) { const s = await getDoc(doc(db, coll, id)); return s.exists() ? s.data() : null; }
// Accueil : sujets suivis, ceux avec nouvelles réponses d'abord.
export async function forumSuivis(uid) {
  const [d, suj] = await Promise.all([forumGet("forumSuivis", uid), forumLs("forumSujets")]);
  const m = (d && d.s) || {};
  return suj.filter((x) => m[x.id] && x.etat !== "masque").map((x) => ({ id: x.id, titre: x.titre, nb: x.nb || 0, maj: x.maj || 0, dernier: x.dernierNom || "", nv: (x.maj || 0) > m[x.id] && x.dernierUid !== uid })).sort((a, b) => (b.nv - a.nv) || (b.maj - a.maj));
}
