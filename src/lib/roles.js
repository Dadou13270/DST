// Jeu de rôle en salle : scénarios (scenariosRoles) et séances (sallesRoles + joueurs, postes, radio).
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, arrayUnion } from "firebase/firestore";

const clean = (o) => JSON.parse(JSON.stringify(o));
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const rnd = () => Array.from({ length: 5 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("");
const sc = () => collection(db, "scenariosRoles");

// ---- Scénarios
export async function listRoles(uid, admin) {
  const snaps = admin ? [await getDocs(sc())] : [await getDocs(query(sc(), where("publie", "==", true))), ...(uid ? [await getDocs(query(sc(), where("auteur", "==", uid)))] : [])];
  const m = new Map();
  snaps.forEach((s) => s.docs.forEach((d) => m.set(d.id, { id: d.id, ...d.data() })));
  return [...m.values()].sort((a, b) => (b.o || 0) - (a.o || 0));
}
export const saveRoles = (id, d) => { const { id: _i, ...r } = d; const ref = id ? doc(db, "scenariosRoles", id) : doc(sc()); return setDoc(ref, clean(r)).then(() => ref.id); }; // eslint-disable-line no-unused-vars
export const deleteRoles = (id) => deleteDoc(doc(db, "scenariosRoles", id));

// ---- Séances
const sess = (c) => doc(db, "sallesRoles", c);
async function purge(code) {
  for (const col of ["sallesRolesJ", "sallesRolesP", "sallesRolesR"]) {
    const l = await getDocs(query(collection(db, col), where("sall", "==", code)));
    await Promise.all(l.docs.map((d) => deleteDoc(d.ref)));
  }
}
export function adaptateurGest({ uid, nom, admin }) {
  return {
    list: () => listRoles(uid, !!admin),
    save: saveRoles, del: deleteRoles,
    async mesSeances() {
      const q = await getDocs(query(collection(db, "sallesRoles"), where("owner", "==", uid)));
      return q.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.le || 0) - (a.le || 0));
    },
    async ouvrir(s) {
      for (let k = 0; k < 20; k++) {
        const code = rnd();
        if ((await getDoc(sess(code))).exists() || (await getDoc(doc(db, "salles", code))).exists()) continue;
        await setDoc(sess(code), clean({ code, scId: s.id, titre: s.titre || "", contexte: s.contexte || "", lieu: s.lieu || "", fiches: s.fiches || {}, envoyes: [], ouverte: true, termine: false, owner: uid, ownerNom: nom || "Formateur", le: Date.now() }));
        return code;
      }
      throw new Error("Impossible de générer un code, réessaie.");
    },
    supprimer: async (code) => { await purge(code); await deleteDoc(sess(code)); },
    watch(code, cb) {
      const L = { s: null, joueurs: [], postes: [], radio: [] };
      const emit = () => cb({ ...L });
      const m = (q) => q.docs.map((d) => ({ id: d.id, ...d.data() }));
      const u = [
        onSnapshot(sess(code), (d) => { L.s = d.exists() ? { id: d.id, ...d.data() } : null; emit(); }, () => {}),
        onSnapshot(query(collection(db, "sallesRolesJ"), where("sall", "==", code)), (q) => { L.joueurs = m(q); emit(); }, () => {}),
        onSnapshot(query(collection(db, "sallesRolesP"), where("sall", "==", code)), (q) => { L.postes = m(q); emit(); }, () => {}),
        onSnapshot(query(collection(db, "sallesRolesR"), where("sall", "==", code)), (q) => { L.radio = m(q).sort((a, b) => (a.le || 0) - (b.le || 0)); emit(); }, () => {}),
      ];
      return () => u.forEach((f) => f());
    },
    envoyer: (code, inj) => updateDoc(sess(code), { envoyes: arrayUnion(clean({ id: inj.id, titre: inj.titre || "", texte: inj.texte || "", cibles: inj.cibles || [], mode: inj.mode || "info", consigne: inj.consigne || "", choix: (inj.choix || []).map((c) => ({ t: c.t })), le: Date.now() })) }),
    setEtat: (code, patch) => updateDoc(sess(code), clean(patch)),
    affecter: (code, poste, u, n) => setDoc(doc(db, "sallesRolesP", `${code}_${poste}`), { sall: code, poste, uid: u, nom: n }),
    liberer: (code, poste) => deleteDoc(doc(db, "sallesRolesP", `${code}_${poste}`)),
    radio: (code, m) => addDoc(collection(db, "sallesRolesR"), { sall: code, ...m, le: Date.now() }),
  };
}
export function adaptateurJoue({ uid }) {
  return {
    existe: async (code) => { const d = await getDoc(sess(code)); return d.exists() ? { id: d.id, ...d.data() } : null; },
    rejoindre: (code, u, nom) => setDoc(doc(db, "sallesRolesJ", `${code}_${u}`), { sall: code, uid: u, nom: nom || "Stagiaire" }, { merge: true }),
    async prendre(code, poste, u, nom) {
      try { await setDoc(doc(db, "sallesRolesP", `${code}_${poste}`), { sall: code, poste, uid: u, nom: nom || "Stagiaire" }); }
      catch { throw new Error("Ce poste vient d'être pris par un autre stagiaire."); }
    },
    liberer: (code, poste) => deleteDoc(doc(db, "sallesRolesP", `${code}_${poste}`)),
    repondre: (code, u, id, r) => setDoc(doc(db, "sallesRolesJ", `${code}_${u}`), { rep: { [id]: r } }, { merge: true }),
    radio: (code, m) => addDoc(collection(db, "sallesRolesR"), { sall: code, ...m, le: Date.now() }),
    watch(code, cb) {
      const L = { s: null, joueurs: [], postes: [], radio: [] };
      const emit = () => cb({ ...L });
      const m = (q) => q.docs.map((d) => ({ id: d.id, ...d.data() }));
      const u = [
        onSnapshot(sess(code), (d) => { L.s = d.exists() ? { id: d.id, ...d.data() } : null; emit(); }, () => {}),
        onSnapshot(doc(db, "sallesRolesJ", `${code}_${uid}`), (d) => { L.joueurs = d.exists() ? [{ id: d.id, ...d.data() }] : []; emit(); }, () => {}),
        onSnapshot(query(collection(db, "sallesRolesP"), where("sall", "==", code)), (q) => { L.postes = m(q); emit(); }, () => {}),
        onSnapshot(query(collection(db, "sallesRolesR"), where("sall", "==", code)), (q) => { L.radio = m(q).sort((a, b) => (a.le || 0) - (b.le || 0)); emit(); }, () => {}),
      ];
      return () => u.forEach((f) => f());
    },
  };
}
export const rolesExiste = async (code) => { try { return (await getDoc(sess(code))).exists(); } catch { return false; } };
