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

export default function Suivi() {
  const { user, profil, isAdmin, logout, refreshProfil } = useAuth();
  const [list, setList] = useState(null);
  useEffect(() => {
    listScenarios(true, { uid: user?.uid, equipeId: profil?.equipeId }).then(setList).catch(() => setList([]));
  }, [user?.uid, profil?.equipeId]); // eslint-disable-line
  const [recup, setRecup] = useState("");
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
      <div className="row">
        <div className="card grow"><div className="muted">Exercices terminés</div><h2>{st.n} / {(list || []).length}</h2></div>
        <div className="card grow"><div className="muted">Temps moyen</div><h2>{st.n ? fmtDuree(st.tmoy) : "—"}</h2></div>
        <div className="card grow"><div className="muted">Questions essentielles posées</div><h2>{st.ess === null ? "—" : st.ess + " %"}</h2></div>
      </div>
      {!list && <p>Chargement…</p>}
      {(list || []).map((s) => {
        const b = bs[s.id];
        const ec = !b && (enCours(s.id) || Boolean(profil?.encours?.[s.id]));
        return (
          <div className="card row between item" key={s.id}>
            <div>
              <strong>{s.titre}</strong>{" "}
              <span className={b ? "tag ok" : "tag"}>{b ? "Terminé" : ec ? "En cours" : "Non commencé"}</span>
              {b && (
                <div className="muted">
                  {fmtDate(b.fin)} · {fmtDuree(b.duree || 0)} · {b.nbQ} question(s)
                  {b.essTot ? ` · essentielles ${b.essOk}/${b.essTot}` : ""}{b.cubTot ? ` · cubique ${b.cubOk}/${b.cubTot}` : ""}
                  {b.nb > 1 ? ` · ${b.nb} tentatives` : ""}
                </div>
              )}
              {profil?.commentaires?.[s.id] && (
                <div className="card alerte" style={{ margin: "8px 0 0", borderLeftColor: "var(--ok)" }}>
                  <strong>Commentaire du formateur</strong>{" "}
                  <span className="muted">{profil.commentaires[s.id].auteur} · {fmtDate(profil.commentaires[s.id].le)}</span>
                  <div className="pre">{profil.commentaires[s.id].texte}</div>
                </div>
              )}
            </div>
            <Link className={b ? "btn" : "btn primary"} to={`/scenario/${s.id}`}>
              {b ? "Revoir mes réponses" : ec ? "Reprendre" : "Commencer"}
            </Link>
          </div>
        );
      })}
    </Layout>
  );
}
