import { useState } from "react";
import { Link } from "react-router-dom";
import { fmtLimite } from "../lib/devoirs";

// Objectifs intermédiaires en pastilles (progression d'après les exercices rattachés).
function ObjChips({ items }) {
  const pcI = (items.find((d) => d.pcI) || {}).pcI || [];
  if (!pcI.length) return null;
  let courant = -1;
  const et = pcI.map((o, k) => { const l = items.filter((d) => d.oi === k), ok = l.filter((d) => d.statut === "ok").length, fini = l.length > 0 && ok === l.length; if (l.length && !fini && courant < 0) courant = k; return { o, k, n: l.length, ok, fini }; });
  return <div className="eqv-obj">{et.map((x) => <span key={x.k}><b>{x.k + 1}. {x.o}</b> {x.n > 0 && <span className="muted">{x.fini ? "✔ atteint" : `${x.ok}/${x.n}`}</span>}{x.k === courant && <> <span className="eqv-tg cur">En cours</span></>}</span>)}</div>;
}

const lien = (d) => (d.k === "dec" ? `/decision/${d.scId}` : d.k === "rel" ? `/relation/${d.scId}` : d.k === "quiz" ? `/quiz/${d.scId}` : d.k ? `/calculs/${d.scId}` : `/scenario/${d.scId}`);

// Données dérivées d'une équipe (communes aux variantes A et B).
export function infosEquipe(eq, liste) {
  const reste = liste.filter((d) => d.statut !== "ok");
  const retard = liste.filter((d) => d.statut === "retard").length;
  const fait = liste.length - reste.length;
  const p = liste.length ? Math.round((fait / liste.length) * 100) : 0;
  const ordre = liste.some((d) => d.pcO);
  const nx = [...reste].sort((a, b) => (ordre ? (a.rg || 0) - (b.rg || 0) : (a.limite || 9e15) - (b.limite || 9e15)))[0];
  const ech = reste.filter((d) => d.limite).map((d) => d.limite).sort((a, b) => a - b)[0];
  const parcours = [];
  const m = new Map();
  liste.forEach((d) => { if (!d.pc) return; if (!m.has(d.pc)) m.set(d.pc, []); m.get(d.pc).push(d); });
  m.forEach((it, k) => parcours.push({ k, it: [...it].sort((a, b) => (a.rg || 0) - (b.rg || 0)), nom: it[0].pcT, fait: it.filter((d) => d.statut === "ok").length, ordre: it.some((d) => d.pcO), obj: (it.find((d) => d.pcJ) || {}).pcJ, pre: (it.find((d) => d.pcP) || {}).pcP }));
  return { eq, liste, reste, retard, fait, p, nx, ech, parcours, gest: liste[0]?.gest };
}

const Etat = ({ d, nx }) => (<>
  {d.statut === "retard" && <span className="eqv-tg late">En retard</span>}
  {d.statut === "ok" && <span className="eqv-tg ok">Terminé</span>}
  {d.statut === "attente" && <span className="eqv-tg">À rendre</span>}
  {nx && d.statut !== "ok" && <> <span className="eqv-tg">Prochaine étape</span></>}
</>);

function Lib({ d, nx }) {
  return (<>
    {d.pc && d.rg !== undefined ? `${d.rg + 1}. ` : ""}
    {d.oi !== undefined && d.pcI?.[d.oi] ? <><span title={d.pcI[d.oi]}>🎯 Obj. {d.oi + 1} · </span></> : null}
    {d.dg ? <><span className="eqv-tg">Diagnostic</span>{" "}</> : null}
    <Link to={lien(d)}>{d.titre}</Link>
  </>);
}

function Suite({ x }) {
  const { nx, p, retard } = x;
  return (<>
    <div className="eqv-bar"><div role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}><i style={{ width: p + "%", background: p === 100 ? "#16794a" : retard ? "var(--red)" : "#2e9e5b" }} /></div><b>{p} %</b></div>
    <div className="ac-next">
      {nx
        ? <><div><span className="muted">Prochaine étape{nx.limite ? ` · avant le ${fmtLimite(nx.limite)}` : ""}</span><br /><strong>{nx.pc && nx.rg !== undefined ? `${nx.rg + 1}. ` : ""}{nx.titre}</strong></div><Link className="btn primary" to={lien(nx)}>Faire l'exercice</Link></>
        : <div><span className="muted">Tout est rendu</span><br /><strong>Bravo, rien à rendre</strong></div>}
    </div>
  </>);
}

function Table({ x }) {
  if (!x.reste.length) return null;
  return (
    <table className="eqv-tab">
      <thead><tr><th>Exercice</th><th>Échéance</th><th>Statut</th></tr></thead>
      <tbody>{x.reste.map((d) => <tr key={d.key || d.scId}><td><Lib d={d} /></td><td>{fmtLimite(d.limite)}</td><td><Etat d={d} nx={x.nx && x.nx.scId === d.scId} /></td></tr>)}</tbody>
    </table>
  );
}

