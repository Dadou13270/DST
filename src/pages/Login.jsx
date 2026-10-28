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

const GOOGLE_SVG = (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" /></svg>
);
const MSG_G = {
  "auth/popup-closed-by-user": "",
  "auth/cancelled-popup-request": "",
  "auth/popup-blocked": "La fenêtre Google a été bloquée par le navigateur : autorise les pop-ups pour ce site.",
  "auth/account-exists-with-different-credential": "Un compte existe déjà avec cet e-mail : connecte-toi avec ton mot de passe.",
  "auth/unauthorized-domain": "Ce site n'est pas encore autorisé pour la connexion Google (domaine à ajouter dans Firebase).",
  "auth/operation-not-allowed": "La connexion Google n'est pas encore activée (à activer dans Firebase).",
};

export default function Login() {
  const { user, loading, login, loginGoogle, register, resetPassword } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [email2, setEmail2] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [pwd3, setPwd3] = useState("");
  const [errIn, setErrIn] = useState("");
  const [errUp, setErrUp] = useState("");
  const [info, setInfo] = useState("");
  const [okCgu, setOkCgu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [echecs, setEchecs] = useState(0);
  const ar = useAntiRobot(); // inscription
  const arIn = useAntiRobot(); // connexion (après 3 échecs)

  if (!configured)
    return (
      <Layout>
        <div className="card warn">Firebase n'est pas configuré. Renseigne le fichier .env (voir README).</div>
      </Layout>
    );
  const bienvenue = (() => { try { return sessionStorage.getItem("op-bienvenue") === "1"; } catch { return false; } })();
  if (!loading && user) return <Navigate to={loc.state?.from || (bienvenue ? "/profil" : "/")} replace />;

  const connexion = async (e) => {
    e.preventDefault();
    setErrIn(""); setInfo("");
    if (echecs >= 3) { const m = arIn.verifier(); if (m) return setErrIn(m); } // anti-robot seulement après 3 échecs
    setBusy(true);
    try {
      await login(email, pwd);
      nav(loc.state?.from || "/", { replace: true });
    } catch (e2) {
      setErrIn(MSG[e2.code] || "Erreur : " + e2.message);
      setEchecs((n) => n + 1);
      arIn.renouveler();
    }
    setBusy(false);
  };

  const inscription = async (e) => {
    e.preventDefault();
    setErrUp("");
    if (nom.trim().length < 2) return setErrUp("Indique ton nom.");
    if (pwd2 !== pwd3) return setErrUp("Les mots de passe ne correspondent pas.");
    if (!okCgu) return setErrUp("Accepte les conditions d'utilisation pour créer ton compte.");
    const m = ar.verifier();
    if (m) return setErrUp(m);
    setBusy(true);
    try {
      try { sessionStorage.setItem("op-bienvenue", "1"); } catch { /* */ }
      await register(nom.trim(), email2, pwd2);
      nav(loc.state?.from || "/profil", { replace: true });
    } catch (e2) {
      setErrUp(MSG[e2.code] || "Erreur : " + e2.message);
      ar.renouveler();
    }
    setBusy(false);
  };

  const google = async (inscr) => {
    const set = inscr ? setErrUp : setErrIn;
    set("");
    if (inscr && !okCgu) return set("Accepte les conditions d'utilisation pour créer ton compte.");
    setBusy(true);
    try {
      if (inscr) { try { sessionStorage.setItem("op-bienvenue", "1"); } catch { /* */ } }
      await loginGoogle();
      nav(loc.state?.from || (inscr ? "/profil" : "/"), { replace: true });
    } catch (e2) {
      set(e2.code in MSG_G ? MSG_G[e2.code] : "Erreur : " + (e2.message || e2.code));
    }
    setBusy(false);
  };

  const oubli = async () => {
    setErrIn(""); setInfo("");
    if (!email) return setErrIn("Saisis d'abord ton e-mail.");
    if (echecs >= 3) { const m = arIn.verifier(); if (m) return setErrIn(m); }
    try {
      await resetPassword(email);
      setInfo("E-mail de réinitialisation envoyé.");
    } catch (e2) {
      setErrIn(MSG[e2.code] || "Erreur : " + e2.message);
    }
  };

  return (
    <Layout>
      <div className="login-hero">
        <h1>Prépare tes devoirs sur table</h1>
        <p className="muted">Le simulateur opérationnel des sapeurs-pompiers : observe, interroge, décide.</p>
      </div>
      <div className="login-duo">
        <form className="card login-card in" onSubmit={connexion}>
          <h2>Connexion</h2>
          <p className="muted">Tu as déjà un compte.</p>
          <button type="button" className="btn gbtn" disabled={busy} onClick={() => google(false)}>{GOOGLE_SVG} Continuer avec Google</button>
          <div className="lsep">ou avec ton e-mail</div>
          <label>E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Mot de passe</label>
          <input type="password" minLength={6} value={pwd} onChange={(e) => setPwd(e.target.value)} required />
          {echecs >= 3 && arIn.widget}
          {errIn && <p className="err">{errIn}</p>}
          {info && <p className="ok-txt">{info}</p>}
          <button className="btn primary" disabled={busy}>{busy ? "…" : "Se connecter"}</button>
          <button type="button" className="link" onClick={oubli} style={{ marginTop: 10, color: "var(--mut)" }}>Mot de passe oublié ?</button>
        </form>

        <form className="card login-card up" onSubmit={inscription}>
          <h2>Inscription</h2>
          <p className="muted">Première visite ? Crée ton compte.</p>
          <button type="button" className="btn gbtn" disabled={busy} onClick={() => google(true)}>{GOOGLE_SVG} S'inscrire avec Google</button>
          <div className="lsep">ou avec ton e-mail</div>
          <label>Nom / prénom</label>
          <input value={nom} onChange={(e) => setNom(e.target.value)} required />
          <label>E-mail</label>
          <input type="email" value={email2} onChange={(e) => setEmail2(e.target.value)} required />
          <label>Mot de passe</label>
          <input type="password" minLength={6} value={pwd2} onChange={(e) => setPwd2(e.target.value)} required />
          <label>Confirmer le mot de passe</label>
          <input type="password" minLength={6} value={pwd3} onChange={(e) => setPwd3(e.target.value)} required />
          <label className="check" style={{ marginTop: 12 }}>
            <input type="checkbox" checked={okCgu} onChange={(e) => setOkCgu(e.target.checked)} />
            <span>J'accepte les <Link to="/cgu" target="_blank">conditions d'utilisation</Link></span>
          </label>
          {ar.widget}
          {errUp && <p className="err">{errUp}</p>}
          <button className="btn primary" disabled={busy}>{busy ? "…" : "Créer mon compte"}</button>
        </form>
      </div>
    </Layout>
  );
}
