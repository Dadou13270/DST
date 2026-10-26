import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { creerSalle, watchMesSalles, etatSalle, libEtat, fmtDebut, debutDepuisInput } from "../lib/salles";

// Carte « Séance en salle » de l'espace gestionnaire
export default function SalleCard({ scs }) {
  const { user, profil } = useAuth();
  const nav = useNavigate();
  const [scId, setScId] = useState("");
  const [salles, setSalles] = useState([]);
  const [err, setErr] = useState("");
  const [deb, setDeb] = useState("");
  useEffect(() => (user ? watchMesSalles(user.uid, setSalles) : undefined), [user?.uid]); // eslint-disable-line
  useEffect(() => { if (!scId && scs.length) setScId(scs[0].id); }, [scs, scId]);
  const ouvrir = async () => {
    setErr("");
    const sc = scs.find((x) => x.id === scId);
    if (!sc) return setErr("Choisis un scénario.");
    try { nav(`/gestion/salle/${await creerSalle(user.uid, profil?.nom, sc, debutDepuisInput(deb))}`); } catch (e) { setErr(e.message); }
  };
  const date = (t) => (t?.toDate ? t.toDate().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "");
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Séance en salle</h3>
      <p className="muted">Choisis un scénario : un code de salle est généré. Les stagiaires le saisissent sur la page d'accueil. Tu vois leurs questions en direct et tu peux projeter le scénario.</p>
      <div className="row item">
        <select className="grow" value={scId} onChange={(e) => setScId(e.target.value)}>
          {scs.map((x) => <option key={x.id} value={x.id}>{x.titre}{x.rubrique ? ` — ${x.rubrique}` : ""}</option>)}
        </select>
      </div>
      <div className="row item">
        <label htmlFor="sdeb">Début de la séance</label>
        <input id="sdeb" type="datetime-local" className="grow" value={deb} onChange={(e) => setDeb(e.target.value)} />
        <button className="btn primary" onClick={ouvrir}>Ouvrir / planifier la salle</button>
      </div>
      <p className="muted" style={{ margin: "4px 0 0" }}>Laisse la date vide pour ouvrir immédiatement. Si une date est choisie, les stagiaires pourront rejoindre à partir de cette date et de cette heure.</p>
      {err && <p className="err">{err}</p>}
      {salles.slice(0, 8).map((r) => (
        <div className="row between item" key={r.id}>
          <span><strong style={{ letterSpacing: ".15em" }}>{r.code}</strong> {r.titre} <span className={etatSalle(r) === "open" ? "tag ok" : "tag"}>{libEtat[etatSalle(r)]}</span> <span className="muted">{r.debut ? "début " + fmtDebut(r.debut) : date(r.le)}</span></span>
          <Link className="btn" to={`/gestion/salle/${r.code}`}>Ouvrir</Link>
        </div>
      ))}
    </div>
  );
}
