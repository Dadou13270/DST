import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { watchNouveautes, watchEnCours, ETATS_CHANTIER, addNouveaute, updateNouveaute, deleteNouveaute, NOUVEAUTES_INIT } from "../lib/nouveautes";

const fmt = (d) => (d || "").split("-").reverse().join("/");
const vide = () => ({ id: null, d: new Date().toISOString().slice(0, 10), t: "", l: "" });

export default function Nouveautes() {
  const { isAdmin } = useAuth() || {};
  const [list, setList] = useState(null);
  const [ed, setEd] = useState(null);
  const [conf, setConf] = useState(null);
  const [err, setErr] = useState("");

  const [onglet, setOnglet] = useState("nv");
  const [chantiers, setChantiers] = useState(null);
  const [ce, setCe] = useState(null);
  const [cconf, setCconf] = useState(null);
  useEffect(() => watchNouveautes(setList), []);
  useEffect(() => watchEnCours(setChantiers), []);
  const saveCe = async () => {
    if (!ce.t.trim()) return setErr("Titre obligatoire.");
    const n = { enCours: true, t: ce.t.trim(), etat: ce.etat, l: ce.l.split("\n").map((x) => x.trim()).filter(Boolean) };
    try {
      if (ce.id) await updateNouveaute(ce.id, n); else await addNouveaute(n);
      setCe(null); setErr("");
    } catch (e) { setErr(e.message); }
  };
  const delCe = async (id) => { try { await deleteNouveaute(id); setCconf(null); } catch (e) { setErr(e.message); } };

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
      <div className="tabs">
        <button className={onglet === "nv" ? "on" : ""} onClick={() => setOnglet("nv")}>Nouveautés</button>
        <button className={onglet === "co" ? "on" : ""} onClick={() => setOnglet("co")}>En construction</button>
      </div>
      <div className="row between">
        <h1>Mises à jour</h1>
        {isAdmin && onglet === "nv" && !ed && <button className="btn pri" onClick={() => setEd(vide())}>+ Ajouter</button>}
        {isAdmin && onglet === "co" && !ce && <button className="btn pri" onClick={() => setCe({ id: null, t: "", etat: "cours", l: "" })}>+ Ajouter</button>}
      </div>
      {err && <div className="card warn">{err}</div>}
      {onglet === "co" && (
        <>
          <p className="muted">Ce qui est en préparation. Les dates ne sont pas garanties.</p>
          {ce && (
            <div className="card form span">
              <h3 style={{ marginTop: 0 }}>{ce.id ? "Modifier le chantier" : "Nouveau chantier"}</h3>
              <label>Titre</label>
              <input maxLength={120} value={ce.t} onChange={(e) => setCe({ ...ce, t: e.target.value })} />
              <label>État</label>
              <select value={ce.etat} onChange={(e) => setCe({ ...ce, etat: e.target.value })}>
                {Object.entries(ETATS_CHANTIER).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <label>Détail (une ligne = une puce)</label>
              <textarea rows={5} maxLength={2000} value={ce.l} onChange={(e) => setCe({ ...ce, l: e.target.value })} />
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn pri" onClick={saveCe}>Enregistrer</button>
                <button className="btn" onClick={() => setCe(null)}>Annuler</button>
              </div>
            </div>
          )}
          {chantiers && chantiers.length === 0 && !ce && <div className="card">Rien en construction pour le moment.</div>}
          {(chantiers || []).filter((c) => !ce || ce.id !== c.id).map((c) => (
            <div className="card" key={c.id}>
              <div className="row between">
                <span className="tag">{ETATS_CHANTIER[c.etat] || "En cours"}</span>
                {isAdmin && (cconf === c.id ? (
                  <span className="row">
                    <button className="btn dng" onClick={() => delCe(c.id)}>Confirmer la suppression</button>
                    <button className="btn" onClick={() => setCconf(null)}>Annuler</button>
                  </span>
                ) : (
                  <span className="row">
                    <button className="btn" onClick={() => setCe({ id: c.id, t: c.t || "", etat: c.etat || "cours", l: (c.l || []).join("\n") })}>Modifier</button>
                    <button className="btn danger" onClick={() => setCconf(c.id)}>Supprimer</button>
                  </span>
                ))}
              </div>
              <h2 style={{ margin: "2px 0 6px" }}>{c.t}</h2>
              <ul>{(c.l || []).map((x, j) => <li key={j}>{x}</li>)}</ul>
            </div>
          ))}
        </>
      )}
      {onglet === "nv" && <>
      <p className="muted">Les évolutions de l'application, de la plus récente à la plus ancienne.</p>
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
      </>}
      </div>
    </Layout>
  );
}
