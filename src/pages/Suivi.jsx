import TachesBilan from "../components/TachesBilan";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import Layout from "../components/Layout";
import { listScenarios } from "../lib/db";
import { useAuth } from "../lib/auth";
import { fmtDate, fmtDuree, statsOf, buildBilan } from "../lib/users";
import { mergeScenario } from "../lib/model";
import { pdfSuivi } from "../lib/pdf";
import { StagiaireNav } from "./Home";
import FilMessages from "../components/FilMessages";
import { repondreFormateur } from "../lib/equipes";
import { listExercices, typeExercice } from "../lib/relation";

function Fil({ profil, scId, uid, onSent }) {
  const [txt, setTxt] = useState("");
  const [err, setErr] = useState("");
  const reps = (profil.reponses || {})[scId] || [];
  const envoyer = async () => {
    setErr("");
    try { await repondreFormateur(uid, scId, txt); setTxt(""); await onSent(); } catch (e) { setErr(e.message); }
  };
  return (
    <div className="card alerte" style={{ margin: "8px 0 0", borderLeftColor: "var(--ok)" }}>
      <strong>Échange avec le formateur</strong>
      <FilMessages c={profil.commentaires[scId]} reps={reps} nomStagiaire="Moi" />
      <textarea rows={2} maxLength={600} placeholder="Répondre au formateur…" value={txt} onChange={(e) => setTxt(e.target.value)} />
      <div className="row item">
        <button className="btn" disabled={!txt.trim() || reps.length >= 30} onClick={envoyer}>Envoyer ma réponse</button>
        {err && <span className="err">{err}</span>}
      </div>
    </div>
  );
}

export default function Suivi() {
  const { user, profil, isAdmin, logout, refreshProfil } = useAuth();
  const [list, setList] = useState(null);
  useEffect(() => {
    listScenarios(true, { uid: user?.uid, equipeId: profil?.equipeId }).then(setList).catch(() => setList([]));
  }, [user?.uid, profil?.equipeId]); // eslint-disable-line
  const [exs, setExs] = useState([]);
  useEffect(() => { listExercices(isAdmin, { uid: user?.uid, equipeId: profil?.equipeId }).then(setExs); }, [isAdmin, user?.uid, profil?.equipeId]);
  const [recup, setRecup] = useState("");
  const [filtre, setFiltre] = useState("");
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
      <div className="row between item"><h1>Mon suivi</h1><button className="btn" onClick={() => pdfSuivi(profil, bs, profil?.equipeNom)}>Exporter en PDF</button></div>
      {recup && recup !== "sync" && <p className={recup.startsWith("Récup") ? "err" : "ok-txt"}>{recup}</p>}
      {!list && <p>Chargement…</p>}
      {list && (() => {
        const items = [
          ...exs.map((ex) => {
            const l = profil?.calculs?.[ex.id] || [], d = l[l.length - 1];
            return { id: "e" + ex.id, rub: ex.rubrique || "Autres", titre: ex.titre, type: typeExercice(ex), etat: d ? "termine" : "nouveau",
              info: d ? `${fmtDate(d.le)} · ${l.length} essai(s) · dernier ${d.ok}/${d.tot} · meilleur ${Math.max(...l.map((x) => x.ok))}/${d.tot}` : "",
              to: ex.kind === "rel" ? `/relation/${ex.id}` : `/calculs/${ex.id}`, btn: d ? "Refaire" : "Commencer" };
          }),
          ...list.map((s) => {
            const b = bs[s.id];
            const ec = !b && (enCours(s.id) || Boolean(profil?.encours?.[s.id]));
            return { id: "s" + s.id, rub: s.rubrique || "Autres", titre: s.titre, type: "Scénario", etat: b ? "termine" : ec ? "encours" : "nouveau", scId: s.id,
              info: b ? `${fmtDate(b.fin)} · ${fmtDuree(b.duree || 0)} · ${b.nbQ} question(s)${b.essTot ? ` · essentielles ${b.essOk}/${b.essTot}` : ""}${b.cubTot ? ` · cubique ${b.cubOk}/${b.cubTot}` : ""}${b.nb > 1 ? ` · ${b.nb} tentatives` : ""}` : "",
              to: `/scenario/${s.id}`, btn: b ? "Revoir mes réponses" : ec ? "Reprendre" : "Commencer" };
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
            {items.length === 0 && <div className="card">Aucun exercice disponible.</div>}
            {items.length > 0 && (
              <div className="sv-pills">
                {[["", "Tous"], ["encours", "En cours"], ["nouveau", "Non commencés"], ["termine", "Terminés"]].map(([k, l]) => (
                  <button key={k} className={"sv-pill" + (filtre === k ? " on" : "")} onClick={() => setFiltre(k)}>{l}<em>{cnt(k)}</em></button>
                ))}
              </div>
            )}
            {items.length > 0 && names.length === 0 && <div className="card">Aucun exercice dans cette catégorie.</div>}
            {names.map((k) => {
              const all = items.filter((i) => i.rub === k), d = all.filter((i) => i.etat === "termine").length;
              return (
                <div className="card sv-rub" key={k}>
                  <div className="sv-h"><h3>{k}</h3><span className="muted">{d} / {all.length} terminé{d > 1 ? "s" : ""}</span></div>
                  <div className="sv-bar" style={{ margin: "0 0 4px" }}><i style={{ width: `${Math.round((100 * d) / all.length)}%` }} /></div>
                  {[...R[k]].sort((a, b) => ord[a.etat] - ord[b.etat]).map((i) => (
                    <div className="sv-row" key={i.id}>
                      <div className="sv-t"><b>{i.titre}</b><span className="tag">{i.type}</span></div>
                      <span className={"sv-st " + i.etat}>{ET[i.etat]}</span>
                      <div className="sv-info">{i.info}</div>
                      <Link className={i.etat === "termine" ? "btn" : "btn primary"} to={i.to}>{i.btn}</Link>
                      {i.scId && bs[i.scId]?.taches && <div className="sv-fil"><TachesBilan taches={bs[i.scId].taches} /></div>}
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
