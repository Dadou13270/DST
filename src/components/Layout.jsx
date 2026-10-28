import { Link, useLocation } from "react-router-dom";
import { basculerTheme, changerTaille } from "../lib/prefs";
import Visite, { rouvrirVisite } from "./Visite";
import Logo from "./Logo";
import AvisModal from "./AvisModal";
import HorsLigne from "./HorsLigne";
import { useAuth } from "../lib/auth";
import { profilComplet } from "../lib/model";
import { useEffect, useState } from "react";
import { pingStats, compteurs } from "../lib/inscrits";

// Bandeau commun : Espace stagiaire / Espace admin (si admin) / nom / déconnexion.
export default function Layout({ children, extra }) {
  const { user, profil, isAdmin, logout } = useAuth() || {};
  const { pathname } = useLocation();
  const adm = pathname.startsWith("/admin");
  const [cnt, setCnt] = useState(null);
  const [avisOpen, setAvisOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [pathname]);
  const uid = user?.uid;
  const dept = profil?.departement;
  // Présence : on signale le passage toutes les 2 min, et on relit les compteurs chaque minute.
  useEffect(() => {
    if (!uid || !profil) return;
    const ping = () => { if (!document.hidden) pingStats(uid, dept); };
    ping();
    const t = setInterval(ping, 120000);
    return () => clearInterval(t);
  }, [uid, dept, !!profil]); // eslint-disable-line
  useEffect(() => {
    if (!uid) return;
    const lire = () => compteurs().then(setCnt).catch(() => {});
    const t0 = setTimeout(lire, 1500);
    const t = setInterval(lire, 60000);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, [uid]);
  return (
    <>
      <header className={"top" + (menu ? " open" : "") + (extra ? " nc" : "")}>
        <Link to="/" className="brand"><Logo size={36} />OPS Training</Link>
        <button className="burger" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>☰</button>
        <nav>
          {extra}
          {user && cnt && (
            <span className="cnt" title="Inscrits et connectés (dernières minutes)">
              <span>{cnt.inscrits} inscrit{cnt.inscrits > 1 ? "s" : ""}</span>
              <span><span className="dot" />{cnt.connectes} connecté{cnt.connectes > 1 ? "s" : ""}</span>
            </span>
          )}
          <span className="prefs" role="group" aria-label="Affichage">
            <button onClick={() => changerTaille(-1)} aria-label="Réduire le texte" title="Réduire le texte">A−</button>
            <button onClick={() => changerTaille(1)} aria-label="Agrandir le texte" title="Agrandir le texte">A+</button>
            <button onClick={rouvrirVisite} aria-label="Visite guidée" title="Revoir la visite guidée">?</button>
            <button onClick={basculerTheme} aria-label="Mode clair / sombre" title="Mode clair / sombre">◐</button>
          </span>
          {user && (
            <>
              <Link to="/" title="Exercices, suivi, équipe et profil" className={adm || pathname.startsWith("/gestion") ? "navbtn" : "navbtn on"}>Espace stagiaire</Link>
              {(profil?.gestionnaire || isAdmin) && <Link to="/gestion" className={pathname.startsWith("/gestion") ? "navbtn on" : "navbtn"}>Espace gestionnaire</Link>}
              {isAdmin && <Link to="/admin" className={adm ? "navbtn on" : "navbtn"}>Espace admin</Link>}
              {profil?.nom && <span className="who">{profil.nom}</span>}
              <button className="navbtn" onClick={logout}>Déconnexion</button>
            </>
          )}
        </nav>
      </header>
      {user && profil && !profilComplet(profil) && pathname !== "/profil" && !pathname.startsWith("/gestion/salle") && (
        <div className="card alerte" role="status" style={{ margin: "10px auto", maxWidth: 1100 }}>
          <strong>Complète ton profil</strong> (grade, département, CIS) pour que ton gestionnaire te retrouve facilement. <Link to="/profil" className="btn primary">Compléter mon profil</Link>
        </div>
      )}
      <main className="wrap">{children}</main>
      <Visite />
      {user && <HorsLigne />}
      <footer className="foot">
        <div className="fin">
          <div className="fbrand">
            <Logo size={52} />
            <b>OPS Training</b>
            <span>Simulateur opérationnel collaboratif</span>
          </div>
          <div>
            <h4>Application</h4>
            <ul>
              <li><Link to="/">Exercices</Link></li>
              <li><Link to="/suivi">Mon suivi</Link></li>
              <li><Link to="/equipe">Mon équipe</Link></li>
              <li><Link to="/profil">Mon profil</Link></li>
              <li><Link to="/carte">Carte des inscrits</Link></li>
            </ul>
          </div>
          <div>
            <h4>Gestionnaires</h4>
            <ul>
              <li><Link to="/aide-equipes">Fonctionnement des équipes</Link></li>
              <li><Link to="/aide-salle">Séance en salle</Link></li>
              <li><Link to="/contact?objet=gestionnaire">Demander l'accès gestionnaire</Link></li>
            </ul>
          </div>
          <div>
            <h4>Informations</h4>
            <ul>
              <li><Link to="/site">Site de présentation</Link></li>
              <li><Link to="/a-propos">À propos</Link></li>
              <li><Link to="/nouveautes">Nouveautés</Link></li>
              <li><Link to="/tickets">Support</Link></li>
              <li><Link to="/cgu">Conditions d'utilisation (CGU)</Link></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); rouvrirVisite(); }}>Visite guidée</a></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setAvisOpen(true); }}>Avis et suggestions</a></li>
            </ul>
          </div>
        </div>
        <div className="fcopy">© {new Date().getFullYear()} OPS Training — Tous droits réservés · <Link to="/cgu">CGU</Link></div>
      </footer>
      {avisOpen && <AvisModal onClose={() => setAvisOpen(false)} />}
    </>
  );
}
