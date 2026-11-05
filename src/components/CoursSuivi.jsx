import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { coursDuStagiaire, progresCours } from "../lib/cours";
import { fmtLimite } from "../lib/devoirs";

// « Mon suivi » : cours en ligne proposés et lecture validée.
export default function CoursSuivi() {
  const { user, profil } = useAuth();
  const [l, setL] = useState([]);
  const [pg, setPg] = useState({});
  useEffect(() => { if (!user) return; coursDuStagiaire(profil).then(setL); progresCours(user.uid).then(setPg).catch(() => {}); }, [user?.uid, profil?.equipeId]); // eslint-disable-line
  if (!l.length) return null;
  const ok = l.filter((c) => pg[c.id]?.fait).length, now = Date.now();
  return (
    <div className="card">
      <div className="row between item"><h3 style={{ margin: 0 }}>Cours en ligne</h3><span className="tag">{ok}/{l.length} lu{ok > 1 ? "s" : ""}</span></div>
      {l.map((c) => { const f = pg[c.id]?.fait, retard = c.type === "devoir" && !f && c.lim && c.lim < now; return (
        <div key={c.id} className="row between item" style={{ marginTop: 6 }}>
          <div><strong>{c.titre}</strong> {f ? <span className="tag ok">✅ Lu le {new Date(f).toLocaleDateString("fr-FR")}</span> : retard ? <span className="tag late">En retard</span> : <span className="tag">À lire</span>}{c.type === "devoir" && !f && <span className="muted"> · avant le {fmtLimite(c.lim)}</span>}</div>
          <Link className="btn sm" to={"/cours/" + c.id}>{f ? "Relire" : "Lire"}</Link>
        </div>); })}
    </div>
  );
}
