import { useCallback, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { calculer } from "./fiche";
import { fmtLimite } from "./devoirs";

// Compétences du stagiaire = critères de ses fiches d'évaluation (moyenne des niveaux 0-3 par critère).
// ≥ 2 acquis · de 1 à 2 en cours · < 1 à travailler.
export function competences(evals) {
  const fiches = (evals || []).filter((e) => e.sections && calculer(e.sections).decision !== "À compléter");
  const crit = new Map();
  const secs = new Map();
  fiches.forEach((e) => e.sections.forEach((s) => {
    const sm = secs.get(s.t) || { t: s.t, pts: 0, max: 0 };
    s.c.forEach((c) => {
      if (c.v === undefined || c.v === null) return;
      sm.pts += c.v * c.k; sm.max += 3 * c.k;
      const x = crit.get(c.n) || { n: c.n, s: s.t, tot: 0, nb: 0, e: 0, dernier: null, le: 0 };
      x.tot += c.v; x.nb++; if (c.e) x.e = 1;
      if ((e.maj || 0) >= x.le) { x.le = e.maj || 0; x.dernier = c.v; }
      crit.set(c.n, x);
    });
    secs.set(s.t, sm);
  }));
  const l = [...crit.values()].map((x) => ({ ...x, moy: x.tot / x.nb }));
  return {
    nb: fiches.length,
    sections: [...secs.values()].filter((s) => s.max).map((s) => ({ t: s.t, pct: Math.round((100 * s.pts) / s.max) })),
    acquis: l.filter((x) => x.moy >= 2).sort((a, b) => b.moy - a.moy),
    encours: l.filter((x) => x.moy >= 1 && x.moy < 2).sort((a, b) => b.moy - a.moy),
    travailler: l.filter((x) => x.moy < 1).sort((a, b) => a.moy - b.moy),
  };
}

// Nouveautés du stagiaire depuis sa dernière lecture : nouvel exercice à rendre, commentaire du formateur, fiche d'évaluation.
// Dernière lecture : users/{uid}/perso/lu = { t } (privé).
const refLu = (uid) => doc(db, "users", uid, "perso", "lu");
export function useLu(uid) {
  const [t, setT] = useState(0);
  useEffect(() => { if (uid) getDoc(refLu(uid)).then((s) => { if (s.exists()) setT(s.data().t || 0); }).catch(() => {}); }, [uid]);
  const marquer = useCallback(() => { const n = Date.now(); setT(n); return setDoc(refLu(uid), { t: n }).catch(() => {}); }, [uid]);
  return { lu: t, marquer };
}
export function nouveautes({ devoirs, profil, evals, lu }) {
  const base = Math.max(lu || 0, Date.now() - 14 * 864e5);
  const l = [];
  (devoirs || []).forEach((d) => { if (d.ajout > base && d.statut !== "ok") l.push({ t: d.ajout, ic: "📌", txt: `Nouvel exercice à rendre : ${d.titre} (avant le ${fmtLimite(d.limite)})` }); });
  Object.entries(profil?.commentaires || {}).forEach(([id, c]) => { if ((c.le || 0) > base) l.push({ t: c.le, ic: "💬", txt: `Commentaire de ${c.auteur || "ton formateur"} sur « ${profil?.bilans?.[id]?.titre || "un exercice"} »`, to: "/suivi" }); });
  (evals || []).forEach((e) => { if ((e.maj || 0) > base && e.decision && e.decision !== "À compléter") l.push({ t: e.maj, ic: "📋", txt: `Fiche d'évaluation : ${e.scTitre} — ${e.decision} (${e.pct} %)`, to: "/suivi" }); });
  return l.sort((a, b) => b.t - a.t);
}
