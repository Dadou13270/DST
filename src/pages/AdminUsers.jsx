import { useEffect, useState } from "react";
import { DEPARTEMENTS } from "../lib/referentiels";
import { listUsers, setStatut, setAdmin, setAdminDept, deleteUserProfile, fmtDate, fmtDuree } from "../lib/users";
import { setGestionnaire } from "../lib/equipes";
import { useAuth } from "../lib/auth";
import { creerUtilisateur, parseLignes } from "../lib/inscription";
import { logAudit } from "../lib/audit";
import { listExercices, typeExercice } from "../lib/relation";

const d = (t) => (t?.toDate ? t.toDate().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");

function AjoutUsers({ adminUid, adminNom, onDone }) {
  const [txt, setTxt] = useState("");
  const [role, setRole] = useState("stagiaire");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const go = async (e) => {
    e.preventDefault();
    setBusy(true);
    const out = [];
    for (const l of parseLignes(txt)) {
      try {
        const id = await creerUtilisateur(l, adminUid);
        if (role === "admin") await setAdmin(id, true);
        if (role === "gestionnaire") await setGestionnaire(id, true);
        logAudit({ uid: adminUid, nom: adminNom }, "creation_compte", { id, nom: l.nom }, `${l.email} · rôle ${role}`);
        out.push({ ...l, ok: true });
      } catch (x) { out.push({ ...l, ok: false, err: x.message }); }
    }
    setRes(out); setBusy(false); setTxt(""); onDone();
  };
  const recap = (res || []).filter((r) => r.ok).map((r) => `${r.nom} — ${r.email} — mot de passe : ${r.mdp}`).join("\n");
  return (
    <form className="card form" onSubmit={go}>
      <h2>Ajouter des utilisateurs</h2>
      <p className="muted">Une personne par ligne : <code>Nom ; e-mail ; mot de passe</code> (mot de passe facultatif : généré sinon). Elle se connecte avec cet e-mail et ce mot de passe provisoire, à changer dans son profil.</p>
      <label>Rôle</label>
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="stagiaire">Stagiaire</option><option value="gestionnaire">Gestionnaire</option><option value="admin">Administrateur</option>
      </select>
      <label>Utilisateurs</label>
      <textarea rows={4} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={"Zoé Léger ; zoe@exemple.fr\nPaul Martin ; paul@exemple.fr ; Motdepasse1"} required />
      <button className="btn primary" disabled={busy}>{busy ? "Création…" : "Créer les comptes"}</button>
      {res && (
        <div style={{ marginTop: 12 }}>
          {res.map((r, i) => (
            <div key={i} className={r.ok ? "ok-txt" : "err"}>{r.ok ? "✓" : "✗"} {r.nom || "(sans nom)"} — {r.email || "?"} {r.ok ? "" : `: ${r.err}`}</div>
          ))}
          {recap && (
            <>
              <p className="muted">À transmettre aux intéressés (les mots de passe ne seront plus affichés) :</p>
              <textarea readOnly rows={Math.min(8, recap.split("\n").length + 1)} value={recap} onFocus={(e) => e.target.select()} />
              <button type="button" className="btn" onClick={() => navigator.clipboard?.writeText(recap)}>Copier</button>
            </>
          )}
        </div>
      )}
    </form>
  );
}

export default function AdminUsers() {
  const { user, profil, resetPassword } = useAuth();
  const L = (action, u, details = "") => logAudit({ uid: user.uid, nom: profil?.nom }, action, { id: u.id, nom: u.nom }, details);
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");
  const [filtre, setFiltre] = useState("tous");
  const [confirm, setConfirm] = useState(null); // "action:uid"
  const [open, setOpen] = useState(null);
  const [exs, setExs] = useState([]);
  useEffect(() => { listExercices(true).then(setExs); }, []);
  const nbEx = (u) => Object.keys(u.bilans || {}).length + Object.keys(u.calculs || {}).length;

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
      <AjoutUsers adminUid={user.uid} adminNom={profil?.nom} onDone={refresh} />
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
              {u.gestionnaire && <span className="tag ok">Gestionnaire</span>}{" "}
              {u.equipeNom && <span className="tag">Équipe : {u.equipeNom}</span>}{" "}
              {susp && <span className="tag">Suspendu</span>} {moi && <span className="tag">Moi</span>}
              <div className="muted">{u.email}</div>
              <small className="muted" style={{ marginLeft: 0 }}>
                Inscrit : {d(u.creeLe)} · Dernière connexion : {d(u.derniereConnexion)} · {nbEx(u)} exercice(s) terminé(s)
              </small>
              {open === u.id && Object.keys(u.calculs || {}).length > 0 && (
                <table className="cmp" style={{ marginTop: 8 }}>
                  <thead><tr><th>Exercice</th><th>Type</th><th>Essais</th><th>Dernier</th><th>Meilleur</th><th>Date</th></tr></thead>
                  <tbody>{Object.entries(u.calculs).map(([id, l]) => { const e = exs.find((x) => x.id === id); const dd = l[l.length - 1]; return <tr key={id}><td>{e ? e.titre : id}</td><td>{typeExercice(e)}</td><td>{l.length}</td><td>{dd.ok}/{dd.tot}</td><td>{Math.max(...l.map((x) => x.ok))}/{dd.tot}</td><td>{fmtDate(dd.le)}</td></tr>; })}</tbody>
                </table>
              )}
              {open === u.id &&
                (Object.keys(u.bilans || {}).length === 0 ? (
                  (Object.keys(u.calculs || {}).length === 0 ? <p className="muted">Aucun exercice terminé.</p> : null)
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
                {two(`st:${u.id}`, susp ? "Réactiver" : "Suspendre", async () => { await setStatut(u.id, susp ? "actif" : "suspendu"); L(susp ? "reactivation" : "suspension", u); },
                  susp ? "Compte réactivé." : "Compte suspendu.")}
                {two(`ad:${u.id}`, u.admin ? "Retirer admin" : "Passer admin", async () => { await setAdmin(u.id, !u.admin); L(u.admin ? "admin_retrait" : "admin_ajout", u); },
                  u.admin ? "Droits admin retirés." : "Compte promu administrateur.")}
                {two(`ge:${u.id}`, u.gestionnaire ? "Retirer gestionnaire" : "Passer gestionnaire", async () => { await setGestionnaire(u.id, !u.gestionnaire); L(u.gestionnaire ? "gestionnaire_retrait" : "gestionnaire_ajout", u); },
                  u.gestionnaire ? "Rôle gestionnaire retiré." : "Compte promu gestionnaire.")}
                <select value={u.adminDept || ""} title="Admin de département : gère les gestionnaires et voit les statistiques de ce seul département"
                  onChange={(e) => run(async () => { await setAdminDept(u.id, e.target.value); L(e.target.value ? "admin_dept_ajout" : "admin_dept_retrait", u, e.target.value); }, e.target.value ? "Admin de département défini." : "Rôle admin de département retiré.")}>
                  <option value="">Admin de département : non</option>
                  {DEPARTEMENTS.map((x) => <option key={x} value={x}>Admin de dép. : {x}</option>)}
                </select>
                {two(`pw:${u.id}`, "Réinit. mot de passe", async () => { await resetPassword(u.email); L("reinit_mdp", u); }, "E-mail de réinitialisation envoyé.")}
                {two(`del:${u.id}`, "Supprimer", async () => { await deleteUserProfile(u.id); L("suppression_profil", u, u.email || ""); }, "Profil supprimé.", "danger")}
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
