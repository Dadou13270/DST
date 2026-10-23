import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { listScenarios } from "../lib/db";
import { useAuth } from "../lib/auth";
import { fmtDate, fmtDuree, statsOf } from "../lib/users";
import { StagiaireNav } from "./Home";

export default function Suivi() {
  const { profil, isAdmin, logout } = useAuth();
  const [list, setList] = useState(null);
  useEffect(() => {
    listScenarios(true).then(setList).catch(() => setList([]));
  }, []);
  const bs = profil?.bilans || {};
  const st = statsOf(bs);
  const enCours = (id) => {
    try {
      const v = JSON.parse(localStorage.getItem(`soiec-session-${id}`));
      return v && v.start && !v.finished;
    } catch {
      return false;
    }
  };
  return (
    <Layout
      right={
        <>
          {profil && <span>{profil.nom}</span>}
          {isAdmin && <Link to="/admin">Paramètres</Link>}
          <button className="link" onClick={logout}>Déconnexion</button>
        </>
      }
    >
      <StagiaireNav />
      <h1>Mon suivi</h1>
      <div className="row">
        <div className="card grow"><div className="muted">Exercices terminés</div><h2>{st.n} / {(list || []).length}</h2></div>
        <div className="card grow"><div className="muted">Temps moyen</div><h2>{st.n ? fmtDuree(st.tmoy) : "—"}</h2></div>
        <div className="card grow"><div className="muted">Questions essentielles posées</div><h2>{st.ess === null ? "—" : st.ess + " %"}</h2></div>
      </div>
      {!list && <p>Chargement…</p>}
      {(list || []).map((s) => {
        const b = bs[s.id];
        const ec = !b && enCours(s.id);
        return (
          <div className="card row between item" key={s.id}>
            <div>
              <strong>{s.titre}</strong>{" "}
              <span className={b ? "tag ok" : "tag"}>{b ? "Terminé" : ec ? "En cours" : "Non commencé"}</span>
              {b && (
                <div className="muted">
                  {fmtDate(b.fin)} · {fmtDuree(b.duree || 0)} · {b.nbQ} question(s)
                  {b.essTot ? ` · essentielles ${b.essOk}/${b.essTot}` : ""}
                  {b.nb > 1 ? ` · ${b.nb} tentatives` : ""}
                </div>
              )}
            </div>
            <Link className={b ? "btn" : "btn primary"} to={`/scenario/${s.id}`}>
              {b ? "Revoir mes réponses" : ec ? "Reprendre" : "Commencer"}
            </Link>
          </div>
        );
      })}
    </Layout>
  );
}
