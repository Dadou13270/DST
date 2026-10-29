import { calcImg } from "../lib/calculImages";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { StagiaireNav } from "./Home";
import { fmtDate, fmtDuree } from "../lib/users";
import { listCalculs, CALC_Q, attendu, corriger, detail, mettreEssai, taOf } from "../lib/calculs";

const fnum = (n) => Number(n).toLocaleString("fr-FR");

export function Memo() {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Fiche mémo · dimensionnement de l'extinction LIF</h3>
      <p><b>Débit solution moussante</b> : Qext = S × TA (TA : 10 l/min/m² non miscible, 20 l/min/m² miscible)</p>
      <p><b>Débit eau total</b> : Qtotal = Qext + Qref. Si Qtotal &gt; débit réseau incendie : GALIM (1 GALIM = 4 000 l/min à 1 000 m).</p>
      <p><b>Volumes d'émulseur</b> : Extinction (t = 40 min) Vext = Qext × C(%) × t · Entretien tapis (10 min/heure) Vetm = Qext × C(%) × 10</p>
      <p>Tapis préventif (sous-cuvette adjacente), F = 7, h = 0,15 m, TA entretien = 0,2 l/min/m² : Vtmp = (S × h × C) / 100 × 1000 · Vetmp = 0,2 × S × C × 10</p>
      <p><b>TOTAL</b> = Vext + Vetm + Vtmp + Vetmp</p>
      <p className="muted" style={{ margin: 0 }}>Même méthode que l'onglet Extinction LIF de TOPIMI (Fiche mémo 1er COS). Vérifie ensuite avec le calculateur.</p>
    </div>
  );
}

export function Donnees({ ex }) {
  return (
    <div className="card">
      <p style={{ marginTop: 0 }}>{ex.contexte}</p>
      <table className="cmp" style={{ minWidth: 0 }}><tbody>
        <tr><th>Surface en feu S</th><td>{ex.S} m²</td><th>Type de LIF</th><td>{ex.miscible ? "Miscible" : "Non miscible"} (TA = {taOf(ex)} l/min/m²)</td></tr>
        <tr><th>Concentration émulseur C</th><td>{ex.C} %</td><th>Débit de refroidissement Qref</th><td>{fnum(ex.Qref)} l/min</td></tr>
        <tr><th>Débit réseau incendie</th><td>{fnum(ex.reseau)} l/min</td><th>Foisonnement F · hauteur tapis h</th><td>{ex.F} · {String(ex.h).replace(".", ",")} m</td></tr>
      </tbody></table>
    </div>
  );
}

export function Comparatif({ ex, essais }) {
  const [a, setA] = useState(Math.max(0, essais.length - 2));
  const [b, setB] = useState(essais.length - 1);
  const att = attendu(ex);
  const A = essais[a], B = essais[b];
  if (!essais.length) return null;
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Mes essais</h3>
      <table className="cmp" style={{ minWidth: 0 }}><thead><tr><th>#</th><th>Date</th><th>Temps</th><th>Score</th></tr></thead>
        <tbody>{essais.map((e, i) => <tr key={i}><td>{i + 1}</td><td>{fmtDate(e.le)}</td><td>{fmtDuree(e.duree || 0)}</td><td>{e.ok}/{e.tot}</td></tr>)}</tbody></table>
      {essais.length > 1 && (
        <>
          <h4>Comparer deux essais</h4>
          <div className="row">
            <select value={a} onChange={(e) => setA(Number(e.target.value))}>{essais.map((_, i) => <option key={i} value={i}>Essai {i + 1}</option>)}</select>
            <span>contre</span>
            <select value={b} onChange={(e) => setB(Number(e.target.value))}>{essais.map((_, i) => <option key={i} value={i}>Essai {i + 1}</option>)}</select>
          </div>
          <table className="cmp" style={{ minWidth: 0, marginTop: 8 }}>
            <thead><tr><th>Question</th><th>Attendu</th><th>Essai {a + 1}</th><th>Essai {b + 1}</th></tr></thead>
            <tbody>{CALC_Q.map(([k, l, u]) => {
              const ra = corriger(ex, A.rep).res[k], rb = corriger(ex, B.rep).res[k];
              return <tr key={k}><td>{l}</td><td>{fnum(att[k])} {u}</td>
                <td>{A.rep[k] === "" || A.rep[k] == null ? "—" : fnum(A.rep[k])} {ra ? "✓" : "✗"}</td>
                <td>{B.rep[k] === "" || B.rep[k] == null ? "—" : fnum(B.rep[k])} {rb ? "✓" : "✗"}</td></tr>;
            })}</tbody>
          </table>
        </>
      )}
    </div>
  );
}

