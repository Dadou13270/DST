import { useEffect, useState } from "react";
import { listSdis, attribuerRoleSdis, refuserSdis, supprimerSdis } from "../lib/sdis";
import { fmtDate } from "../lib/users";

const LIB = { attente: "En attente", valide: "Validé", refuse: "Refusé" };
const ROLE = { "": "Aucun rôle", gestionnaire: "Gestionnaire", dept: "Admin de département" };

// Liste des SDIS inscrits : valider, attribuer le rôle de gestionnaire ou d'admin de département au référent
export default function AdminSdis() {
  const [l, setL] = useState(null);
  const [msg, setMsg] = useState("");
  const [raison, setRaison] = useState({});
  const charger = () => listSdis().then(setL).catch((e) => { setL([]); setMsg("Erreur : " + e.message); });
  useEffect(() => { charger(); }, []);
  const run = async (fn, ok) => { setMsg(""); try { await fn(); setMsg(ok); charger(); } catch (e) { setMsg("Erreur : " + e.message); } };
  return (
    <div>
      <h2>SDIS inscrits</h2>
      <p className="muted">Valide l'inscription d'un SDIS en attribuant un rôle à son référent : Gestionnaire (équipes et suivi des stagiaires) ou Admin de département (statistiques du département).</p>
      {msg && <p className="tag ok" style={{ display: "block" }}>{msg}</p>}
      {!l && <p>Chargement…</p>}
      {l && l.length === 0 && <div className="card">Aucun SDIS inscrit.</div>}
      {(l || []).map((s) => (
        <div className="card" key={s.id}>
          <div className="row between item">
            <div><strong>{s.nom}</strong> <span className="tag">{s.departement}</span> <span className={s.statut === "valide" ? "tag ok" : "tag"}>{LIB[s.statut] || s.statut}</span>{s.statut === "valide" && <span className="tag"> {ROLE[s.role || ""]}</span>}</div>
            <span className="muted">{fmtDate(s.le)}</span>
          </div>
          <p className="muted" style={{ margin: "4px 0" }}>
            Référent : {s.refNom}{s.refFonction ? ` (${s.refFonction})` : ""} · {s.email}{s.tel ? ` · ${s.tel}` : ""}{s.ville ? ` · ${s.ville}` : ""} · {s.nbCis || 0} CIS · {s.nbStagiaires || 0} stagiaires
          </p>
          {s.message && <p className="pre" style={{ margin: "4px 0" }}>{s.message}</p>}
          <div className="row">
            <select value={s.statut === "valide" ? s.role || "" : ""} onChange={(e) => run(() => attribuerRoleSdis(s, e.target.value), `${s.nom} : ${ROLE[e.target.value]} attribué au référent.`)}>
              <option value="" disabled={s.statut !== "valide"}>{s.statut === "valide" ? "Aucun rôle" : "Attribuer un rôle et valider…"}</option>
              <option value="gestionnaire">Gestionnaire</option>
              <option value="dept">Admin de département</option>
            </select>
            {s.statut !== "valide" && <button className="btn danger" onClick={() => run(() => refuserSdis(s, raison[s.id] || ""), `${s.nom} : inscription refusée.`)}>Refuser</button>}
            <button className="btn danger" onClick={() => window.confirm(`Supprimer ${s.nom} de la liste ? Les rôles du référent ne changent pas.`) && run(() => supprimerSdis(s), "SDIS supprimé.")}>Supprimer</button>
          </div>
          {s.statut !== "valide" && <input style={{ marginTop: 6 }} placeholder="Motif du refus (facultatif, visible par le référent)" value={raison[s.id] || ""} onChange={(e) => setRaison({ ...raison, [s.id]: e.target.value })} />}
        </div>
      ))}
    </div>
  );
}
