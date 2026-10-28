import { useEffect, useState } from "react";
import { listParcours, saveParcours, supprimerParcours, dupliquerParcours } from "../lib/parcours";

const vide = { id: null, titre: "", description: "", ordre: false, partage: false, scIds: [] };

export default function Parcours({ user, profil, isAdmin, scs, pcs, onChange }) {
  const [ed, setEd] = useState(null);
  const [add, setAdd] = useState("");
  const [msg, setMsg] = useState("");
  const [conf, setConf] = useState(null);
  const [vus, setVus] = useState({});
  const titre = (id) => scs.find((x) => x.id === id)?.titre || "(exercice indisponible)";
  const run = async (f) => { setMsg(""); try { await f(); onChange(); } catch (e) { setMsg("Erreur : " + e.message); } };
  const move = (i, d) => setEd((e) => { const a = [...e.scIds]; const j = i + d; if (j < 0 || j >= a.length) return e; [a[i], a[j]] = [a[j], a[i]]; return { ...e, scIds: a }; });
  const save = (e) => {
    e.preventDefault();
    if (!ed.titre.trim()) return setMsg("Donne un nom au parcours.");
    if (!ed.scIds.length) return setMsg("Ajoute au moins un exercice.");
    run(async () => { await saveParcours(ed.id, ed, user.uid, profil?.nom); setEd(null); });
  };
  return (
    <div className="card">
      <div className="row item between">
        <h2 style={{ margin: 0 }}>Parcours</h2>
        {!ed && <button className="btn primary" onClick={() => setEd({ ...vide })}>Nouveau parcours</button>}
      </div>
      <p className="muted">Un parcours regroupe plusieurs exercices dans un ordre précis (ex. « FMPA chef d'agrès »). Assigne-le ensuite à une équipe avec une date limite, depuis le bloc « Exercices à rendre » de l'équipe.</p>
      {ed ? (
        <form className="form" onSubmit={save}>
          <label>Nom du parcours</label>
          <input value={ed.titre} maxLength={80} onChange={(e) => setEd({ ...ed, titre: e.target.value })} placeholder="Ex. FMPA chef d'agrès" />
          <label>Description (facultatif)</label>
          <textarea rows={2} maxLength={400} value={ed.description} onChange={(e) => setEd({ ...ed, description: e.target.value })} />
          <label className="check"><input type="checkbox" checked={ed.ordre} onChange={(e) => setEd({ ...ed, ordre: e.target.checked })} /> Ordre imposé (la prochaine étape est mise en avant, les suivantes restent grisées)</label>
          <label className="check"><input type="checkbox" checked={ed.partage} onChange={(e) => setEd({ ...ed, partage: e.target.checked })} /> Partager avec les autres gestionnaires</label>
          <label>Exercices du parcours (dans l'ordre)</label>
          {ed.scIds.length === 0 && <p className="muted">Aucun exercice pour l'instant.</p>}
          <ol>
            {ed.scIds.map((id, i) => (
              <li key={id + i}>{titre(id)}{" "}
                <button type="button" className="btn" disabled={!i} onClick={() => move(i, -1)}>↑</button>{" "}
                <button type="button" className="btn" disabled={i === ed.scIds.length - 1} onClick={() => move(i, 1)}>↓</button>{" "}
                <button type="button" className="btn danger" onClick={() => setEd({ ...ed, scIds: ed.scIds.filter((_, k) => k !== i) })}>✕</button>
              </li>
            ))}
          </ol>
          <div className="row item">
            <select className="grow" value={add} onChange={(e) => setAdd(e.target.value)}>
              <option value="">Ajouter un exercice…</option>
              {scs.filter((x) => !ed.scIds.includes(x.id)).map((x) => <option key={x.id} value={x.id}>{x.titre}{x.kind === "rel" ? " · Relationnel" : x.kind === "calc" ? " · Calcul LIF" : ""}</option>)}
            </select>
            <button type="button" className="btn" onClick={() => { if (add) { setEd({ ...ed, scIds: [...ed.scIds, add] }); setAdd(""); } }}>Ajouter</button>
          </div>
          <div className="row item" style={{ marginTop: 12 }}>
            <button className="btn primary">Enregistrer le parcours</button>
            <button type="button" className="btn" onClick={() => { setEd(null); setMsg(""); }}>Annuler</button>
          </div>
        </form>
      ) : (
        <>
          {pcs.length === 0 && <p className="muted">Aucun parcours. Crée le premier.</p>}
          {pcs.map((p) => {
            const mien = p.owner === user.uid || isAdmin;
            return (
              <div className="card" key={p.id} style={{ margin: "8px 0" }}>
                <div className="row item between">
                  <div>
                    <strong>{p.titre}</strong> {p.ordre && <span className="tag">Ordre imposé</span>} {p.partage && <span className="tag">Partagé</span>}
                    <div className="muted">{(p.scIds || []).length} exercice(s){p.owner !== user.uid ? ` · par ${p.ownerNom || "un gestionnaire"}` : ""}</div>
                    {p.description && <div className="muted">{p.description}</div>}
                    {(p.scIds || []).length > 0 && (
                      <button type="button" className="btn" style={{ marginTop: 6 }} onClick={() => setVus((v) => ({ ...v, [p.id]: !v[p.id] }))}>
                        {vus[p.id] ? "▾ Masquer les exercices" : "▸ Voir les exercices"}
                      </button>
                    )}
                    {vus[p.id] && (
                      <ol style={{ margin: "6px 0 0 20px", padding: 0 }}>
                        {(p.scIds || []).map((id, i) => <li key={id + i}>{titre(id)}{scs.find((x) => x.id === id)?.rubrique ? <span className="muted"> · {scs.find((x) => x.id === id).rubrique}</span> : null}</li>)}
                      </ol>
                    )}
                  </div>
                  <div className="row item">
                    {mien && <button className="btn" onClick={() => setEd({ ...p })}>Modifier</button>}
                    <button className="btn" onClick={() => run(() => dupliquerParcours(p, user.uid, profil?.nom))}>Dupliquer</button>
                    {mien && (conf === p.id
                      ? <button className="btn danger" onClick={() => { setConf(null); run(() => supprimerParcours(p.id)); }}>Confirmer ?</button>
                      : <button className="btn danger" onClick={() => setConf(p.id)}>Supprimer</button>)}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
      {msg && <p className="err">{msg}</p>}
    </div>
  );
}
