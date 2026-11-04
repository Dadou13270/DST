import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteQuiz, dupQuiz, listMesQuiz } from "../lib/quiz";
import { nivNorm } from "../lib/model";

// Quiz et QCM créés par le gestionnaire : réservés à lui et à ses équipes, utilisables dans un parcours ou en exercice libre.
export default function MesQuiz({ user, profil }) {
  const [l, setL] = useState(null);
  const [err, setErr] = useState("");
  const [conf, setConf] = useState("");
  const charger = () => listMesQuiz(user.uid).then(setL).catch((e) => setErr(e.message));
  useEffect(() => { charger(); }, []); // eslint-disable-line
  const suppr = async (x) => { try { await deleteQuiz(x.id); setConf(""); charger(); } catch (e) { setErr(e.message); } };
  const dup = async (x) => { try { await dupQuiz({ ...x, auteur: user.uid, reserveA: user.uid }); charger(); } catch (e) { setErr(e.message); } };
  return (
    <>
      <div className="row between item">
        <h2 style={{ margin: 0 }}>Mes quiz et QCM</h2>
        <Link className="btn primary" to="/editeur/quiz/nouveau">+ Nouveau quiz / QCM</Link>
      </div>
      <p className="muted">Rattachés à ton département{profil?.departement ? ` (${profil.departement})` : ""} et visibles par toi et les membres de tes équipes, une fois publiés. Un quiz publié se choisit comme exercice libre ou s'ajoute à un parcours (Parcours pédagogiques) ou à une échéance.</p>
      {err && <div className="card warn">Erreur : {err}</div>}
      {!l && !err && <p>Chargement…</p>}
      {l && l.length === 0 && <div className="card">Aucun quiz pour le moment. Démarre avec la trame QCM ou la trame quiz.</div>}
      {(l || []).map((x) => (
        <div className="card row between item" key={x.id}>
          <div>
            <strong>{x.titre || "Sans titre"}</strong>
            <div className="meta">
              <span className={"st " + (x.publie ? "ok" : "br")}>● {x.publie ? "Publié" : "Brouillon"}</span>
              <span className="tag">{x.format === "quiz" ? "Quiz" : "QCM"}</span>
              <span className="tag niv">{nivNorm(x.niveau) || "Débutant"}</span>
            </div>
            <div className="muted">{(x.questions || []).length} question(s)</div>
          </div>
          <div className="row">
            <Link className="btn" to={`/quiz/${x.id}`}>Tester</Link>
            <Link className="btn" to={`/editeur/quiz/${x.id}`}>Modifier</Link>
            <button className="btn" onClick={() => dup(x)}>Dupliquer</button>
            {conf === x.id ? <button className="btn danger" onClick={() => suppr(x)}>Confirmer ?</button> : <button className="btn danger" onClick={() => setConf(x.id)}>Supprimer</button>}
          </div>
        </div>
      ))}
    </>
  );
}
