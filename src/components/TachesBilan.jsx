// Réponses aux consignes demandées par le formateur pendant une séance en salle (message flash, arrivée sur les lieux…).
export default function TachesBilan({ taches }) {
  const l = Object.values(taches || {}).filter((t) => t && t.texte);
  if (!l.length) return null;
  return (
    <div className="taches-bilan">
      <strong>Consignes de la séance en salle</strong>
      {l.sort((a, b) => (a.le || 0) - (b.le || 0)).map((t, i) => (
        <div key={i} className="tb-item"><div className="muted">{t.titre}</div><p className="pre" style={{ margin: "2px 0 0" }}>{t.texte}</p></div>
      ))}
    </div>
  );
}
