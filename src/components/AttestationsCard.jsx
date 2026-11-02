import { useState } from "react";
import { bilanParcours, parcoursDevoirs, pdfAttestations, slug } from "../lib/attestation";

// Attestations de fin de parcours (PDF) : une ligne par parcours assigné à l'équipe, téléchargeable une fois tous les exercices rendus.
export default function AttestationsCard({ profil, devoirs, catalogue, equipe, gest, titre = "Attestations de fin de parcours", compact }) {
  const [err, setErr] = useState("");
  const bps = parcoursDevoirs(devoirs).map((pc) => bilanParcours(pc, profil, catalogue));
  if (!bps.length) return null;
  const telecharger = async (liste) => {
    setErr("");
    try { await pdfAttestations(liste.map((bp) => ({ profil, bp, equipe, gest })), `attestation-${slug(profil?.nom)}${liste.length === 1 ? "-" + slug(liste[0].pc.titre) : ""}`); }
    catch (e) { setErr("Génération du PDF impossible : " + (e.message || e)); }
  };
  const faits = bps.filter((b) => b.termine);
  const corps = (
    <>
      {bps.map((bp) => (
        <div className="row between item" key={bp.pc.id} style={{ marginTop: 6 }}>
          <div>
            <strong>{bp.pc.titre}</strong>{" "}
            {bp.termine ? <span className="tag ok">Terminé{bp.note !== null ? ` · ${bp.note} %` : ""}</span> : <span className="tag">{bp.faits}/{bp.total} exercice(s)</span>}
          </div>
          <button className="btn primary" disabled={!bp.termine} title={bp.termine ? "Télécharger l'attestation (PDF)" : "Disponible quand tous les exercices du parcours sont rendus"} onClick={() => telecharger([bp])}>Attestation PDF</button>
        </div>
      ))}
      {faits.length > 1 && <div style={{ marginTop: 8 }}><button className="btn" onClick={() => telecharger(faits)}>Toutes les attestations (PDF unique)</button></div>}
      {err && <p className="err">{err}</p>}
    </>
  );
  return compact ? <div style={{ marginTop: 10 }}><h4 style={{ margin: "0 0 4px" }}>{titre}</h4>{corps}</div> : <div className="card"><h3 style={{ margin: 0 }}>{titre}</h3>{corps}</div>;
}
