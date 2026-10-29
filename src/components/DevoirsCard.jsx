import { Link } from "react-router-dom";
import { fmtLimite } from "../lib/devoirs";

// Exercices à rendre du stagiaire, regroupés par parcours (progression + prochaine étape si ordre imposé).
export default function DevoirsCard({ devoirs }) {
  const late = devoirs.some((d) => d.statut === "retard");
  const groupes = new Map();
  devoirs.forEach((d) => { const k = d.pc || ""; if (!groupes.has(k)) groupes.set(k, []); groupes.get(k).push(d); });
  const ligne = (d, next, dim) => (
    <div key={d.scId} style={dim ? { opacity: 0.55 } : undefined}>
      {d.pc && d.rg !== undefined ? `${d.rg + 1}. ` : ""}<Link to={d.k === "rel" ? `/relation/${d.scId}` : d.k ? `/calculs/${d.scId}` : `/scenario/${d.scId}`}>{d.titre}</Link> — avant le {fmtLimite(d.limite)}{" "}
      {d.statut === "retard" && <span className="tag late">En retard</span>}{next && <span className="tag">Prochaine étape</span>}
    </div>
  );
  return (
    <div className="card">
      <strong>{late ? "Exercices en retard" : "Exercices à rendre"}</strong>
      {[...groupes.entries()].map(([k, it]) => {
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
            <div style={{ height: 6, background: "var(--line, #ddd)", borderRadius: 9, overflow: "hidden", margin: "4px 0" }}>
              <i style={{ display: "block", height: "100%", width: `${Math.round((fait / it.length) * 100)}%`, background: "#2e9e5b" }} />
            </div>
            {tri.filter((d) => d.statut !== "ok").map((d) => ligne(d, nx && d.scId === nx.scId, nx && d.scId !== nx.scId))}
          </div>
        );
      })}
    </div>
  );
}
