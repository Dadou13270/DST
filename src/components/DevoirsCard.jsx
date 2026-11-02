import { Link } from "react-router-dom";
import { fmtLimite } from "../lib/devoirs";
import ObjectifsPc from "./ObjectifsPc";

// Détail des exercices à rendre d'une équipe, regroupés par parcours (objectif, prérequis, objectifs intermédiaires, prochaine étape).
export function CorpsEquipe({ liste }) {
  const ligne = (d, next, dim) => (
    <div key={d.key || d.scId} style={dim ? { opacity: 0.55 } : undefined}>
      {d.pc && d.rg !== undefined ? `${d.rg + 1}. ` : ""}{d.oi !== undefined && d.pcI?.[d.oi] ? <><span className="tag" title={d.pcI[d.oi]}>🎯 Objectif {d.oi + 1}</span>{" "}</> : null}{d.dg ? <span className="tag">Diagnostic</span> : null}{d.dg ? " " : ""}<Link to={d.k === "rel" ? `/relation/${d.scId}` : d.k === "quiz" ? `/quiz/${d.scId}` : d.k ? `/calculs/${d.scId}` : `/scenario/${d.scId}`}>{d.titre}</Link> — avant le {fmtLimite(d.limite)}{" "}
      {null}{d.statut === "retard" && <span className="tag late">En retard</span>}{next && <span className="tag">Prochaine étape</span>}
    </div>
  );
  const rendu = (() => {
    const groupes = new Map();
    liste.forEach((d) => { const k = d.pc || ""; if (!groupes.has(k)) groupes.set(k, []); groupes.get(k).push(d); });
    const corps = [...groupes.entries()].map(([k, it]) => {
    const reste = it.filter((d) => d.statut !== "ok");
    if (!reste.length) return null;
    if (!k) return reste.map((d) => ligne(d, false, false));
    const tri = [...it].sort((a, b) => (a.rg || 0) - (b.rg || 0));
    const fait = it.length - reste.length;
    const nx = it.some((d) => d.pcO) ? tri.find((d) => d.statut !== "ok") : null;
    return (
      <div key={k} style={{ margin: "8px 0 4px" }}>
        <strong>Parcours « {it[0].pcT} »</strong> <span className="muted">{fait}/{it.length} terminé(s)</span>
        {it.find((d) => d.pcJ)?.pcJ && <div className="refdoc"><strong>Objectif du parcours :</strong> <span style={{ whiteSpace: "pre-line" }}>{it.find((d) => d.pcJ).pcJ}</span></div>}
        {it.find((d) => d.pcP)?.pcP && <div className="refdoc"><strong>Prérequis :</strong> <span style={{ whiteSpace: "pre-line" }}>{it.find((d) => d.pcP).pcP}</span></div>}
        <ObjectifsPc items={it} />
        {tri.filter((d) => d.statut !== "ok").map((d) => ligne(d, nx && d.scId === nx.scId, nx && d.scId !== nx.scId))}
      </div>
    );
    });
    return corps;
  })();
  return <>{rendu}</>;
}
