import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { getScenario, getPhoto, getSituationPhotos } from "../lib/db";
import { watchSalle } from "../lib/salles";

// Écran de projection (plein écran, sans menu) : photo, situation et, à la demande, la correction
export default function SalleProjection() {
  const { code } = useParams();
  const { user, isAdmin, profil } = useAuth();
  const [salle, setSalle] = useState(undefined);
  const [sc, setSc] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [sp, setSp] = useState([]);
  const [corr, setCorr] = useState(false);
  useEffect(() => watchSalle(code, setSalle), [code]);
  useEffect(() => {
    if (!salle?.scId) return;
    (async () => {
      const s = await getScenario(salle.scId);
      setSc(s);
      setPhoto(await getPhoto(salle.scId).catch(() => null));
      const p = await getSituationPhotos(salle.scId).catch(() => []);
      setSp(p.length ? p : s?.situation?.photos || []);
    })().catch(() => {});
  }, [salle?.scId]);
  if (!user) return null;
  if (!isAdmin && !profil?.gestionnaire) return <Navigate to="/" replace />;
  if (!salle || !sc) return <div style={{ padding: 22 }}>{salle === null ? "Salle introuvable." : "Chargement…"}</div>;
  const c = sc.correction || {};
  return (
    <div style={{ padding: 22, maxWidth: 1400, margin: "0 auto" }}>
      <div className="row between">
        <div>
          <div className="muted">Rejoindre : page d'accueil → Séance en salle → code</div>
          <div style={{ fontSize: "2.6rem", fontWeight: 800, letterSpacing: ".3em" }}>{salle.code}</div>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setCorr(!corr)}>{corr ? "Masquer la correction" : "Afficher la correction"}</button>
          <Link className="btn" to={`/gestion/salle/${code}`}>Retour au tableau de bord</Link>
        </div>
      </div>
      <h1 style={{ fontSize: "2rem" }}>{sc.titre}</h1>
      {photo && <img src={photo} alt="" style={{ width: "100%", maxHeight: "62vh", objectFit: "contain", borderRadius: 10 }} />}
      {sc.situation?.consigne && <p className="consigne" style={{ fontSize: "1.35rem" }}>{sc.situation.consigne}</p>}
      {sc.situation?.contexte && <p className="pre" style={{ fontSize: "1.25rem" }}>{sc.situation.contexte}</p>}
      {sp.length > 0 && (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}>
          {sp.map((p) => (
            <figure key={p.id} style={{ margin: 0 }}>
              <img src={p.data} alt="" style={{ width: "100%", borderRadius: 10 }} />
              {p.legende && <figcaption style={{ fontSize: "1.1rem" }}>{p.legende}</figcaption>}
            </figure>
          ))}
        </div>
      )}
      {corr && (
        <div className="card" style={{ fontSize: "1.1rem" }}>
          <h2>Correction</h2>
          {["S", "O", "I", "E", "C"].map((k) => c[k] && <p className="pre" key={k}><strong>{k}</strong> — {c[k]}</p>)}
          {c.message && <><h3>Message de renseignements</h3><p className="pre">{c.message}</p></>}
          {c.commentaire && <><h3>Points de vigilance</h3><p className="pre">{c.commentaire}</p></>}
          {sc.cubique && c.cubique && <><h3>Reconnaissance cubique</h3><p className="pre">{c.cubique}</p></>}
        </div>
      )}
    </div>
  );
}