// Proposition A : une carte par équipe, sections repliables.
export function VarianteA({ groupes }) {
  return (
    <div className="card">
      <h3 style={{ margin: "0 0 8px" }}>Mes équipes</h3>
      {groupes.map((x) => (
        <div key={x.eq || "_"} className={"eqv-card"}>
          <div className="row between" style={{ gap: 8 }}>
            <div><strong>{x.eq ? `Équipe « ${x.eq} »` : "Mes exercices"}</strong>{x.gest && <span className="muted"> · gestionnaire {x.gest}</span>}
              <div className="muted" style={{ fontSize: ".85rem" }}>{x.parcours.length ? x.parcours.map((q) => `Parcours « ${q.nom} »`).join(" · ") : "Exercices à rendre"} · {x.fait}/{x.liste.length} terminé(s)</div></div>
            {x.retard > 0 && <span className="eqv-tg late">En retard</span>}
          </div>
          <Suite x={x} />
          {x.parcours.map((q) => (
            <details key={q.k} className="eqv-det"><summary>Parcours « {q.nom} » · {q.fait}/{q.it.length} terminé(s)</summary>
              {q.pre && <div className="eqv-p"><strong>Prérequis :</strong> <span style={{ whiteSpace: "pre-line" }}>{q.pre}</span></div>}
              {q.obj && <div className="eqv-p"><strong>Objectif du parcours :</strong> <span style={{ whiteSpace: "pre-line" }}>{q.obj}</span></div>}
              <ObjChips items={q.it} />
            </details>
          ))}
          {x.reste.length > 0 && <details className="eqv-det"><summary>Exercices à rendre ({x.reste.length})</summary><Table x={x} /></details>}
        </div>
      ))}
    </div>
  );
}

// Proposition B : un onglet par équipe, chiffres clés, frise du parcours et tableau.
export function VarianteB({ groupes }) {
  const [i, setI] = useState(0);
  const x = groupes[Math.min(i, groupes.length - 1)];
  const court = (ms) => (ms ? new Date(ms).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) : "—");
  return (
    <div className="card">
      <h3 style={{ margin: "0 0 8px" }}>Mes équipes</h3>
      {groupes.length > 1 && <div className="eqv-tabs" role="tablist">{groupes.map((g, k) => <button key={g.eq || "_"} role="tab" aria-selected={k === i} className={k === i ? "on" : ""} onClick={() => setI(k)}>{g.eq || "Mes exercices"}{g.retard > 0 && <span className="eqv-tg late">retard</span>}</button>)}</div>}
      <div className="row between" style={{ gap: 8 }}>
        <span><strong>{x.eq ? `Équipe « ${x.eq} »` : "Mes exercices"}</strong>{x.gest && <span className="muted"> · gestionnaire {x.gest}</span>}</span>
        <span className="muted">{x.parcours.length ? x.parcours.map((q) => `Parcours « ${q.nom} »`).join(" · ") : "Exercices à rendre"}</span>
      </div>
      <div className="eqv-kp">
        <div><span className="muted">Progression</span><b>{x.p} %</b></div>
        <div><span className="muted">Terminés</span><b>{x.fait} / {x.liste.length}</b></div>
        <div><span className="muted">En retard</span><b style={x.retard ? { color: "var(--red)" } : undefined}>{x.retard}</b></div>
        <div><span className="muted">Prochaine échéance</span><b>{court(x.ech)}</b></div>
      </div>
      <Suite x={x} />
      <div className="eqv-g2">
        {x.parcours.length > 0 && <div>
          {x.parcours.map((q) => {
            const nom = (d) => (d.oi !== undefined && d.pcI?.[d.oi] ? d.pcI[d.oi] : null);
            return (
              <div key={q.k}><strong>Parcours « {q.nom} »</strong> <span className="muted">{q.fait}/{q.it.length} terminé(s)</span>
                {q.pre && <div className="eqv-p"><strong>Prérequis :</strong> <span style={{ whiteSpace: "pre-line" }}>{q.pre}</span></div>}
                {q.obj && <div className="eqv-p"><strong>Objectif :</strong> <span style={{ whiteSpace: "pre-line" }}>{q.obj}</span></div>}
                <ObjChips items={q.it} />
                <div className="eqv-tl">{q.it.map((d) => (
                  <div key={d.key || d.scId} className={d.statut === "ok" ? "fait" : ""}>
                    {nom(d) && <div><strong>Obj. {d.oi + 1} · {nom(d)}</strong></div>}
                    <Lib d={d} />
                    <br /><span className="muted">avant le {fmtLimite(d.limite)}</span> <Etat d={d} nx={x.nx && x.nx.scId === d.scId} />
                  </div>))}</div>
              </div>
            );
          })}
        </div>}
        <div>{x.reste.length > 0 && <><strong>Exercices à rendre ({x.reste.length})</strong><Table x={x} /></>}</div>
      </div>
    </div>
  );
}
