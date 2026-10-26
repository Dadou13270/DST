import { useState } from "react";
import { useAntiRobot } from "../components/AntiRobot";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
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
  const [okCgu, setOkCgu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [echecs, setEchecs] = useState(0);
  const ar = useAntiRobot();
  const arActif = mode === "register" || echecs >= 3; // à la connexion, seulement après 3 échecs

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
      if (!okCgu) return setErr("Accepte les conditions d'utilisation pour créer ton compte.");
    }
    if (arActif) {
      const m = ar.verifier();
      if (m) return setErr(m);
    }
    setBusy(true);
    try {
      if (mode === "login") await login(email, pwd);
      else await register(nom.trim(), email, pwd);
      nav(loc.state?.from || "/", { replace: true });
    } catch (e2) {
      setErr(MSG[e2.code] || "Erreur : " + e2.message);
      if (mode === "login") setEchecs((n) => n + 1);
      ar.renouveler();
    }
    setBusy(false);
  };

  const oubli = async () => {
    setErr("");
    setInfo("");
    if (!email) return setErr("Saisis d'abord ton e-mail.");
    if (echecs >= 3) {
      const m = ar.verifier();
      if (m) return setErr(m);
    }
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
            <label className="check" style={{ marginTop: 12 }}>
              <input type="checkbox" checked={okCgu} onChange={(e) => setOkCgu(e.target.checked)} />
              <span>J'accepte les <Link to="/cgu" target="_blank">conditions d'utilisation</Link></span>
            </label>
          </>
        )}
        {arActif && ar.widget}
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
