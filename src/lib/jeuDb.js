import { db } from "../firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, query, where } from "firebase/firestore";
import QRCode from "qrcode";

// Jeu « Trivial pompiers » : questions ajoutées par l'admin (jeuQuestions) et parties jouées (jeuParties).
const clean = (o) => JSON.parse(JSON.stringify(o));
export const listQuestionsJeu = async () => (await getDocs(collection(db, "jeuQuestions"))).docs.map((d) => ({ ...d.data(), id: d.id }));
export async function saveQuestionJeu(q) {
  const ref = q.id ? doc(db, "jeuQuestions", q.id) : doc(collection(db, "jeuQuestions"));
  const { id, ...d } = q; // eslint-disable-line no-unused-vars
  await setDoc(ref, clean(d));
  return ref.id;
}
export const deleteQuestionJeu = (id) => deleteDoc(doc(db, "jeuQuestions", id));
export const listPartiesJeu = async () => (await getDocs(collection(db, "jeuParties"))).docs.map((d) => ({ ...d.data(), id: d.id }));
export const logPartieJeu = (p) => setDoc(doc(collection(db, "jeuParties")), clean(p));

// Parties multijoueurs : documents jeuSalles/{CODE} (état) et jeuSalles/{CODE}_{uid} (joueur).
export const salleSet = (id, d) => setDoc(doc(db, "jeuSalles", id), clean(d));
export const salleWatchDoc = (id, cb) => onSnapshot(doc(db, "jeuSalles", id), (sn) => cb(sn.exists() ? sn.data() : null), () => cb(null));
export const salleWatchCode = (code, cb) => onSnapshot(query(collection(db, "jeuSalles"), where("code", "==", code)), (sn) => cb(sn.docs.map((d) => d.data()).filter((x) => x.uid)), () => {});
export const salleQr = (t) => QRCode.toDataURL(t, { margin: 1, width: 320 });
