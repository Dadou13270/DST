import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { mergeScenario } from "./model";

const col = () => collection(db, "scenarios");
const clean = (o) => JSON.parse(JSON.stringify(o)); // retire les undefined
const byTitre = (a, b) => (a.titre || "").localeCompare(b.titre || "", "fr");

export async function listScenarios(onlyPublished) {
  const q = onlyPublished ? query(col(), where("publie", "==", true)) : col();
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byTitre);
}

export async function getScenario(id) {
  const s = await getDoc(doc(db, "scenarios", id));
  return s.exists() ? mergeScenario({ ...s.data(), id: s.id }) : null;
}

export async function getPhoto(id) {
  const s = await getDoc(doc(db, "scenarios", id, "media", "photo"));
  return s.exists() ? s.data().data : null;
}

// photo : undefined = inchangée, null = supprimée, string = nouvelle image
export async function saveScenario(id, data, photo) {
  const ref = id ? doc(db, "scenarios", id) : doc(col());
  // eslint-disable-next-line no-unused-vars
  const { id: _id, maj: _maj, ...rest } = data;
  await setDoc(ref, { ...clean(rest), maj: serverTimestamp() });
  if (photo !== undefined) {
    const mref = doc(db, "scenarios", ref.id, "media", "photo");
    if (photo) await setDoc(mref, { data: photo });
    else await deleteDoc(mref);
  }
  return ref.id;
}

export async function deleteScenario(id) {
  await deleteDoc(doc(db, "scenarios", id, "media", "photo"));
  await deleteDoc(doc(db, "scenarios", id));
}

export async function duplicateScenario(id) {
  const s = await getScenario(id);
  const p = await getPhoto(id);
  return saveScenario(null, { ...s, titre: `${s.titre} (copie)`, publie: false }, p);
}
