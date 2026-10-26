import { mergeScenario } from "./model";

const norm = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

// Statistiques globales à partir des profils (bilans) et des scénarios.
export function computeStats(users, scenarios) {
  return scenarios.map((raw) => {
    const sc = mergeScenario(raw);
    const bs = users.map((u) => (u.bilans || {})[sc.id]).filter(Boolean);
    const asked = {};
    const libres = {};
    let tent = 0, tps = 0, pct = 0, nPct = 0, echecs = 0;
    for (const b of bs) {
      tent += b.nb || 1;
      tps += b.duree || 0;
      if (b.essTot) {
        const p = b.essOk / b.essTot;
        pct += p; nPct++;
        if (p < 0.5) echecs++;
      }
      for (const l of b.log || []) {
        if (l.qaId) asked[l.qaId] = (asked[l.qaId] || 0) + 1;
        else if (l.question) { const k = norm(l.question); libres[k] = libres[k] || { q: l.question, n: 0 }; libres[k].n++; }
      }
    }
    const nb = bs.length;
    return {
      id: sc.id, titre: sc.titre, rubrique: sc.rubrique || "",
      termines: nb, tentatives: tent,
      tmoy: nb ? Math.round(tps / nb) : 0,
      pctEss: nPct ? Math.round((100 * pct) / nPct) : null,
      echecs,
      jamais: nb ? sc.qa.filter((x) => !asked[x.id]).map((x) => ({ id: x.id, intitule: x.intitule || x.reponse?.slice(0, 60) || "(sans intitulé)", essentielle: Boolean(x.essentielle) })) : [],
      libres: Object.values(libres).sort((a, b) => b.n - a.n).slice(0, 8),
    };
  });
}
