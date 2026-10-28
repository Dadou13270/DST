import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc, deleteField } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, verifyBeforeUpdateEmail, deleteUser } from "firebase/auth";
import { db, auth } from "../firebase";
import Layout from "../components/Layout";
import { StagiaireNav } from "./Home";
import { useAuth } from "../lib/auth";
import { logAudit } from "../lib/audit";
import { monGestionnaire } from "../lib/messages";
import { GRADES, DEPARTEMENTS, CIS_PAR_DEPT } from "../lib/referentiels";

const ERR = {
  "auth/wrong-password": "Mot de passe actuel incorrect.",
  "auth/invalid-credential": "Mot de passe actuel incorrect.",
  "auth/weak-password": "Nouveau mot de passe trop court (6 caractères minimum).",
  "auth/invalid-email": "Adresse e-mail invalide.",
  "auth/email-already-in-use": "Cette adresse est déjà utilisée.",
  "auth/too-many-requests": "Trop de tentatives, réessaie plus tard.",
  "auth/requires-recent-login": "Reconnecte-toi puis réessaie.",
};
const d = (t) => (t?.toDate ? t.toDate().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");

export default function Profil() {
  const [bienvenue] = useState(() => { try { const v = sessionStorage.getItem("op-bienvenue") === "1"; sessionStorage.removeItem("op-bienvenue"); return v; } catch { return false; } });
  const { user, profil, isAdmin, refreshProfil } = useAuth();
  const [f, setF] = useState({
    nom: profil?.nom || "", grade: profil?.grade || "", departement: profil?.departement || "", cis: profil?.cis || "",
  });
  const [autre, setAutre] = useState(() => Boolean(profil?.cis && !(CIS_PAR_DEPT[profil?.departement] || []).includes(profil.cis)));
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [cx, setCx] = useState({ actuel: "", email: "", nouveau: "", confirm: "" });
  const [cmsg, setCmsg] = useState("");
  const [cerr, setCerr] = useState("");
  const setC = (k) => (e) => setCx({ ...cx, [k]: e.target.value });
  const reauth = () => reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(auth.currentUser.email, cx.actuel));
  const changeEmail = async (e) => {
    e.preventDefault(); setCerr(""); setCmsg("");
    try {
      await reauth();
      await verifyBeforeUpdateEmail(auth.currentUser, cx.email.trim());
      setCmsg("Un lien de confirmation a été envoyé à la nouvelle adresse. L'e-mail changera après avoir cliqué dessus (reconnecte-toi ensuite).");
      setCx({ ...cx, actuel: "", email: "" });
    } catch (x) { setCerr(ERR[x.code] || x.message); }
  };
  const changePwd = async (e) => {
    e.preventDefault(); setCerr(""); setCmsg("");
    if (cx.nouveau !== cx.confirm) return setCerr("Les mots de passe ne correspondent pas.");
    try {
      await reauth();
      await updatePassword(auth.currentUser, cx.nouveau);
      if (profil?.mdpProvisoire) { await updateDoc(doc(db, "users", user.uid), { mdpProvisoire: deleteField() }).catch(() => {}); await refreshProfil(); }
      setCmsg("Mot de passe modifié.");
      setCx({ actuel: "", email: "", nouveau: "", confirm: "" });
    } catch (x) { setCerr(ERR[x.code] || x.message); }
  };
  const liste = CIS_PAR_DEPT[f.departement] || [];
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    if (f.nom.trim().length < 2) return setErr("Indique ton nom.");
    try {
      await updateDoc(doc(db, "users", user.uid), { nom: f.nom.trim(), grade: f.grade, departement: f.departement, cis: f.cis.trim() });
      await refreshProfil();
      setMsg("Profil enregistré.");
    } catch (x) { setErr(x.message); }
  };

  const [gestId, setGestId] = useState("");
  useEffect(() => { monGestionnaire(profil).then((g) => setGestId(g?.id || "")).catch(() => {}); }, [profil?.equipeId]); // eslint-disable-line
  const [sup, setSup] = useState({ ouvert: false, mdp: "", err: "", busy: false });
  const exporter = async () => {
    const s = await getDoc(doc(db, "users", user.uid));
    const data = { exporteLe: new Date().toISOString(), email: user.email, ...s.data() };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = "mes-donnees-ops-training.json";
    a.click();
    logAudit({ uid: user.uid, nom: profil?.nom }, "export_donnees", { id: user.uid, nom: profil?.nom });
  };
  const supprimer = async (e) => {
    e.preventDefault();
    setSup((x) => ({ ...x, err: "", busy: true }));
    try {
      if (isAdmin || profil?.gestionnaire) throw new Error("Un administrateur ou gestionnaire doit d'abord perdre son rôle (demande à un administrateur).");
      await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(user.email, sup.mdp));
      await logAudit({ uid: user.uid, nom: profil?.nom }, "suppression_compte", { id: user.uid, nom: profil?.nom }, user.email);
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(auth.currentUser);
    } catch (x) {
      setSup((v) => ({ ...v, busy: false, err: ERR[x.code] || x.message }));
    }
  };

  return (
    <Layout>
      <StagiaireNav />
      <div className="pgrid etroit">
      <h1>Mon profil</h1>
      {bienvenue && <div className="card alerte span"><strong>Bienvenue !</strong> Dernière étape : renseigne ton grade, ton département et ton CIS, puis enregistre. Ton gestionnaire pourra ainsi t'affecter à son équipe.</div>}
      {profil?.mdpProvisoire && <div className="card alerte span"><strong>Mot de passe provisoire.</strong> Il t'a été fourni par ton gestionnaire : change-le dans la section « Connexion » ci-dessous.</div>}
      <form className="dc" onSubmit={save}>
      <div className="card form">
        <h3 style={{ marginTop: 0 }}>Inscription</h3>
        <label>Nom / prénom</label>
        <input value={f.nom} onChange={set("nom")} required />
        <label>E-mail</label>
        <input value={user?.email || profil?.email || ""} disabled />
        <p className="muted">Inscrit : {d(profil?.creeLe)} · Dernière connexion : {d(profil?.derniereConnexion)}</p>
        <p>
          <strong>Rôle :</strong>{" "}
          {isAdmin && <span className="tag ok">Administrateur</span>}{" "}
          {profil?.gestionnaire && <span className="tag ok">Gestionnaire</span>}{" "}
          <span className="tag">Stagiaire</span>
          {profil?.equipeNom && <span className="muted"> · équipe {profil.equipeNom}</span>}
        </p>
      </div>
      <div className="card form">
        <h3 style={{ marginTop: 0 }}>Informations complémentaires</h3>
        <label>Grade</label>
        <select value={f.grade} onChange={set("grade")}><option value="">— Choisir —</option>{GRADES.map((g) => <option key={g}>{g}</option>)}</select>
        <label>Département</label>
        <select value={f.departement} onChange={(e) => { setF({ ...f, departement: e.target.value, cis: "" }); setAutre(false); }}>
          <option value="">— Choisir —</option>{DEPARTEMENTS.map((x) => <option key={x}>{x}</option>)}
        </select>
        <label>CIS (centre d'incendie et de secours)</label>
        {liste.length > 0 && !autre ? (
          <select value={f.cis} onChange={(e) => (e.target.value === "__autre" ? (setAutre(true), setF({ ...f, cis: "" })) : set("cis")(e))}>
            <option value="">— Choisir —</option>{liste.map((x) => <option key={x}>{x}</option>)}<option value="__autre">Autre (saisir)…</option>
          </select>
        ) : (
          <input value={f.cis} onChange={set("cis")} placeholder="Nom du CIS" />
        )}
        {err && <p className="err">{err}</p>}
        {msg && <p className="ok-txt">{msg}</p>}
        <button className="btn primary big">Enregistrer</button>
      </div>
      </form>
      <div className="card form">
        <h3>Connexion</h3>
        <p className="muted">E-mail actuel : <strong>{user?.email}</strong>. Le mot de passe actuel est demandé pour toute modification.</p>
        <label>Mot de passe actuel</label>
        <input type="password" autoComplete="current-password" value={cx.actuel} onChange={setC("actuel")} />
        <form onSubmit={changeEmail}>
          <label>Nouvel e-mail</label>
          <input type="email" value={cx.email} onChange={setC("email")} required />
          <button className="btn" style={{ marginTop: 8 }} disabled={!cx.actuel}>Changer l'e-mail</button>
        </form>
        <form onSubmit={changePwd}>
          <label>Nouveau mot de passe</label>
          <input type="password" autoComplete="new-password" value={cx.nouveau} onChange={setC("nouveau")} required minLength={6} />
          <label>Confirmer le nouveau mot de passe</label>
          <input type="password" autoComplete="new-password" value={cx.confirm} onChange={setC("confirm")} required minLength={6} />
          <button className="btn" style={{ marginTop: 8 }} disabled={!cx.actuel}>Changer le mot de passe</button>
        </form>
        {cerr && <p className="err">{cerr}</p>}
        {cmsg && <p className="ok-txt">{cmsg}</p>}
      </div>
      <div className="card form">
        <h3 style={{ marginTop: 0 }}>Mes données personnelles</h3>
        <p className="muted">Tu peux récupérer toutes les données de ton compte (profil, résultats, essais) ou supprimer définitivement ton compte et tes résultats.</p>
        <div className="row">
          <button className="btn" onClick={exporter}>Exporter mes données (JSON)</button>
          {!sup.ouvert && <button className="btn danger" onClick={() => setSup({ ...sup, ouvert: true })}>Supprimer mon compte</button>}
        </div>
        {sup.ouvert && (
          <form onSubmit={supprimer} style={{ marginTop: 10 }}>
            <p className="err">Suppression définitive : ton profil et tous tes résultats seront effacés, sans retour possible.</p>
            <label>Mot de passe actuel</label>
            <input type="password" autoComplete="current-password" value={sup.mdp} onChange={(e) => setSup({ ...sup, mdp: e.target.value })} required />
            {sup.err && <p className="err">{sup.err}</p>}
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn danger" disabled={sup.busy}>{sup.busy ? "Suppression…" : "Confirmer la suppression"}</button>
              <button type="button" className="btn" onClick={() => setSup({ ouvert: false, mdp: "", err: "", busy: false })}>Annuler</button>
            </div>
          </form>
        )}
      </div>
      <div className="card row between item">
        <div>
          <h3 style={{ margin: 0 }}>Affectation</h3>
          {profil?.equipeId ? (
            <>
              <p style={{ margin: "6px 0 0" }}>Équipe : <strong>{profil.equipeNom}</strong><br />Gestionnaire : <strong>{profil.equipeGest || "—"}</strong></p>
              <p style={{ margin: "8px 0 0" }}>
                {gestId ? <Link className="btn" to={`/messages?avec=${gestId}`}>✉ Envoyer un message au gestionnaire</Link> : <span className="muted">Messagerie indisponible.</span>}
              </p>
            </>
          ) : (
            <p className="muted" style={{ margin: "6px 0 0" }}>Aucune équipe.</p>
          )}
        </div>
        <Link className="btn" to="/equipe">{profil?.equipeId ? "Gérer" : "Rejoindre une équipe"}</Link>
      </div>
      </div>
    </Layout>
  );
}
