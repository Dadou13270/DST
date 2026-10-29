import { collection, deleteDoc, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

// Collections rattachées à l'utilisateur : [collection, champ propriétaire]
const LIENS = [
  ["messages", "stagId"],
  ["evaluations", "stagId"],
  ["tickets", "uid"],
  ["demandesScenario", "demandeur"],
];

const lire = async (nom, champ, uid) => {
  try {
    const q = await getDocs(query(collection(db, nom), where(champ, "==", uid)));
    return q.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch { return []; }
};
const un = async (...chemin) => {
  try { const s = await getDoc(doc(db, ...chemin)); return s.exists() ? s.data() : null; } catch { return null; }
};

// Export complet (art. 15 et 20 RGPD) : toutes les données liées au compte.
export async function exporterTout(user) {
  const uid = user.uid;
  const out = { exporteLe: new Date().toISOString(), email: user.email, profil: await un("users", uid) };
  out.perso = {};
  for (const k of ["carnet", "lu", "fiche"]) { const v = await un("users", uid, "perso", k); if (v) out.perso[k] = v; }
  out.stats = await un("stats", uid);
  out.demandeGestionnaire = await un("demandesGest", uid);
  for (const [nom, champ] of LIENS) out[nom] = await lire(nom, champ, uid);
  out.messages = [...out.messages, ...(await lire("messages", "gestId", uid))];
  for (const t of out.tickets) {
    try { t.messagesTicket = (await getDocs(collection(db, "tickets", t.id, "messages"))).docs.map((d) => d.data()); } catch { /* ignoré */ }
  }
  return out;
}

// Effacement : tout ce que le stagiaire peut supprimer lui-même. Les fiches d'évaluation
// rédigées par les formateurs sont conservées (dossier de formation) ; elles sont mentionnées à l'écran.
export async function effacerTout(uid) {
  const del = (...c) => deleteDoc(doc(db, ...c)).catch(() => {});
  for (const k of ["carnet", "lu", "fiche"]) await del("users", uid, "perso", k);
  await del("stats", uid);
  await del("demandesGest", uid);
  for (const nom of ["demandesScenario", "tickets"]) {
    const champ = nom === "tickets" ? "uid" : "demandeur";
    for (const r of await lire(nom, champ, uid)) {
      if (nom === "tickets") {
        try { for (const m of (await getDocs(collection(db, "tickets", r.id, "messages"))).docs) await deleteDoc(m.ref); } catch { /* */ }
      }
      await del(nom, r.id);
    }
  }
  for (const m of await lire("messages", "stagId", uid)) await del("messages", m.id);
}
