import { db } from "../firebase";
import { collection, getDocs, getCountFromServer } from "firebase/firestore";

// Suivi de l'activité (admin) : équipes, stagiaires, séances en salle.
export async function chargerActivite(users) {
  const [t, s] = await Promise.all([getDocs(collection(db, "teams")), getDocs(collection(db, "salles"))]);
  const equipes = t.docs.map((d) => {
    const e = { id: d.id, ...d.data() };
    const m = users.filter((u) => u.equipeId === d.id);
    return { ...e, membres: m.length, termines: m.reduce((n, u) => n + Object.keys(u.bilans || {}).length, 0) };
  }).sort((a, b) => (b.membres - a.membres) || (a.nom || "").localeCompare(b.nom || "", "fr"));
  const salles = await Promise.all(
    s.docs.map(async (d) => {
      const r = { id: d.id, ...d.data(), le: d.data().le?.toMillis?.() || 0 };
      try {
        const [p, q] = await Promise.all([
          getCountFromServer(collection(db, "salles", d.id, "participants")),
          getCountFromServer(collection(db, "salles", d.id, "questions")),
        ]);
        return { ...r, participants: p.data().count, questions: q.data().count };
      } catch { return { ...r, participants: 0, questions: 0 }; }
    })
  );
  return { equipes, salles: salles.sort((a, b) => b.le - a.le) };
}
