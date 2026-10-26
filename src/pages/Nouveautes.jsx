import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { watchNouveautes, addNouveaute, updateNouveaute, deleteNouveaute, NOUVEAUTES_INIT } from "../lib/nouveautes";

const fmt = (d) => (d || "").split("-").reverse().join("/");
const vide = () => ({ id: null, d: new Date().toISOString().slice(0, 10), t: "", l: "" });

export default function Nouveautes() {
  const { isAdmin } = useAuth() || {};
  const [list, setList] = useState(null);
  const [ed, setEd] = useState(null);
  const [conf, setConf] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => watchNouveautes(setList), []);

  const save = async () => {
    if (!ed.d || !ed.t.trim()) return setErr("Date et titre obligatoires.");
    const n = { d: ed.d, t: ed.t.trim(), l: ed.l.split("\n").map((x) => x.trim()).filter(Boolean) };
    try {
      if (ed.id) await updateNouveaute(ed.id, n); else await addNouveaute(n);
      setEd(null); setErr("");
    } catch (e) { setErr(e.message); }
  };
  const del = async (id) => {
    try { await deleteNouveaute(id); setConf(null); } catch (e) { setErr(e.message); }
  };
  const charger = async () => {
    for (const n of [...NOUVEAUTES_INIT].reverse()) await addNouveaute(n);
  };

  const form = (
    ed && (
      <div className="card form span">
        <h3 style={{ marginTop: 0 }}>{ed.id ? "Modifier la nouveauté" : "Nouvelle nouveauté"}</h3>
        <label>Date</label>
        <input type="date" value={ed.d} onChange={(e) => setEd({ ...ed, d: e.target.value })} />
        <label>Titre</label>
        <input maxLength={120} value={ed.t} onChange={(e) => setEd({ ...ed, t: e.target.value })} />
        <label>Contenu (une ligne = une puce)</label>
        <textarea rows={6} maxLength={2000} value={ed.l} onChange={(e) => setEd({ ...ed, l: e.target.value })} />
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn pri" onClick={save}>Enregistrer</button>
          <button className="btn" onClick={() => setEd(null)}>Annuler</button>
        </div>
      </div>
    )
  );

  return (
    <Layout>
      <div className="pgrid">
      <div className="row between">
        <h1>Nouveautés</h1>
        {isAdmin && !ed && <button className="btn pri" onClick={() => setEd(vide())}>+ Ajouter</button>}
      </div>
      <p className="muted">Les évolutions de l'application, de la plus récente à la plus ancienne.</p>
      {err && <div className="card warn">{err}</div>}
      {ed && !ed.id && form}
      {list && list.length === 0 && (
        <div className="card">
          Aucune nouveauté pour le moment.
          {isAdmin && <> <button className="btn" onClick={charger}>Charger l'historique</button></>}
        </div>
      )}
      {(list || []).map((n) =>
        ed && ed.id === n.id ? <div key={n.id}>{form}</div> : (
          <div className="card" key={n.id}>
            <div className="row between">
              <span className="muted">{fmt(n.d)}</span>
              {isAdmin && (conf === n.id ? (
                <span className="row">
                  <button className="btn dng" onClick={() => del(n.id)}>Confirmer la suppression</button>
                  <button className="btn" onClick={() => setConf(null)}>Annuler</button>
                </span>
              ) : (
                <span className="row">
                  <button className="btn" onClick={() => setEd({ id: n.id, d: n.d || "", t: n.t || "", l: (n.l || []).join("\n") })}>Modifier</button>
                  <button className="btn danger" onClick={() => setConf(n.id)}>Supprimer</button>
                </span>
              ))}
            </div>
            <h2 style={{ margin: "2px 0 6px" }}>{n.t}</h2>
            <ul>{(n.l || []).map((x, j) => <li key={j}>{x}</li>)}</ul>
          </div>
        )
      )}
      </div>
    </Layout>
  );
}