export function CalculExercice() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, profil, refreshProfil } = useAuth();
  const [exs, setExs] = useState(null);
  useEffect(() => { listCalculs(true).then(setExs).catch(() => setExs([])); }, []);
  const ex = (exs || []).find((x) => x.id === id);
  const [rep, setRep] = useState({});
  const [tab, setTab] = useState("ex");
  const [t0] = useState(Date.now());
  const [fait, setFait] = useState(null);
  const [err, setErr] = useState("");
  if (!exs) return <Layout><StagiaireNav /><p>Chargement…</p></Layout>;
  if (!ex) return <Layout><StagiaireNav /><p>Exercice introuvable.</p></Layout>;
  const essais = (profil?.calculs || {})[ex.id] || [];
  const valider = async () => {
    setErr("");
    const r = corriger(ex, rep);
    const essai = { le: Date.now(), duree: Math.round((Date.now() - t0) / 1000), rep: Object.fromEntries(CALC_Q.map(([k]) => [k, rep[k] ?? ""])), ok: r.ok, tot: r.tot };
    try {
      await updateDoc(doc(db, "users", user.uid), { calculs: mettreEssai(profil?.calculs, ex.id, essai) });
      await refreshProfil();
      setFait(essai);
    } catch (e) { setErr(e.message); }
  };
  const att = attendu(ex), det = detail(ex), cor = fait ? corriger(ex, fait.rep) : null;
  return (
    <Layout>
      <StagiaireNav />
      <div className="row between"><h1>{ex.titre}</h1><Link to="/scenarios"><button className="btn">Retour</button></Link></div>
      {calcImg(ex) && <img src={calcImg(ex)} alt="Illustration de l'exercice" style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 10, marginBottom: 12 }} />}
      <div className="tabs" style={{ marginBottom: 12 }}>
        <button className={tab === "ex" ? "on" : ""} onClick={() => setTab("ex")}>Exercice</button>
        <button className={tab === "memo" ? "on" : ""} onClick={() => setTab("memo")}>Fiche mémo</button>
      </div>
      {tab === "memo" ? <Memo /> : (
        <>
          <Donnees ex={ex} />
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Tes résultats</h3>
            <table className="cmp" style={{ minWidth: 0 }}>
              <thead><tr><th>Question</th><th>Ta réponse</th>{cor && <><th>Attendu</th><th></th></>}</tr></thead>
              <tbody>{CALC_Q.map(([k, l, u]) => (
                <tr key={k}>
                  <td>{l}<div className="muted" style={{ fontSize: ".8rem" }}>{u}</div></td>
                  <td><input type="number" inputMode="decimal" disabled={!!fait} value={rep[k] ?? ""} onChange={(e) => setRep({ ...rep, [k]: e.target.value })} style={{ width: 110 }} /></td>
                  {cor && <><td><b>{fnum(att[k])}</b><div className="muted" style={{ fontSize: ".8rem" }}>{det[k]}</div></td><td>{cor.res[k] ? "✓" : "✗"}</td></>}
                </tr>))}</tbody>
            </table>
            {!fait && <p><button className="btn pri" onClick={valider}>Valider et enregistrer mes résultats</button> {err && <span className="err">{err}</span>}</p>}
            {fait && <p><b>Score : {cor.ok}/{cor.tot}</b> — résultats enregistrés. <button className="btn" onClick={() => { setRep({}); setFait(null); nav(0); }}>Refaire cet exercice</button></p>}
          </div>
        </>
      )}
      {essais.length > 0 && <Comparatif ex={ex} essais={essais} />}
    </Layout>
  );
}
