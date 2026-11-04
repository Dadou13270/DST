import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import CarteMentale from "../components/CarteMentale";
import { StagiaireNav } from "./Home";
import { useAuth } from "../lib/auth";
import { cartesDuStagiaire, progresCarte, getCarte, sauverProgres, masquees } from "../lib/cartes";
import { fmtLimite } from "../lib/devoirs";

// Stagiaire : cartes mentales proposées par le gestionnaire de ses équipes.
export function MesCartes() {
  const { user, profil } = useAuth();
  const [l, setL] = useState(null);
  const [pg, setPg] = useState({});
  useEffect(() => { if (!user) return; cartesDuStagiaire(profil).then(setL); progresCarte(user.uid).then(setPg).catch(() => {}); }, [user?.uid, profil?.equipeId]); // eslint-disable-line
  const now = Date.now();
  const tri = [...(l || [])].sort((a, b) => (a.type === "devoir" ? 0 : 1) - (b.type === "devoir" ? 0 : 1) || (a.lim || 9e15) - (b.lim || 9e15));
  return (
    <Layout>
      <StagiaireNav />
      <h1>Cartes mentales</h1>
      <p className="muted">Cartes proposées par le gestionnaire de ton équipe : à consulter pour réviser, ou à compléter.</p>
      {!l && <p>Chargement…</p>}
      {l && l.length === 0 && <div className="card">Aucune carte mentale proposée pour le moment.</div>}
      {tri.map((c) => {
        const fait = pg[c.id]?.fait, retard = c.type === "devoir" && !fait && c.lim && c.lim < now;
        return (
          <div className="card row between item" key={c.id}>
            <div>
              <strong>{c.titre}</strong>{" "}
              <span className="tag">{c.mode === "exo" ? "À compléter" : "À consulter"}</span>{" "}
              {c.type === "devoir" ? <span className={fait ? "tag ok" : retard ? "tag late" : "tag"}>{fait ? "Terminée" : retard ? "En retard" : "À rendre"}</span> : fait ? <span className="tag ok">Terminée</span> : null}
              <div className="muted">{c.type === "devoir" ? `Avant le ${fmtLimite(c.lim)}` : "Bibliothèque"} · {c.equipe}</div>
            </div>
            <Link className={fait ? "btn" : "btn primary"} to={"/carte/" + c.id}>{fait ? "Revoir" : c.mode === "exo" ? "Compléter" : "Ouvrir"}</Link>
          </div>
        );
      })}
    </Layout>
  );
}

export function CarteVue() {
  const { id } = useParams();
  const { user } = useAuth();
  const [c, setC] = useState(undefined);
  const [rep, setRep] = useState({});
  const [fait, setFait] = useState(false);
  const [corr, setCorr] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    getCarte(id).then((x) => setC(x)).catch((e) => { setErr(e.message); setC(null); });
    if (user) progresCarte(user.uid).then((p) => { const q = p[id]; if (q) { setRep(q.rep || {}); setFait(!!q.fait); setCorr(!!q.fait); } }).catch(() => {});
  }, [id, user?.uid]); // eslint-disable-line
  const exo = c?.mode === "exo";
  const save = (fin) => sauverProgres(user.uid, id, { rep, fait: fin ? Date.now() : 0, le: Date.now() }).then(() => { if (fin) { setFait(true); setCorr(true); } }).catch((e) => setErr(e.message));
  const nbOk = c ? masquees(c.arbre).filter((n) => (rep[n.id] || "").trim().toLowerCase() === (n.t || "").trim().toLowerCase()).length : 0;
  return (
    <Layout>
      <StagiaireNav />
      <p><Link to="/cartes">← Cartes mentales</Link></p>
      {c === undefined && <p>Chargement…</p>}
      {c === null && <div className="card warn">Carte introuvable{err ? " : " + err : "."}</div>}
      {c && (
        <>
          <h1 style={{ marginBottom: 2 }}>{c.titre}</h1>
          <p className="muted" style={{ marginTop: 0 }}>{exo ? "Complète les cases en pointillés, puis valide pour afficher le corrigé." : "Fiche à consulter. Fais défiler pour voir toutes les branches."}{c.autNom ? ` · par ${c.autNom}` : ""}</p>
          <CarteMentale arbre={c.arbre} exo={exo} rep={rep} setRep={corr ? undefined : setRep} corrige={corr} />
          {err && <p className="err">{err}</p>}
          {exo && !corr && <div className="row" style={{ marginTop: 12 }}><button className="btn" onClick={() => save(false)}>Enregistrer mon brouillon</button><button className="btn primary" onClick={() => save(true)}>Valider et voir le corrigé</button></div>}
          {exo && corr && <p className="ok-txt" style={{ marginTop: 12 }}>{nbOk}/{masquees(c.arbre).length} branche(s) retrouvée(s). Le gestionnaire voit que tu as terminé.</p>}
          {!exo && !fait && <div style={{ marginTop: 12 }}><button className="btn primary" onClick={() => save(true)}>J'ai terminé la révision</button></div>}
          {!exo && fait && <p className="ok-txt" style={{ marginTop: 12 }}>Terminée.</p>}
        </>
      )}
    </Layout>
  );
}
