import { useEffect, useState } from "react";
import { listDemandesGest, traiterDemandeGest } from "../lib/gestionnaires";
import { useAuth } from "../lib/auth";
import { fmtDate } from "../lib/users";

const LIB = { attente: "En attente", acceptee: "Acceptée", refusee: "Refusée" };

// Demandes « devenir gestionnaire » : accepter ou refuser en un clic
export default function AdminGestionnaires() {
  const { profil } = useAuth();
  const [l, setL] = useState(null);
  const [msg, setMsg] = useState("");
  const [raison, setRaison] = useState({});
  const charger = () => listDemandesGest().then(setL).catch((e) => { setL([]); setMsg("Erreur : " + e.message); });
  useEffect(() => { charger(); }, []);
  const go = async (d, ok) => {
    setMsg("");
    try { await traiterDemandeGest(d, ok, profil?.nom || "Admin", raison[d.id] || ""); setMsg(`${d.nom} : demande ${ok ? "acceptée, le droit gestionnaire est accordé" : "refusée"}.`); charger(); } catch (e) { setMsg("Erreur : " + e.message); }
  };
  const att = (l || []).filter((d) => d.statut === "attente"), hist = (l || []).filter((d) => d.statut !== "attente");
  return (
    <div>
      <h2>Demandes pour devenir gestionnaire</h2>
      {msg && <p className="tag ok" style={{ display: "block" }}>{msg}</p>}
      {!l && <p>Chargement…</p>}
      {l && att.length === 0 && <div className="card">Aucune demande en attente.</div>}
      {att.map((d) => (
        <div className="card" key={d.id}>
          <div className="row between item">
            <div><strong>{d.nom}</strong> <span className="muted">{[d.grade, d.cis, d.departement].filter(Boolean).join(" · ")} · {d.email} · {fmtDate(d.le)}</span></div>
            <div className="row">
              <button className="btn primary" onClick={() => go(d, true)}>Accepter</button>
              <button className="btn danger" onClick={() => go(d, false)}>Refuser</button>
            </div>
          </div>
          <p className="pre" style={{ margin: "4px 0" }}>{d.motif}</p>
          <input placeholder="Motif du refus (facultatif, visible par le demandeur)" value={raison[d.id] || ""} onChange={(e) => setRaison({ ...raison, [d.id]: e.target.value })} />
        </div>
      ))}
      {hist.length > 0 && (
        <>
          <h3>Historique</h3>
          <table className="cmp"><thead><tr><th>Demandeur</th><th>CIS</th><th>Décision</th><th>Date</th></tr></thead>
            <tbody>{hist.map((d) => <tr key={d.id}><td>{d.nom}</td><td>{[d.cis, d.departement].filter(Boolean).join(" · ")}</td><td><span className={d.statut === "acceptee" ? "tag ok" : "tag"}>{LIB[d.statut]}</span>{d.raison && <div className="muted">{d.raison}</div>}</td><td>{fmtDate(d.traiteLe)}</td></tr>)}</tbody></table>
        </>
      )}
    </div>
  );
}
