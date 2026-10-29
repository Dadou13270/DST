import { calcImg } from "../lib/calculImages";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CadresBadges, CADRES } from "../components/Cadres";
import Dominantes from "../components/Dominantes";
import Layout from "../components/Layout";
import { configured } from "../firebase";
import { listScenarios } from "../lib/db";
import { useAuth } from "../lib/auth";
import { useDevoirs } from "../lib/useDevoirs";
import DevoirsCard from "../components/DevoirsCard";
import { etatExercice } from "../lib/etat";
import { rubriquesDe, RI } from "../lib/model";
import { listCalculs } from "../lib/calculs";
import { listExercices } from "../lib/relation";
import { useCharte } from "../lib/charte";
import { useCarnet } from "../lib/carnet";
import { useMessages, nbNonLus } from "../lib/messages";
import { nouveautes, useLu } from "../lib/competences";
import { evaluationsDe } from "../lib/fiche";

export function StagiaireNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const nonLus = nbNonLus(useMessages(user?.uid), user?.uid);
  return (
    <div className="tabs">
      <Link to="/" className="tablink" title="Tes exercices à réaliser"><button className={pathname === "/" ? "on" : ""}>Accueil</button></Link>
      <Link to="/scenarios" className="tablink" title="Tous les scénarios"><button className={pathname === "/scenarios" || pathname.startsWith("/calculs") ? "on" : ""}>Scénarios</button></Link>
      <Link to="/suivi" className="tablink" title="Tes résultats et commentaires du formateur"><button className={pathname === "/suivi" ? "on" : ""}>Mon suivi</button></Link>
      <Link to="/fiches" className="tablink" title="Rappels courts : SOIEC, formules, messages"><button className={pathname === "/fiches" ? "on" : ""}>Fiches mémo</button></Link>
      <Link to="/equipe" className="tablink" title="Rejoindre une équipe avec un code"><button className={pathname === "/equipe" ? "on" : ""}>Mon équipe</button></Link>
      <Link to="/seance" className="tablink" title="Rejoindre une séance en salle avec un code"><button className={pathname === "/seance" ? "on" : ""}>Séance en salle</button></Link>
      <Link to="/messages" className="tablink" title="Messages privés avec ton gestionnaire"><button className={pathname === "/messages" ? "on" : ""}>Messages{nonLus > 0 && <span className="tabbadge">{nonLus}</span>}</button></Link>
      <Link to="/profil" className="tablink" title="Tes informations, e-mail et mot de passe"><button className={pathname === "/profil" ? "on" : ""}>Mon profil</button></Link>
    </div>
  );
}

