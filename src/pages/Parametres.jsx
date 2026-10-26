import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listScenarios, saveScenario, setReserve, initialiserVisibilite } from "../lib/db";
import { listDemandes, majDemande, listGestionnaires, STATUTS } from "../lib/demandesScenario";
import { newScenario } from "../lib/model";
import { fmtDate } from "../lib/users";

export default function Parametres() {
  const nav = useNavigate();
  const [dem, setDem] = useState([]);
  const [scs, setScs] = useState([]);
  const [gests, setGests] = useState([]);
  const [msg, setMsg] = useState("");

  const charger = async () => {
    try {
      const [d, s, g] = await Promise.all([listDemandes(), listScenarios(false), listGestionnaires()]);
      setDem(d); setScs(s); setGests(g);
    } catch (e) { setMsg("Erreur : " + e.message); }
  };
  useEffect(() => { charger(); }, []);

  const creer = async (r) => {
    try {
      const base = newScenario();
      const id = await saveScenario(null, {
        ...base, titre: r.titre, rubrique: r.rubrique || "", description: r.details || "",
        publie: false, reserveA: r.demandeur, cubique: r.rubrique === "Incendie",
      });
      await majDemande(r.id, { statut: "en_cours", scenarioId: id });
      nav(`/admin/scenario/${id}`);
    } catch (e) { setMsg("Erreur : " + e.message); }
  };
  const statut = async (r, st) => { await majDemande(r.id, { statut: st }); charger(); };
  const attribuer = async (s, uid) => { await setReserve(s.id, uid); setMsg("Attribution enregistrée."); charger(); };
  const nomGest = (uid) => gests.find((g) => g.id === uid)?.nom || "un gestionnaire";

  return (
    <>
      <h1>Paramètres</h1>
      {msg && <p className="muted">{msg}</p>}

      <div className="card">
        <h3>Demandes de scénarios des gestionnaires</h3>
        {dem.length === 0 && <p className="muted">Aucune demande pour le moment.</p>}
        {dem.map((r) => (
          <div className="card" key={r.id}>
            <strong>{r.titre}</strong> <span className={r.statut === "livree" ? "tag ok" : "tag"}>{STATUTS[r.statut] || r.statut}</span>{" "}
            {r.rubrique && <span className="tag">{r.rubrique}</span>}
            <div className="muted">{r.demandeurNom} · {fmtDate(r.creeLe)}</div>
            {r.details && <p className="pre">{r.details}</p>}
            <div className="row">
              {r.scenarioId
                ? <Link className="btn" to={`/admin/scenario/${r.scenarioId}`}>Ouvrir le scénario</Link>
                : <button className="btn primary" onClick={() => creer(r)}>Créer le scénario et l'attribuer</button>}
              {r.statut !== "livree" && <button className="btn" onClick={() => statut(r, "livree")}>Marquer livrée</button>}
              {r.statut !== "livree" && r.statut !== "refusee" && <button className="btn danger" onClick={() => statut(r, "refusee")}>Refuser</button>}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Attribution des scénarios</h3>
        <p className="muted">Un scénario attribué à un gestionnaire n'est visible que par lui et les membres de ses équipes.</p>
        {scs.map((s) => (
          <div className="row between" key={s.id} style={{ margin: "6px 0" }}>
            <span>{s.titre} <span className="muted">{s.rubrique}</span></span>
            <select value={s.reserveA || ""} onChange={(e) => attribuer(s, e.target.value)}>
              <option value="">Tous (public)</option>
              {gests.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
              {s.reserveA && !gests.some((g) => g.id === s.reserveA) && <option value={s.reserveA}>{nomGest(s.reserveA)}</option>}
            </select>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Maintenance</h3>
        <p className="muted">À lancer une fois après la mise à jour : marque les anciens scénarios comme publics (nécessaire pour la visibilité par gestionnaire).</p>
        <button className="btn" onClick={async () => setMsg(`${await initialiserVisibilite()} scénario(s) mis à jour.`)}>Initialiser la visibilité des scénarios existants</button>
      </div>
    </>
  );
}
