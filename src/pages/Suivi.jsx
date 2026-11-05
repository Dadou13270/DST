import TachesBilan from "../components/TachesBilan";
import { idsEquipes, equipesDe } from "../lib/equipes";
import AutoBilan from "../components/AutoBilan";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import Layout from "../components/Layout";
import { listScenarios } from "../lib/db";
import { useAuth } from "../lib/auth";
import { fmtDate, fmtDuree, statsOf, buildBilan } from "../lib/users";
import { mergeScenario } from "../lib/model";
import { pdfSuivi, pdfDossier } from "../lib/pdf";
import { useCarnet } from "../lib/carnet";
import { StagiaireNav } from "./Home";
import { competences } from "../lib/competences";
import { useDevoirs } from "../lib/useDevoirs";
import CourbeFiches from "../components/CourbeFiches";
import { FicheLecture } from "../components/FicheEval";
import { evaluationsDe } from "../lib/fiche";
import FilMessages from "../components/FilMessages";
import { repondreFormateur } from "../lib/equipes";
import { lienExercice, listExercices, typeExercice } from "../lib/relation";
import AttestationsCard from "../components/AttestationsCard";
import CoursSuivi from "../components/CoursSuivi";

function Repliable({ titre, children }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="sv-fil">
      <button type="button" className="sv-tog" aria-expanded={ouvert} onClick={() => setOuvert(!ouvert)}>
        <span className="chev" style={{ display: "inline-block", transition: ".15s", transform: ouvert ? "rotate(90deg)" : "none" }}>▶</span> <strong>{titre}</strong>
      </button>
      {ouvert && children}
    </div>
  );
}

function Fil({ profil, scId, uid, onSent }) {
  const [txt, setTxt] = useState("");
  const [err, setErr] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const reps = (profil.reponses || {})[scId] || [];
  const envoyer = async () => {
    setErr("");
    try { await repondreFormateur(uid, scId, txt); setTxt(""); await onSent(); } catch (e) { setErr(e.message); }
  };
  return (
    <div className="card alerte" style={{ margin: "8px 0 0", borderLeftColor: "var(--ok)" }}>
      <button type="button" className="sv-tog" aria-expanded={ouvert} onClick={() => setOuvert(!ouvert)}>
        <span className="chev" style={{ display: "inline-block", transition: ".15s", transform: ouvert ? "rotate(90deg)" : "none" }}>▶</span> <strong>Échange avec le formateur</strong> <span className="muted">· {1 + reps.length} message{reps.length ? "s" : ""}</span>
      </button>
      {ouvert && (
        <>
          <FilMessages c={profil.commentaires[scId]} reps={reps} nomStagiaire="Moi" />
          <textarea rows={2} maxLength={600} placeholder="Répondre au formateur…" value={txt} onChange={(e) => setTxt(e.target.value)} />
          <div className="row item">
            <button className="btn" disabled={!txt.trim() || reps.length >= 30} onClick={envoyer}>Envoyer ma réponse</button>
            {err && <span className="err">{err}</span>}
          </div>
        </>
      )}
    </div>
  );
}

