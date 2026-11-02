import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { qlCreer, qlQuestions, QL_DUREES } from "../quizlive/quizlive";
import { adaptateursQuizLive } from "../lib/quizLiveDb";

const lsGet = () => { try { return JSON.parse(localStorage.getItem("ql-mes") || "[]"); } catch { return []; } };
const lsAdd = (x) => { try { localStorage.setItem("ql-mes", JSON.stringify([x, ...lsGet().filter((y) => y.code !== x.code)].slice(0, 5))); } catch { /* sans stockage */ } };

// Carte « Quiz en direct » (onglet Séance en salle de l'espace gestionnaire)
export default function QuizLiveCard({ quizs }) {
  const { user, profil } = useAuth();
  const nav = useNavigate();
  const util = quizs.filter((q) => q.format !== "cartes" && qlQuestions(q).length > 0);
  const [id, setId] = useState("");
  const [dur, setDur] = useState(20);
  const [melange, setMelange] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const cur = util.find((q) => q.id === id) || util[0];
  const ouvrir = async () => {
    if (!cur) return;
    setErr(""); setBusy(true);
    try {
      const code = await qlCreer(adaptateursQuizLive({ uid: user.uid, nom: profil?.nom }), cur, { dur, melange });
      lsAdd({ code, titre: cur.titre || "Quiz" });
      nav(`/gestion/quiz-live/${code}`);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Quiz en direct</h3>
      <p className="muted">Tous répondent à la même question en même temps, sur leur téléphone, avec un classement à l'écran. Les stagiaires saisissent le code dans « Séance en salle » ou scannent le QR code.</p>
      {util.length === 0 ? <p className="muted">Aucun QCM ou quiz publié utilisable (choix unique, choix multiple ou vrai / faux).</p> : (
        <>
          <div className="row item">
            <select className="grow" value={cur?.id || ""} onChange={(e) => setId(e.target.value)} aria-label="Quiz ou QCM">
              {util.map((q) => <option key={q.id} value={q.id}>{q.titre} · {q.format === "quiz" ? "Quiz" : "QCM"} · {qlQuestions(q).length} question(s)</option>)}
            </select>
          </div>
          <div className="row item">
            <label>Temps par question <select value={dur} onChange={(e) => setDur(Number(e.target.value))}>{QL_DUREES.map((s) => <option key={s} value={s}>{s} s</option>)}</select></label>
            <label><input type="checkbox" checked={melange} onChange={(e) => setMelange(e.target.checked)} /> Mélanger les questions</label>
            <button className="btn primary" disabled={busy} onClick={ouvrir}>Ouvrir le quiz en direct</button>
          </div>
        </>
      )}
      {err && <p className="err">{err}</p>}
      {lsGet().length > 0 && <p className="muted" style={{ marginBottom: 0 }}>Reprendre : {lsGet().map((x) => <Link key={x.code} className="btn" style={{ marginRight: 6 }} to={`/gestion/quiz-live/${x.code}`}>{x.code} · {x.titre}</Link>)}</p>}
    </div>
  );
}
