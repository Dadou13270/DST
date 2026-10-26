import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import Layout from "../components/Layout";
import { auth, configured } from "../firebase";
import { useAuth } from "../lib/auth";

export default function AdminGate() {
  const { user, isAdmin, loading, logout } = useAuth();
  const { pathname } = useLocation();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");

  if (!configured)
    return (
      <Layout>
        <div className="card warn">Firebase n'est pas configuré. Renseigne le fichier .env (voir README).</div>
      </Layout>
    );
  if (loading)
    return (
      <Layout>
        <p>Chargement…</p>
      </Layout>
    );

  if (!user)
    return (
      <Layout right={<Link to="/">Retour</Link>}>
        <form
          className="card login"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr("");
            try {
              await signInWithEmailAndPassword(auth, email, pwd);
            } catch {
              setErr("Identifiants incorrects.");
            }
          }}
        >
          <h2>Espace paramètres</h2>
          <label>E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Mot de passe</label>
          <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required />
          {err && <p className="err">{err}</p>}
          <button className="btn primary">Connexion</button>
        </form>
      </Layout>
    );

  if (!isAdmin)
    return (
      <Layout right={<button className="link" onClick={logout}>Déconnexion</button>}>
        <div className="card warn">
          <p>Ce compte n'est pas administrateur.</p>
          <p className="muted">
            Crée dans Firestore un document <code>admins/{user.uid}</code> (voir README), puis recharge la page.
          </p>
        </div>
      </Layout>
    );

  return (
    <Layout
      wide
      right={
        <>
          <Link to="/admin">Scénarios</Link>
          <Link to="/admin/utilisateurs">Utilisateurs</Link>
          <Link to="/">Voir l'app</Link>
          <button className="link" onClick={logout}>Déconnexion</button>
        </>
      }
    >
      <div className="tabs">
        <Link to="/admin" className="tablink"><button className={pathname === "/admin" || pathname.startsWith("/admin/scenario") ? "on" : ""}>Scénarios</button></Link>
        <Link to="/admin/utilisateurs" className="tablink"><button className={pathname.startsWith("/admin/utilisateurs") ? "on" : ""}>Utilisateurs</button></Link>
        <Link to="/admin/stats" className="tablink"><button className={pathname.startsWith("/admin/stats") ? "on" : ""}>Statistiques</button></Link>
        <Link to="/admin/parametres" className="tablink"><button className={pathname.startsWith("/admin/parametres") ? "on" : ""}>Paramètres</button></Link>
        <Link to="/admin/tickets" className="tablink"><button className={pathname.startsWith("/admin/tickets") ? "on" : ""}>Tickets</button></Link>
      </div>
      <Outlet />
    </Layout>
  );
}
