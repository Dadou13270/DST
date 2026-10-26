import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { mergeScenario } from "./model";

const col = () => collection(db, "scenarios");
const clean = (o) => JSON.parse(JSON.stringify(o)); // retire les undefined
const byTitre = (a, b) => (a.titre || "").localeCompare(b.titre || "", "fr");

// onlyPublished=false : tout (admin). Sinon : scénarios publics + ceux réservés au gestionnaire connecté
// ou au gestionnaire de son équipe. ctx = { uid, equipeId }.
export async function listScenarios(onlyPublished, ctx) {
  if (!onlyPublished) {
    const snap = await getDocs(col());
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byTitre);
  }
  const base = [where("publie", "==", true)];
  const qs = [query(col(), ...base, where("reserveA", "==", null))];
  if (ctx?.uid) qs.push(query(col(), ...base, where("reserveA", "==", ctx.uid)));
  if (ctx?.equipeId) {
    const t = await getDoc(doc(db, "teams", ctx.equipeId)).catch(() => null);
    const owner = t?.exists() ? t.data().owner : null;
    if (owner && owner !== ctx.uid) qs.push(query(col(), ...base, where("reserveA", "==", owner)));
  }
  const res = await Promise.all(qs.map((q) => getDocs(q)));
  const m = new Map();
  res.forEach((s) => s.docs.forEach((d) => m.set(d.id, { id: d.id, ...d.data() })));
  return [...m.values()].sort(byTitre);
}

export const setReserve = (id, uid) => updateDoc(doc(db, "scenarios", id), { reserveA: uid || null });

// À lancer une fois par l'admin : donne reserveA = null aux anciens scénarios (nécessaire pour les requêtes ci-dessus).
export async function initialiserVisibilite() {
  const snap = await getDocs(col());
  let n = 0;
  for (const d of snap.docs) {
    if (!("reserveA" in d.data())) {
      await updateDoc(d.ref, { reserveA: null });
      n++;
    }
  }
  return n;
}

export async function getScenario(id) {
  const s = await getDoc(doc(db, "scenarios", id));
  return s.exists() ? mergeScenario({ ...s.data(), id: s.id }) : null;
}

export async function getPhoto(id) {
  const s = await getDoc(doc(db, "scenarios", id, "media", "photo"));
  return s.exists() ? s.data().data : null;
}

export async function getSituationPhotos(id) {
  const s = await getDoc(doc(db, "scenarios", id, "media", "situation"));
  return s.exists() ? s.data().photos || [] : [];
}

// photo : undefined = inchangée, null = supprimée, string = nouvelle image
export async function saveScenario(id, data, photo, sitPhotos) {
  const ref = id ? doc(db, "scenarios", id) : doc(col());
  // eslint-disable-next-line no-unused-vars
  const { id: _id, maj: _maj, ...rest } = data;
  if (sitPhotos === undefined && rest.situation?.photos?.length) sitPhotos = rest.situation.photos; // import de seeds
  if (rest.situation) rest.situation = { ...rest.situation, photos: [] }; // les photos de la situation vivent dans media/situation
  await setDoc(ref, { ...clean(rest), reserveA: rest.reserveA || null, maj: serverTimestamp() });
  if (photo !== undefined) {
    const mref = doc(db, "scenarios", ref.id, "media", "photo");
    if (photo) await setDoc(mref, { data: photo });
    else await deleteDoc(mref);
  }
  if (sitPhotos !== undefined) {
    const sref = doc(db, "scenarios", ref.id, "media", "situation");
    if (sitPhotos && sitPhotos.length) await setDoc(sref, { photos: clean(sitPhotos) });
    else await deleteDoc(sref);
  }
  return ref.id;
}

export async function deleteScenario(id) {
  await deleteDoc(doc(db, "scenarios", id, "media", "photo"));
  await deleteDoc(doc(db, "scenarios", id, "media", "situation"));
  await deleteDoc(doc(db, "scenarios", id));
}

export async function duplicateScenario(id) {
  const s = await getScenario(id);
  const p = await getPhoto(id);
  const sp = await getSituationPhotos(id);
  return saveScenario(null, { ...s, titre: `${s.titre} (copie)`, publie: false }, p, sp);
}
