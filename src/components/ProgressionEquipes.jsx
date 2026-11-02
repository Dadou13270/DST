// Barre de progression d'une équipe : parcours concernés, exercices terminés et pourcentage. À placer sous le nom de l'équipe.
export default function BarreEquipe({ liste }) {
  if (!liste || !liste.length) return null;
  const fait = liste.filter((d) => d.statut === "ok").length, retard = liste.some((d) => d.statut === "retard");
  const noms = [...new Set(liste.filter((d) => d.pc).map((d) => d.pcT))];
  const p = Math.round((fait / liste.length) * 100);
  return (
    <>
      <div className="muted" style={{ fontSize: ".85rem" }}>{noms.length ? noms.map((n) => `Parcours « ${n} »`).join(" · ") : "Exercices à rendre"} · {fait}/{liste.length} terminé(s){retard ? " · en retard" : ""}</div>
      <div role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100} aria-label={`${p} % terminé`} style={{ position: "relative", height: 20, background: "var(--line,#ddd)", borderRadius: 9, overflow: "hidden", margin: "4px 0 6px" }}>
        <i style={{ display: "block", height: "100%", width: p + "%", background: p === 100 ? "#16794a" : retard ? "var(--red)" : "#2e9e5b", transition: "width .4s" }} />
        <b style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: ".78rem", color: p > 45 ? "#fff" : "var(--ink)" }}>{p} %</b>
      </div>
    </>
  );
}
