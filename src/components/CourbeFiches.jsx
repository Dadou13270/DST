import { useState } from "react";
import { calculer } from "../lib/fiche";

// Courbe d'évolution d'un stagiaire : un point par fiche d'évaluation (par date), % de réussite global ou par rubrique.
const coul = (p) => (p >= 70 ? "#1f8a4c" : p >= 50 ? "#d98a00" : "#c42a1c");
export function serie(evals, rub) {
  return (evals || []).filter((e) => e.sections && calculer(e.sections).decision !== "À compléter").sort((a, b) => (a.maj || 0) - (b.maj || 0))
    .map((e) => {
      let pct = calculer(e.sections).pct;
      if (rub) {
        const s = e.sections.find((x) => x.t === rub);
        if (!s) return null;
        let pts = 0, max = 0;
        s.c.forEach((c) => { if (c.v !== undefined && c.v !== null) { pts += c.v * c.k; max += 3 * c.k; } });
        if (!max) return null;
        pct = Math.round((100 * pts) / max);
      }
      return { pct, titre: e.scTitre || "", date: new Date(e.maj || 0).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }), dec: e.decision };
    }).filter(Boolean);
}
export default function CourbeFiches({ evals }) {
  const [rub, setRub] = useState("");
  const rubs = [...new Set((evals || []).flatMap((e) => (e.sections || []).map((s) => s.t)))];
  const pts = serie(evals, rub);
  if (!pts.length) return null;
  const W = 640, H = 230, L = 38, R = 14, T = 12, B = 34;
  const x = (i) => (pts.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (pts.length - 1));
  const y = (p) => T + ((100 - p) * (H - T - B)) / 100;
  return (
    <div className="cb">
      <div className="row between" style={{ marginBottom: 6 }}>
        <h4 style={{ margin: 0 }}>Évolution dans le temps</h4>
        <select value={rub} onChange={(e) => setRub(e.target.value)} aria-label="Rubrique">
          <option value="">Résultat global</option>
          {rubs.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="cb-svg" role="img" aria-label="Courbe d'évolution des fiches d'évaluation">
        {[0, 50, 70, 100].map((p) => (
          <g key={p}><line x1={L} x2={W - R} y1={y(p)} y2={y(p)} stroke={p === 50 || p === 70 ? "#d98a00" : "#bbb"} strokeDasharray={p === 50 || p === 70 ? "5 4" : ""} strokeWidth="1" opacity=".7" /><text x={L - 6} y={y(p) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity=".7">{p}%</text></g>
        ))}
        {pts.length > 1 && <polyline points={pts.map((p, i) => `${x(i)},${y(p.pct)}`).join(" ")} fill="none" stroke="#2e6bd6" strokeWidth="2.5" />}
        {pts.map((p, i) => (
          <g key={i}><circle cx={x(i)} cy={y(p.pct)} r="6" fill={coul(p.pct)} stroke="#fff" strokeWidth="2"><title>{`${p.titre} · ${p.date} · ${p.pct} %${rub ? "" : " · " + p.dec}`}</title></circle>
            <text x={x(i)} y={y(p.pct) - 11} textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor">{p.pct}</text>
            <text x={x(i)} y={H - 16} textAnchor="middle" fontSize="11" fill="currentColor" opacity=".75">{p.date}</text></g>
        ))}
      </svg>
      <p className="muted" style={{ margin: "4px 0 0", fontSize: ".85em" }}>{pts.length > 1 ? "Un point par fiche, du plus ancien au plus récent. Traits orange : seuils de 50 % et 70 %. Survole un point pour voir le scénario." : "Une seule fiche pour l'instant : la courbe apparaît dès la deuxième."}</p>
    </div>
  );
}
