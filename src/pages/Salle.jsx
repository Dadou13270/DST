import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import SalleChat from "../components/SalleChat";
import { useAuth } from "../lib/auth";
import { getScenario } from "../lib/db";
import { watchSalle, watchQuestions, watchParticipants, setOuverte, supprimerSalle, etatSalle, libEtat, fmtDebut, setDebut, debutDepuisInput, inputDepuisDebut } from "../lib/salles";

const hhmm = (t) => new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

// Tableau de bord du formateur : participants, couverture des questions essentielles, flux en direct
export default function Salle() {
  const { code } = useParams();
  const { user, isAdmin, profil } = useAuth();
  const nav = useNavigate();
  const [salle, setSalle] = useState(undefined);
  const [qs, setQs] = useState([]);
  const [ps, setPs] = useState([]);
  const [sc, setSc] = useState(null);
  const [filt, setFilt] = useState("all");
  const [conf, setConf] = useState(false);
  const [err, setErr] = useState("");
  const [deb, setDeb] = useState(null);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 15000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const u = [watchSalle(code, setSalle), watchQuestions(code, setQs), watchParticipants(code, setPs)];
    return () => u.forEach((f) => f && f());
  }, [code]);
  useEffect(() => { if (salle?.scId) getScenario(salle.scId).then(setSc).catch(() => {}); }, [salle?.scId]);

  if (!user) return null;
  if (!isAdmin && !profil?.gestionnaire) return <Navigate to="/" replace />;
  if (salle === undefined) return <Layout><p>Chargement…</p></Layout>;
  if (!salle) return <Layout><h1>Séance en salle</h1><div className="card">Salle introuvable ou supprimée.</div><Link className="btn" to="/gestion">Retour</Link></Layout>;

  const ess = (sc?.qa || []).filter((x) => x.essentielle);
  const esId = new Set(ess.map((x) => x.id));
  const qui = (x) => new Set(qs.filter((q) => q.qaId === x.id).map((q) => q.uid)).size;
  const faites = ess.filter((x) => qui(x) > 0).length;
  const feed = qs.filter((x) => filt === "all" || x.uid === filt);
  const interNom = (id) => (sc?.interlocuteurs || []).find((i) => i.id === id)?.nom || "";
  const ferme = salle.ouverte === false;
  const act = (f) => async () => { setErr(""); try { await f(); } catch (e) { setErr(e.message); } };

  return (
    <Layout>
      <div className="row between">
        <h1>Séance en salle</h1>
        <div className="row">
          <Link className="btn" to={`/gestion/salle/${code}/projection`} target="_blank">Projeter</Link>
          <button className="btn" onClick={act(() => setOuverte(code, ferme))}>{ferme ? "Rouvrir" : "Clôturer"}</button>
          {conf
            ? <button className="btn danger" onClick={act(async () => { await supprimerSalle(code); nav("/gestion"); })}>Confirmer la suppression</button>
            : <button className="btn danger" onClick={() => setConf(true)}>Supprimer</button>}
          <Link className="btn" to="/gestion">Retour</Link>
        </div>
      </div>
      {err && <div className="card warn">Erreur : {err}</div>}
      <div className="card" style={{ textAlign: "center" }}>
        <div className="muted">Code de la salle</div>
        <div style={{ fontSize: "3.2rem", fontWeight: 800, letterSpacing: ".3em" }}>{salle.code}</div>
        <div><strong>{salle.titre}</strong> <span className={etatSalle(salle) === "open" ? "tag ok" : "tag"}>{libEtat[etatSalle(salle)]}</span></div>
        {salle.debut && <p style={{ margin: "6px 0 0" }}>Début : <strong>{fmtDebut(salle.debut)}</strong>{etatSalle(salle) === "plan" && " — les stagiaires pourront rejoindre à partir de cette heure."}</p>}
        <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
          <input type="datetime-local" value={deb ?? inputDepuisDebut(salle.debut)} onChange={(e) => setDeb(e.target.value)} />
          <button className="btn" onClick={act(async () => { await setDebut(code, debutDepuisInput(deb ?? inputDepuisDebut(salle.debut))); setDeb(null); })}>Reprogrammer</button>
          {etatSalle(salle) === "plan" && <button className="btn primary" onClick={act(() => setDebut(code, Date.now()))}>Ouvrir maintenant</button>}
        </div>
        <p className="muted" style={{ margin: "6px 0 0" }}>{ps.length} stagiaire(s) connecté(s) · {qs.length} question(s) posée(s)</p>
      </div>
      <SalleChat code={code} role="formateur" />
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Stagiaires</h3>
        {ps.length === 0 ? <p className="muted">En attente des stagiaires…</p> : (
          <div className="chips">
            <button className={"chip" + (filt === "all" ? " on" : "")} onClick={() => setFilt("all")}>Tous ({qs.length})</button>
            {ps.map((u) => (
              <button key={u.uid} className={"chip" + (filt === u.uid ? " on" : "")} onClick={() => setFilt(u.uid)}>
                {u.nom} ({qs.filter((q) => q.uid === u.uid).length})
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Questions essentielles : {faites} / {ess.length} posées au moins une fois</h3>
        {ess.map((x) => (
          <div className="row between" key={x.id} style={{ margin: "3px 0" }}>
            <span>{qui(x) ? "✅" : "⬜"} {x.intitule} <span className="muted">{interNom(x.interlocuteurId)}</span></span>
            <span className={qui(x) ? "tag ok" : "tag"}>{qui(x)} / {ps.length}</span>
          </div>
        ))}
        {ess.length === 0 && <p className="muted">Aucune question essentielle définie.</p>}
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Questions en direct</h3>
        {feed.length === 0 && <p className="muted">Aucune question pour le moment.</p>}
        {feed.map((x) => (
          <div key={x.id} style={{ margin: "8px 0", paddingBottom: 6, borderBottom: "1px solid var(--line, #ddd)" }}>
            <div className="muted">
              {hhmm(x.le)} · <strong>{x.nom}</strong> → {x.whoNom}{" "}
              {x.qaId ? (esId.has(x.qaId) && <span className="tag ok">essentielle</span>) : <span className="tag">hors base</span>}
            </div>
            <div>{x.q}</div>
            <div className="muted">↳ {x.a}</div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
