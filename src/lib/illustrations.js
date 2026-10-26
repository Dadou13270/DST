import { db } from "../firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

export async function listIllustrations() {
  const s = await getDocs(collection(db, "illustrations"));
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.titre || "").localeCompare(b.titre || "", "fr"));
}
export const addIllustration = (titre, photo, vignette, tags = "") =>
  setDoc(doc(collection(db, "illustrations")), { titre, tags, photo, vignette, le: serverTimestamp() });
export const deleteIllustration = (id) => deleteDoc(doc(db, "illustrations", id));
