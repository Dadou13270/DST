// Auto-évaluation du stagiaire avant la fin de l'exercice : observer, analyser, décider.
export const AUTO_CH = [
  { k: "obs", titre: "Observer", q: "Qu'ai-je observé ?" },
  { k: "ana", titre: "Analyser", q: "Qu'en ai-je analysé ?" },
  { k: "dec", titre: "Décider", q: "Qu'ai-je décidé ?" },
];
export default function AutoBilan({ auto }) {
  if (!auto || !AUTO_CH.some((c) => auto[c.k])) return null;
  return (
    <div className="taches-bilan">
      <strong>Auto-évaluation du stagiaire</strong>
      {AUTO_CH.map((c) => <div key={c.k} className="tb-item"><div className="muted">{c.titre}</div><p className="pre" style={{ margin: "2px 0 0" }}>{auto[c.k] || "—"}</p></div>)}
    </div>
  );
}
