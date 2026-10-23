import { db } from "../firebase";
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

export async function listUsers() {
  const [u, a] = await Promise.all([getDocs(collection(db, "users")), getDocs(collection(db, "admins"))]);
  const admins = new Set(a.docs.map((d) => d.id));
  return u.docs
    .map((d) => ({ id: d.id, ...d.data(), admin: admins.has(d.id) }))
    .sort((x, y) => (x.nom || "").localeCompare(y.nom || "", "fr"));
}
export const setStatut = (uid, statut) => updateDoc(doc(db, "users", uid), { statut });
export const setAdmin = (uid, on) =>
  on ? setDoc(doc(db, "admins", uid), { actif: true }) : deleteDoc(doc(db, "admins", uid));
export const deleteUserProfile = async (uid) => {
  await deleteDoc(doc(db, "admins", uid)).catch(() => {});
  await deleteDoc(doc(db, "users", uid));
};

export const fmtDuree = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// Résultat d'un exercice terminé, stocké dans users/{uid}.bilans[scenarioId]
export function buildBilan(sc, sess, ancien) {
  const ess = sc.qa.filter((x) => x.essentielle);
  const asked = new Set(sess.log.map((l) => l.qaId));
  return {
    titre: sc.titre,
    fin: sess.finishedAt,
    duree: Math.floor((sess.finishedAt - sess.start) / 1000),
    nbQ: sess.log.length,
    essTot: ess.length,
    essOk: ess.filter((x) => asked.has(x.id)).length,
    nb: (ancien?.nb || (ancien ? 1 : 0)) + 1,
    log: sess.log.map((l) => ({ who: l.who, question: l.question, answer: l.answer, qaId: l.qaId || null })),
    notes: sess.notes,
  };
}
export const saveBilan = (uid, bilans, id, bilan) =>
  updateDoc(doc(db, "users", uid), { bilans: JSON.parse(JSON.stringify({ ...(bilans || {}), [id]: bilan })) });

export function statsOf(bilans) {
  const a = Object.values(bilans || {});
  const tot = a.reduce((n, b) => n + (b.essTot || 0), 0);
  const ok = a.reduce((n, b) => n + (b.essOk || 0), 0);
  return {
    n: a.length,
    tmoy: a.length ? Math.round(a.reduce((n, b) => n + (b.duree || 0), 0) / a.length) : 0,
    ess: tot ? Math.round((100 * ok) / tot) : null,
  };
}
export const fmtDate = (ms) => (ms ? new Date(ms).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");
