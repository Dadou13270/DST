import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { forumActivite } from "../lib/forumDb";

// Accueil stagiaire : mes sujets et réponses sur le forum.
export default function ForumActivite({ uid }) {
  const [l, setL] = useState(null);
  useEffect(() => { if (uid) forumActivite(uid).then(setL).catch(() => setL([])); }, [uid]);
  if (l === null) return null;
  return (
    <div className="card">
      <h3 style={{ margin: "0 0 8px" }}>💬 Mon activité sur le forum</h3>
      {l.length === 0 ? <p className="muted" style={{ margin: 0 }}>Tu n'as pas encore participé. <Link to="/forum">Ouvrir le forum</Link></p> : (
        <>
          {l.slice(0, 6).map((x) => (
            <div key={x.id} className="ac-ech">
              <b>{new Date(x.t).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</b>
              <span><Link to={"/forum?sujet=" + x.sujet}>{x.titre}</Link> <span className="muted">· {x.type}{x.extrait ? " : « " + x.extrait + (x.extrait.length >= 90 ? "…" : "") + " »" : ""}</span></span>
            </div>
          ))}
          <div style={{ marginTop: 8 }}><Link to="/forum">Voir le forum ({l.filter((x) => x.type === "Sujet").length} sujet(s), {l.filter((x) => x.type === "Réponse").length} réponse(s))</Link></div>
        </>
      )}
    </div>
  );
}