export default function Suivi() {
  const { user, profil, isAdmin, logout, refreshProfil } = useAuth();
  const [evals, setEvals] = useState([]);
  const [evOuv, setEvOuv] = useState(null);
  useEffect(() => { if (user) evaluationsDe(user.uid).then((l) => setEvals(l.filter((e) => e.decision !== "À compléter"))).catch(() => {}); }, [user?.uid]); // eslint-disable-line
  const [list, setList] = useState(null);
  useEffect(() => {
    listScenarios(true, { uid: user?.uid, equipeIds: idsEquipes(profil) }).then(setList).catch(() => setList([]));
  }, [user?.uid, idsEquipes(profil).join()]); // eslint-disable-line
  const [exs, setExs] = useState([]);
  useEffect(() => { listExercices(isAdmin, { uid: user?.uid, equipeIds: idsEquipes(profil) }).then(setExs); }, [isAdmin, user?.uid, idsEquipes(profil).join()]);
  const { carnet } = useCarnet(user?.uid);
  const [recup, setRecup] = useState("");
  const [filtre, setFiltre] = useState("");
  const devoirs = useDevoirs(profil);
  const [rubOuv, setRubOuv] = useState({});
  // Récupère les exercices terminés sur cet appareil mais absents du suivi (faits avant la mise à jour ou échec d'enregistrement).
  useEffect(() => {
    if (!list || !user || !profil || recup) return;
    const bs0 = profil.bilans || {};
    const nb = { ...bs0 };
    let n = 0;
    for (const sc of list) {
      if (nb[sc.id]) continue;
      try {
        const l = JSON.parse(localStorage.getItem(`soiec-session-${sc.id}`));
        if (l && l.finished && l.start && l.finishedAt) {
          nb[sc.id] = buildBilan(mergeScenario(sc), l, null);
          n++;
        }
      } catch {
        /* ignoré */
      }
    }
    if (!n) return;
    setRecup("sync");
    setDoc(doc(db, "users", user.uid), { bilans: JSON.parse(JSON.stringify(nb)) }, { merge: true })
      .then(() => refreshProfil())
      .then(() => setRecup(`${n} exercice(s) terminé(s) récupéré(s) dans ton suivi.`))
      .catch((e) => setRecup("Récupération impossible (" + (e.code || e.message) + ")."));
  }, [list, user, profil]); // eslint-disable-line react-hooks/exhaustive-deps
  const bs = profil?.bilans || {};
  const dossier = () => {
    const titres = {};
    (list || []).forEach((s) => { titres["s:" + s.id] = s.titre; });
    exs.forEach((e) => { titres["e:" + e.id] = e.titre; });
    pdfDossier(profil, bs, equipesDe(profil || {}).map((t) => t.nom).join(", "), {
      titres,
      notes: Object.entries(carnet.notes).map(([k, n]) => ({ titre: titres[k] || k, texte: n.texte })),
      favoris: carnet.favoris.map((k) => titres[k]).filter(Boolean),
      fiches: evals,
    });
  };
  const st = statsOf(bs);
  const enCours = (id) => {
    try {
      const v = JSON.parse(localStorage.getItem(`soiec-session-${id}`));
      return v && v.start && !v.finished;
    } catch {
      return false;
    }
  };
  return (
    <Layout
      right={
        <>
          {profil && <span>{profil.nom}</span>}
          {isAdmin && <Link to="/admin">Paramètres</Link>}
          <button className="link" onClick={logout}>Déconnexion</button>
        </>
      }
    >
      <StagiaireNav />
      <div className="row between item"><h1>Mon suivi</h1><span className="row"><button className="btn" onClick={() => pdfSuivi(profil, bs, equipesDe(profil || {}).map((t) => t.nom).join(", "))}>Exporter en PDF</button> <button className="btn primary" title="Bilans, auto-évaluations, commentaires et notes personnelles" onClick={() => dossier()}>Mon dossier PDF</button></span></div>
      {recup && recup !== "sync" && <p className={recup.startsWith("Récup") ? "err" : "ok-txt"}>{recup}</p>}
      {list && <AttestationsCard profil={profil} devoirs={devoirs} catalogue={[...list, ...exs]} equipe={equipesDe(profil || {}).map((t) => t.nom).join(", ")} gest={profil?.equipeGest} />}
      <CoursSuivi />
      {!list && <p>Chargement…</p>}
      {list && (() => {
        const dvIds = new Set((devoirs || []).map((d) => d.scId));
        const orph = Object.keys(bs).filter((id) => !list.some((x) => x.id === id)).map((id) => ({ id, titre: bs[id].titre || id, rubrique: bs[id].rubrique || "Hors catalogue", orph: true }));
        const items = [
          ...exs.map((ex) => {
            const l = profil?.calculs?.[ex.id] || [], d = l[l.length - 1];
            return { id: "e" + ex.id, rub: ex.rubrique || "Autres", titre: ex.titre, org: dvIds.has(ex.id) ? "Équipe" : "Libre", type: typeExercice(ex), etat: d ? "termine" : "nouveau",
              info: d ? `${fmtDate(d.le)} · ${l.length} essai(s) · dernier ${d.ok}/${d.tot} · meilleur ${Math.max(...l.map((x) => x.ok))}/${d.tot}` : "",
              to: lienExercice(ex), btn: d ? "Refaire" : "Commencer" };
          }),
          ...[...list, ...orph].map((s) => {
            const b = bs[s.id];
            const ec = !b && (enCours(s.id) || Boolean(profil?.encours?.[s.id]));
            return { id: "s" + s.id, rub: s.rubrique || "Autres", titre: s.titre, org: s.orph ? "Libre · hors catalogue" : dvIds.has(s.id) ? "Équipe" : "Libre", type: "Scénario", etat: b ? "termine" : ec ? "encours" : "nouveau", scId: s.id,
              info: b ? `${fmtDate(b.fin)} · ${fmtDuree(b.duree || 0)} · ${b.nbQ} question(s)${b.essTot ? ` · essentielles ${b.essOk}/${b.essTot}` : ""}${b.cubTot ? ` · cubique ${b.cubOk}/${b.cubTot}` : ""}${b.nb > 1 ? ` · ${b.nb} tentatives` : ""}` : "",
              to: s.orph ? null : `/scenario/${s.id}`, btn: b ? "Revoir mes réponses" : ec ? "Reprendre" : "Commencer" };
          }),
        ];
        const cnt = (e) => items.filter((i) => !e || i.etat === e).length;
        const ET = { termine: "Terminé", encours: "En cours", nouveau: "Non commencé" };
        const ord = { encours: 0, nouveau: 1, termine: 2 };
        const R = {};
        items.filter((i) => !filtre || i.etat === filtre).forEach((i) => { (R[i.rub] = R[i.rub] || []).push(i); });
        const names = Object.keys(R).sort((a, b) => a.localeCompare(b, "fr"));
        return (
          <>
            <div className="sv-kpis">
              <div className="card"><div className="muted">Exercices terminés</div><h2>{cnt("termine")} / {items.length}</h2><div className="sv-bar"><i style={{ width: `${items.length ? Math.round((100 * cnt("termine")) / items.length) : 0}%` }} /></div></div>
              <div className="card"><div className="muted">En cours</div><h2>{cnt("encours")}</h2></div>
              <div className="card"><div className="muted">Temps moyen</div><h2>{st.n ? fmtDuree(st.tmoy) : "—"}</h2></div>
              <div className="card"><div className="muted">Questions essentielles posées</div><h2>{st.ess === null ? "—" : st.ess + " %"}</h2></div>
            </div>
      {(() => {
        const cp = competences(evals);
        if (!cp.nb) return null;
        const col = (titre, l, coul) => (
          <div className="cp-col" style={{ borderTopColor: coul }}>
            <h4 style={{ margin: 0 }}>{titre} <span className="muted">({l.length})</span></h4>
            {l.length ? l.map((x) => <div key={x.n} className="cp-it">{x.n}{x.e ? <span className="tag late" style={{ marginLeft: 6 }}>Éliminatoire</span> : null}<span className="muted"> · {x.moy.toFixed(1)}/3</span></div>) : <p className="muted" style={{ margin: "6px 0 0" }}>Rien pour l'instant.</p>}
          </div>
        );
        return (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Mes compétences <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>· d'après {cp.nb} fiche{cp.nb > 1 ? "s" : ""} d'évaluation</span></h3>
            <CourbeFiches evals={evals} />
            {cp.sections.map((s) => (
              <div key={s.t} className="cp-bar"><span>{s.t}</span><div><i style={{ width: s.pct + "%", background: s.pct >= 70 ? "#1f8a4c" : s.pct >= 50 ? "#d98a00" : "#c42a1c" }} /></div><b>{s.pct} %</b></div>
            ))}
            <div className="cp-cols">{col("Acquis", cp.acquis, "#1f8a4c")}{col("En cours", cp.encours, "#d98a00")}{col("À travailler", cp.travailler, "#c42a1c")}</div>
          </div>
        );
      })()}
      {evals.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Mes fiches d'évaluation</h3>
          {evals.map((e) => (
            <div key={e.id} style={{ marginBottom: 6 }}>
              <button className="btn" onClick={() => setEvOuv(evOuv === e.id ? null : e.id)}>
                {evOuv === e.id ? "▾" : "▸"} {e.scTitre} · <span className={"fiche-dec " + ({ "Validé": "ok", "Non validé": "ko", "À consolider": "mid" }[e.decision] || "")}>{e.decision}</span> {e.pct} %
              </button>
              {evOuv === e.id && <FicheLecture e={e} />}
            </div>
          ))}
        </div>
      )}
      {evals.length > 0 && <hr className="sv-sep" />}
            {items.length === 0 && <div className="card">Aucun exercice disponible.</div>}
            {items.length > 0 && (
              <div className="sv-pills">
                {[["", "Tous"], ["encours", "En cours"], ["nouveau", "Non commencés"], ["termine", "Terminés"]].map(([k, l]) => (
                  <button key={k} className={"sv-pill" + (filtre === k ? " on" : "")} onClick={() => setFiltre(k)}>{l}<em>{cnt(k)}</em></button>
                ))}
                <button className="sv-pill" style={{ marginLeft: "auto" }} onClick={() => { const o = {}; const tout = names.every((k) => (rubOuv[k] !== undefined ? rubOuv[k] : false)); names.forEach((k) => { o[k] = !tout; }); setRubOuv({ ...rubOuv, ...o }); }}>Tout déplier / replier</button>
              </div>
            )}
            {items.length > 0 && names.length === 0 && <div className="card">Aucun exercice dans cette catégorie.</div>}
            {names.map((k) => {
              const all = items.filter((i) => i.rub === k), d = all.filter((i) => i.etat === "termine").length;
              const ouv = rubOuv[k] !== undefined ? rubOuv[k] : false;
              return (
                <div className="card sv-rub" key={k}>
                  <button type="button" className="sv-h sv-tog sv-rubtog" aria-expanded={ouv} onClick={() => setRubOuv({ ...rubOuv, [k]: !ouv })}>
                    <span><span className="chev" style={{ display: "inline-block", transition: ".15s", transform: ouv ? "rotate(90deg)" : "none" }}>▶</span> <h3 style={{ display: "inline" }}>{k}</h3></span><span className="muted">{d} / {all.length} terminé{d > 1 ? "s" : ""}</span>
                  </button>
                  <div className="sv-bar" style={{ margin: "0 0 4px" }}><i style={{ width: `${Math.round((100 * d) / all.length)}%` }} /></div>
                  {ouv && [...R[k]].sort((a, b) => ord[a.etat] - ord[b.etat]).map((i) => (
                    <div className="sv-row" key={i.id}>
                      <div className="sv-t"><b>{i.titre}</b><span className="tag">{i.type}</span>{i.org && <span className="tag">{i.org}</span>}</div>
                      <span className={"sv-st " + i.etat}>{ET[i.etat]}</span>
                      <div className="sv-info">{i.info}</div>
                      {i.to && <Link className={i.etat === "termine" ? "btn" : "btn primary"} to={i.to}>{i.btn}</Link>}
                      {carnet.notes[i.id[0] + ":" + i.id.slice(1)] && <div className="carnet-note"><b>✎ Ma note :</b> {carnet.notes[i.id[0] + ":" + i.id.slice(1)].texte}</div>}
                      {i.scId && bs[i.scId]?.auto && <Repliable titre="Auto-évaluation du stagiaire"><AutoBilan auto={bs[i.scId].auto} sansTitre /></Repliable>}
                      {i.scId && bs[i.scId]?.taches && <Repliable titre="Consignes de la séance en salle"><TachesBilan taches={bs[i.scId].taches} sansTitre /></Repliable>}
                      {i.scId && profil?.commentaires?.[i.scId] && <div className="sv-fil"><Fil profil={profil} scId={i.scId} uid={user?.uid} onSent={refreshProfil} /></div>}
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        );
      })()}
    </Layout>
  );
}
