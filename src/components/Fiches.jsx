import { useState } from "react";
import { FICHES, chercherFiches } from "../lib/fiches";

export default function Fiches({ compact }) {
  const [q, setQ] = useState("");
  const [ouv, setOuv] = useState("");
  const l = chercherFiches(q);
  return (
    <div className="fiches">
      <input type="search" placeholder="Chercher dans les fiches…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Chercher une fiche" />
      {l.length === 0 && <p className="muted">Aucune fiche.</p>}
      {l.map((f) => {
        const o = q.trim() || ouv === f.id;
        return (
          <div className="card fiche" key={f.id}>
            <button type="button" className="sv-tog" aria-expanded={!!o} onClick={() => setOuv(ouv === f.id ? "" : f.id)}>
              <span className="chev" style={{ display: "inline-block", transition: ".15s", transform: o ? "rotate(90deg)" : "none" }}>▶</span> <strong>{f.titre}</strong>
            </button>
            {o && (
              <div>
                <p className="muted">{f.intro}</p>
                <dl className="fdl">{f.lignes.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
                {f.pre && <pre className="pre">{f.pre}</pre>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
export { FICHES };
