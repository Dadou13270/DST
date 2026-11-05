import ObjectifsPc from "../components/ObjectifsPc";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { StagiaireNav } from "./Home";
import { useAuth } from "../lib/auth";
import { Link, useSearchParams } from "react-router-dom";
import { useDevoirs } from "../lib/useDevoirs";
import { fmtLimite } from "../lib/devoirs";
import BarreEquipe from "../components/ProgressionEquipes";
import { rejoindre, quitterEquipe, equipesDe, nbEquipes, MAX_EQUIPES } from "../lib/equipes";
import { mesGestionnaires } from "../lib/messages";
import { coursDuStagiaire, progresCours } from "../lib/cours";

// Côté stagiaire : rejoindre / quitter une équipe avec un code d'accès.
export default function Equipe() {
  const { user, profil, refreshProfil } = useAuth();
  const devoirs = useDevoirs(profil);
  const [params] = useSearchParams();
  const [code, setCode] = useState((params.get("code") || "").toUpperCase().slice(0, 10));
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [conf, setConf] = useState(null);
  const [gests, setGests] = useState([]);
  const equipes = equipesDe(profil || {});
  const [nbs, setNbs] = useState({});
  const [crs, setCrs] = useState([]);
  const [pgc, setPgc] = useState({});
  useEffect(() => { if (!user || !profil) return; coursDuStagiaire(profil).then(setCrs); progresCours(user.uid).then(setPgc).catch(() => {}); }, [user?.uid, equipes.map((t) => t.id).join()]); // eslint-disable-line
  useEffect(() => { nbEquipes(equipes.map((t) => t.id)).then(setNbs); }, [equipes.map((t) => t.id).join()]); // eslint-disable-line
  useEffect(() => { mesGestionnaires(profil || {}).then(setGests).catch(() => {}); }, [equipes.map((t) => t.id).join()]); // eslint-disable-line
  const run = async (fn, ok) => {
    setErr(""); setMsg(""); setConf(null);
    try { await fn(); await refreshProfil(); setMsg(ok); setCode(""); }
    catch (e) { setErr(e.message || "Erreur"); }
  };
  return (
    <Layout>
      <StagiaireNav />
      <h1>{equipes.length > 1 ? "Mes équipes" : "Mon équipe"}</h1>
      {msg && <p className="ok-txt">{msg}</p>}
      {err && <p className="err">{err}</p>}
      {devoirs.erreurs?.length > 0 && <p className="err">Impossible de lire les exercices de {devoirs.erreurs.length} équipe(s) ({devoirs.erreurs[0]}). Vérifie que les règles Firestore (firestore.rules) sont bien publiées.</p>}
      {equipes.length < MAX_EQUIPES ? (
        <form className="card" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "8px 12px" }}
          onSubmit={(e) => { e.preventDefault(); run(() => rejoindre(user.uid, code, profil), "Équipe rejointe."); }}>
          <strong>Rejoindre une équipe</strong>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={10} placeholder="Code, ex. K7M2QX" required aria-label="Code d'équipe"
            style={{ flex: "1 1 160px", minWidth: 140, letterSpacing: ".15em", fontFamily: "IBM Plex Mono, monospace" }} />
          <button className="btn primary">Rejoindre</button>
        </form>
      ) : <p className="muted">Tu appartiens à {MAX_EQUIPES} équipes (maximum). Quitte-en une pour en rejoindre une autre.</p>}
      {devoirs.length > 0 && (
        <div className="card">
          <h3 style={{ margin: 0 }}>Exercices à rendre</h3>
          {[...new Set(devoirs.map((d) => d.eq || ""))].map((eq) => {
            const L = devoirs.filter((d) => (d.eq || "") === eq);
            const late = L.some((d) => d.statut === "retard"), fini = L.every((d) => d.statut === "ok");
            return (
              <div key={"e" + eq} className={"ac-eq" + (late ? " late" : fini ? " ok" : "")} style={{ marginTop: 10 }}>
                <strong>{eq && devoirs.some((d) => d.multi) ? `Équipe « ${eq} »` : "Mes exercices"}</strong>
                <BarreEquipe liste={L} />
            {[...new Set(L.map((d) => d.pc || ""))].map((k) => {
              const it = L.filter((d) => (d.pc || "") === k).sort((a, b) => (a.rg || 0) - (b.rg || 0));
              const obj = it.find((d) => d.pcJ)?.pcJ;
              return (
                <div key={k || "_"}>
                  {k && <div style={{ marginTop: 12 }}><strong>Parcours « {it[0].pcT} »</strong>{it[0].multi && <> <span className="tag">{it[0].eq}</span></>}{it.find((d) => d.pcP)?.pcP && <div className="refdoc"><strong>Prérequis :</strong> <span style={{ whiteSpace: "pre-line" }}>{it.find((d) => d.pcP).pcP}</span></div>}{obj && <div className="refdoc"><strong>Objectif du parcours :</strong> <span style={{ whiteSpace: "pre-line" }}>{obj}</span></div>}<ObjectifsPc items={it} /></div>}
                  {it.map((d) => (
                    <div className="row between item" key={d.key || d.scId} style={{ marginTop: 8 }}>
                      <div>
                        <strong>{k ? `${(d.rg || 0) + 1}. ` : ""}{d.titre}</strong>{" "}{d.multi && d.eq && <><span className="tag">{d.eq}</span>{" "}</>}{d.oi !== undefined && d.pcI?.[d.oi] && <><span className="tag" title={d.pcI[d.oi]}>🎯 Objectif {d.oi + 1}</span>{" "}</>}{d.dg && <><span className="tag">Diagnostic</span>{" "}</>}
                        <span className={d.statut === "ok" ? "tag ok" : d.statut === "retard" ? "tag late" : "tag"}>
                          {d.statut === "ok" ? "Rendu" : d.statut === "retard" ? "En retard" : "À rendre"}
                        </span>
                        <div className="muted">Avant le {fmtLimite(d.limite)}</div>
                      </div>
                      <Link className={d.statut === "ok" ? "btn" : "btn primary"} to={`/scenario/${d.scId}`}>{d.statut === "ok" ? "Revoir" : "Faire l'exercice"}</Link>
                    </div>
                  ))}
                  {k && crs.filter((c) => c.pc === k).map((c) => (
                    <div className="row between item" key={"c" + c.id} style={{ marginTop: 8 }}>
                      <div>
                        <strong>📖 {c.titre}</strong> <span className="tag">Cours en ligne</span>{" "}
                        <span className={pgc[c.id]?.fait ? "tag ok" : c.lim && c.lim < Date.now() ? "tag late" : "tag"}>{pgc[c.id]?.fait ? "Lu" : c.lim && c.lim < Date.now() ? "En retard" : "À lire"}</span>
                        <div className="muted">Avant le {fmtLimite(c.lim)}</div>
                      </div>
                      <Link className={pgc[c.id]?.fait ? "btn" : "btn primary"} to={"/cours/" + c.id}>{pgc[c.id]?.fait ? "Relire" : "Lire le cours"}</Link>
                    </div>
                  ))}
                </div>
              );
            })}
              </div>
            );
          })}
        </div>
      )}
      {equipes.map((t) => {
        const g = gests.find((x) => x.equipes.includes(t.nom));
        return (
          <div className="card row between item" key={t.id}>
            <div>
              <strong>{t.nom}</strong> <span className="tag ok">Membre</span>{nbs[t.id] !== undefined && <> <span className="tag" title="Stagiaires inscrits dans cette équipe">👥 {nbs[t.id]} inscrit{nbs[t.id] > 1 ? "s" : ""}</span></>}{equipes.length > 1 && t.id === profil.equipeId && <> <span className="tag">Principale</span></>}
              <div className="muted">Gestionnaire : {t.gest || g?.nom || "—"}. Il voit ton suivi (exercices terminés, temps, réponses).</div>
              {g && <p style={{ margin: "8px 0 0" }}><Link className="btn primary" to={`/messages?avec=${g.id}`}>✉ Ouvrir la conversation</Link></p>}
            </div>
            {conf === t.id ? (
              <button className="btn danger" onClick={() => run(() => quitterEquipe(user.uid, profil, t.id), "Tu as quitté l'équipe « " + t.nom + " ».")}>Confirmer ?</button>
            ) : (
              <button className="btn" onClick={() => setConf(t.id)}>Quitter l'équipe</button>
            )}
          </div>
        );
      })}
    </Layout>
  );
}
