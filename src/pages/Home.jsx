import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import SalleJoin from "../components/SalleJoin";
import Dominantes from "../components/Dominantes";
import Layout from "../components/Layout";
import { configured } from "../firebase";
import { listScenarios } from "../lib/db";
import { useAuth } from "../lib/auth";
import { useDevoirs } from "../lib/useDevoirs";
import DevoirsCard from "../components/DevoirsCard";
import { etatExercice } from "../lib/etat";
import { rubriquesDe } from "../lib/model";

export function StagiaireNav() {
  const { pathname } = useLocation();
  return (
    <div className="tabs">
      <Link to="/" className="tablink" title="Tous les scénarios"><button className={pathname === "/" ? "on" : ""}>Exercices</button></Link>
      <Link to="/suivi" className="tablink" title="Tes résultats et commentaires du formateur"><button className={pathname === "/suivi" ? "on" : ""}>Mon suivi</button></Link>
      <Link to="/equipe" className="tablink" title="Rejoindre une équipe avec un code"><button className={pathname === "/equipe" ? "on" : ""}>Mon équipe</button></Link>
      <Link to="/profil" className="tablink" title="Tes informations, e-mail et mot de passe"><button className={pathname === "/profil" ? "on" : ""}>Mon profil</button></Link>
    </div>
  );
}

export default function Home() {
  const { user, profil, isAdmin, logout } = useAuth();
  const devoirs = useDevoirs(profil);
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [rub, setRub] = useState("");
  const [dur, setDur] = useState("");
  const [etat, setEtat] = useState("");
  const norm = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const vue = (list || []).filter((s) => {
    if (q && !norm(`${s.titre} ${s.description}`).includes(norm(q))) return false;
    if (rub && (s.rubrique || "") !== (rub === "__aucune" ? "" : rub)) return false;
    const d = s.duree || 0;
    if (dur === "10" && !(d > 0 && d <= 10)) return false;
    if (dur === "20" && !(d > 10 && d <= 20)) return false;
    if (dur === "21" && !(d > 20)) return false;
    if (etat && etatExercice(profil, s.id) !== etat) return false;
    return true;
  });
  const filtre = Boolean(q || rub || dur || etat);

  useEffect(() => {
    if (!configured) return;
    listScenarios(true, { uid: user?.uid, equipeId: profil?.equipeId })
      .then(setList)
      .catch((e) => setErr(e.message));
  }, [user?.uid, profil?.equipeId]); // eslint-disable-line

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
      {devoirs.filter((d) => d.statut !== "ok").length > 0 && <DevoirsCard devoirs={devoirs} />}
      {profil?.mdpProvisoire && <div className="card alerte"><strong>Mot de passe provisoire.</strong> Change-le dans <Link to="/profil">Mon profil</Link>.</div>}
      <SalleJoin />
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
      {list && list.length > 0 && (
        <div className="filtres">
          <input type="search" placeholder="Rechercher un scénario…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher" />
          <select value={rub} onChange={(e) => setRub(e.target.value)} aria-label="Rubrique">
            <option value="">Toutes les rubriques</option>
            {rubriquesDe(list).filter((r) => list.some((s) => s.rubrique === r)).map((r) => <option key={r}>{r}</option>)}
            {list.some((s) => !s.rubrique) && <option value="__aucune">Autres</option>}
          </select>
          <select value={dur} onChange={(e) => setDur(e.target.value)} aria-label="Durée">
            <option value="">Toutes durées</option><option value="10">10 min ou moins</option><option value="20">11 à 20 min</option><option value="21">Plus de 20 min</option>
          </select>
          <select value={etat} onChange={(e) => setEtat(e.target.value)} aria-label="État">
            <option value="">Tous les états</option><option value="nouveau">Non commencés</option><option value="encours">En cours</option><option value="termine">Terminés</option>
          </select>
          {filtre && <button className="btn" onClick={() => { setQ(""); setRub(""); setDur(""); setEtat(""); }}>Réinitialiser</button>}
          {filtre && <span className="muted">{vue.length} sur {list.length}</span>}
        </div>
      )}
      {filtre && list && vue.length === 0 && <div className="card">Aucun scénario ne correspond à ces filtres.</div>}
      {err && <div className="card warn">Erreur : {err}</div>}
      {configured && !list && !err && <p>Chargement…</p>}
      {list && list.length === 0 && <div className="card">Aucun scénario publié pour le moment.</div>}

      {[...rubriquesDe(list).filter((r) => vue.some((s) => s.rubrique === r)), ...(vue.some((s) => !s.rubrique) ? [""] : [])].map((r) => {
        const g = vue.filter((s) => (s.rubrique || "") === r);
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
                    <div>
                      {s.reserveA && <span className="tag">Réservé</span>}{" "}
                      {s.evolutif && <span className="tag evo">Évolutif</span>}
                      <Dominantes s={s} />
                    </div>
                    <div className="ft">
                      <span className="muted">{s.duree > 0 ? `⏱ ${s.duree} min` : ""}</span>
                      <span className="btn pri">Démarrer</span>
                    </div>
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
