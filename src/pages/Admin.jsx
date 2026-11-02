import { useEffect, useState } from "react";
import { listDemandesGest } from "../lib/gestionnaires";
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
  const [nbDem, setNbDem] = useState(0);
  useEffect(() => { if (isAdmin) listDemandesGest().then((l) => setNbDem(l.filter((d) => d.statut === "attente").length)).catch(() => {}); }, [isAdmin, pathname]);

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

  const groupes = [
    { k: "sc", t: "Scénarios", subs: [["/admin", "Scénarios"]], tst: (p) => p === "/admin" || /^\/admin\/(scenario|calcul|relation)/.test(p) },
    { k: "in", t: `Inscrits${nbDem > 0 ? ` (${nbDem})` : ""}`, subs: [["/admin/utilisateurs", "Utilisateurs"], ["/admin/gestionnaires", `Gestionnaires${nbDem > 0 ? ` (${nbDem})` : ""}`], ["/admin/droits", "Droits"]] },
    { k: "ge", t: "Gestion", subs: [["/admin/stats", "Statistiques"], ["/admin/attribution", "Attribution"], ["/admin/journal", "Journal"]] },
    { k: "ap", t: "Application", subs: [["/admin/annonces", "Annonces"], ["/admin/parametres", "Paramètres"], ["/admin/legal", "Pages légales"], ["/admin/tickets", "Tickets"], ["/admin/banque", "Commentaires types"]] },
    { k: "si", t: "Site", subs: [["/admin/site", "Site"]] },
  ];
  const gActif = groupes.find((g) => (g.tst ? g.tst(pathname) : g.subs.some(([to]) => pathname.startsWith(to)))) || groupes[0];
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
      <div className="tabs navmenu">
        {groupes.map((g) => <Link key={g.k} to={g.subs[0][0]} className="tablink"><button className={gActif.k === g.k ? "on" : ""}>{g.t}</button></Link>)}
      </div>
      {gActif.subs.length > 1 && (
        <div className="tabs sub navmenu">
          {gActif.subs.map(([to, l]) => <Link key={to} to={to} className="tablink"><button className={pathname.startsWith(to) ? "on" : ""}>{l}</button></Link>)}
        </div>
      )}
      <Outlet />
    </Layout>
  );
}
