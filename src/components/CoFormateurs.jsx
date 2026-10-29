import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { coAjouter, coRetirer, listGestionnairesCis } from "../lib/equipes";

// Co-formateurs d'une équipe (col="teams") ou d'une séance (col="salles") : gestionnaires du même CIS.
// Seul le créateur (ou un admin) ajoute / retire ; le co-formateur pilote ensuite comme le créateur.
export default function CoFormateurs({ col, id, obj, onChange }) {
  const { user, profil, isAdmin } = useAuth();
  const [liste, setListe] = useState(null);
  const [err, setErr] = useState("");
  const proprio = obj.owner === user.uid || isAdmin;
  useEffect(() => { if (proprio) listGestionnairesCis(profil, obj.owner).then(setListe).catch(() => setListe([])); }, [proprio, profil?.cis]); // eslint-disable-line
  const co = obj.co || [];
  const run = async (f) => { setErr(""); try { await f(); onChange?.(); } catch (e) { setErr(e.message); } };
  if (!proprio && !co.length) return null;
  const dispo = (liste || []).filter((g) => !co.includes(g.id));
  return (
    <div className="row item" style={{ flexWrap: "wrap" }}>
      <span className="muted">Co-formateurs :</span>
      {!proprio && <span>Géré avec {obj.ownerNom || "le créateur"}</span>}
      {co.length === 0 && proprio && <span className="muted">aucun</span>}
      {co.map((uid) => (
        <span key={uid} className="tag">{(obj.coNoms || {})[uid] || "Gestionnaire"}{proprio && <button className="link" title="Retirer" onClick={() => run(() => coRetirer(col, id, obj, uid))}> ✕</button>}</span>
      ))}
      {proprio && (
        <select value="" disabled={!liste} onChange={(e) => { const g = liste.find((x) => x.id === e.target.value); if (g) run(() => coAjouter(col, id, obj, g)); }}>
          <option value="">{liste === null ? "Chargement…" : dispo.length ? "Ajouter un co-formateur…" : "Aucun autre gestionnaire dans ton CIS"}</option>
          {dispo.map((g) => <option key={g.id} value={g.id}>{g.nom}{g.grade ? " — " + g.grade : ""}</option>)}
        </select>
      )}
      {err && <span className="err">{err}</span>}
    </div>
  );
}
