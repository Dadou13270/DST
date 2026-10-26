import {
  addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, where,
} from "firebase/firestore";
import { db } from "../firebase";
import { envoyerNetlify } from "./netlify";

export const OBJETS_TICKET = ["Renseignement", "Aide à l'utilisation", "Signaler un problème", "Demande de scénario", "Demande de compte / accès", "Autre"];

const trier = (l) => l.sort((a, b) => (b.maj || 0) - (a.maj || 0));

export const watchMesTickets = (uid, cb) =>
  onSnapshot(query(collection(db, "tickets"), where("uid", "==", uid)),
    (q) => cb(trier(q.docs.map((d) => ({ id: d.id, ...d.data() })))), () => cb([]));

export const watchTousTickets = (cb) =>
  onSnapshot(collection(db, "tickets"),
    (q) => cb(trier(q.docs.map((d) => ({ id: d.id, ...d.data() })))), () => cb([]));

export const watchMessagesTicket = (id, cb) =>
  onSnapshot(collection(db, "tickets", id, "messages"),
    (q) => cb(q.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.le || 0) - (b.le || 0))), () => cb([]));

// Notification de l'équipe : le formulaire Netlify « ticket » (e-mail / tableau de bord Netlify). Non bloquant.
const notifier = (champs) => envoyerNetlify("ticket", champs).catch(() => {});

export async function creerTicket({ uid, nom, email, objet, sujet, message }) {
  const now = Date.now();
  const ref = await addDoc(collection(db, "tickets"), {
    uid, nom: nom || "", email: email || "", objet, sujet, statut: "ouvert", cree: now, maj: now, nonLuAdmin: true, nonLuUser: false,
  });
  await addDoc(collection(db, "tickets", ref.id, "messages"), { de: "user", nom: nom || "", texte: message, le: now });
  notifier({ evenement: "nouveau", ticket: ref.id, nom, email, objet, sujet, message });
  return ref.id;
}

export async function repondre(t, role, nom, texte) {
  const now = Date.now();
  await addDoc(collection(db, "tickets", t.id, "messages"), { de: role, nom, texte: texte.slice(0, 1500), le: now });
  await updateDoc(doc(db, "tickets", t.id), role === "admin"
    ? { maj: now, nonLuUser: true, statut: t.statut === "ouvert" ? "encours" : t.statut }
    : { maj: now, nonLuAdmin: true });
  if (role === "user") notifier({ evenement: "réponse", ticket: t.id, nom: t.nom, email: t.email, objet: t.objet, sujet: t.sujet, message: texte });
}

export const setStatut = (t, role, statut) =>
  updateDoc(doc(db, "tickets", t.id), { statut, maj: Date.now(), ...(role === "admin" ? { nonLuUser: true } : { nonLuAdmin: true }) });

export const marquerLu = (t, role) =>
  updateDoc(doc(db, "tickets", t.id), role === "admin" ? { nonLuAdmin: false } : { nonLuUser: false }).catch(() => {});

export async function supprimerTicket(id) {
  const l = await getDocs(collection(db, "tickets", id, "messages"));
  await Promise.all(l.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, "tickets", id));
}
