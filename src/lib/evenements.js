import { db } from "../firebase";
import { SOIEC, SMES, CRM } from "./model";
import { collection, doc, addDoc, deleteDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";

// Évènements : evenements/{id} = { type: "flash"|"mise"|"rex", theme, desc, date (ms), actif, le, par (uid), parNom, dept ("" = tous), scId, scTitre }
// Participations : evtPart/{evId}_{uid} = { ev, uid, nom, cis, dept, org (uid de l'organisateur), statut: "inscrit"|"encours"|"fait", le, maj }
export const TYPES = { flash: { ic: "⚡", n: "Scénario flash" }, mise: { ic: "🎬", n: "Mise en place d'un scénario" }, rex: { ic: "🧠", n: "Retour d'expérience" } };
export const STATUTS = { inscrit: "Inscrit", encours: "Scénario ouvert", fait: "Terminé" };
export const creerEvenement = (e, par, parNom, dept) => addDoc(collection(db, "evenements"), { type: e.type, theme: e.theme.trim().slice(0, 120), desc: (e.desc || "").trim().slice(0, 400), date: e.date, scId: e.scId || "", scTitre: e.scTitre || "", actif: true, le: Date.now(), par, parNom: parNom || "", dept: dept || "" });
export const modifierEvenement = (id, e) => updateDoc(doc(db, "evenements", id), { type: e.type, theme: e.theme.trim().slice(0, 120), desc: (e.desc || "").trim().slice(0, 400), date: e.date, scId: e.scId || "", scTitre: e.scTitre || "" });
export const majEvenement = (id, patch) => updateDoc(doc(db, "evenements", id), patch);
export const supprimerEvenement = (id) => deleteDoc(doc(db, "evenements", id));
export const watchEvenements = (cb) => onSnapshot(collection(db, "evenements"), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => cb([]));
// Visible pour ce profil : évènement général, ou de son département.
export const visibleEv = (e, profil) => !e.dept || e.dept === (profil?.departement || "");
// À afficher : actifs, à venir ou commencés depuis moins de 2 h.
export const aVenir = (l, profil, now = Date.now()) => (l || []).filter((e) => e.actif && e.date && e.date > now - 7200000 && visibleEv(e, profil)).sort((a, b) => a.date - b.date);
export const decompte = (ms) => {
  if (ms <= 0) return "En cours";
  const s = Math.floor(ms / 1000), j = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), x = s % 60, p = (n) => String(n).padStart(2, "0");
  return (j ? j + " j " : "") + p(h) + ":" + p(m) + ":" + p(x);
};
const snap = (q, cb) => onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => cb([]));
export const watchMesPart = (uid, cb) => snap(query(collection(db, "evtPart"), where("uid", "==", uid)), cb);
export const watchPartOrg = (uid, cb) => snap(query(collection(db, "evtPart"), where("org", "==", uid)), cb);
export const watchToutesPart = (cb) => snap(collection(db, "evtPart"), cb);
export const participer = (ev, uid, profil) => setDoc(doc(db, "evtPart", ev.id + "_" + uid), { ev: ev.id, uid, nom: profil?.nom || "", cis: profil?.cis || "", dept: profil?.departement || "", org: ev.par || "", statut: "inscrit", le: Date.now(), maj: Date.now() });
export const quitter = (evId, uid) => deleteDoc(doc(db, "evtPart", evId + "_" + uid));
// Résultat joint par le participant à « J'ai terminé » : copie du bilan de son scénario (le gestionnaire n'a pas accès à son profil).
const LIB = { actions: "Actions engagées", ri: "Réactions immédiates", message: "Message d'ambiance", ...Object.fromEntries(SOIEC.map((r) => [r.k, r.k + " – " + r.titre])), ...Object.fromEntries(SMES.map((r) => [r.k, "SMES – " + r.titre])), ...Object.fromEntries(CRM.map((r) => [r.k, "Compte rendu – " + r.titre])) };
const ORDRE = ["actions", "ri", ...SMES.map((r) => r.k), ...SOIEC.map((r) => r.k), "message", ...CRM.map((r) => r.k)];
export const resumeBilan = (b) => ({ titre: b.titre || "", fin: b.fin || 0, duree: b.duree || 0, nbQ: b.nbQ || 0, essOk: b.essOk ?? null, essTot: b.essTot ?? null, vars: b.vars ? Object.values(b.vars).join(" · ") : "",
  notes: ORDRE.filter((k) => (b.notes?.[k] || "").trim()).map((k) => [LIB[k], String(b.notes[k]).slice(0, 3000)]),
  log: (b.log || []).filter((l) => l.question).slice(0, 80).map((l) => ({ who: l.who || "", q: String(l.question).slice(0, 200), a: String(l.answer || "").slice(0, 300) })) });
export const terminerPart = (evId, uid, res) => updateDoc(doc(db, "evtPart", evId + "_" + uid), { statut: "fait", maj: Date.now(), ...(res ? { res: JSON.parse(JSON.stringify(res)) } : {}) });
export const rouvrirPart = (evId, uid) => updateDoc(doc(db, "evtPart", evId + "_" + uid), { statut: "inscrit", maj: Date.now(), res: null });
export const majPart = (evId, uid, statut) => updateDoc(doc(db, "evtPart", evId + "_" + uid), { statut, maj: Date.now() });

// Webinaires à venir ou en direct (bloc d'accueil).
export const watchWebinaires = (cb) => snap(collection(db, "webinaires"), cb);
