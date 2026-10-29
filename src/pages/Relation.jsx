import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { StagiaireNav } from "./Home";
import { listRelations, TECH, ETATS, BESOINS, initEtat, appliquer, bilan } from "../lib/relation";
import { mettreEssai } from "../lib/calculs";

const mel = (a) => [...a].map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);
const sg = (n) => (n > 0 ? "+" + n : String(n));

function Jauge({ l, v, inv, cache }) {
  const bon = inv ? 100 - v : v;
  const col = bon >= 60 ? "var(--ok)" : bon >= 35 ? "#e08a00" : "var(--red)";
  return (
    <div className="rel-j"><span>{l}</span><div className="rel-bar"><i style={{ width: cache ? "100%" : v + "%", background: cache ? "var(--line)" : col }} /></div><b>{cache ? "" : v}</b></div>
  );
}

function Courbe({ tours, init }) {
  const pts = [init, ...tours.map((t) => t.apres.t)];
  const W = 320, H = 90, dx = pts.length > 1 ? W / (pts.length - 1) : W;
  const d = pts.map((v, i) => `${i ? "L" : "M"}${(i * dx).toFixed(1)},${(H - (v / 100) * H).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`-6 -6 ${W + 12} ${H + 12}`} style={{ width: "100%", maxWidth: 420 }} role="img" aria-label="Courbe de tension de la victime">
      <line x1="0" x2={W} y1={H * 0.3} y2={H * 0.3} stroke="var(--red)" strokeDasharray="4 4" strokeWidth="1" />
      <path d={d} fill="none" stroke="var(--red)" strokeWidth="2.5" />
      {pts.map((v, i) => <circle key={i} cx={i * dx} cy={H - (v / 100) * H} r="3.5" fill="var(--card)" stroke="var(--red)" strokeWidth="2" />)}
    </svg>
  );
}

export function RelationJeu({ ex, onFini, apercu }) {
  const [st, setSt] = useState(() => initEtat(ex));
  const [rea, setRea] = useState(null);
  const [t0] = useState(Date.now());
  const noeud = ex.noeuds.find((n) => n.id === st.noeud);
  const choix = useMemo(() => mel(noeud?.choix || []), [st.noeud, ex]); // eslint-disable-line react-hooks/exhaustive-deps
  const c = ex.contexte || {};
  const jv = !ex.jaugesMasquees;
  const choisir = (ch) => {
    const n = appliquer(ex, st, ch);
    setRea({ texte: ch.reaction, alerte: n.alerte && !n.fin });
    setSt(n);
    if (n.fin && onFini) onFini(n, bilan(ex, n), Math.round((Date.now() - t0) / 1000));
  };
  const sc = st.fin ? bilan(ex, st) : null;
  const finLabel = { apaise: "Victime apaisée", echec: "Échec : la situation a dégénéré", renfort: "Renfort demandé" }[st.fin];
  return (
    <>
      <div className="card">
        <div className="row between">
          <div><span className="tag">{c.type}</span> <span className="tag">Gravité {c.gravite}/5</span> {c.public !== "aucun" && <span className="tag">Public présent</span>} {c.alcool && <span className="tag">Alcool</span>} {c.arme && <span className="tag">Arme / objet dangereux</span>}</div>
          <div className="timer" style={{ fontSize: "1.2rem" }}>⏱ {st.temps} / {c.tempsMax} min</div>
        </div>
        <p style={{ margin: "8px 0" }}>{c.texte}</p>
        {c.objectif && <p className="muted" style={{ margin: 0 }}><b>Objectif :</b> {c.objectif} · <b>Moyens :</b> {c.effectifs} sapeurs-pompiers{c.lieu ? ` · ${c.lieu}` : ""}</p>}
      </div>
      <div className="card">
        <div className="rel-jauges">
          <Jauge l={`Tension (${ETATS[ex.victime.etat] || ex.victime.etat})`} v={st.tension} inv cache={!jv} />
          <Jauge l="Confiance" v={st.confiance} cache={!jv} />
          <Jauge l="Besoin identifié" v={st.besoin} cache={!jv} />
        </div>
        {!jv && <p className="muted" style={{ margin: "6px 0 0" }}>Jauges masquées : lis l'attitude de la victime.</p>}
        {st.alerte && !st.fin && <p className="rel-al">⚠ La tension est très élevée : pense à ta sécurité et à ce qui est justifié (retrait, renfort).</p>}
      </div>
      {rea && rea.texte && <div className="rel-rea"><i>{rea.texte}</i></div>}
      {!st.fin && noeud && (
        <>
          <div className="rel-bulle"><b>{ex.victime.nom}</b><p style={{ whiteSpace: "pre-line", margin: "4px 0 0" }}>{noeud.victime}</p></div>
          <h3>Que fais-tu / dis-tu ?</h3>
          <div className="rel-choix">{choix.map((ch) => <button key={ch.id} className="btn rel-ch" onClick={() => choisir(ch)}>{ch.texte}</button>)}</div>
        </>
      )}
      {st.fin && (
        <>
          <div className="card"><h2 style={{ marginTop: 0 }}>{finLabel}</h2>
            <div className="rel-scores">
              {[["Désamorçage", sc.desamorcage], ["Compréhension du besoin", sc.besoin], ["Posture et sécurité", sc.posture], ["Tenue de la mission", sc.mission]].map(([l, v]) => <div key={l}><b>{v}</b><span>{l}</span></div>)}
              <div className="g"><b>{sc.global}</b><span>Score global /100</span></div>
            </div>
            <h4>Courbe de tension de la victime</h4>
            <Courbe tours={st.tours} init={ex.victime.tension} />
            <p><b>Besoin réel :</b> {BESOINS[ex.victime.besoin] || ex.victime.besoin}. {ex.victime.besoinTexte} <br /><b>Identifié à {st.besoin} %.</b></p>
          </div>
          <div className="card"><h3 style={{ marginTop: 0 }}>Ton dialogue, tour par tour</h3>
            {st.tours.map((t, i) => (
              <div key={i} className="rel-tour">
                <div className="muted" style={{ whiteSpace: "pre-line" }}>« {String(t.victime).split("\n")[0].replace(/^«\s*|\s*»$/g, "")} »</div>
                <div><b>Toi :</b> {t.texte}</div>
                <div><span className={"tag " + (t.type === "piege" ? "bad" : t.type === "renfort" ? "" : "ok")}>{(TECH[t.technique] || {}).l || t.technique}</span> <span className="muted">tension {sg(t.apres.t - t.avant.t)} · confiance {sg(t.apres.c - t.avant.c)} · besoin {sg(t.apres.b - t.avant.b)} · {t.temps} min{t.technique === "renfort" ? (t.justifie ? " · renfort justifié" : " · renfort prématuré") : ""}</span></div>
                {t.conseil && <div className="muted">→ {t.conseil}</div>}
              </div>))}
          </div>
          {(ex.debrief.points.length > 0 || ex.debrief.erreurs.length > 0 || ex.debrief.principes.length > 0) && (
            <div className="card"><h3 style={{ marginTop: 0 }}>Débriefing</h3>
              {ex.debrief.points.length > 0 && <><b>À retenir</b><ul>{ex.debrief.points.map((x, i) => <li key={i}>{x}</li>)}</ul></>}
              {ex.debrief.erreurs.length > 0 && <><b>Erreurs fréquentes</b><ul>{ex.debrief.erreurs.map((x, i) => <li key={i}>{x}</li>)}</ul></>}
              {ex.debrief.principes.length > 0 && <><b>Principes</b><ul>{ex.debrief.principes.map((x, i) => <li key={i}>{x}</li>)}</ul></>}
            </div>)}
          <button className="btn pri" onClick={() => { setSt(initEtat(ex)); setRea(null); if (apercu) apercu(); }}>Refaire cet exercice</button>
        </>
      )}
    </>
  );
}

export default function Relation() {
  const { id } = useParams();
  const { user, profil, refreshProfil, isAdmin } = useAuth();
  const [exs, setExs] = useState(null);
  const [msg, setMsg] = useState("");
  const [k, setK] = useState(0);
  useEffect(() => { listRelations(true).then(setExs).catch(() => setExs([])); }, []);
  const ex = (exs || []).find((x) => x.id === id);
  if (!exs) return <Layout><StagiaireNav /><p>Chargement…</p></Layout>;
  if (!ex || (!ex.publie && !isAdmin)) return <Layout><StagiaireNav /><p>Exercice introuvable.</p></Layout>;
  const fini = async (st, sc, duree) => {
    try {
      const essai = { le: Date.now(), duree, ok: sc.global, tot: 100, rel: sc, fin: st.fin };
      await updateDoc(doc(db, "users", user.uid), { calculs: mettreEssai(profil?.calculs, ex.id, essai) });
      await refreshProfil();
      setMsg("Résultat enregistré.");
    } catch (e) { setMsg("Erreur d'enregistrement : " + e.message); }
  };
  return (
    <Layout>
      <StagiaireNav />
      <div className="row between"><h1>{ex.titre}</h1><Link to="/scenarios"><button className="btn">Retour</button></Link></div>
      {msg && <p className="muted">{msg}</p>}
      <RelationJeu key={k} ex={ex} onFini={fini} apercu={() => { setK(k + 1); setMsg(""); }} />
    </Layout>
  );
}
