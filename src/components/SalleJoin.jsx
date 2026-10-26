import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { getSalle, normSalle, rejoindreSalle, etatSalle, fmtDebut } from "../lib/salles";

// Carte « Rejoindre une séance en salle » (page d'accueil du stagiaire)
export default function SalleJoin() {
  const { user, profil } = useAuth();
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const go = async (e) => {
    e.preventDefault();
    setErr("");
    const c = normSalle(code);
    if (!c) return setErr("Saisis le code de la salle.");
    try {
      const s = await getSalle(c);
      if (!s) return setErr("Code inconnu.");
      if (s.ouverte === false) return setErr("Cette séance est clôturée.");
      if (etatSalle(s) === "plan") return setErr(`Cette séance débute le ${fmtDebut(s.debut)}. Reviens à cette heure.`);
      await rejoindreSalle(c, user.uid, profil?.nom);
      nav(`/scenario/${s.scId}?salle=${c}`);
    } catch (x) { setErr(x.message); }
  };
  return (
    <form className="card row item" onSubmit={go}>
      <strong>Séance en salle</strong>
      <input className="grow" maxLength={8} placeholder="Code donné par le formateur (ex. K7M2P)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoComplete="off" />
      <button className="btn primary">Rejoindre</button>
      {err && <span className="err">{err}</span>}
    </form>
  );
}
