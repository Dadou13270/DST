// Webinaires en direct : webinaires/{code}, inscrits webinairesP/{code_uid}, messages webinairesM/{id}.
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where } from "firebase/firestore";

const clean = (o) => JSON.parse(JSON.stringify(o));
export const lienWebinaire = (code) => `${window.location.origin}/webinaire/${code}`;

export function adaptateurWebi({ uid, nom, dept, canEdit, isAdmin, initial }) {
  return {
    uid, nom, dept, canEdit, isAdmin, initial: initial || "", lien: lienWebinaire,
    async list() { return (await getDocs(collection(db, "webinaires"))).docs.map((d) => ({ id: d.id, ...d.data() })); },
    save: (id, d) => { const { id: _i, ...r } = d; return setDoc(doc(db, "webinaires", id), clean(r)).then(() => id); }, // eslint-disable-line no-unused-vars
    async del(id) {
      for (const c of ["webinairesP", "webinairesM", "webinairesS", "webinairesC"]) {
        const l = await getDocs(query(collection(db, c), where("web", "==", id)));
        await Promise.all(l.docs.map((d) => deleteDoc(d.ref)));
      }
      await deleteDoc(doc(db, "webinaires", id));
    },
    setEtat: (code, etat) => updateDoc(doc(db, "webinaires", code), { etat }),
    maj: (code, p) => setDoc(doc(db, "webinairesP", code + "_" + uid), clean(p), { merge: true }),
    hote: (code, u, p) => updateDoc(doc(db, "webinairesP", code + "_" + u), clean(p)),
    envoyer: (code, m) => addDoc(collection(db, "webinairesM"), clean({ web: code, ...m })),
    delMsg: (id) => deleteDoc(doc(db, "webinairesM", id)),
    sigSet: (code, viewer, p) => setDoc(doc(db, "webinairesS", code + "_" + viewer), clean(p), { merge: true }),
    sigWatch(code, viewer, cb) {
      if (viewer) return onSnapshot(doc(db, "webinairesS", code + "_" + viewer), (s) => cb(s.exists() ? [s.data()] : []), () => cb([]));
      return onSnapshot(query(collection(db, "webinairesS"), where("web", "==", code)), (s) => cb(s.docs.map((d) => d.data())), () => cb([]));
    },
    candAdd: (code, viewer, from, n, c) => addDoc(collection(db, "webinairesC"), { web: code, pair: code + "_" + viewer, viewer, from, n, c, uid, t: Date.now() }),
    candWatch(code, viewer, cb) {
      const q = viewer ? query(collection(db, "webinairesC"), where("pair", "==", code + "_" + viewer)) : query(collection(db, "webinairesC"), where("web", "==", code));
      return onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => cb([]));
    },
    watch(code, cb) {
      const u1 = onSnapshot(doc(db, "webinaires", code), (s) => cb({ w: s.exists() ? { id: s.id, ...s.data() } : null }), () => cb({ w: null }));
      const u2 = onSnapshot(query(collection(db, "webinairesP"), where("web", "==", code)), (s) => cb({ ps: s.docs.map((d) => d.data()) }), () => cb({ ps: [] }));
      const u3 = onSnapshot(query(collection(db, "webinairesM"), where("web", "==", code)), (s) => cb({ ms: s.docs.map((d) => ({ id: d.id, ...d.data() })) }), () => cb({ ms: [] }));
      return () => { u1(); u2(); u3(); };
    },
  };
}
export const existeWebinaire = async (code) => (await getDoc(doc(db, "webinaires", code))).exists();