export default function Home({ mode = "scenarios" }) {
  const { user, profil, isAdmin, logout } = useAuth();
  const devoirs = useDevoirs(profil);
  const { lu, marquer } = useLu(user?.uid);
  const [evalsN, setEvalsN] = useState([]);
  useEffect(() => { if (user && configured) evaluationsDe(user.uid).then(setEvalsN).catch(() => {}); }, [user?.uid]); // eslint-disable-line
  const [list, setList] = useState(null);
  const [calcEx, setCalcEx] = useState([]);
  useEffect(() => { if (configured) listExercices(isAdmin, { uid: user?.uid, equipeId: profil?.equipeId }).then(setCalcEx).catch(() => {}); }, [isAdmin, user?.uid, profil?.equipeId]);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [rub, setRub] = useState("");
  const [dur, setDur] = useState("");
  const [etat, setEtat] = useState("");
  const [typ, setTyp] = useState("");
  const [soloFav, setSoloFav] = useState(false);
  const [cadre, setCadre] = useState(() => { try { return localStorage.getItem("op-cadre") || ""; } catch { return ""; } });
  const majCadre = (v) => { setCadre(v); try { localStorage.setItem("op-cadre", v); } catch { /* */ } };
  const charte = useCharte();
  const { carnet, basculerFavori } = useCarnet(user?.uid);
  const estFav = (k) => carnet.favoris.includes(k);
  const etoile = (k) => (
    <span role="button" tabIndex={0} className={"fav" + (estFav(k) ? " on" : "")} style={{ position: "absolute", top: 8, right: 8, zIndex: 2, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "rgba(255,255,255,.92)", color: estFav(k) ? "#e0a100" : "#777", fontSize: "1.25rem", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,.25)", userSelect: "none" }} title={estFav(k) ? "Retirer des favoris" : "Mettre en favori"} aria-label="Favori" aria-pressed={estFav(k)}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); basculerFavori(k); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); basculerFavori(k); } }}>{estFav(k) ? "★" : "☆"}</span>
  );
  const [ferme, setFerme] = useState(() => { try { return JSON.parse(localStorage.getItem("op-rub") || "{}") || {}; } catch { return {}; } });
  const [cols, setCols] = useState(() => { try { const v = localStorage.getItem("op-cols"); return ["2", "3", "4", "5"].includes(v) ? v : "5"; } catch { return "5"; } });
  const suivCols = () => { const n = { "2": "3", "3": "4", "4": "5", "5": "2" }[cols] ?? "5"; setCols(n); try { localStorage.setItem("op-cols", n); } catch { /* */ } };
  const majFerme = (n) => { setFerme(n); try { localStorage.setItem("op-rub", JSON.stringify(n)); } catch { /* */ } };
  const norm = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const vue = (list || []).filter((s) => {
    if (q && !norm(`${s.titre} ${s.description}`).includes(norm(q))) return false;
    if (rub && (s.rubrique || "") !== (rub === "__aucune" ? "" : rub)) return false;
    if (typ && typ !== "soiec") return false;
    const d = s.duree || 0;
    if (dur === "10" && !(d > 0 && d <= 10)) return false;
    if (dur === "20" && !(d > 10 && d <= 20)) return false;
    if (dur === "21" && !(d > 20)) return false;
    if (etat && etatExercice(profil, s.id) !== etat) return false;
    if (soloFav && !estFav("s:" + s.id)) return false;
    if (cadre && !(s.cadres || []).includes(cadre)) return false;
    return true;
  });
  const filtre = Boolean(q || rub || dur || etat || typ || soloFav || cadre);
  const essaisDe = (id) => (profil?.calculs || {})[id] || [];
  const calcs = calcEx.filter((ex) => {
    if (typ === "soiec" || (typ === "calc" && ex.kind === "rel") || (typ === "rel" && ex.kind !== "rel")) return false;
    if (rub && (ex.rubrique || "") !== (rub === "__aucune" ? "" : rub)) return false;
    if (dur) return false;
    if (q && !norm(`${ex.titre} ${ex.kind === "rel" ? ex.description : ex.contexte}`).includes(norm(q))) return false;
    if (etat && etat !== (essaisDe(ex.id).length ? "termine" : "nouveau")) return false;
    if (soloFav && !estFav("e:" + ex.id)) return false;
    if (cadre && !(ex.cadres || []).includes(cadre)) return false;
    return true;
  });

  useEffect(() => {
    if (!configured) return;
    listScenarios(true, { uid: user?.uid, equipeId: profil?.equipeId })
      .then(setList)
      .catch((e) => setErr(e.message));
  }, [user?.uid, profil?.equipeId]); // eslint-disable-line

  if (mode === "accueil") {
    const aRendre = devoirs.filter((d) => d.statut !== "ok");
    const nvx = nouveautes({ devoirs, profil, evals: evalsN, lu });
    const favs = (carnet.favoris || []).map((k) => {
      const id = k.slice(2);
      if (k[0] === "s") { const s = (list || []).find((x) => x.id === id); return s ? { k, titre: s.titre, to: `/scenario/${id}` } : null; }
      const e = calcEx.find((x) => x.id === id);
      return e ? { k, titre: e.titre, to: e.kind === "rel" ? `/relation/${id}` : `/calculs/${id}` } : null;
    }).filter(Boolean);
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
        {profil?.mdpProvisoire && <div className="card alerte"><strong>Mot de passe provisoire.</strong> Change-le dans <Link to="/profil">Mon profil</Link>.</div>}
        <h1>Accueil</h1>
        {!configured && <div className="card warn">Firebase n'est pas configuré. Renseigne le fichier .env (voir README).</div>}
        {nvx.length > 0 && (
          <div className="card nvx">
            <div className="row between"><strong>🔔 Nouveau pour toi ({nvx.length})</strong><button className="btn" onClick={marquer}>Marquer comme lu</button></div>
            {nvx.map((n, i) => <div key={i} style={{ marginTop: 6 }}>{n.ic} {n.to ? <Link to={n.to}>{n.txt}</Link> : n.txt} <span className="muted">· {new Date(n.t).toLocaleDateString("fr-FR")}</span></div>)}
          </div>
        )}
        {aRendre.length > 0
          ? <DevoirsCard devoirs={devoirs} />
          : <div className="card"><strong>Exercices à réaliser</strong><p className="muted" style={{ margin: "4px 0 0" }}>Aucun exercice à rendre pour le moment.</p></div>}
        {favs.length > 0 && (
          <div className="card">
            <strong>★ Mes favoris</strong>
            {favs.map((f) => <div key={f.k} style={{ marginTop: 6 }}><Link to={f.to}>{f.titre}</Link></div>)}
          </div>
        )}
        <div className="card">
          <strong>Choisir un exercice</strong>
          <p className="muted" style={{ margin: "4px 0 8px" }}>{charte.accueil}</p>
          <Link to="/scenarios" className="btn primary">Parcourir tous les scénarios{list ? ` (${list.length + calcEx.length})` : ""}</Link>
        </div>
      </Layout>
    );
  }

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
      <p className="muted">{charte.accueil}</p>

      {!configured && (
        <div className="card warn">Firebase n'est pas configuré. Renseigne le fichier .env (voir README).</div>
      )}
      {list && list.length > 0 && (
        <p>
          <strong>{list.length + calcEx.length}</strong> exercice{list.length + calcEx.length > 1 ? "s" : ""} disponible{list.length + calcEx.length > 1 ? "s" : ""} ·{" "}
          {new Set([...list, ...calcEx].map((s) => s.rubrique || "")).size} rubrique{new Set([...list, ...calcEx].map((s) => s.rubrique || "")).size > 1 ? "s" : ""}
        </p>
      )}
      {list && list.length > 0 && (
        <div className="filtres">
          <input type="search" placeholder="Rechercher un exercice…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher" />
          <select value={rub} onChange={(e) => setRub(e.target.value)} aria-label="Rubrique">
            <option value="">Toutes les rubriques</option>
            {rubriquesDe([...(list || []), ...calcEx]).filter((r) => list.some((s) => s.rubrique === r) || calcEx.some((c) => c.rubrique === r)).map((r) => <option key={r}>{r}</option>)}
            {(list.some((s) => !s.rubrique) || calcEx.some((c) => !c.rubrique)) && <option value="__aucune">Autres</option>}
          </select>
          <select value={typ} onChange={(e) => setTyp(e.target.value)} aria-label="Type d'exercice">
            <option value="">Tous les types</option><option value="soiec">Scénarios</option><option value="calc">Calcul LIF</option><option value="rel">Relationnel</option>
          </select>
          <select value={dur} onChange={(e) => setDur(e.target.value)} aria-label="Durée">
            <option value="">Toutes durées</option><option value="10">10 min ou moins</option><option value="20">11 à 20 min</option><option value="21">Plus de 20 min</option>
          </select>
          <select value={etat} onChange={(e) => setEtat(e.target.value)} aria-label="État">
            <option value="">Tous les états</option><option value="nouveau">Non commencés</option><option value="encours">En cours</option><option value="termine">Terminés</option>
          </select>
          <select value={cadre} onChange={(e) => majCadre(e.target.value)} aria-label="Cadre d'emploi">
            <option value="">Tous les cadres d'emploi</option>
            {CADRES.map((c) => <option key={c.k} value={c.k}>{c.l}</option>)}
          </select>
          <button className={"btn" + (soloFav ? " primary" : "")} aria-pressed={soloFav} onClick={() => setSoloFav(!soloFav)} title="Afficher seulement mes favoris">★ Favoris{carnet.favoris.length ? ` (${carnet.favoris.length})` : ""}</button>
          <button className="btn colbtn" onClick={suivCols} title="Changer le nombre de colonnes">▦ Colonnes : {cols}</button>
          {filtre && <button className="btn" onClick={() => { setQ(""); setRub(""); setDur(""); setEtat(""); setTyp(""); setSoloFav(false); majCadre(""); }}>Réinitialiser</button>}
          {filtre && <span className="muted">{vue.length + calcs.length} sur {list.length + calcEx.length}</span>}
        </div>
      )}
      {filtre && list && vue.length === 0 && calcs.length === 0 && <div className="card">Aucun scénario ne correspond à ces filtres.</div>}
      {err && <div className="card warn">Erreur : {err}</div>}
      {configured && !list && !err && <p>Chargement…</p>}
      {list && list.length === 0 && <div className="card">Aucun scénario publié pour le moment.</div>}

      {(() => {
        const toutes = [...rubriquesDe([...(list || []), ...calcEx]).filter((r) => vue.some((s) => s.rubrique === r) || calcs.some((c) => c.rubrique === r)), ...(vue.some((s) => !s.rubrique) || calcs.some((c) => !c.rubrique) ? [""] : [])];
        if (toutes.length < 2 || filtre) return null;
        const un = toutes.some((r) => !ferme[r]);
        return <div className="rubbar"><span /><button className="btn" onClick={() => majFerme(Object.fromEntries(toutes.map((r) => [r, un])))}>{un ? "Tout replier" : "Tout déplier"}</button></div>;
      })()}
      {[...rubriquesDe([...(list || []), ...calcEx]).filter((r) => vue.some((s) => s.rubrique === r) || calcs.some((c) => c.rubrique === r)), ...(vue.some((s) => !s.rubrique) || calcs.some((c) => !c.rubrique) ? [""] : [])].map((r) => {
        const g = vue.filter((s) => (s.rubrique || "") === r);
        const clos = !filtre && ferme[r];
        return (
          <section key={r || "autres"}>
            <h3 className="rub">
              <button className="rubtog" aria-expanded={!clos} onClick={() => majFerme({ ...ferme, [r]: !ferme[r] })}>
                <span className="chev">▾</span><span className="rname">{r || "Autres"}</span> <span className="muted">({g.length + calcs.filter((c) => (c.rubrique || "") === r).length})</span>
              </button>
            </h3>
            {!clos && <div className="grid" data-cols={cols}>
              {calcs.filter((c) => (c.rubrique || "") === r).map((ex) => {
                const l = essaisDe(ex.id), last = l[l.length - 1];
                return (
                  <Link key={ex.id} to={ex.kind === "rel" ? `/relation/${ex.id}` : `/calculs/${ex.id}`} className="card scn" style={{ position: "relative" }}>
                    {etoile("e:" + ex.id)}
                                        {ex.kind === "rel" && ex.vignette ? <img src={ex.vignette} alt="" loading="lazy" /> : calcImg(ex) ? <img src={calcImg(ex)} alt="" loading="lazy" /> : <div className="ph" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>{ex.kind === "rel" ? "🗣️" : "🧮"}</div>}
                    <CadresBadges v={ex.cadres} />
                    <div className="scn-body">
                      <div className="stl"><span className={`stc ${last ? "termine" : ""}`}>{last ? "Terminé" : "Nouveau"}</span></div>
                      <h3>{ex.titre}</h3>
                      <p className="muted">{ex.kind === "rel" ? ex.description : ex.contexte}</p>
                      <div><span className="tag">{ex.kind === "rel" ? "Relationnel" : "Calcul LIF"}</span> <span className="tag">{ex.niveau}</span></div>
                      <div className="ft"><span className="muted">{last ? `${l.length} essai(s) · dernier ${last.ok}/${last.tot}` : "Non commencé"}</span><span className="btn pri">{last ? "Refaire" : "Démarrer"}</span></div>
                    </div>
                  </Link>
                );
              })}
              {g.map((s) => (
                <Link key={s.id} to={`/scenario/${s.id}`} className="card scn" style={{ position: "relative" }}>
                  {etoile("s:" + s.id)}
                                    {s.vignette ? <img src={s.vignette} alt="" /> : <div className="ph">Pas de photo</div>}
                  <CadresBadges v={s.cadres} />
                  <div className="scn-body">
                    <div className="stl"><span className={`stc ${etatExercice(profil, s.id)}`}>{{ nouveau: "Nouveau", encours: "En cours", termine: "Terminé" }[etatExercice(profil, s.id)]}</span></div>
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
            </div>}
          </section>
        );
      })}
    </Layout>
  );
}
