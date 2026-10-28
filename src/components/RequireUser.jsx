import { Navigate, useLocation } from "react-router-dom";
import Layout from "./Layout";
import { configured } from "../firebase";
import { useAuth } from "../lib/auth";

// Accès réservé aux comptes connectés et actifs.
export default function RequireUser({ children }) {
  const { user, profil, loading, logout } = useAuth();
  const loc = useLocation();
  if (!configured) return children; // message de config géré par les pages
  if (loading)
    return (
      <Layout>
        <p>Chargement…</p>
      </Layout>
    );
  if (!user) return <Navigate to="/connexion" state={{ from: loc.pathname + loc.search }} replace />;
  if (profil?.statut === "suspendu")
    return (
      <Layout right={<button className="link" onClick={logout}>Déconnexion</button>}>
        <div className="card warn">
          <h2>Compte suspendu</h2>
          <p>Ton accès a été suspendu par un administrateur.</p>
        </div>
      </Layout>
    );
  return children;
}
