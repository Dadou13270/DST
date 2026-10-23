import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { configured } from "../firebase";
import { useAuth } from "../lib/auth";

const MSG = {
  "auth/email-already-in-use": "Un compte existe déjà avec cet e-mail.",
  "auth/weak-password": "Mot de passe trop court (6 caractères minimum).",
  "auth/invalid-email": "Adresse e-mail invalide.",
  "auth/invalid-credential": "E-mail ou mot de passe incorrect.",
  "auth/user-not-found": "E-mail ou mot de passe incorrect.",
  "auth/wrong-password": "E-mail ou mot de passe incorrect.",
  "auth/too-many-requests": "Trop de tentatives, réessaie plus tard.",
};

export default function Login() {
  const { user, loading, login, register, resetPassword } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [mode, setMode] = useState("login"); // login | register
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  if (!configured)
    return (
      <Layout>
        <div className="card warn">Firebase n'est pas configuré. Renseigne le fichier .env (voir README).</div>
      </Layout>
    );
  if (!loading && user) return <Navigate to={loc.state?.from || "/"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    if (mode === "register") {
      if (nom.trim().length < 2) return setErr("Indique ton nom.");
      if (pwd !== pwd2) return setErr("Les mots de passe ne correspondent pas.");
    }
    setBusy(true);
    try {
      if (mode === "login") await login(email, pwd);
      else await register(nom.trim(), email, pwd);
      nav(loc.state?.from || "/", { replace: true });
    } catch (e2) {
      setErr(MSG[e2.code] || "Erreur : " + e2.message);
    }
    setBusy(false);
  };

  const oubli = async () => {
    setErr("");
    setInfo("");
    if (!email) return setErr("Saisis d'abord ton e-mail.");
    try {
      await resetPassword(email);
      setInfo("E-mail de réinitialisation envoyé.");
    } catch (e2) {
      setErr(MSG[e2.code] || "Erreur : " + e2.message);
    }
  };

  return (
    <Layout>
      <form className="card login" onSubmit={submit}>
        <div className="tabs">
          <button type="button" className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>
            Connexion
          </button>
          <button type="button" className={mode === "register" ? "on" : ""} onClick={() => setMode("register")}>
            Inscription
          </button>
        </div>
        {mode === "register" && (
          <>
            <label>Nom / prénom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} required />
          </>
        )}
        <label>E-mail</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Mot de passe</label>
        <input type="password" minLength={6} value={pwd} onChange={(e) => setPwd(e.target.value)} required />
        {mode === "register" && (
          <>
            <label>Confirmer le mot de passe</label>
            <input type="password" minLength={6} value={pwd2} onChange={(e) => setPwd2(e.target.value)} required />
          </>
        )}
        {err && <p className="err">{err}</p>}
        {info && <p className="ok-txt">{info}</p>}
        <button className="btn primary" disabled={busy}>
          {busy ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </button>
        {mode === "login" && (
          <button type="button" className="link" onClick={oubli} style={{ marginTop: 10, color: "var(--mut)" }}>
            Mot de passe oublié ?
          </button>
        )}
      </form>
    </Layout>
  );
}
