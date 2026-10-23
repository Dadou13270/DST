import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import { configured } from "../firebase";
import { listScenarios } from "../lib/db";
import { useAuth } from "../lib/auth";
import { rubriquesDe } from "../lib/model";

export function StagiaireNav() {
  const { pathname } = useLocation();
  return (
    <div className="tabs">
      <Link to="/" className="tablink"><button className={pathname === "/" ? "on" : ""}>Exercices</button></Link>
      <Link to="/suivi" className="tablink"><button className={pathname === "/suivi" ? "on" : ""}>Mon suivi</button></Link>
    </div>
  );
}

export default function Home() {
  const { profil, isAdmin, logout } = useAuth();
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!configured) return;
    listScenarios(true)
      .then(setList)
      .catch((e) => setErr(e.message));
  }, []);

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
      <h1>Choisis un scénario</h1>
      <p className="muted">
        Observe la photo, interroge les personnes présentes, puis construis ton SOIEC et ton message.
      </p>

      {!configured && (
        <div className="card warn">Firebase n'est pas configuré. Renseigne le fichier .env (voir README).</div>
      )}
      {list && list.length > 0 && (
        <p>
          <strong>{list.length}</strong> scénario{list.length > 1 ? "s" : ""} disponible{list.length > 1 ? "s" : ""} ·{" "}
          {new Set(list.map((s) => s.rubrique || "")).size} rubrique{new Set(list.map((s) => s.rubrique || "")).size > 1 ? "s" : ""}
        </p>
      )}
      {err && <div className="card warn">Erreur : {err}</div>}
      {configured && !list && !err && <p>Chargement…</p>}
      {list && list.length === 0 && <div className="card">Aucun scénario publié pour le moment.</div>}

      {[...rubriquesDe(list).filter((r) => (list || []).some((s) => s.rubrique === r)), ...((list || []).some((s) => !s.rubrique) ? [""] : [])].map((r) => {
        const g = (list || []).filter((s) => (s.rubrique || "") === r);
        return (
          <section key={r || "autres"}>
            <h3 className="rub">{r || "Autres"} <span className="muted">({g.length})</span></h3>
            <div className="grid">
              {g.map((s) => (
                <Link key={s.id} to={`/scenario/${s.id}`} className="card scn">
                  {s.vignette ? <img src={s.vignette} alt="" /> : <div className="ph">Pas de photo</div>}
                  <div className="scn-body">
                    <h3>{s.titre}</h3>
                    <p className="muted">{s.description}</p>
                    {s.duree > 0 && <span className="tag">{s.duree} min</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </Layout>
  );
}
