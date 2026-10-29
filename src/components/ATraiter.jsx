import { useEffect, useState } from "react";
import { listMembres } from "../lib/equipes";
import { statutDevoir, fmtLimite, relancer, MODELE_RELANCE } from "../lib/devoirs";
import { nonLusMembre } from "./FilMessages";
import { evaluationsDeGest } from "../lib/fiche";
import { fmtDate } from "../lib/users";

// Synthèse du gestionnaire : ce qui demande une action, toutes équipes confondues (retards, réponses non lues, fiches à remplir).
export default function ATraiter({ teams, user, profil, onOuvrir }) {
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");
  const [tout, setTout] = useState(false);
  const [rel, setRel] = useState({}); // relances envoyées pendant cette visite : "tid|stagId_scId" -> date
  const charger = () => {
    Promise.all([Promise.all(teams.map((t) => listMembres(t.id).then((m) => ({ t, m })))), evaluationsDeGest(user.uid).catch(() => [])])
      .then(([eq, ev]) => setData({ eq, ev: new Set(ev.filter((e) => e.decision !== "À compléter").map((e) => e.id)) }))
      .catch(() => setData({ eq: [], ev: new Set() }));
  };
  useEffect(() => { if (teams.length) charger(); else setData({ eq: [], ev: new Set() }); }, [teams.map((t) => t.id).join(",")]); // eslint-disable-line
  if (!data) return <div className="card"><strong>À traiter</strong> <span className="muted">· chargement…</span></div>;
  const now = Date.now();
  const retards = [], reponses = [], fiches = [];
  data.eq.forEach(({ t, m }) => (m || []).forEach((u) => {
    (t.devoirs || []).forEach((d) => { if (statutDevoir(d, u.bilans, now, u.calculs) === "retard") retards.push({ t, u, d }); });
    const n = nonLusMembre(u);
    if (n) reponses.push({ t, u, n });
    Object.entries(u.bilans || {}).forEach(([scId, b]) => { if (!data.ev.has(`${u.id}_${scId}_${user.uid}`)) fiches.push({ t, u, scId, b }); });
  }));
  fiches.sort((a, b) => (b.b.fin || 0) - (a.b.fin || 0));
  const parStag = new Map();
  retards.forEach((r) => { const k = r.t.id + "|" + r.u.id; parStag.set(k, { ...r, ds: [...(parStag.get(k)?.ds || []), r.d] }); });
  const dateRel = (t, u, d) => rel[`${t.id}|${u.id}_${d.scId}`] || (t.relances || {})[`${u.id}_${d.scId}`] || 0;
  const relancerTous = async () => {
    setMsg("");
    try {
      let n = 0;
      const maj = {};
      for (const { t } of data.eq) {
        const l = retards.filter((r) => r.t.id === t.id).map(({ u, d }) => ({ u, d }));
        if (l.length) { n += await relancer(t, { uid: user.uid, nom: profil?.nom }, l, MODELE_RELANCE); l.forEach(({ u, d }) => { maj[`${t.id}|${u.id}_${d.scId}`] = Date.now(); }); }
      }
      setRel((x) => ({ ...x, ...maj }));
      setMsg(`${n} stagiaire(s) relancé(s) par message privé.`);
    } catch (e) { setMsg("Erreur : " + e.message); }
  };
  const vide = !retards.length && !reponses.length && !fiches.length;
  const nf = tout ? fiches : fiches.slice(0, 6);
  const bloc = (titre, n, coul, contenu) => (
    <div className="card">
      <h3 style={{ margin: 0 }}>{titre} <span className="at-n" style={{ background: n ? coul : "#1f8a4c" }}>{n}</span></h3>
      {n ? contenu : <p className="muted" style={{ margin: "6px 0 0" }}>Rien à signaler.</p>}
    </div>
  );
  return (
    <>
      <div className="row between item"><h2 style={{ margin: 0 }}>À traiter</h2><button className="btn" onClick={charger}>Actualiser</button></div>
      {vide && <div className="card"><p className="ok-txt" style={{ margin: 0 }}>✔ Tout est à jour : aucun retard, aucune réponse non lue, aucune fiche en attente.</p></div>}
      <div className="at-cols">
        {bloc("En retard", parStag.size, "#c42a1c", (
          <>
            {[...parStag.values()].map(({ t, u, ds }) => (
              <div key={t.id + u.id} className="at-it"><button className="link" onClick={() => onOuvrir(t.id, u.id)}>{u.nom || "Stagiaire"}</button> <span className="muted">· {t.nom}</span><br /><span className="muted">{ds.map((d) => `${d.titre} (${fmtLimite(d.limite)})`).join(", ")}</span>{ds.some((d) => dateRel(t, u, d)) && <><br /><span className="at-rel">✉ Relancé le {fmtLimite(Math.max(...ds.map((d) => dateRel(t, u, d))))}</span></>}</div>
            ))}
            <div className="row" style={{ marginTop: 8 }}><button className="btn" onClick={relancerTous}>{retards.length && retards.every((r) => dateRel(r.t, r.u, r.d)) ? "Relancer à nouveau" : "Relancer tous"}</button>{msg && <span className={msg.startsWith("Erreur") ? "err" : "ok-txt"}>{msg}</span>}</div>
          </>
        ))}
        {bloc("Réponses non lues", reponses.length, "#d98a00", reponses.map(({ t, u, n }) => (
          <div key={t.id + u.id} className="at-it"><button className="link" onClick={() => onOuvrir(t.id, u.id)}>{u.nom || "Stagiaire"}</button> <span className="muted">· {t.nom} · {n} réponse{n > 1 ? "s" : ""}</span></div>
        )))}
        {bloc("Fiches à remplir", fiches.length, "#2e6bd6", (
          <>
            {nf.map(({ t, u, scId, b }) => (
              <div key={t.id + u.id + scId} className="at-it"><button className="link" onClick={() => onOuvrir(t.id, u.id)}>{u.nom || "Stagiaire"}</button> <span className="muted">· {b.titre} · {fmtDate(b.fin)}</span></div>
            ))}
            {fiches.length > 6 && <button className="btn" style={{ marginTop: 6 }} onClick={() => setTout(!tout)}>{tout ? "Réduire" : `Voir les ${fiches.length}`}</button>}
          </>
        ))}
      </div>
    </>
  );
}
