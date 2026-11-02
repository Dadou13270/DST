import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { StagiaireNav } from "./Home";
import { blancs, bonneReponse, listMesQuiz, listQuiz, noterQuestion, noterQuiz, TYPES_Q } from "../lib/quiz";
import { ajouterXp, ptsExercice, annonceXp } from "../lib/xp";
import { mettreEssai } from "../lib/calculs";

const mel = (a) => [...a].map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// Saisie d'une réponse selon le type de question. fige = correction affichée (plus de modification).
function Saisie({ q, rep, set, fige }) {
  if (q.type === "unique" || q.type === "multiple")
    return (
      <div className="rel-choix">
        {q.ordreAff.map((k) => {
          const c = q.choix[k]; const sel = q.type === "multiple" ? (rep || []).includes(k) : rep === k;
          const cls = fige ? (c.ok ? "btn pri" : sel ? "btn dng" : "btn") : sel ? "btn pri" : "btn";
          const clic = () => (q.type === "multiple" ? set(sel ? (rep || []).filter((x) => x !== k) : [...(rep || []), k]) : set(k));
          return <button key={k} className={cls + " rel-ch"} disabled={fige} aria-pressed={sel} onClick={clic}>{q.type === "multiple" ? (sel ? "☑ " : "☐ ") : sel ? "◉ " : "○ "}{c.t}</button>;
        })}
      </div>
    );
  if (q.type === "vf")
    return (
      <div className="row">
        {[[true, "Vrai"], [false, "Faux"]].map(([v, l]) => <button key={l} className={(fige ? (q.vf === v ? "btn pri" : rep === v ? "btn dng" : "btn") : rep === v ? "btn pri" : "btn") + " rel-ch"} disabled={fige} onClick={() => set(v)}>{l}</button>)}
      </div>
    );
  if (q.type === "libre") return <input value={rep || ""} disabled={fige} onChange={(e) => set(e.target.value)} placeholder="Ta réponse" autoComplete="off" />;
  if (q.type === "ordre") {
    const choisis = rep || [];
    return (
      <>
        <p className="muted" style={{ margin: "0 0 6px" }}>Touche les éléments dans l'ordre : le premier en haut de ta liste est le premier de la séquence.</p>
        <ol style={{ margin: "0 0 8px", paddingLeft: 22 }}>
          {choisis.map((k, n) => <li key={n}><b>{q.items[k]}</b></li>)}
          {choisis.length === 0 && <li className="muted" style={{ listStyle: "none", marginLeft: -22 }}>Ta liste est vide.</li>}
        </ol>
        {!fige && (
          <div className="rel-choix">
            {q.ordreAff.filter((k) => !choisis.includes(k)).map((k) => <button key={k} className="btn rel-ch" onClick={() => set([...choisis, k])}>{q.items[k]}</button>)}
          </div>
        )}
        {!fige && choisis.length > 0 && <div className="row" style={{ marginTop: 8 }}><button className="btn" onClick={() => set(choisis.slice(0, -1))}>↶ Retirer le dernier</button><button className="btn" onClick={() => set([])}>Tout effacer</button></div>}
      </>
    );
  }
  if (q.type === "assoc") {
    const r = rep || [];
    return (
      <div>
        <p className="muted" style={{ margin: "0 0 6px" }}>Associe chaque élément de gauche à sa correspondance.</p>
        {q.paires.map((p, k) => (
          <div className="row" key={k} style={{ margin: "6px 0", alignItems: "center" }}>
            <b className="grow" style={{ minWidth: 120 }}>{p.g}</b><span aria-hidden="true">→</span>
            <select className="grow" aria-label={`Correspondance de ${p.g}`} disabled={fige} value={r[k] ?? ""}
              onChange={(e) => { const n = q.paires.map((_, j) => r[j] ?? ""); n[k] = e.target.value === "" ? "" : Number(e.target.value); set(n); }}>
              <option value="">— Choisir —</option>
              {q.ordreAff.map((j) => <option key={j} value={j}>{q.paires[j].d}</option>)}
            </select>
          </div>
        ))}
      </div>
    );
  }
  if (q.type === "trous") {
    const { textes } = blancs(q.texte); const r = rep || [];
    return (
      <p style={{ lineHeight: 2.2 }}>
        {textes.map((tx, i) => (
          <span key={i}>{tx}{i < textes.length - 1 && <input style={{ width: 130, display: "inline-block", margin: "0 4px" }} aria-label={`Trou ${i + 1}`} value={r[i] || ""} disabled={fige} autoComplete="off"
            onChange={(e) => { const n = textes.slice(0, -1).map((_, j) => r[j] || ""); n[i] = e.target.value; set(n); }} />}</span>
        ))}
      </p>
    );
  }
  return null;
}

