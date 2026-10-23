import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

// Bandeau commun : Espace stagiaire / Espace admin (si admin) / nom / déconnexion.
export default function Layout({ children, extra }) {
  const { user, profil, isAdmin, logout } = useAuth() || {};
  const { pathname } = useLocation();
  const adm = pathname.startsWith("/admin");
  return (
    <>
      <header className="top">
        <Link to="/" className="brand">Simulateur SOIEC</Link>
        <nav>
          {extra}
          {user && (
            <>
              <Link to="/" className={adm ? "navbtn" : "navbtn on"}>Espace stagiaire</Link>
              {isAdmin && <Link to="/admin" className={adm ? "navbtn on" : "navbtn"}>Espace admin</Link>}
              {profil?.nom && <span className="who">{profil.nom}</span>}
              <button className="navbtn" onClick={logout}>Déconnexion</button>
            </>
          )}
        </nav>
      </header>
      <main className="wrap">{children}</main>
    </>
  );
}
