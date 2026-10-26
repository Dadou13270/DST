import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { getScenario, getPhoto, getSituationPhotos } from "../lib/db";
import { findAnswer } from "../lib/matching";
import { evoList, qaActives, essentielles as essentielles_, nbQuestions } from "../lib/evolutif";
import { SOIEC, MESSAGE_MODELE, uid, CUB, cubStat } from "../lib/model";
import { useAuth } from "../lib/auth";
import { db } from "../firebase";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import Dominantes from "../components/Dominantes";
import Frise from "../components/Frise";
import SalleChat from "../components/SalleChat";
import { posterQuestion, watchSalle } from "../lib/salles";
import { buildBilan, saveBilan } from "../lib/users";
import { applyVars, tirer, varsDe } from "../lib/variantes";

const emptySession = () => ({
  start: null,
  finishedAt: null,
  finished: false,
  evo: {},
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
  b ? { start: b.fin - (b.duree || 0) * 1000, finishedAt: b.fin, finished: true, evoT: b.evos || undefined, vars: b.vars || undefined, log: b.log || [], notes: { ...emptySession().notes, ...b.notes } } : null;
const fmt = (s) => {
  const a = Math.abs(s);
  return `${s < 0 ? "-" : ""}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
};

function SalleBanner({ code }) {
  const [r, setR] = useState(undefined);
  useEffect(() => watchSalle(code, setR), [code]);
  return (
    <>
      <div className="card" style={{ background: "var(--soft)" }}>
        <strong>Séance en salle {code}</strong> — {r && r.ouverte === false ? "séance clôturée par le formateur." : "le formateur voit tes questions en direct."}
      </div>
      <SalleChat code={code} role="stagiaire" />
    </>
  );
}

export default function Player() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const salle = sp.get("salle") || "";
  const key = salle ? `soiec-session-${id}-s${salle}` : `soiec-session-${id}`;
  const [scRaw, setSc] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [sitPhotos, setSitPhotos] = useState([]);
  const [sz, setSz] = useState(-1);
  const [err, setErr] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const { user, profil, isAdmin, refreshProfil } = useAuth();
  const [sess, setSess] = useState(() => {
    const loc = load(key);
    const cl = salle ? null : profil?.encours?.[id];
    // reprise sur un autre appareil : on garde la version la plus récente
    if (cl && (!loc || (cl.maj || 0) > (loc.maj || 0))) return { ...emptySession(), ...cl, finished: false, finishedAt: null };
    return loc || (salle ? null : bilanSession(profil?.bilans?.[id])) || emptySession();
  });
  const sc = useMemo(() => (scRaw ? applyVars(scRaw, sess.vars) : null), [scRaw, sess.vars]);
  const [sugOpen, setSugOpen] = useState(true);
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
        const sp = await getSituationPhotos(id);
        setSitPhotos(sp.length ? sp : s.situation.photos || []); // repli : photos intégrées au scénario (import de seeds)
      } catch (e) {
        setErr("Erreur de chargement : " + e.message);
      }
    })();
  }, [id]);

  const premier = useRef(true);
  useEffect(() => {
    const maj = Date.now();
    save(key, { ...sess, maj });
    if (premier.current) {
      premier.current = false;
      return;
    }
    if (!user || !db || salle) return;
    const t = setTimeout(() => {
      const val =
        !sess.start || sess.finished
          ? deleteField()
          : { start: sess.start, maj, evo: sess.evo || {}, log: sess.log.map((l) => ({ t: l.t ?? null, id: l.id, who: l.who, question: l.question, answer: l.answer, qaId: l.qaId || null, sys: !!l.sys })), notes: sess.notes };
      updateDoc(doc(db, "users", user.uid), { [`encours.${id}`]: val }).catch(() => {});
    }, 2500);
    return () => clearTimeout(t);
  }, [key, sess]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sess.start || sess.finished) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [sess.start, sess.finished]);

  const [alerteId, setAlerteId] = useState(null);
  const alerte = sc?.evolutif && alerteId ? (sc.evolutions || []).find((x) => x.id === alerteId) : null;
  useEffect(() => {
    if (!sc?.evolutif || !sess.start || sess.finished) return;
    const min = (now - sess.start) / 60000;
    const dues = evoList(sc).filter((x) => !(sess.evo || {})[x.id] && min >= (Number(x.delai) || 0));
    if (!dues.length) return;
    setSess((s) => {
      const evo = { ...(s.evo || {}) };
      const log = [...s.log];
      dues.forEach((x) => {
        if (evo[x.id]) return;
        evo[x.id] = Date.now();
        log.push({ t: Math.max(0, Math.round((Date.now() - s.start) / 1000)), id: uid(), who: "__evo", question: "⚠ " + (x.titre || "Évolution de la situation"), answer: x.message || "", sys: true, qaId: null });
      });
      return { ...s, evo, log };
    });
    setAlerteId(dues[dues.length - 1].id);
  }, [now, sc, sess.start, sess.finished]); // eslint-disable-line react-hooks/exhaustive-deps

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
    const qa = findAnswer(text, qaActives(sc, sess), who);
    const answer = qa ? qa.reponse : inter.reponseDefaut || "Je n'ai pas d'information à ce sujet.";
    setSess((s) => ({
      ...s,
      log: [...s.log, { t: Math.max(0, Math.round((Date.now() - s.start) / 1000)), id: uid(), who, question: text, answer, qaId: qa ? qa.id : null }],
    }));
    if (salle) posterQuestion(salle, user.uid, profil?.nom, who, inter.nom, text, answer, qa ? qa.id : null);
    setQ("");
  };

  const poserSuggestion = (x) => {
    if (salle) posterQuestion(salle, user.uid, profil?.nom, who, sc.interlocuteurs.find((i) => i.id === who)?.nom || "", x.intitule, x.reponse, x.id);
    setSess((s) => ({ ...s, log: [...s.log, { t: Math.max(0, Math.round((Date.now() - s.start) / 1000)), id: uid(), who, question: x.intitule, answer: x.reponse, qaId: x.id }] }));
  };
  const suggestions = (() => {
    if (!sc || sc.suggestions === false || !who) return [];
    const asked = new Set(sess.log.map((l) => l.qaId));
    return qaActives(sc, sess).filter((x) => (x.interlocuteurId === who || x.interlocuteurId === "tous") && x.intitule?.trim() && !asked.has(x.id));
  })();

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
          <Dominantes s={sc} />
          {varsDe(scRaw).length > 0 && <p className="muted">Conditions variables : heure, météo, vent… sont tirées au sort à chaque tentative.</p>}
          {sc.evolutif && <p className="muted">Scénario évolutif : la situation changera pendant l'exercice, des informations te seront transmises.</p>}
          <p className="consigne">{sc.situation.consigne}</p>
          {sc.duree > 0 && <p className="muted">Durée conseillée : {sc.duree} min</p>}
          <button className="btn primary big" onClick={() => { const v = tirer(scRaw); setSess({ ...emptySession(), start: Date.now(), ...(Object.keys(v).length ? { vars: v } : {}) }); }}>
            Arriver sur les lieux
          </button>
        </div>
      </Layout>
    );

  /* ---------- Correction ---------- */
  if (sess.finished) {
    const essentielles = essentielles_(sc, sess);
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
          Temps : {fmt(elapsed)} · {nbQuestions(sess)} question(s) posée(s){sc.evolutif && ` · ${Object.keys(sess.evo || {}).length}/${(sc.evolutions || []).length} évolution(s) vue(s)`}{sess.vars && ` · Variante jouée : ${Object.values(sess.vars).join(" · ")}`}
          {saveMsg && <span className="err"> — {saveMsg}</span>}
        </p>
        <Frise sc={sc} sess={sess} interName={interName} />

        {sc.afficherCorrection && essentielles.length > 0 && (
          <div className="card">
            <h3>Questions essentielles</h3>
            <ul className="checks">
              {essentielles.map((x) => (
                <li key={x.id} className={asked.has(x.id) ? "yes" : "no"}>
                  {asked.has(x.id) ? "✓" : "✗"} {x.intitule || x.motsCles}{" "}
                  <span className="muted">({x.interlocuteurId === "tous" ? "tous" : interName(x.interlocuteurId)})</span>
                  {!asked.has(x.id) && x.reponse && (
                    <div className="reponse-oubliee"><strong>Réponse :</strong> {x.reponse}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {sc.afficherCorrection && sc.cubique && (
          <div className="card">
            <h3>Reconnaissance cubique</h3>
            <ul className="checks">
              {cubStat(sc, asked).map((r) =>
                r.q.length ? (
                  <li key={r.c} className={r.ok ? "yes" : "no"}>
                    {r.ok ? "✓" : "✗"} {r.c}. {r.l}
                    {!r.ok && r.q.filter((x) => x.reponse).map((x) => (
                      <div key={x.id} className="reponse-oubliee"><strong>{x.intitule}</strong> {x.reponse}</div>
                    ))}
                  </li>
                ) : (
                  <li key={r.c}>• {r.c}. {r.l} <span className="muted">(à apprécier, voir synthèse)</span></li>
                )
              )}
            </ul>
            {sc.correction.cubique && <p className="pre"><strong>Synthèse attendue</strong>{"\n"}{sc.correction.cubique}</p>}
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
      {salle && <SalleBanner code={salle} />}
      {alerte && (
        <div className="card" style={{ border: "2px solid #c4161c", background: "var(--soft)" }}>
          <strong>⚠ Évolution de la situation{alerte.titre ? ` : ${alerte.titre}` : ""}</strong>
          <p className="pre" style={{ margin: "6px 0" }}>{alerte.message}</p>
          <button className="btn primary" onClick={() => setAlerteId(null)}>Compris</button>
        </div>
      )}
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
          {sitPhotos.length > 0 && (
            <>
              <h3>Sur les lieux</h3>
              <div className="grid" style={{ gridTemplateColumns: sz >= 0 ? "100%" : "repeat(auto-fill,minmax(180px,1fr))" }}>
                {sitPhotos.map((p, i) =>
                  sz >= 0 && sz !== i ? null : (
                    <figure key={p.id || i} style={{ margin: 0 }}>
                      <img
                        className={sz === i ? "photo zoom" : "photo"}
                        style={sz === i ? undefined : { height: 120, objectFit: "cover" }}
                        src={p.data}
                        alt="Situation à l'arrivée"
                        onClick={() => setSz(sz === i ? -1 : i)}
                      />
                      {p.legende && <figcaption className="muted">{p.legende}</figcaption>}
                    </figure>
                  )
                )}
              </div>
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
                {sess.log.map((l) => l.sys ? (
                  <div key={l.id} className="card" style={{ margin: "8px 0", borderColor: "#c4161c" }}>
                    <strong>{l.question}</strong>
                    <div className="pre">{l.answer}</div>
                  </div>
                ) : (
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
              {sc.cubique && (
                <details className="card" style={{ margin: "8px 0" }}>
                  <summary><b>Aide-mémoire : reconnaissance cubique</b></summary>
                  <ol style={{ margin: "6px 0 0 18px" }}>{CUB.map(([c, l]) => <li key={c} value={c}>{l}</li>)}</ol>
                </details>
              )}
              <form className="ask" onSubmit={ask}>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={`Question à ${interName(who)}…`}
                />
                <button className="btn primary">Demander</button>
              </form>
              {sc.suggestions !== false && who && (
                <div style={{ marginTop: 10 }}>
                  <div className="row between">
                    <strong>Questions suggérées à {interName(who)}</strong>
                    <button type="button" className="btn" onClick={() => setSugOpen(!sugOpen)}>{sugOpen ? "Masquer" : "Afficher"}</button>
                  </div>
                  {sugOpen &&
                    (suggestions.length ? (
                      <div className="chips" style={{ marginTop: 6 }}>
                        {suggestions.map((x) => (
                          <button key={x.id} type="button" className="chip" onClick={() => poserSuggestion(x)}>{x.intitule}</button>
                        ))}
                      </div>
                    ) : (
                      <p className="muted" style={{ margin: "6px 0 0" }}>Plus de question suggérée pour cet interlocuteur. Pose tes propres questions.</p>
                    ))}
                </div>
              )}
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
                if (user)
                  saveBilan(user.uid, profil?.bilans, id, buildBilan(sc, fin, profil?.bilans?.[id]))
                    .then(refreshProfil)
                    .catch((e) => setSaveMsg("Ton résultat n'a pas pu être enregistré dans ton suivi (" + (e.code || e.message) + "). L'exercice est bien terminé."));
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
