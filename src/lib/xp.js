// Système d'XP : points gagnés à chaque exercice terminé (scénario, quiz/QCM, calcul, relation).
// Stocké dans users/{uid}.xp = { total, k: { clé: nombre de fois } }.
// Première réussite = gain complet ; les refaire rapporte 25 % (pas de farm).
export const GRADES = [
  { n: "Aspirant", s: 0, e: "🧑‍🚒" },
  { n: "Sapeur 2e classe", s: 100, e: "🔰" },
  { n: "Sapeur 1re classe", s: 300, e: "🥉" },
  { n: "Caporal", s: 600, e: "🎖️" },
  { n: "Caporal-chef", s: 1000, e: "🥈" },
  { n: "Sergent", s: 1600, e: "🥇" },
  { n: "Sergent-chef", s: 2400, e: "⭐" },
  { n: "Adjudant", s: 3400, e: "🌟" },
  { n: "Lieutenant", s: 4800, e: "🏅" },
  { n: "Capitaine", s: 6500, e: "🏆" },
  { n: "Commandant", s: 9000, e: "👑" },
];

export function niveau(total) {
  const t = Math.max(0, Number(total) || 0);
  let i = 0;
  GRADES.forEach((g, k) => { if (t >= g.s) i = k; });
  const g = GRADES[i], suiv = GRADES[i + 1] || null;
  return { i, ...g, suiv, pct: suiv ? Math.round(((t - g.s) / (suiv.s - g.s)) * 100) : 100, reste: suiv ? suiv.s - t : 0 };
}

// Points d'un exercice terminé : base 20 + jusqu'à 60 selon la réussite (+20 si 100 %).
export const ptsExercice = (ok, tot) => {
  const p = tot > 0 ? Math.max(0, Math.min(1, ok / tot)) : 0;
  return 20 + Math.round(60 * p) + (p === 1 ? 20 : 0);
};
// Scénario : 50 + 2 par question essentielle posée + 10 si toutes les essentielles ont été posées.
export const ptsScenario = (b) => {
  const tot = b.essTot || 0, ok = b.essOk || 0;
  return 50 + ok * 2 + (tot > 0 && ok === tot ? 10 : 0);
};

// Retourne { xp (nouvel objet à enregistrer), gain } pour la clé (ex. "sc_abc", "ex_xyz").
export function ajouterXp(xp, cle, pts) {
  const cur = xp && typeof xp === "object" ? xp : {};
  const k = { ...(cur.k || {}) };
  const n = k[cle] || 0;
  const gain = n === 0 ? pts : Math.max(1, Math.round(pts * 0.25));
  k[cle] = n + 1;
  return { xp: { total: (Number(cur.total) || 0) + gain, k }, gain };
}

// Annonce un gain (affiché par <XpToast/> dans Layout).
export const annonceXp = (gain) => { try { window.dispatchEvent(new CustomEvent("xp-gain", { detail: gain })); } catch (e) { /* ignore */ } };
