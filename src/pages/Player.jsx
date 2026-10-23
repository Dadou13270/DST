import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { getScenario, getPhoto } from "../lib/db";
import { findAnswer } from "../lib/matching";
import { SOIEC, MESSAGE_MODELE, uid } from "../lib/model";
import { useAuth } from "../lib/auth";
import { buildBilan, saveBilan } from "../lib/users";

const emptySession = () => ({
  start: null,
  finishedAt: null,
  finished: false,
  log: [],
  notes: { S: "", O: "", I: "", E: "", C: "", message: "" },
});
const load = (k) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* stockage indisponible */
  }
};
const bilanSession = (b) =>
  b ? { start: b.fin - (b.duree || 0) * 1000, finishedAt: b.fin, finished: true, log: b.log || [], notes: { ...emptySession().notes, ...b.notes } } : null;
const fmt = (s) => {
  const a = Math.abs(s);
  return `${s < 0 ? "-" : ""}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
};

export default function Player() {
  const { id } = useParams();
  const key = `soiec-session-${id}`;
  const [sc, setSc] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [err, setErr] = useState("");
  const { user, profil, isAdmin, refreshProfil } = useAuth();
  const [sess, setSess] = useState(() => load(key) || bilanSession(profil?.bilans?.[id]) || emptySession());
  const [tab, setTab] = useState("questions");
  const [who, setWho] = useState(null);
  const [q, setQ] = useState("");
  const [now, setNow] = useState(Date.now());
  const [zoom, setZoom] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await getScenario(id);
        if (!s) return setErr("Scénario introuvable ou non publié.");
        setSc(s);
        setWho(s.interlocuteurs[0]?.id || null);
        setPhoto(await getPhoto(id));
      } catch (e) {
        setErr("Erreur de chargement : " + e.message);
      }
    })();
  }, [id]);

  useEffect(() => save(key, sess), [key, sess]);

  useEffect(() => {
    if (!sess.start || sess.finished) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [sess.start, sess.finished]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [sess.log.length, tab]);

  if (err)
    return (
      <Layout right={<Link to="/">Retour</Link>}>
        <div className="card warn">{err}</div>
      </Layout>
    );
  if (!sc)
    return (
      <Layout>
        <p>Chargement…</p>
      </Layout>
    );

  const interName = (iid) => sc.interlocuteurs.find((i) => i.id === iid)?.nom || "?";
  const setNote = (k, v) => setSess((s) => ({ ...s, notes: { ...s.notes, [k]: v } }));
  const elapsed = sess.start ? Math.floor(((sess.finishedAt || now) - sess.start) / 1000) : 0;
  const remaining = sc.duree > 0 ? sc.duree * 60 - elapsed : null;

  const ask = (e) => {
    e.preventDefault();
    const text = q.trim();
    if (!text || !who) return;
    const inter = sc.interlocuteurs.find((i) => i.id === who);
    const qa = findAnswer(text, sc.qa, who);
    const answer = qa ? qa.reponse : inter.reponseDefaut || "Je n'ai pas d'information à ce sujet.";
    setSess((s) => ({
      ...s,
      log: [...s.log, { id: uid(), who, question: text, answer, qaId: qa ? qa.id : null }],
    }));
    setQ("");
  };

  const restart = () => {
    if (window.confirm("Recommencer l'exercice à zéro ?")) setSess(emptySession());
  };

  /* ---------- Introduction ---------- */
  if (!sess.start)
    return (
      <Layout right={<Link to="/">Retour</Link>}>
        <div className="card intro">
          <h1>{sc.titre}</h1>
          <p>{sc.description}</p>
          <p className="consigne">{sc.situation.consigne}</p>
          {sc.duree > 0 && <p className="muted">Durée conseillée : {sc.duree} min</p>}
          <button className="btn primary big" onClick={() => setSess({ ...emptySession(), start: Date.now() })}>
            Arriver sur les lieux
          </button>
        </div>
      </Layout>
    );

  /* ---------- Correction ---------- */
  if (sess.finished) {
    const essentielles = sc.qa.filter((x) => x.essentielle);
    const asked = new Set(sess.log.map((l) => l.qaId));
    const rows = [...SOIEC.map((r) => ({ label: `${r.k} – ${r.titre}`, mine: sess.notes[r.k], ref: sc.correction[r.k] })),
      { label: "Message", mine: sess.notes.message, ref: sc.correction.message }];
    return (
      <Layout wide right={<Link to="/">Scénarios</Link>}>
        <div className="row between">
          <h1>Bilan : {sc.titre}</h1>
          <div className="row">
            <button className="btn" onClick={() => window.print()}>Imprimer</button>
            <button className="btn" onClick={restart}>Recommencer</button>
          </div>
        </div>
        <p className="muted">
          Temps : {fmt(elapsed)} · {sess.log.length} question(s) posée(s)
        </p>

        {sc.afficherCorrection && essentielles.length > 0 && (
          <div className="card">
            <h3>Questions essentielles</h3>
            <ul className="checks">
              {essentielles.map((x) => (
                <li key={x.id} className={asked.has(x.id) ? "yes" : "no"}>
                  {asked.has(x.id) ? "✓" : "✗"} {x.intitule || x.motsCles}{" "}
                  <span className="muted">({x.interlocuteurId === "tous" ? "tous" : interName(x.interlocuteurId)})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card">
          <table className="cmp">
            <thead>
              <tr>
                <th></th>
                <th>Ta réponse</th>
                {sc.afficherCorrection && <th>Correction</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th>{r.label}</th>
                  <td>{r.mine || <em className="muted">—</em>}</td>
                  {sc.afficherCorrection && <td>{r.ref || <em className="muted">—</em>}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sc.afficherCorrection && sc.correction.commentaire && (
          <div className="card">
            <h3>Commentaire du formateur</h3>
            <p className="pre">{sc.correction.commentaire}</p>
          </div>
        )}
        {!sc.afficherCorrection && <p className="muted">La correction sera donnée par le formateur.</p>}
      </Layout>
    );
  }

  /* ---------- Exercice ---------- */
  return (
    <Layout
      extra={
        <>
          {remaining !== null && <span className={remaining < 0 ? "timer late" : "timer"}>{fmt(remaining)}</span>}
          {remaining === null && <span className="timer">{fmt(elapsed)}</span>}
          <Link to="/" className="navbtn">Quitter</Link>
        </>
      }
    >
      <div className="play">
        <section className="left card">
          <h2>{sc.titre}</h2>
          {photo ? (
            <img className={zoom ? "photo zoom" : "photo"} src={photo} alt="Situation" onClick={() => setZoom(!zoom)} />
          ) : (
            <div className="ph tall">Pas de photo</div>
          )}
          {sc.situation.contexte && (
            <>
              <h3>Situation initiale</h3>
              <p className="pre">{sc.situation.contexte}</p>
            </>
          )}
          <p className="consigne">{sc.situation.consigne}</p>
        </section>

        <section className="right card">
          <div className="tabs">
            {[["questions", "Questions"], ["soiec", "SOIEC"], ["message", "Message"]].map(([k, l]) => (
              <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
                {l}
              </button>
            ))}
          </div>

          {tab === "questions" && (
            <div className="chatbox">
              <div className="chips">
                {sc.interlocuteurs.map((i) => (
                  <button key={i.id} className={who === i.id ? "chip on" : "chip"} onClick={() => setWho(i.id)} title={i.role}>
                    {i.nom}
                  </button>
                ))}
              </div>
              <div className="chat" ref={chatRef}>
                {sess.log.length === 0 && (
                  <p className="muted">Choisis un interlocuteur, puis pose ta question (requérant, témoin, badaud…).</p>
                )}
                {sess.log.map((l) => (
                  <div key={l.id}>
                    <div className="bubble me">
                      <small>Vous → {interName(l.who)}</small>
                      {l.question}
                    </div>
                    <div className="bubble them">
                      <small>{interName(l.who)}</small>
                      {l.answer}
                    </div>
                  </div>
                ))}
              </div>
              <form className="ask" onSubmit={ask}>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={`Question à ${interName(who)}…`}
                />
                <button className="btn primary">Demander</button>
              </form>
            </div>
          )}

          {tab === "soiec" && (
            <div className="notes">
              {SOIEC.map((r) => (
                <div key={r.k} className="note">
                  <label>
                    <b>{r.k}</b> {r.titre} <small className="muted">{r.aide}</small>
                  </label>
                  <textarea rows={3} value={sess.notes[r.k]} onChange={(e) => setNote(r.k, e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {tab === "message" && (
            <div className="notes">
              <label>
                <b>Message d'ambiance / de renseignements</b>
              </label>
              <textarea rows={12} value={sess.notes.message} onChange={(e) => setNote("message", e.target.value)} />
              {!sess.notes.message && (
                <button className="btn" onClick={() => setNote("message", MESSAGE_MODELE)}>
                  Insérer une trame
                </button>
              )}
            </div>
          )}

          <div className="row end">
            <button
              className="btn primary"
              onClick={() => {
                if (!window.confirm("Terminer l'exercice ?")) return;
                const fin = { ...sess, finished: true, finishedAt: Date.now() };
                setSess(fin);
                if (user && !isAdmin)
                  saveBilan(user.uid, profil?.bilans, id, buildBilan(sc, fin, profil?.bilans?.[id]))
                    .then(refreshProfil)
                    .catch((e) => setErr("Résultat non enregistré : " + e.message));
              }}
            >
              Terminer l'exercice
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
