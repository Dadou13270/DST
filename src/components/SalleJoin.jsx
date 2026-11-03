import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { qlExiste } from "../quizlive/quizlive";
import { adaptateursQuizLive } from "../lib/quizLiveDb";
import { rolesExiste } from "../lib/roles";
import { getSalle, normSalle, rejoindreSalle, etatSalle, fmtDebut } from "../lib/salles";

// Carte « Rejoindre une séance en salle » (page d'accueil du stagiaire)
export default function SalleJoin() {
  const { user, profil } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [code, setCode] = useState(normSalle(sp.get("code") || ""));
  const [err, setErr] = useState("");
  const go = async (e) => {
    e?.preventDefault();
    setErr("");
    const c = normSalle(code);
    if (!c) return setErr("Saisis le code de la salle.");
    try {
      const s = await getSalle(c);
      if (!s) {
        if (await rolesExiste(c)) { nav(`/roles/jouer/${c}`); return; }
        if (await qlExiste(adaptateursQuizLive({ uid: user.uid, nom: profil?.nom }), c)) { nav(`/quiz-live?code=${c}`); return; }
        return setErr("Code inconnu.");
      }
      if (s.ouverte === false) return setErr("Cette séance est clôturée.");
      if (etatSalle(s) === "plan") return setErr(`Cette séance débute le ${fmtDebut(s.debut)}. Reviens à cette heure.`);
      await rejoindreSalle(c, user.uid, profil?.nom);
      nav(`/scenario/${s.scId}?salle=${c}`);
    } catch (x) { setErr(x.message); }
  };
  const auto = useRef(false);
  useEffect(() => { if (code && sp.get("code") && user && profil && !auto.current) { auto.current = true; go(); } }, [user, profil]); // eslint-disable-line
  return (
    <form className="card row item" onSubmit={go}>
      <input className="grow" maxLength={8} placeholder="Code donné par le formateur (ex. K7M2P)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoComplete="off" />
      <button className="btn primary">Rejoindre</button>
      <Link className="btn" to="/roles/jouer">🎭 Jeu de rôle</Link>
      {err && <span className="err">{err}</span>}
    </form>
  );
}
