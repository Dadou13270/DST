import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import PdfLecteur from "../components/PdfLecteur";
import { StagiaireNav } from "./Home";
import { useAuth } from "../lib/auth";
import { coursDuStagiaire, progresCours, getCours, lirePdf, validerLecture } from "../lib/cours";
import { fmtLimite } from "../lib/devoirs";

// Stagiaire : cours en ligne proposés par le gestionnaire de ses équipes.
export function MesCours() {
  const { user, profil } = useAuth();
  const [l, setL] = useState(null);
  const [pg, setPg] = useState({});
  useEffect(() => { if (!user) return; coursDuStagiaire(profil).then(setL); progresCours(user.uid).then(setPg).catch(() => {}); }, [user?.uid, profil?.equipeId]); // eslint-disable-line
  const now = Date.now();
  const tri = [...(l || [])].sort((a, b) => (a.type === "devoir" ? 0 : 1) - (b.type === "devoir" ? 0 : 1) || (a.lim || 9e15) - (b.lim || 9e15));
  return (
    <Layout>
      <StagiaireNav />
      <h1>Cours en ligne</h1>
      <p className="muted">Cours au format PDF proposés par le gestionnaire de ton équipe : fais défiler jusqu'à la fin, puis valide ta lecture.</p>
      {!l && <p>Chargement…</p>}
      {l && l.length === 0 && <div className="card">Aucun cours proposé pour le moment.</div>}
      {tri.map((c) => {
        const fait = pg[c.id]?.fait, retard = c.type === "devoir" && !fait && c.lim && c.lim < now;
        return (
          <div className="card row between item" key={c.id}>
            <div>
              <strong>{c.titre}</strong>{" "}
              {c.type === "devoir" ? <span className={fait ? "tag ok" : retard ? "tag late" : "tag"}>{fait ? "Lu" : retard ? "En retard" : "À lire"}</span> : fait ? <span className="tag ok">Lu</span> : null}
              <div className="muted">{c.type === "devoir" ? `Avant le ${fmtLimite(c.lim)}` : "Bibliothèque"} · {c.equipe}{fait ? ` · lu le ${new Date(fait).toLocaleDateString("fr-FR")}` : ""}</div>
            </div>
            <Link className={fait ? "btn" : "btn primary"} to={"/cours/" + c.id}>{fait ? "Relire" : "Lire le cours"}</Link>
          </div>
        );
      })}
    </Layout>
  );
}

export function CoursVue() {
  const { id } = useParams();
  const { user } = useAuth();
  const [c, setC] = useState(undefined);
  const [d, setD] = useState(null);
  const [fait, setFait] = useState(0);
  const [bas, setBas] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    getCours(id).then((x) => { setC(x); if (x) lirePdf(x).then(setD).catch((e) => setErr(e.message)); }).catch((e) => { setErr(e.message); setC(null); });
    if (user) progresCours(user.uid).then((p) => setFait(p[id]?.fait || 0)).catch(() => {});
  }, [id, user?.uid]); // eslint-disable-line
  const valider = () => validerLecture(user.uid, id).then(() => setFait(Date.now())).catch((e) => setErr(e.message));
  return (
    <Layout>
      <StagiaireNav />
      <p><Link to="/cours">← Cours en ligne</Link></p>
      {c === undefined && <p>Chargement…</p>}
      {c === null && <div className="card warn">Cours introuvable{err ? " : " + err : "."}</div>}
      {c && (
        <>
          <h1 style={{ marginBottom: 2 }}>{c.titre}</h1>
          <p className="muted" style={{ marginTop: 0 }}>{c.description || "Fais défiler le document jusqu'à la fin, puis valide ta lecture."}{c.autNom ? ` · par ${c.autNom}` : ""}</p>
          {err && <p className="err">{err}</p>}
          {!d && !err && <p>Chargement du PDF…</p>}
          {d && <PdfLecteur data={d} onFin={() => setBas(true)} />}
          {d && (
            <div className="card" style={{ marginTop: 12 }}>
              {fait ? <p className="ok-txt" style={{ margin: 0 }}>✅ Lecture validée le {new Date(fait).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}. Ton gestionnaire le voit dans ton suivi.</p> : (
                <div className="row item" style={{ gap: 10, flexWrap: "wrap" }}>
                  <button className="btn primary" disabled={!bas} onClick={valider}>J'ai lu ce cours en entier</button>
                  {!bas && <span className="muted">Fais défiler le document jusqu'en bas pour valider.</span>}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
