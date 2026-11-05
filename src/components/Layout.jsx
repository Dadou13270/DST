import { Link, useLocation } from "react-router-dom";
import { basculerTheme, changerTaille, definirTheme } from "../lib/prefs";
import { useMessages, nbNonLus } from "../lib/messages";
import Visite, { rouvrirVisite } from "./Visite";
import Logo from "./Logo";
import { useCharte } from "../lib/charte";
import AvisModal from "./AvisModal";
import HorsLigne from "./HorsLigne";
import Annonces from "./Annonces";
import SideMenu from "./SideMenu";
import XpBarre, { XpToast } from "./XpBarre";
import { useAuth } from "../lib/auth";
import { espaceDecision } from "../lib/decision";
import { espaceReco } from "../lib/reco";
import { useAccesJeu } from "../lib/jeuAcces";
import { profilComplet } from "../lib/model";
import { useEffect, useState } from "react";
import { pingStats, compteurs } from "../lib/inscrits";
import { estMasque, useMenusMasques } from "../lib/menusRoles";

// Bandeau commun : Espace stagiaire / Espace admin (si admin) / nom / déconnexion.
export default function Layout({ children, extra }) {
  const { user, profil, isAdmin, logout } = useAuth() || {};
  const menusM = useMenusMasques();
  const accesJeu = useAccesJeu();
  const charte = useCharte();
  const { pathname, search } = useLocation();
  const adm = pathname.startsWith("/admin");
  const espDec = pathname.startsWith("/decision") ? espaceDecision(pathname, search, !!isAdmin, !!profil?.gestionnaire) : pathname.startsWith("/reco") ? espaceReco(pathname, search, !!isAdmin, !!profil?.gestionnaire) : "";
  const webG = pathname === "/webinaires" && new URLSearchParams(search).get("esp") === "gestion";
  const pesp = pathname === "/profils" ? new URLSearchParams(search).get("esp") : "";
  const decAdm = espDec === "admin", decGest = espDec === "gestion" || pathname === "/roles" || webG || pesp === "gestion";
  const [cnt, setCnt] = useState(null);
  const [avisOpen, setAvisOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => setMenu(false), [pathname]);
  const uid = user?.uid;
  const nonLus = nbNonLus(useMessages(uid), uid);
  const [crumb, setCrumb] = useState({ esp: "", titre: "" });
  useEffect(() => {
    let tm;
    const f = () => {
      const t0 = document.querySelector("main h1")?.textContent?.trim() || "", e = document.querySelector(".top .navbtn.on")?.textContent?.trim() || "";
      const t = pathname === "/" && /^Bonjour/.test(t0) ? "Tableau de bord" : t0;
      setCrumb((c) => (c.titre === t && c.esp === e ? c : { esp: e, titre: t }));
    };
    f();
    const mo = new MutationObserver(() => { clearTimeout(tm); tm = setTimeout(f, 80); });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { mo.disconnect(); clearTimeout(tm); };
  }, [pathname, search]);
  const [acc, setAcc] = useState(false);
  useEffect(() => setAcc(false), [pathname]);
  useEffect(() => {
    if (!acc) return;
    const f = (e) => { if (!e.target.closest?.(".nb-acc")) setAcc(false); };
    const k = (e) => { if (e.key === "Escape") setAcc(false); };
    document.addEventListener("click", f); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("click", f); document.removeEventListener("keydown", k); };
  }, [acc]);
  const nomAff = profil?.nom || user?.email || "Mon compte";
  const initiales = nomAff.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join("");
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
      <XpToast />
      <header className={"top" + (menu ? " open" : "") + (extra ? " nc" : "")}>
        <Link to="/" className="brand"><Logo size={36} /><span className="bn">{charte.nom}<small className="bt">{charte.slogan}</small></span></Link>
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
              <Link to="/" title="Exercices, suivi, équipe et profil" className={adm || pathname.startsWith("/gestion") || pathname.startsWith("/departement") || pesp === "dept" || pathname === "/jeu" || pathname === "/forum" || pathname === "/presentation" || pathname === "/collaboratif" || decAdm || decGest ? "navbtn" : "navbtn on"}>Espace stagiaire</Link>
              {(profil?.gestionnaire || isAdmin) && <Link to="/gestion" className={pathname.startsWith("/gestion") || decGest ? "navbtn on" : "navbtn"}>Espace gestionnaire</Link>}
              {(profil?.adminDept || isAdmin) && <Link to="/departement" className={pathname.startsWith("/departement") || pesp === "dept" ? "navbtn on" : "navbtn"}>Espace département</Link>}
              {isAdmin && <Link to="/admin" className={adm || decAdm ? "navbtn on" : "navbtn"}>Espace admin</Link>}
              {(isAdmin || !estMasque(menusM, "stagiaire", "Forum d'entraide")) && <Link to="/forum" className={pathname === "/forum" ? "navbtn on" : "navbtn"} title="Forum d'entraide">💬 Forum</Link>}
              {accesJeu && (isAdmin || !estMasque(menusM, "stagiaire", "Jeu")) && <Link to="/jeu" className={pathname === "/jeu" ? "navbtn on" : "navbtn"} title="Jeu Trivial pompiers">🎲 Jeu</Link>}
              {(isAdmin || !estMasque(menusM, "stagiaire", "Présentation de l'application")) && <Link to="/presentation" className={pathname === "/presentation" ? "navbtn on" : "navbtn"} title="Fonctions de chaque profil">📋 Présentation</Link>}
              {(isAdmin || !estMasque(menusM, "stagiaire", "Collaboratif")) && <Link to="/collaboratif" className={pathname === "/collaboratif" ? "navbtn on" : "navbtn"} title="Esprit collaboratif et soutien">🤝 Collaboratif</Link>}
              {profil?.nom && <span className="who">{profil.nom}</span>}
              <button className="navbtn nb-old" onClick={logout}>Déconnexion</button>
              <Link to="/messages" className="nb-msg" title="Messages" aria-label={"Messages" + (nonLus ? " (" + nonLus + " non lu" + (nonLus > 1 ? "s" : "") + ")" : "")}>✉{nonLus > 0 && <span className="nb-badge">{nonLus}</span>}</Link>
              <div className="nb-acc">
                <button className="nb-pill" aria-haspopup="menu" aria-expanded={acc} onClick={() => setAcc((v) => !v)}>
                  <span className="nb-av">{initiales || "?"}</span><span className="nb-nom">{nomAff}</span><span aria-hidden="true">▾</span>
                </button>
                {acc && (
                  <div className="nb-menu" role="menu">
                    {!adm && <XpBarre />}
                    <Link to="/profil" role="menuitem">Mon profil</Link>
                    <div className="nb-row"><span>Taille du texte</span><span><button onClick={() => changerTaille(-1)} aria-label="Réduire le texte">A−</button><button onClick={() => changerTaille(1)} aria-label="Agrandir le texte">A+</button></span></div>
                    <div className="nb-row"><span>Thème</span><span><button onClick={() => definirTheme("light")}>Clair</button><button onClick={() => definirTheme("dark")}>Sombre</button></span></div>
                    <button role="menuitem" onClick={() => { setAcc(false); rouvrirVisite(); }}>Visite guidée</button>
                    <button role="menuitem" className="nb-out" onClick={logout}>Déconnexion</button>
                  </div>
                )}
              </div>
            </>
          )}
        </nav>
      </header>
      {user && profil && !profilComplet(profil) && pathname !== "/profil" && !pathname.startsWith("/gestion/salle") && (
        <div className="card alerte" role="status" style={{ margin: "10px auto", maxWidth: 1100 }}>
          <strong>Complète ton profil</strong> (grade, département, CIS) pour que ton gestionnaire te retrouve facilement. <Link to="/profil" className="btn primary">Compléter mon profil</Link>
        </div>
      )}
      <Annonces />
      <nav className="crumb" aria-label="Fil d'Ariane"><Link to="/">Accueil</Link>{crumb.esp && crumb.esp !== crumb.titre && <><span>›</span><span>{crumb.esp}</span></>}{crumb.titre && <><span>›</span><b>{crumb.titre}</b></>}</nav>
      <div className="lay">
      {user && <aside className="side" aria-label="Menu"><SideMenu isAdmin={isAdmin} profil={profil} accesJeu={accesJeu} nonLus={nonLus} /></aside>}
      <div className="lay-c">
      <main className="wrap">{children}</main>
      <Visite />
      {user && <HorsLigne />}
      </div>
      </div>
      <footer className="foot">
        <div className="fin">
          <div className="fbrand">
            <Logo size={52} />
            <b>{charte.nom}</b>
            <span>{charte.slogan}</span>
          </div>
          <div>
            <h4>Application</h4>
            <ul>
              {user && <>
                <li><Link to="/">Exercices</Link></li>
                <li><Link to="/suivi">Mon suivi</Link></li>
                <li><Link to="/equipe">Mon équipe</Link></li>
                <li><Link to="/profil">Mon profil</Link></li>
                <li><Link to="/carte">Carte des inscrits</Link></li>
              </>}
              <li><Link to="/site">Site de présentation</Link></li>
              {user && <>
                <li><Link to="/nouveautes">Mises à jour</Link></li>
                <li><Link to="/demande-scenario">Demander un scénario</Link></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); rouvrirVisite(); }}>Visite guidée</a></li>
              </>}
            </ul>
          </div>
          {user && accesJeu && <div>
            <h4>Jeu</h4>
            <ul>
              <li><Link to="/jeu">🎲 Trivial pompiers</Link></li>
              <li><Link to="/jeu">Jouer à plusieurs (code de salle)</Link></li>
            </ul>
          </div>}
          {user && <div>
            <h4>Gestionnaires</h4>
            <ul>
              <li><Link to="/aide-equipes">Fonctionnement des équipes</Link></li>
              <li><Link to="/aide-salle">Séance en salle</Link></li>
              <li><Link to="/contact?objet=gestionnaire">Demander l'accès gestionnaire</Link></li>
            </ul>
          </div>}
          <div>
            <h4>Informations</h4>
            <ul>
              <li><Link to="/a-propos">À propos</Link></li>
              <li><Link to="/confidentialite">Politique de confidentialité</Link></li>
              <li><Link to="/mentions-legales">Mentions légales</Link></li>
              <li><Link to="/cgu">Conditions d'utilisation (CGU)</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              {user && <>
                <li><Link to="/tickets">Support</Link></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setAvisOpen(true); }}>Avis et suggestions</a></li>
              </>}
            </ul>
          </div>
        </div>
        <div className="fcopy"><span>© {new Date().getFullYear()} {charte.nom} — Tous droits réservés</span><nav><Link to="/cgu">CGU</Link><Link to="/confidentialite">Confidentialité</Link><Link to="/mentions-legales">Mentions légales</Link></nav></div>
      </footer>
      {avisOpen && <AvisModal onClose={() => setAvisOpen(false)} />}
    </>
  );
}
