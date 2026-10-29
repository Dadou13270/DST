import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { StagiaireNav } from "./Home";
import { useAuth } from "../lib/auth";
import { Link, useSearchParams } from "react-router-dom";
import { useDevoirs } from "../lib/useDevoirs";
import { fmtLimite } from "../lib/devoirs";
import { rejoindre, quitterEquipe } from "../lib/equipes";
import { monGestionnaire } from "../lib/messages";

// Côté stagiaire : rejoindre / quitter une équipe avec un code d'accès.
export default function Equipe() {
  const { user, profil, refreshProfil } = useAuth();
  const devoirs = useDevoirs(profil);
  const [params] = useSearchParams();
  const [code, setCode] = useState((params.get("code") || "").toUpperCase().slice(0, 10));
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [conf, setConf] = useState(false);
  const [gest, setGest] = useState(null);
  useEffect(() => { monGestionnaire(profil).then(setGest).catch(() => {}); }, [profil?.equipeId]); // eslint-disable-line
  const run = async (fn, ok) => {
    setErr(""); setMsg(""); setConf(false);
    try { await fn(); await refreshProfil(); setMsg(ok); setCode(""); }
    catch (e) { setErr(e.message || "Erreur"); }
  };
  return (
    <Layout>
      <StagiaireNav />
      <h1>Mon équipe</h1>
      {msg && <p className="ok-txt">{msg}</p>}
      {err && <p className="err">{err}</p>}
      {devoirs.length > 0 && (
        <div className="card">
          <h3 style={{ margin: 0 }}>Exercices à rendre</h3>
          {[...new Set(devoirs.map((d) => d.pc || ""))].map((k) => {
            const it = devoirs.filter((d) => (d.pc || "") === k).sort((a, b) => (a.rg || 0) - (b.rg || 0));
            const obj = it.find((d) => d.pcJ)?.pcJ;
            return (
              <div key={k || "_"}>
                {k && <div style={{ marginTop: 12 }}><strong>Parcours « {it[0].pcT} »</strong>{obj && <div className="refdoc"><strong>Objectif du parcours :</strong> <span style={{ whiteSpace: "pre-line" }}>{obj}</span></div>}</div>}
                {it.map((d) => (
                  <div className="row between item" key={d.scId} style={{ marginTop: 8 }}>
                    <div>
                      <strong>{k ? `${(d.rg || 0) + 1}. ` : ""}{d.titre}</strong>{" "}
                      <span className={d.statut === "ok" ? "tag ok" : d.statut === "retard" ? "tag late" : "tag"}>
                        {d.statut === "ok" ? "Rendu" : d.statut === "retard" ? "En retard" : "À rendre"}
                      </span>
                      <div className="muted">Avant le {fmtLimite(d.limite)}</div>
                    </div>
                    <Link className={d.statut === "ok" ? "btn" : "btn primary"} to={`/scenario/${d.scId}`}>{d.statut === "ok" ? "Revoir" : "Faire l'exercice"}</Link>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
      {profil?.equipeId ? (
        <div className="card row between item">
          <div>
            <strong>{profil.equipeNom || "Équipe"}</strong> <span className="tag ok">Membre</span>
            <div className="muted">Gestionnaire : {profil.equipeGest || gest?.nom || "—"}. Il voit ton suivi (exercices terminés, temps, réponses).</div>
            {gest && <p style={{ margin: "8px 0 0" }}><Link className="btn primary" to={`/messages?avec=${gest.id}`}>✉ Ouvrir la conversation</Link></p>}
          </div>
          {conf ? (
            <button className="btn danger" onClick={() => run(() => quitterEquipe(user.uid), "Tu as quitté l'équipe.")}>Confirmer ?</button>
          ) : (
            <button className="btn" onClick={() => setConf(true)}>Quitter l'équipe</button>
          )}
        </div>
      ) : (
        <form className="card form" style={{ maxWidth: 480 }}
          onSubmit={(e) => { e.preventDefault(); run(() => rejoindre(user.uid, code), "Équipe rejointe."); }}>
          <p>Saisis le code d'accès donné par ton gestionnaire.</p>
          <label>Code d'équipe</label>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={10} placeholder="ex. K7M2QX" required
            style={{ letterSpacing: ".15em", fontFamily: "IBM Plex Mono, monospace" }} />
          <button className="btn primary big">Rejoindre</button>
        </form>
      )}
    </Layout>
  );
}
