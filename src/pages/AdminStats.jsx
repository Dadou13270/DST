import { useEffect, useState } from "react";
import { listUsers, fmtDuree } from "../lib/users";
import { listScenarios } from "../lib/db";
import { computeStats } from "../lib/stats";
import { chargerActivite } from "../lib/activite";
import ActiviteBloc from "../components/ActiviteBloc";

export default function AdminStats() {
  const [st, setSt] = useState(null);
  const [nbU, setNbU] = useState(0);
  const [err, setErr] = useState("");
  const [act, setAct] = useState(null);
  const [tab, setTab] = useState("ov");
  const [users, setUsers] = useState([]);
  useEffect(() => {
    Promise.all([listUsers(), listScenarios(false)])
      .then(([u, s]) => { setNbU(u.length); setUsers(u); setSt(computeStats(u, s)); chargerActivite(u).then(setAct).catch(() => {}); })
      .catch((e) => setErr(e.message));
  }, []);
  if (err) return <div className="card warn">Erreur : {err}</div>;
  if (!st) return <p>Chargement…</p>;
  const joues = [...st].sort((a, b) => b.tentatives - a.tentatives);
  const rates = st.filter((x) => x.pctEss !== null).sort((a, b) => a.pctEss - b.pctEss);
  const total = st.reduce((n, x) => n + x.termines, 0);
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
      <h3>Scénarios les plus joués</h3>
      <table className="cmp">
        <thead><tr><th>Scénario</th><th>Rubrique</th><th>Terminés</th><th>Tentatives</th><th>Temps moyen</th></tr></thead>
        <tbody>{joues.map((x) => <tr key={x.id}><td>{x.titre}</td><td>{x.rubrique || "—"}</td><td>{x.termines}</td><td>{x.tentatives}</td><td>{x.termines ? fmtDuree(x.tmoy) : "—"}</td></tr>)}</tbody>
      </table>
      <h3>Scénarios les plus échoués</h3>
      {rates.length === 0 ? <p className="muted">Pas encore de données.</p> : (
        <table className="cmp">
          <thead><tr><th>Scénario</th><th>Essentielles posées (moy.)</th><th>Échecs</th></tr></thead>
          <tbody>{rates.map((x) => <tr key={x.id}><td>{x.titre}</td><td>{x.pctEss} %</td><td>{x.echecs}/{x.termines}</td></tr>)}</tbody>
        </table>
      )}
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
