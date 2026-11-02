import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteScenario, listMesScenarios } from "../lib/db";
import { nivNorm } from "../lib/model";

// Scénarios créés par le gestionnaire (éditeur ouvert aux formateurs) : affectés à son département, réservés à lui et à ses équipes.
export default function MesScenarios({ user, profil }) {
  const [l, setL] = useState(null);
  const [err, setErr] = useState("");
  const [conf, setConf] = useState("");
  const charger = () => listMesScenarios(user.uid).then(setL).catch((e) => setErr(e.message));
  useEffect(() => { charger(); }, []); // eslint-disable-line
  const suppr = async (s) => { try { await deleteScenario(s.id); setConf(""); charger(); } catch (e) { setErr(e.message); } };
  return (
    <>
      <div className="row between item">
        <h3 style={{ margin: 0 }}>Mes scénarios</h3>
        <Link className="btn primary" to="/editeur/scenario/nouveau">+ Nouveau scénario</Link>
      </div>
      <p className="muted">Tes scénarios sont rattachés à ton département{profil?.departement ? ` (${profil.departement})` : ""} et visibles uniquement par toi et les membres de tes équipes, une fois publiés. L'administrateur peut les consulter.</p>
      {err && <div className="card warn">Erreur : {err}</div>}
      {!l && !err && <p>Chargement…</p>}
      {l && l.length === 0 && <div className="card">Aucun scénario pour le moment.</div>}
      {(l || []).map((s) => (
        <div className="card row between item" key={s.id}>
          <div className="row">
            {s.vignette ? <img className="thumb" src={s.vignette} alt="" /> : <div className="thumb ph" />}
            <div>
              <strong>{s.titre || "Sans titre"}</strong>
              <div className="meta">
                <span className={"st " + (s.publie ? "ok" : "br")}>● {s.publie ? "Publié" : "Brouillon"}</span>
                {s.rubrique && <span><span className="muted">Rubrique :</span> <b>{s.rubrique}</b></span>}
                <span className="tag niv">{nivNorm(s.niveau) || "Débutant"}</span>
              </div>
              <div className="muted">{(s.interlocuteurs || []).length} interlocuteur(s) · {(s.qa || []).length} réponse(s)</div>
            </div>
          </div>
          <div className="row">
            <Link className="btn" to={`/scenario/${s.id}`}>Tester</Link>
            <Link className="btn" to={`/editeur/scenario/${s.id}`}>Modifier</Link>
            {conf === s.id
              ? <button className="btn danger" onClick={() => suppr(s)}>Confirmer ?</button>
              : <button className="btn danger" onClick={() => setConf(s.id)}>Supprimer</button>}
          </div>
        </div>
      ))}
    </>
  );
}
