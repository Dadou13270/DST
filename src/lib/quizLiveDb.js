import { db } from "../firebase";
import { collection, doc, setDoc, onSnapshot, query, where } from "firebase/firestore";
import QRCode from "qrcode";

// Quiz en direct : quizLive/{CODE} (état, écrit par le formateur) et quizLive/{CODE}_{uid} (réponses d'un participant).
const clean = (o) => JSON.parse(JSON.stringify(o));
export const lienQuizLive = (code) => `${window.location.origin}/quiz-live?code=${code}`;
export const adaptateursQuizLive = ({ uid, nom, quitter }) => ({
  uid: () => uid,
  nom: () => nom || "",
  set: (id, d) => setDoc(doc(db, "quizLive", id), clean(d)),
  watchDoc: (id, cb) => onSnapshot(doc(db, "quizLive", id), (sn) => cb(sn.exists() ? sn.data() : null), () => cb(null)),
  watchCode: (code, cb) => onSnapshot(query(collection(db, "quizLive"), where("code", "==", code)), (sn) => cb(sn.docs.map((d) => d.data()).filter((x) => x.uid)), () => {}),
  qr: (t) => QRCode.toDataURL(t, { margin: 1, width: 340 }),
  lien: lienQuizLive,
  quitter,
});
