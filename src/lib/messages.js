import { useEffect, useState } from "react";
import { db } from "../firebase";
import { addDoc, collection, doc, getDoc, onSnapshot, query, updateDoc, where, writeBatch } from "firebase/firestore";

// Messagerie privée stagiaire <-> gestionnaire. Un message : { stagId, stagNom, gestId, gestNom, de, texte, le, lu }.
// Abonnement partagé (un seul jeu d'écouteurs, quel que soit le nombre de composants qui l'utilisent).
let store = { uid: null, a: [], b: [], subs: new Set(), offs: [] };
const emit = () => {
  const l = [...new Map([...store.a, ...store.b].map((m) => [m.id, m])).values()].sort((x, y) => x.le - y.le);
  store.subs.forEach((f) => f(l));
};
function ouvrir(uid) {
  if (store.uid === uid) return;
  store.offs.forEach((o) => o());
  store = { ...store, uid, a: [], b: [], offs: [] };
  const lire = (champ, cle) =>
    onSnapshot(query(collection(db, "messages"), where(champ, "==", uid)), (s) => { store[cle] = s.docs.map((d) => ({ id: d.id, ...d.data() })); emit(); }, () => {});
  store.offs = [lire("stagId", "a"), lire("gestId", "b")];
}
export function useMessages(uid) {
  const [l, setL] = useState([]);
  useEffect(() => {
    if (!db || !uid) return;
    ouvrir(uid);
    store.subs.add(setL);
    emit();
    return () => {
      store.subs.delete(setL);
      if (!store.subs.size) { store.offs.forEach((o) => o()); store = { uid: null, a: [], b: [], subs: new Set(), offs: [] }; }
    };
  }, [uid]);
  return l;
}

export const envoyer = (m) => addDoc(collection(db, "messages"), { ...m, texte: m.texte.trim().slice(0, 2000), le: Date.now(), lu: false });
export async function marquerLus(ids) {
  if (!ids.length) return;
  const b = writeBatch(db);
  ids.slice(0, 400).forEach((id) => b.update(doc(db, "messages", id), { lu: true }));
  await b.commit();
}
// identifiant du gestionnaire de mon équipe
export async function monGestionnaire(profil) {
  if (!profil?.equipeId) return null;
  const t = await getDoc(doc(db, "teams", profil.equipeId));
  return t.exists() ? { id: t.data().owner, nom: t.data().ownerNom || profil.equipeGest || "Gestionnaire" } : null;
}
// conversations : { id, autre, nomAutre, msgs, nonLus, dernier }
export function conversations(msgs, uid) {
  const c = {};
  msgs.forEach((m) => {
    const moiStag = m.stagId === uid;
    const k = m.stagId + "_" + m.gestId;
    const o = (c[k] = c[k] || { id: k, stagId: m.stagId, gestId: m.gestId, stagNom: m.stagNom, gestNom: m.gestNom, moiStag, msgs: [], nonLus: 0 });
    o.msgs.push(m);
    if (m.de !== uid && !m.lu) o.nonLus++;
    o.stagNom = m.stagNom; o.gestNom = m.gestNom;
  });
  return Object.values(c).map((o) => ({ ...o, nomAutre: o.moiStag ? o.gestNom : o.stagNom, dernier: o.msgs[o.msgs.length - 1] })).sort((x, y) => y.dernier.le - x.dernier.le);
}
export const nbNonLus = (msgs, uid) => msgs.filter((m) => m.de !== uid && !m.lu).length;