const reponseVide = (q, rep) => (q.type === "multiple" ? !(rep || []).length : q.type === "libre" ? !(rep || "").trim() : q.type === "ordre" ? (rep || []).length < (q.items || []).length : q.type === "assoc" ? q.paires.some((_, k) => (rep || [])[k] === undefined || (rep || [])[k] === "") : q.type === "trous" ? !(rep || []).some((x) => (x || "").trim()) : rep === undefined || rep === null);

// Lecteur de quiz / QCM / examen blanc.
// correction « immediate » : validation question par question ; « fin » (examen) : navigation libre, chronomètre, correction à la fin.
function QuizJeuClassique({ ex, onFini, apercu }) {
  const enFin = ex.format === "examen" || ex.correction === "fin";
  const qs = useMemo(() => (ex.melange ? mel(ex.questions) : ex.questions).map((q) => ({
    ...q,
    ordreAff: q.choix ? (ex.melange ? mel(q.choix.map((_, i) => i)) : q.choix.map((_, i) => i)) : null,
    ...(q.type === "ordre" ? { ordreAff: mel(q.items.map((_, i) => i)) } : {}),
    ...(q.type === "assoc" ? { ordreAff: mel(q.paires.map((_, i) => i)) } : {}),
  })), [ex]);
  const [i, setI] = useState(0);
  const [reps, setReps] = useState({});
  const [valide, setValide] = useState(false);
  const [fini, setFini] = useState(false);
  const [t0] = useState(Date.now());
  const [reste, setReste] = useState(ex.duree > 0 ? ex.duree * 60 : null);
  const termine = useRef(false);
  const q = qs[i];
  const rep = reps[q?.id];
  const set = (v) => { if (!valide && !fini) setReps((r) => ({ ...r, [q.id]: v })); };
  const terminer = () => {
    if (termine.current) return; termine.current = true;
    const res = noterQuiz({ ...ex, questions: qs }, reps);
    setFini(true);
    onFini && onFini(res, Math.round((Date.now() - t0) / 1000), reps);
  };
  useEffect(() => {
    if (!enFin || reste === null || fini) return;
    if (reste <= 0) { terminer(); return; }
    const t = setTimeout(() => setReste((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [reste, fini]); // eslint-disable-line
  const suite = () => { if (i + 1 < qs.length) { setI(i + 1); setValide(false); } else terminer(); };
  const nonRep = qs.filter((x) => reponseVide(x, reps[x.id])).length;
  if (fini) {
    const res = noterQuiz({ ...ex, questions: qs }, reps);
    return (
      <>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{res.reussi ? "Bravo, objectif atteint" : "À revoir"}</h2>
          <div className="rel-scores">
            <div className="g"><b>{res.ok}/{res.tot}</b><span>points</span></div>
            <div><b>{res.pct} %</b><span>réussite (seuil {ex.seuil ?? 70} %)</span></div>
          </div>
          {Object.keys(res.themes).length > 0 && (
            <>
              <h3>Résultat par thème</h3>
              {Object.entries(res.themes).map(([th, v]) => { const p = Math.round((v.ok / v.tot) * 100); return (
                <div className="cp-bar" key={th}><span>{th}</span><div><i style={{ width: p + "%", background: p >= (ex.seuil ?? 70) ? "var(--ok)" : p >= 40 ? "#e08a00" : "var(--red)" }} /></div><b>{v.ok}/{v.tot}</b></div>
              ); })}
              <p className="muted">À revoir en priorité : {Object.entries(res.themes).filter(([, v]) => v.ok / v.tot < (ex.seuil ?? 70) / 100).map(([th]) => th).join(", ") || "rien : tous les thèmes sont maîtrisés"}.</p>
            </>
          )}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Correction</h3>
          {qs.map((qq, n) => (
            <div key={qq.id} style={{ borderTop: n ? "1px solid var(--line)" : 0, padding: "8px 0" }}>
              <strong>{n + 1}. {qq.q}</strong> <span className={res.detail[n].bon ? "tag ok" : "tag bad"}>{res.detail[n].bon ? "Juste" : reponseVide(qq, reps[qq.id]) ? "Sans réponse" : "Faux"}</span>
              <div className="muted">Bonne réponse : {bonneReponse(qq)}</div>
              {qq.expl && <div className="pre">{qq.expl}</div>}
            </div>
          ))}
        </div>
        <button className="btn pri" onClick={() => { if (apercu) apercu(); }}>Refaire</button>
      </>
    );
  }
  const bon = valide && noterQuestion(q, rep);
  return (
    <div className="card">
      <div className="row between">
        <span className="muted">Question {i + 1} sur {qs.length} · {TYPES_Q[q.type]}{q.theme ? ` · ${q.theme}` : ""}</span>
        <span className="row">{reste !== null && <span className={"timer" + (reste < 60 ? " danger" : reste < 180 ? " warn" : "")} aria-label="Temps restant">⏱ {mmss(Math.max(reste, 0))}</span>}<span className="tag">{q.pts || 1} pt{(q.pts || 1) > 1 ? "s" : ""}</span></span>
      </div>
      <div className="sv-bar"><i style={{ width: (i / qs.length) * 100 + "%" }} /></div>
      {i === 0 && ex.consigne && <p className="muted" style={{ marginTop: 8 }}>{ex.consigne}</p>}
      <h3 style={{ margin: "12px 0" }}>{q.q}</h3>
      {q.image && <img src={q.image} alt="" style={{ maxWidth: "100%", maxHeight: 360, borderRadius: 8, display: "block", margin: "0 0 12px" }} />}
      <Saisie q={q} rep={rep} set={set} fige={valide} />
      {valide && (
        <div className="rel-bulle" role="status">
          <strong>{bon ? "Bonne réponse" : "Réponse incorrecte"}</strong>
          {!bon && <div className="muted">Bonne réponse : {bonneReponse(q)}</div>}
          {q.expl && <div className="pre" style={{ marginTop: 4 }}>{q.expl}</div>}
        </div>
      )}
      <div className="row" style={{ marginTop: 12, justifyContent: "space-between" }}>
        {enFin ? (
          <>
            <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>← Précédente</button>
            {i + 1 < qs.length
              ? <button className="btn pri" onClick={() => setI(i + 1)}>Suivante →</button>
              : <button className="btn pri" onClick={() => { if (!nonRep || window.confirm(`${nonRep} question(s) sans réponse. Terminer quand même ?`)) terminer(); }}>Terminer l'examen</button>}
          </>
        ) : (
          <>
            <span />
            {!valide ? <button className="btn pri" disabled={reponseVide(q, rep)} onClick={() => setValide(true)}>Valider</button> : <button className="btn pri" onClick={suite}>{i + 1 < qs.length ? "Question suivante" : "Voir le résultat"}</button>}
          </>
        )}
      </div>
      {enFin && <p className="muted" style={{ margin: "8px 0 0" }}>{nonRep ? `${nonRep} question(s) sans réponse.` : "Toutes les questions ont une réponse."} La correction est donnée à la fin.</p>}
    </div>
  );
}

// Flashcards : on retourne la carte puis « Je savais » (retirée) ou « À revoir » (remise en fin de paquet).
// Score : cartes sues dès le premier passage.
function CartesJeu({ ex, onFini, apercu }) {
  const cartes = useMemo(() => (ex.melange ? mel(ex.questions) : ex.questions), [ex]);
  const [file, setFile] = useState(() => cartes.map((_, n) => n));
  const [retourne, setRetourne] = useState(false);
  const [reps, setReps] = useState({}); // id -> true (sue du premier coup) / false
  const [t0] = useState(Date.now());
  const [fini, setFini] = useState(false);
  const c = cartes[file[0]];
  const repondre = (sue) => {
    const prem = reps[c.id] === undefined;
    const r = prem ? { ...reps, [c.id]: sue } : reps;
    setReps(r); setRetourne(false);
    const f = file.slice(1);
    if (!sue) f.push(file[0]);
    setFile(f);
    if (!f.length) { setFini(true); onFini && onFini(noterQuiz({ ...ex, questions: cartes }, r), Math.round((Date.now() - t0) / 1000), r); }
  };
  if (fini) {
    const res = noterQuiz({ ...ex, questions: cartes }, reps);
    const revoir = cartes.filter((x) => reps[x.id] === false);
    return (
      <>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{res.pct === 100 ? "Paquet maîtrisé" : "Paquet terminé"}</h2>
          <div className="rel-scores"><div className="g"><b>{res.ok}/{res.tot}</b><span>cartes sues du premier coup</span></div><div><b>{res.pct} %</b><span>réussite</span></div></div>
          {Object.keys(res.themes).length > 0 && Object.entries(res.themes).map(([th, v]) => { const p = Math.round((v.ok / v.tot) * 100); return (
            <div className="cp-bar" key={th}><span>{th}</span><div><i style={{ width: p + "%", background: p >= (ex.seuil ?? 70) ? "var(--ok)" : p >= 40 ? "#e08a00" : "var(--red)" }} /></div><b>{v.ok}/{v.tot}</b></div>
          ); })}
        </div>
        {revoir.length > 0 && (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>À revoir ({revoir.length})</h3>
            {revoir.map((x, n) => <div key={x.id} style={{ borderTop: n ? "1px solid var(--line)" : 0, padding: "8px 0" }}><strong>{x.q}</strong><div className="muted">{x.r}</div></div>)}
          </div>
        )}
        <button className="btn pri" onClick={() => apercu && apercu()}>Refaire le paquet</button>
      </>
    );
  }
  const fait = cartes.length - new Set(file).size;
  return (
    <div className="card">
      <div className="row between"><span className="muted">Carte {Math.min(fait + 1, cartes.length)} sur {cartes.length}{c.theme ? ` · ${c.theme}` : ""}</span><span className="muted">{file.length} à passer</span></div>
      <div className="sv-bar"><i style={{ width: (fait / cartes.length) * 100 + "%" }} /></div>
      {fait === 0 && reps[c.id] === undefined && ex.consigne && <p className="muted" style={{ marginTop: 8 }}>{ex.consigne}</p>}
      <button className={"fc" + (retourne ? " retourne" : "")} onClick={() => setRetourne((v) => !v)} aria-label={retourne ? "Voir le recto" : "Retourner la carte"}>
        <span className="fc-in">
          <span className="fc-face"><small>Question</small><b>{c.q}</b>{c.image && <img src={c.image} alt="" />}<em>Touche pour retourner</em></span>
          <span className="fc-face fc-verso"><small>Réponse</small><b>{c.r}</b>{c.expl && <span className="muted">{c.expl}</span>}</span>
        </span>
      </button>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn grow" disabled={!retourne} onClick={() => repondre(false)}>✗ À revoir</button>
        <button className="btn pri grow" disabled={!retourne} onClick={() => repondre(true)}>✓ Je savais</button>
      </div>
    </div>
  );
}

export function QuizJeu(props) {
  return props.ex.format === "cartes" ? <CartesJeu {...props} /> : <QuizJeuClassique {...props} />;
}

export default function Quiz() {
  const { id } = useParams();
  const { user, profil, refreshProfil, isAdmin } = useAuth();
  const [exs, setExs] = useState(null);
  const [msg, setMsg] = useState("");
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!user) return;
    Promise.all([listQuiz(isAdmin).catch(() => []), isAdmin ? [] : listMesQuiz(user.uid).catch(() => [])]) // un gestionnaire teste aussi ses brouillons
      .then(([a, b]) => setExs([...a, ...b.filter((x) => !a.some((y) => y.id === x.id))])).catch(() => setExs([]));
  }, [isAdmin, user?.uid]); // eslint-disable-line
  const ex = (exs || []).find((x) => x.id === id);
  if (!exs) return <Layout><StagiaireNav /><p>Chargement…</p></Layout>;
  if (!ex) return <Layout><StagiaireNav /><p>Exercice introuvable.</p></Layout>;
  const fini = async (res, duree) => {
    try {
      const essai = { le: Date.now(), duree, ok: res.ok, tot: res.tot, quiz: { pct: res.pct, reussi: res.reussi, ...(Object.keys(res.themes).length ? { themes: res.themes } : {}) } };
      const g = ajouterXp(profil?.xp, "ex_" + ex.id, ptsExercice(essai.ok, essai.tot));
      await updateDoc(doc(db, "users", user.uid), { calculs: mettreEssai(profil?.calculs, ex.id, essai), xp: g.xp });
      annonceXp(g.gain);
      await refreshProfil();
      setMsg("Résultat enregistré.");
    } catch (e) { setMsg("Erreur d'enregistrement : " + e.message); }
  };
  return (
    <Layout>
      <StagiaireNav />
      <div className="row between"><h1>{ex.titre}</h1><Link to="/scenarios"><button className="btn">Retour</button></Link></div>
      {ex.description && <p className="muted">{ex.description}</p>}
      {msg && <p className="muted">{msg}</p>}
      <QuizJeu key={k} ex={ex} onFini={fini} apercu={() => { setK(k + 1); setMsg(""); }} />
    </Layout>
  );
}
