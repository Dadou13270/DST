import { useEffect, useState } from "react";
import { listUsers, fmtDuree } from "../lib/users";
import { listScenarios } from "../lib/db";
import { computeStats } from "../lib/stats";
import { chargerActivite } from "../lib/activite";
import ActiviteBloc from "../components/ActiviteBloc";
import { listExercices, typeExercice } from "../lib/relation";

export default function AdminStats() {
  const [st, setSt] = useState(null);
  const [nbU, setNbU] = useState(0);
  const [err, setErr] = useState("");
  const [act, setAct] = useState(null);
  const [tab, setTab] = useState("ov");
  const [users, setUsers] = useState([]);
  const [exs, setExs] = useState([]);
  useEffect(() => { listExercices(true).then(setExs); }, []);
  useEffect(() => {
    Promise.all([listUsers(), listScenarios(false)])
      .then(([u, s]) => { setNbU(u.length); setUsers(u); setSt(computeStats(u, s)); chargerActivite(u).then(setAct).catch(() => {}); })
      .catch((e) => setErr(e.message));
  }, []);
  if (err) return <div className="card warn">Erreur : {err}</div>;
  if (!st) return <p>Chargement…</p>;
  const total = st.reduce((n, x) => n + x.termines, 0);
  const exRows = exs.map((ex) => {
    const ls = users.map((u) => (u.calculs || {})[ex.id]).filter((a) => a && a.length);
    const n = ls.length, tot = n ? ls[0][ls[0].length - 1].tot : "";
    return { ex, n, essais: ls.reduce((a, l) => a + l.length, 0), moy: n ? Math.round(ls.reduce((a, l) => a + l[l.length - 1].ok, 0) / n) : null, best: n ? Math.max(...ls.map((l) => Math.max(...l.map((y) => y.ok)))) : null, tot };
  });
  const items = [
    ...st.map((x) => ({ id: "s" + x.id, titre: x.titre, type: "Scénario", rub: x.rubrique || "Sans rubrique", term: x.termines, tent: x.tentatives, tmoy: x.termines ? fmtDuree(x.tmoy) : "—", score: x.pctEss === null ? null : x.pctEss, res: x.pctEss === null ? "—" : `${x.pctEss} % essentielles · ${x.echecs}/${x.termines} échecs` })),
    ...exRows.map((r) => ({ id: "e" + r.ex.id, titre: r.ex.titre, type: typeExercice(r.ex), rub: r.ex.rubrique || "Sans rubrique", term: r.n, tent: r.essais, tmoy: "—", score: r.moy === null ? null : Math.round((r.moy / (r.tot || 100)) * 100), res: r.moy === null ? "—" : `moy. ${r.moy}/${r.tot} · meilleur ${r.best}/${r.tot}` })),
  ];
  const R = {};
  items.forEach((x) => { (R[x.rub] = R[x.rub] || []).push(x); });
  const rubs = Object.keys(R).sort((a, b) => a.localeCompare(b, "fr"));
  const echoues = [
    ...st.filter((x) => x.termines && x.echecs > 0).map((x) => ({ id: "s" + x.id, titre: x.titre, type: "Scénario", rub: x.rubrique || "Sans rubrique", tx: Math.round((100 * x.echecs) / x.termines), d: `${x.echecs} échec(s) sur ${x.termines} terminé(s)` })),
    ...exRows.filter((r) => r.moy !== null && r.tot && r.moy / r.tot < 0.5).map((r) => ({ id: "e" + r.ex.id, titre: r.ex.titre, type: typeExercice(r.ex), rub: r.ex.rubrique || "Sans rubrique", tx: Math.round(100 * (1 - r.moy / r.tot)), d: `score moyen ${r.moy}/${r.tot} (sous 50 %)` })),
  ].sort((a, b) => b.tx - a.tx).slice(0, 10);
  const sum = (l, k) => l.reduce((n, x) => n + x[k], 0);
  return (
    <>
      <h1>Statistiques globales</h1>
      <div className="tabs" style={{ marginBottom: 14 }}>
        {[["ov", "Vue d'ensemble"], ["sal", "Séances en salle"], ["scn", "Scénarios"], ["qst", "Questions"]].map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {(tab === "ov" || tab === "sal") && <ActiviteBloc act={act} users={users} part={tab} />}
      {tab === "scn" && <>
      <p className="muted">{nbU} inscrits · {total} résultats d'exercices terminés. Un exercice est « échoué » si moins de la moitié des questions essentielles ont été posées.</p>
      <h3>Total par rubrique</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 10 }}>
        <div className="card" style={{ borderTop: "3px solid var(--red, #c00)", margin: 0 }}><strong>Toutes rubriques</strong><div>{items.length} exercice(s)</div><div className="muted">{sum(items, "term")} terminés · {sum(items, "tent")} tentatives</div></div>
        {rubs.map((k) => <div className="card" key={k} style={{ margin: 0 }}><strong>{k}</strong><div>{R[k].length} exercice(s)</div><div className="muted">{sum(R[k], "term")} terminés · {sum(R[k], "tent")} tentatives</div></div>)}
      </div>
      <h3>Les plus échoués</h3>
      {echoues.length === 0 ? <p className="muted">Aucun exercice échoué pour l'instant.</p> : (
        <table className="cmp">
          <thead><tr><th>Exercice</th><th>Type</th><th>Rubrique</th><th>Taux d'échec</th><th>Détail</th></tr></thead>
          <tbody>{echoues.map((x) => <tr key={x.id}><td>{x.titre}</td><td>{x.type}</td><td>{x.rub}</td><td>{x.tx} %</td><td>{x.d}</td></tr>)}</tbody>
        </table>
      )}
      {rubs.map((k) => (
        <div className="card" key={k} style={{ marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>{k} <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>· {R[k].length} exercice(s) · {sum(R[k], "term")} terminés</span></h3>
          <table className="cmp">
            <thead><tr><th>Exercice</th><th>Type</th><th>Terminés</th><th>Tentatives</th><th>Temps moyen</th><th>Résultat</th></tr></thead>
            <tbody>{[...R[k]].sort((a, b) => b.tent - a.tent).map((x) => <tr key={x.id}><td>{x.titre}</td><td>{x.type}</td><td>{x.term}</td><td>{x.tent}</td><td>{x.tmoy}</td><td>{x.res}</td></tr>)}</tbody>
          </table>
        </div>
      ))}
      </>}
      {tab === "qst" && <>
      <h3>Questions jamais posées et questions libres sans réponse</h3>
      <p className="muted">À utiliser pour enrichir les mots-clés : une question jamais posée est peut-être mal formulée ; une question libre sans correspondance est un mot-clé manquant.</p>
      {st.filter((x) => x.jamais.length || x.libres.length).map((x) => (
        <div className="card" key={x.id}>
          <strong>{x.titre}</strong>
          {x.jamais.length > 0 && (
            <>
              <div className="muted" style={{ marginTop: 6 }}>Jamais posées</div>
              <ul>{x.jamais.map((q) => <li key={q.id}>{q.intitule} {q.essentielle && <span className="tag ok">essentielle</span>}</li>)}</ul>
            </>
          )}
          {x.libres.length > 0 && (
            <>
              <div className="muted">Questions libres sans réponse trouvée</div>
              <ul>{x.libres.map((q, i) => <li key={i}>« {q.q} » ×{q.n}</li>)}</ul>
            </>
          )}
        </div>
      ))}
      {st.every((x) => !x.jamais.length && !x.libres.length) && <p className="muted">Rien à signaler pour l'instant.</p>}
      </>}
    </>
  );
}
