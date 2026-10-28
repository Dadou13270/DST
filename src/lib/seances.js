// Bilan de séance conservé : instantané d'une salle (questions, évolutions, consignes, stagiaires)
// enregistré dans seances/{code_creation} avant suppression, lisible par son formateur.
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where } from "firebase/firestore";
import { getScenario } from "./db";

export async function archiverSalle(code) {
  const sref = doc(db, "salles", code);
  const s = await getDoc(sref);
  if (!s.exists()) return null;
  const salle = { id: s.id, ...s.data() };
  const sub = async (n) => (await getDocs(collection(db, "salles", code, n))).docs.map((d) => ({ id: d.id, ...d.data() }));
  const [qs, ps, ms] = await Promise.all([sub("questions"), sub("participants"), sub("messages")]);
  const sc = await getScenario(salle.scId).catch(() => null);
  const evts = ms.filter((m) => m.kind === "evo");
  const prevues = (sc?.evolutions || []).slice().sort((a, b) => (Number(a.delai) || 0) - (Number(b.delai) || 0));
  const nomDe = (uid) => ps.find((u) => (u.uid || u.id) === uid)?.nom || "Stagiaire";
  const evolutions = [
    ...prevues.map((e) => ({ cle: e.id, titre: e.titre || "Évolution", texte: e.message || "", cible: "all", le: evts.find((m) => m.evoId === e.id)?.le || 0 })),
    ...evts.filter((m) => !m.evoId).map((m) => ({ cle: "libre_" + m.id, titre: m.titre || "Évolution libre", texte: m.texte || "", cible: m.cible || "all", le: m.le || 0 })),
  ].map((l) => {
    const dest = l.cible && l.cible !== "all" ? ps.filter((u) => (u.uid || u.id) === l.cible) : ps;
    return { titre: l.titre, texte: l.texte, le: l.le, dest: dest.length, recu: dest.filter((u) => u.evo?.[l.cle]?.r).length, comp: dest.filter((u) => u.evo?.[l.cle]?.c).length,
      attente: dest.filter((u) => !u.evo?.[l.cle]?.c).map((u) => u.nom || "Stagiaire") };
  }).filter((l) => l.le || l.recu);
  const ess = (sc?.qa || []).filter((x) => x.essentielle);
  const essOk = ess.filter((x) => qs.some((q) => q.qaId === x.id)).length;
  const inter = (id) => (sc?.interlocuteurs || []).find((i) => i.id === id)?.nom || "";
  const data = {
    owner: salle.owner, ownerNom: salle.ownerNom || "", code, scId: salle.scId || "", titre: salle.titre || "",
    debut: salle.debut || 0, creeLe: (salle.le?.seconds || 0) * 1000, archiveLe: Date.now(),
    consignes: (salle.taches || []).map((t) => t.titre),
    stagiaires: ps.map((u) => ({
      nom: u.nom || "Stagiaire", nbQ: qs.filter((q) => q.uid === (u.uid || u.id)).length,
      taches: Object.values(u.taches || {}).map((t) => ({ titre: t.titre, texte: t.texte })),
    })),
    questions: qs.sort((a, b) => (a.le || 0) - (b.le || 0)).map((q) => ({ nom: q.nom || nomDe(q.uid), who: q.whoNom || inter(q.who) || "", q: q.q || "", a: q.a || "", le: q.le || 0, ess: !!(q.qaId && ess.some((x) => x.id === q.qaId)) })),
    evolutions: evolutions.sort((a, b) => (a.le || 0) - (b.le || 0)),
    essTot: ess.length, essOk,
    essManquantes: ess.filter((x) => !qs.some((q) => q.qaId === x.id)).map((x) => x.intitule || ""),
  };
  const id = `${code}_${salle.le?.seconds || 0}`;
  await setDoc(doc(db, "seances", id), data);
  return id;
}

export async function listSeances(owner) {
  const s = await getDocs(query(collection(db, "seances"), where("owner", "==", owner)));
  return s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.archiveLe || 0) - (a.archiveLe || 0));
}
export const supprimerSeance = (id) => deleteDoc(doc(db, "seances", id));
