import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LEGAL_DEFAUT, LEGAL_IDS, retablirLegal, sauverLegal, useLegal } from "../lib/legal";

// Édition des pages légales (administrateur général) : titre, date, rubriques (titre + texte), ordre.
function Editeur({ k }) {
  const src = useLegal(k);
  const [d, setD] = useState(null);
  const [msg, setMsg] = useState("");
  const [conf, setConf] = useState(false);
  useEffect(() => { if (src && !d) setD(JSON.parse(JSON.stringify(src))); }, [src]); // eslint-disable-line
  if (!d) return <p>Chargement…</p>;
  const sec = (i, c) => setD({ ...d, sections: d.sections.map((s, j) => (j === i ? { ...s, ...c } : s)) });
  const bouger = (i, n) => { const l = [...d.sections]; const [x] = l.splice(i, 1); l.splice(i + n, 0, x); setD({ ...d, sections: l }); };
  const sauver = async () => {
    setMsg("");
    try { await sauverLegal(k, { ...d, maj: d.maj || new Date().toLocaleDateString("fr-FR", { dateStyle: "long" }) }); setMsg("Enregistré : la page publique est à jour."); } catch (e) { setMsg("Erreur : " + (e.code || e.message)); }
  };
  const retablir = async () => { await retablirLegal(k); setD(JSON.parse(JSON.stringify(LEGAL_DEFAUT[k]))); setConf(false); setMsg("Texte par défaut rétabli."); };
  return (
    <div>
      <div className="card">
        <label>Titre de la page</label>
        <input value={d.titre} onChange={(e) => setD({ ...d, titre: e.target.value })} />
        <label>Date de dernière mise à jour (affichée en haut de la page)</label>
        <div className="row"><input style={{ flex: 1 }} value={d.maj} onChange={(e) => setD({ ...d, maj: e.target.value })} /><button className="btn" onClick={() => setD({ ...d, maj: new Date().toLocaleDateString("fr-FR", { dateStyle: "long" }) })}>Aujourd'hui</button></div>
      </div>
      {d.sections.map((s, i) => (
        <div className="card" key={i}>
          <div className="row between"><strong>Rubrique {i + 1}</strong>
            <span className="row"><button className="btn" disabled={i === 0} onClick={() => bouger(i, -1)}>↑</button><button className="btn" disabled={i === d.sections.length - 1} onClick={() => bouger(i, 1)}>↓</button><button className="btn danger" onClick={() => setD({ ...d, sections: d.sections.filter((_, j) => j !== i) })}>Supprimer</button></span></div>
          <input value={s.t} onChange={(e) => sec(i, { t: e.target.value })} placeholder="Titre de la rubrique" />
          <textarea rows={6} value={s.p} onChange={(e) => sec(i, { p: e.target.value })} placeholder="Texte" />
        </div>
      ))}
      <div className="row item">
        <button className="btn" onClick={() => setD({ ...d, sections: [...d.sections, { t: "", p: "" }] })}>+ Ajouter une rubrique</button>
        <button className="btn primary" onClick={sauver}>Enregistrer</button>
        {conf ? <button className="btn danger" onClick={retablir}>Confirmer le retour au texte par défaut ?</button> : <button className="btn" onClick={() => setConf(true)}>Rétablir le texte par défaut</button>}
        {msg && <span className={msg.startsWith("Erreur") ? "err" : "ok-txt"}>{msg}</span>}
      </div>
    </div>
  );
}

export default function AdminLegal() {
  const [k, setK] = useState("cgu");
  return (
    <div>
      <h2>Pages légales</h2>
      <p className="muted">Ces trois pages sont publiques et liées dans le pied de page. Remplace les passages « [À compléter] » avant de les diffuser, et fais valider les textes par le DPO ou le service juridique. Page publique : <Link to="/cgu">Conditions d'utilisation</Link> · <Link to="/confidentialite">Confidentialité</Link> · <Link to="/mentions-legales">Mentions légales</Link>.</p>
      <div className="tabs">{Object.entries(LEGAL_IDS).map(([id, t]) => <button key={id} className={k === id ? "on" : ""} onClick={() => setK(id)}>{t}</button>)}</div>
      <Editeur key={k} k={k} />
    </div>
  );
}
