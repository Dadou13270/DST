import { useEffect, useState } from "react";
import { fmtDate } from "../lib/users";

// Note privée liée à un exercice (visible de toi seul) + favori.
export default function NotePerso({ k, carnet, noter, basculerFavori }) {
  const n = carnet.notes[k]?.texte || "";
  const [t, setT] = useState(n);
  const [msg, setMsg] = useState("");
  useEffect(() => { setT(n); }, [n]);
  const fav = carnet.favoris.includes(k);
  const enreg = async () => { setMsg(""); try { await noter(k, t); setMsg("Enregistrée."); } catch (e) { setMsg("Échec : " + (e.code || e.message)); } };
  return (
    <div className="note">
      <div className="nk"><span className="kk">✎</span>Mes notes personnelles</div>
      <p className="nh">Point à retenir, erreur à ne pas refaire… Cette note est privée : ni le formateur ni les administrateurs ne la voient. Elle figure dans « Mon dossier PDF ».</p>
      <textarea rows={6} maxLength={2000} value={t} onChange={(e) => setT(e.target.value)} placeholder="Ma note sur cet exercice…" />
      <div className="row item">
        <button className="btn primary" disabled={t.trim() === n.trim()} onClick={enreg}>Enregistrer la note</button>
        <button className="btn" onClick={() => basculerFavori(k).catch(() => {})}>{fav ? "★ Retirer des favoris" : "☆ Mettre en favori"}</button>
        {carnet.notes[k] && <span className="muted">Dernière modification : {fmtDate(carnet.notes[k].le)}</span>}
        {msg && <span className="muted">{msg}</span>}
      </div>
    </div>
  );
}
