// Séance en salle : le formateur ouvre une salle (code à 5 caractères), les stagiaires la rejoignent,
// leurs questions arrivent en direct chez le formateur.
import { db } from "../firebase";
import { archiverSalle } from "./seances";
import {
  collection, doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, addDoc, onSnapshot, query, where, serverTimestamp,
} from "firebase/firestore";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const normSalle = (c) => (c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const rnd = () => Array.from({ length: 5 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join("");

// État d'une salle : "close", "plan" (début dans le futur) ou "open"
export const etatSalle = (r, now = Date.now()) => (r.ouverte === false ? "close" : r.debut && r.debut > now ? "plan" : "open");
export const libEtat = { close: "Clôturée", plan: "Planifiée", open: "Ouverte" };
export const fmtDebut = (ms) => (ms ? new Date(ms).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "");
export const debutDepuisInput = (v) => { const t = v ? new Date(v).getTime() : NaN; return Number.isNaN(t) ? null : t; };
export const inputDepuisDebut = (ms) => (ms ? new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
export const modifierSalle = (code, data) => updateDoc(doc(db, "salles", code), data);
export const setDebut = (code, debut) => updateDoc(doc(db, "salles", code), { debut });

export async function creerSalle(owner, ownerNom, sc, debut = null) {
  for (let k = 0; k < 20; k++) {
    const code = rnd();
    const ref = doc(db, "salles", code);
    if ((await getDoc(ref)).exists()) continue;
    await setDoc(ref, { code, scId: sc.id, titre: sc.titre || "", owner, ownerNom: ownerNom || "Formateur", ouverte: true, debut, le: serverTimestamp() });
    return code;
  }
  throw new Error("Impossible de générer un code, réessaie.");
}

export async function getSalle(code) {
  const s = await getDoc(doc(db, "salles", normSalle(code)));
  return s.exists() ? { id: s.id, ...s.data() } : null;
}

export const watchMesSalles = (owner, cb) => {
  let a = [], b = [];
  const emit = () => cb([...new Map([...a, ...b].map((x) => [x.id, x])).values()].sort((x, y) => (y.le?.seconds || 0) - (x.le?.seconds || 0)));
  const map = (q) => q.docs.map((d) => ({ id: d.id, ...d.data() }));
  const u1 = onSnapshot(query(collection(db, "salles"), where("owner", "==", owner)), (q) => { a = map(q); emit(); }, () => {});
  const u2 = onSnapshot(query(collection(db, "salles"), where("co", "array-contains", owner)), (q) => { b = map(q); emit(); }, () => {});
  return () => { u1(); u2(); };
};

export const watchSalle = (code, cb) =>
  onSnapshot(doc(db, "salles", code), (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null), () => cb(null));

export const watchQuestions = (code, cb) =>
  onSnapshot(collection(db, "salles", code, "questions"), (q) =>
    cb(q.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.le || 0) - (a.le || 0))), () => cb([]));

export const watchParticipants = (code, cb) =>
  onSnapshot(collection(db, "salles", code, "participants"), (q) =>
    cb(q.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.nom || "").localeCompare(b.nom || "", "fr"))), () => cb([]));

export const rejoindreSalle = (code, uid, nom) =>
  setDoc(doc(db, "salles", code, "participants", uid), { uid, nom: nom || "Stagiaire", le: Date.now() }, { merge: true });

// Suivi des évolutions côté stagiaire : champ "r" = reçue, "c" = comprise (horodatage), par clé d'évolution.
export const signalerEvo = (code, uid, cle, champ) =>
  setDoc(doc(db, "salles", code, "participants", uid), { evo: { [cle]: { [champ]: Date.now() } } }, { merge: true }).catch(() => {});

export const posterQuestion = (code, uid, nom, who, whoNom, q, a, qaId) =>
  addDoc(collection(db, "salles", code, "questions"), { uid, nom: nom || "Stagiaire", who, whoNom, q, a, qaId: qaId || null, le: Date.now() }).catch(() => {});

export const watchMessages = (code, cb) =>
  onSnapshot(collection(db, "salles", code, "messages"), (q) =>
    cb(q.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.le || 0) - (b.le || 0))), () => cb([]));

export const posterMessage = (code, uid, nom, role, texte) =>
  addDoc(collection(db, "salles", code, "messages"), { uid, nom, role, texte: texte.slice(0, 400), le: Date.now() });

// Pilotage de la séance par le formateur : évolution prévue/libre ou réponse imposée (champ texte toujours présent pour les règles)
export const envoyerEvenement = (code, uid, nom, data) =>
  addDoc(collection(db, "salles", code, "messages"), { uid, nom, role: "formateur", texte: "", ...data, le: Date.now() });

// Chrono commun : { duree (s), t0 (ms, décalé des pauses), pausedAt (ms|null), fin (ms|null) } ; null = pas de chrono
// Consignes cochées par le formateur (modèles + libres) et réponses des stagiaires.
export const TACHES_MODELES = [
  { id: "flash", titre: "Rédiger le message flash" },
  { id: "arrivee", titre: "Rédiger le message d'arrivée sur les lieux" },
];
export const setTaches = (code, taches) => updateDoc(doc(db, "salles", code), { taches });
export const repondreTache = (code, uid, nom, t, texte) =>
  setDoc(doc(db, "salles", code, "participants", uid), { uid, nom: nom || "Stagiaire", taches: { [t.id]: { titre: t.titre, texte, le: Date.now() } } }, { merge: true });

export const setChrono = (code, chrono) => updateDoc(doc(db, "salles", code), { chrono });
export const chronoReste = (ch, now = Date.now()) => Math.round(ch.duree - ((ch.fin || ch.pausedAt || now) - ch.t0) / 1000);

export const setOuverte = (code, ouverte) => updateDoc(doc(db, "salles", code), { ouverte });

export async function supprimerSalle(code) {
  await archiverSalle(code).catch(() => {}); // bilan conservé dans l'historique
  for (const sub of ["questions", "participants", "messages"]) {
    const l = await getDocs(collection(db, "salles", code, sub));
    await Promise.all(l.docs.map((d) => deleteDoc(d.ref)));
  }
  await deleteDoc(doc(db, "salles", code));
}
