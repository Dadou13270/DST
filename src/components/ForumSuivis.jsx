import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { forumSuivis } from "../lib/forumDb";

// Accueil stagiaire : sujets du forum suivis, avec indication des nouvelles réponses.
export default function ForumSuivis({ uid }) {
  const [l, setL] = useState(null);
  useEffect(() => { if (uid) forumSuivis(uid).then(setL).catch(() => setL([])); }, [uid]);
  if (l === null) return null;
  const nv = l.filter((x) => x.nv).length;
  return (
    <div className={"card" + (nv ? " nvx" : "")}>
      <h3 style={{ margin: "0 0 8px" }}>🔔 Sujets suivis{nv ? ` · ${nv} avec du nouveau` : ""}</h3>
      {l.length === 0 ? <p className="muted" style={{ margin: 0 }}>Aucun sujet suivi. Clique sur « Suivre » dans un sujet du <Link to="/forum">forum</Link> pour ne pas manquer les réponses.</p> : l.slice(0, 6).map((x) => (
        <div key={x.id} className="ac-ech">
          <span style={{ minWidth: 70 }}>{x.nv ? <b style={{ color: "var(--red)" }}>● Nouveau</b> : <span className="muted">à jour</span>}</span>
          <span><Link to={"/forum?sujet=" + x.id}>{x.titre}</Link> <span className="muted">· {x.nb} réponse(s){x.nv && x.dernier ? ` · dernière de ${x.dernier}` : ""}</span></span>
        </div>
      ))}
    </div>
  );
}
