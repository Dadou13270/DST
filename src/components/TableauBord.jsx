import { useEffect, useState } from "react";
import { listMembres } from "../lib/equipes";
import { statutDevoir, fmtLimite } from "../lib/devoirs";

const ms = (t) => (t?.toMillis ? t.toMillis() : typeof t === "number" ? t : 0);
const J = 86400000;

// Tableau de bord d'une équipe : progression, scénarios les plus ratés, stagiaires inactifs.
export default function TableauBord({ teams, scs }) {
  const [tid, setTid] = useState(teams[0]?.id || "");
  const [jours, setJours] = useState(14);
  const [m, setM] = useState(null);
  const [err, setErr] = useState("");
  const team = teams.find((t) => t.id === tid) || teams[0];
  useEffect(() => {
    if (!team) return;
    setM(null);
    listMembres(team.id).then(setM).catch((e) => setErr(e.message));
  }, [team?.id]); // eslint-disable-line
  if (!team) return <div className="card">Aucune équipe. Crée-en une dans l'onglet Équipes.</div>;
  const now = Date.now();
  const dev = team.devoirs || [];
  const nPub = scs.length;
  const membres = (m || []).map((u) => {
    const bs = u.bilans || {};
    const n = Object.keys(bs).length;
    const rendus = dev.filter((d) => bs[d.scId]).length;
    const retards = dev.filter((d) => statutDevoir(d, bs, now) === "retard").length;
    const pct = dev.length ? rendus / dev.length : nPub ? Math.min(1, n / nPub) : 0;
    const last = Math.max(ms(u.derniereConnexion), ...Object.values(bs).map((b) => b.fin || 0));
    return { u, n, rendus, retards, pct, last };
  });
  const moyenne = membres.length ? Math.round((membres.reduce((a, x) => a + x.pct, 0) / membres.length) * 100) : 0;
  // Scénarios les plus ratés : plus faible part de questions essentielles posées
  const agg = {};
  membres.forEach(({ u }) => Object.entries(u.bilans || {}).forEach(([id, b]) => {
    const a = (agg[id] = agg[id] || { id, titre: b.titre, n: 0, ok: 0, tot: 0 });
    a.n++; a.ok += b.essOk || 0; a.tot += b.essTot || 0;
  }));
  const rates = Object.values(agg).filter((a) => a.tot > 0).map((a) => ({ ...a, taux: Math.round((a.ok / a.tot) * 100) })).sort((a, b) => a.taux - b.taux).slice(0, 5);
  const retardsDev = dev.map((d) => ({ d, r: membres.filter((x) => statutDevoir(d, x.u.bilans, now) === "retard").length })).filter((x) => x.r > 0);
  const inactifs = membres.filter((x) => !x.last || now - x.last > jours * J).sort((a, b) => a.last - b.last);
  const depuis = (t) => (t ? `il y a ${Math.floor((now - t) / J)} j` : "jamais");

  return (
    <div>
      <div className="row item" style={{ marginBottom: 10 }}>
        {teams.length > 1 && (
          <select value={team.id} onChange={(e) => setTid(e.target.value)}>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
          </select>
        )}
        <span className="muted">{team.nom} · {m ? `${m.length} membre(s)` : "Chargement…"}</span>
      </div>
      {err && <p className="err">{err}</p>}
      {m && m.length === 0 && <div className="card">Aucun membre dans cette équipe.</div>}
      {m && m.length > 0 && (
        <>
          <div className="card">
            <h2 style={{ margin: 0 }}>Progression de l'équipe : {moyenne} %</h2>
            <div className="muted">{dev.length ? `Sur ${dev.length} exercice(s) à rendre.` : `Aucun exercice imposé : progression calculée sur les ${nPub} exercices disponibles.`}</div>
            <table className="cmp" style={{ marginTop: 8 }}>
              <thead><tr><th>Stagiaire</th><th>Progression</th><th>Terminés</th>{dev.length > 0 && <th>Rendus</th>}<th>Retards</th></tr></thead>
              <tbody>
                {[...membres].sort((a, b) => a.pct - b.pct).map(({ u, n, rendus, retards, pct }) => (
                  <tr key={u.id}>
                    <td>{u.nom || "—"}</td>
                    <td style={{ minWidth: 140 }}>
                      <div style={{ height: 8, background: "var(--line, #ddd)", borderRadius: 9, overflow: "hidden" }}>
                        <i style={{ display: "block", height: "100%", width: `${Math.round(pct * 100)}%`, background: "#2e9e5b" }} />
                      </div>
                      <span className="muted">{Math.round(pct * 100)} %</span>
                    </td>
                    <td>{n}</td>{dev.length > 0 && <td>{rendus}/{dev.length}</td>}
                    <td>{retards > 0 ? <span className="tag late">{retards}</span> : "0"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h2 style={{ margin: 0 }}>Scénarios les plus ratés</h2>
            <div className="muted">Part des questions essentielles posées par les stagiaires (la plus faible en premier).</div>
            {rates.length === 0 && <p className="muted">Pas encore de résultat.</p>}
            {rates.map((a) => (
              <div key={a.id} style={{ margin: "8px 0" }}>
                <div className="row between"><span>{a.titre}</span><span className="muted">{a.taux} % · {a.n} stagiaire(s)</span></div>
                <div style={{ height: 8, background: "var(--line, #ddd)", borderRadius: 9, overflow: "hidden" }}>
                  <i style={{ display: "block", height: "100%", width: `${a.taux}%`, background: a.taux < 50 ? "#c42a1c" : "#e8a81c" }} />
                </div>
              </div>
            ))}
            {retardsDev.length > 0 && (
              <>
                <h3>Exercices les plus en retard</h3>
                {retardsDev.sort((a, b) => b.r - a.r).map(({ d, r }) => <div key={d.scId}>{d.titre} — {r} en retard (échéance {fmtLimite(d.limite)})</div>)}
              </>
            )}
          </div>
          <div className="card">
            <div className="row item between">
              <h2 style={{ margin: 0 }}>Stagiaires inactifs</h2>
              <select value={jours} onChange={(e) => setJours(Number(e.target.value))}>
                <option value={7}>Sans activité depuis 7 jours</option><option value={14}>14 jours</option><option value={30}>30 jours</option>
              </select>
            </div>
            {inactifs.length === 0 && <p className="muted">Tous les stagiaires ont été actifs récemment.</p>}
            {inactifs.map(({ u, n, last }) => <div key={u.id}>{u.nom || "—"} — dernière activité : {depuis(last)} · {n} exercice(s) terminé(s)</div>)}
          </div>
        </>
      )}
    </div>
  );
}
