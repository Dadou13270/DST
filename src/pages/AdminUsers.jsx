import { useEffect, useState } from "react";
import { listUsers, setStatut, setAdmin, deleteUserProfile, fmtDate, fmtDuree } from "../lib/users";
import { useAuth } from "../lib/auth";

const d = (t) => (t?.toDate ? t.toDate().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");

export default function AdminUsers() {
  const { user, resetPassword } = useAuth();
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState("tous");
  const [confirm, setConfirm] = useState(null); // "action:uid"
  const [open, setOpen] = useState(null);

  const refresh = () =>
    listUsers()
      .then(setList)
      .catch((e) => setErr(e.message));
  useEffect(() => {
    refresh();
  }, []);

  const run = async (fn, ok) => {
    setErr("");
    setMsg("");
    setConfirm(null);
    try {
      await fn();
      setMsg(ok);
      await refresh();
    } catch (e) {
      setErr(e.message);
    }
  };
  // bouton en deux temps (pas de window.confirm)
  const two = (key, label, fn, ok, cls = "") =>
    confirm === key ? (
      <button className={`btn danger`} onClick={() => run(fn, ok)}>Confirmer ?</button>
    ) : (
      <button className={`btn ${cls}`} onClick={() => setConfirm(key)}>{label}</button>
    );

  const rows = (list || []).filter((u) => {
    const t = `${u.nom} ${u.email}`.toLowerCase();
    if (q && !t.includes(q.toLowerCase())) return false;
    if (filtre === "admin") return u.admin;
    if (filtre === "suspendu") return u.statut === "suspendu";
    if (filtre === "actif") return u.statut !== "suspendu";
    return true;
  });
  const nb = (f) => (list || []).filter(f).length;

  return (
    <>
      <div className="row between">
        <h1>Utilisateurs</h1>
        <span className="muted">
          {nb(() => true)} inscrits · {nb((u) => u.statut !== "suspendu")} actifs · {nb((u) => u.admin)} admin ·{" "}
          {nb((u) => u.statut === "suspendu")} suspendus
        </span>
      </div>
      <div className="row">
        <input className="grow" placeholder="Rechercher nom ou e-mail…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
          <option value="tous">Tous</option>
          <option value="actif">Actifs</option>
          <option value="suspendu">Suspendus</option>
          <option value="admin">Administrateurs</option>
        </select>
      </div>
      {msg && <p className="ok-txt">{msg}</p>}
      {err && <div className="card warn">Erreur : {err}</div>}
      {!list && !err && <p>Chargement…</p>}
      {list && rows.length === 0 && <div className="card">Aucun utilisateur.</div>}

      {rows.map((u) => {
        const moi = u.id === user.uid;
        const susp = u.statut === "suspendu";
        return (
          <div className="card row between item" key={u.id}>
            <div>
              <strong>{u.nom || "—"}</strong>{" "}
              {u.admin && <span className="tag ok">Admin</span>}{" "}
              {susp && <span className="tag">Suspendu</span>} {moi && <span className="tag">Moi</span>}
              <div className="muted">{u.email}</div>
              <small className="muted" style={{ marginLeft: 0 }}>
                Inscrit : {d(u.creeLe)} · Dernière connexion : {d(u.derniereConnexion)} · {Object.keys(u.bilans || {}).length} exercice(s) terminé(s)
              </small>
              {open === u.id &&
                (Object.keys(u.bilans || {}).length === 0 ? (
                  <p className="muted">Aucun exercice terminé.</p>
                ) : (
                  <table className="cmp" style={{ marginTop: 8 }}>
                    <thead><tr><th>Exercice</th><th>Fin</th><th>Temps</th><th>Questions</th><th>Essentielles</th><th>Tent.</th></tr></thead>
                    <tbody>
                      {Object.values(u.bilans).map((b, i) => (
                        <tr key={i}><td>{b.titre}</td><td>{fmtDate(b.fin)}</td><td>{fmtDuree(b.duree || 0)}</td><td>{b.nbQ}</td><td>{b.essTot ? `${b.essOk}/${b.essTot}` : "—"}</td><td>{b.nb || 1}</td></tr>
                      ))}
                    </tbody>
                  </table>
                ))}
            </div>
            <div className="row">
              <button className="btn" onClick={() => setOpen(open === u.id ? null : u.id)}>{open === u.id ? "Masquer" : "Suivi"}</button>
            </div>
            {!moi && (
              <div className="row">
                {two(`st:${u.id}`, susp ? "Réactiver" : "Suspendre", () => setStatut(u.id, susp ? "actif" : "suspendu"),
                  susp ? "Compte réactivé." : "Compte suspendu.")}
                {two(`ad:${u.id}`, u.admin ? "Retirer admin" : "Passer admin", () => setAdmin(u.id, !u.admin),
                  u.admin ? "Droits admin retirés." : "Compte promu administrateur.")}
                {two(`pw:${u.id}`, "Réinit. mot de passe", () => resetPassword(u.email), "E-mail de réinitialisation envoyé.")}
                {two(`del:${u.id}`, "Supprimer", () => deleteUserProfile(u.id), "Profil supprimé.", "danger")}
              </div>
            )}
          </div>
        );
      })}
      <p className="muted">
        « Supprimer » retire le profil et les droits ; le compte de connexion Firebase (Authentication) reste à
        supprimer dans la console si besoin. Un compte suspendu ne peut plus accéder aux scénarios.
      </p>
    </>
  );
}
