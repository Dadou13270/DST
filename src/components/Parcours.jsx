import { useEffect, useState } from "react";
import { listMesQuiz, listQuiz } from "../lib/quiz";
import { lignesObjectifs, sequenceParcours, listParcours, saveParcours, supprimerParcours, dupliquerParcours } from "../lib/parcours";

const vide = { id: null, titre: "", objectif: "", prerequis: "", description: "", ordre: false, partage: false, diag: false, diagId: "", scIds: [] };

export default function Parcours({ user, profil, isAdmin, scs, pcs, onChange }) {
  const [ed, setEd] = useState(null);
  const [add, setAdd] = useState("");
  const [msg, setMsg] = useState("");
  const [conf, setConf] = useState(null);
  const [vus, setVus] = useState({});
  const [brouillons, setBrouillons] = useState([]); // quiz / QCM pas encore publiés (les miens, ou tous pour l'admin)
  useEffect(() => { (isAdmin ? listQuiz(true) : listMesQuiz(user.uid)).then((l) => setBrouillons(l.filter((x) => !x.publie))).catch(() => {}); }, [user.uid, isAdmin]);
  const diagChoix = [...scs, ...brouillons.filter((b) => !scs.some((x) => x.id === b.id))];
  const titre = (id) => scs.find((x) => x.id === id)?.titre || "(exercice indisponible)";
  const run = async (f) => { setMsg(""); try { await f(); onChange(); } catch (e) { setMsg("Erreur : " + e.message); } };
  const move = (i, d) => setEd((e) => { const a = [...e.scIds]; const j = i + d; if (j < 0 || j >= a.length) return e; [a[i], a[j]] = [a[j], a[i]]; return { ...e, scIds: a }; });
  const save = (e) => {
    e.preventDefault();
    if (!ed.titre.trim()) return setMsg("Donne un nom au parcours.");
    if (ed.diag && !ed.diagId) return setMsg("Choisis l'exercice diagnostic ou décoche la case.");
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
          <label>Objectif du parcours</label>
          <textarea rows={3} maxLength={600} value={ed.objectif || ""} onChange={(e) => setEd({ ...ed, objectif: e.target.value })} placeholder="Ce que le stagiaire saura faire à la fin du parcours (visible par les stagiaires)" />
          <label>Prérequis (facultatif)</label>
          <textarea rows={2} maxLength={400} value={ed.prerequis || ""} onChange={(e) => setEd({ ...ed, prerequis: e.target.value })} placeholder="Ce qu'il faut avoir ou savoir avant de commencer (ex. formation chef d'équipe validée, QCM « fondamentaux » réussi). Visible par les stagiaires." />
          <label>Objectifs intermédiaires (facultatif)</label>
          <textarea rows={4} value={ed.objTxt !== undefined ? ed.objTxt : (ed.objectifs || []).join("\n")} onChange={(e) => setEd({ ...ed, objTxt: e.target.value })} placeholder={"Une marche par ligne, dans l'ordre, avec un verbe d'action :\nAnalyser la situation et les risques\nRédiger l'ordre d'opération\nCalculer les besoins en eau"} />
          <p className="muted" style={{ margin: "2px 0 0" }}>Les étapes à franchir pour atteindre l'objectif du parcours (8 maximum). Visibles par les stagiaires.</p>
          <label>Description (facultatif)</label>
          <textarea rows={2} maxLength={400} value={ed.description} onChange={(e) => setEd({ ...ed, description: e.target.value })} />
          <label className="check"><input type="checkbox" checked={ed.ordre} onChange={(e) => setEd({ ...ed, ordre: e.target.checked })} /> Ordre imposé (la prochaine étape est mise en avant, les suivantes restent grisées)</label>
          <label className="check"><input type="checkbox" checked={ed.partage} onChange={(e) => setEd({ ...ed, partage: e.target.checked })} /> Partager avec les autres gestionnaires</label>
          <label className="check"><input type="checkbox" checked={!!ed.diag} onChange={(e) => setEd({ ...ed, diag: e.target.checked, diagId: e.target.checked ? ed.diagId : "" })} /> Diagnostic (un exercice ou QCM / quiz d'évaluation en début de parcours)</label>
          {ed.diag && (
            <>
              <label>Exercice diagnostic (placé en premier, un seul)</label>
              <select value={ed.diagId || ""} onChange={(e) => setEd({ ...ed, diagId: e.target.value })}>
                <option value="">Choisir l'exercice diagnostic…</option>
                {diagChoix.filter((x) => !ed.scIds.includes(x.id)).map((x) => <option key={x.id} value={x.id}>{x.titre}{x.kind === "quiz" && !x.publie ? " · brouillon" : ""}{x.kind === "quiz" ? (x.format === "cartes" ? " · Flashcards" : x.format === "quiz" ? " · Quiz" : " · QCM") : x.kind === "rel" ? " · Relationnel" : x.kind === "calc" ? " · Calcul LIF" : ""}</option>)}
              </select>
              {brouillons.some((b) => b.id === ed.diagId) && <p className="muted">Ce quiz est un brouillon : publie-le pour que les stagiaires puissent le faire.</p>}
            </>
          )}
          <label>Exercices du parcours (dans l'ordre)</label>
          {ed.scIds.length === 0 && <p className="muted">Aucun exercice pour l'instant.</p>}
          <ol>
            {ed.scIds.map((id, i) => (
              <li key={id + i}>{titre(id)}{" "}
                <select value={(ed.objLiens || {})[id] ?? ""} onChange={(e) => setEd({ ...ed, objLiens: { ...(ed.objLiens || {}), [id]: e.target.value === "" ? undefined : Number(e.target.value) } })} style={{ width: "auto", maxWidth: 220 }} title="Objectif intermédiaire atteint grâce à cet exercice">
                  <option value="">Objectif : aucun</option>
                  {lignesObjectifs(ed.objTxt !== undefined ? ed.objTxt : (ed.objectifs || []).join("\n")).map((o, k) => <option key={k} value={k}>{`${k + 1}. ${o.slice(0, 40)}`}</option>)}
                </select>{" "}
                <button type="button" className="btn" disabled={!i} onClick={() => move(i, -1)}>↑</button>{" "}
                <button type="button" className="btn" disabled={i === ed.scIds.length - 1} onClick={() => move(i, 1)}>↓</button>{" "}
                <button type="button" className="btn danger" onClick={() => setEd({ ...ed, scIds: ed.scIds.filter((_, k) => k !== i) })}>✕</button>
              </li>
            ))}
          </ol>
          <div className="row item">
            <select className="grow" value={add} onChange={(e) => setAdd(e.target.value)}>
              <option value="">Ajouter un exercice…</option>
              {scs.filter((x) => !ed.scIds.includes(x.id) && x.id !== ed.diagId).map((x) => <option key={x.id} value={x.id}>{x.titre}{x.kind === "quiz" ? (x.format === "cartes" ? " · Flashcards" : x.format === "quiz" ? " · Quiz" : x.format === "examen" ? " · Examen blanc" : " · QCM") : x.kind === "rel" ? " · Relationnel" : x.kind === "calc" ? " · Calcul LIF" : ""}</option>)}
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
                    {p.diag && p.diagId && <> <span className="tag">Diagnostic</span></>}
                    <div className="muted">{(p.scIds || []).length + (p.diag && p.diagId ? 1 : 0)} exercice(s){p.owner !== user.uid ? ` · par ${p.ownerNom || "un gestionnaire"}` : ""}</div>
                    {p.prerequis && <div style={{ margin: "4px 0" }}><strong>Prérequis :</strong> {p.prerequis}</div>}
                    {p.objectif && <div style={{ margin: "4px 0" }}><strong>Objectif :</strong> {p.objectif}</div>}
                    {(p.objectifs || []).length > 0 && <ol style={{ margin: "2px 0 4px", paddingLeft: 20 }}>{p.objectifs.map((o, k) => { const n = Object.values(p.objLiens || {}).filter((v) => v === k).length; return <li key={k}>{o} {n ? <span className="tag ok">{n} exercice{n > 1 ? "s" : ""}</span> : <span className="tag" style={{ color: "#c42a1c" }} title="Aucun exercice n'est rattaché à cet objectif">aucun exercice</span>}</li>; })}</ol>}
                    {p.description && <div className="muted">{p.description}</div>}
                    {((p.scIds || []).length > 0 || p.diagId) && (
                      <button type="button" className="btn" style={{ marginTop: 6 }} onClick={() => setVus((v) => ({ ...v, [p.id]: !v[p.id] }))}>
                        {vus[p.id] ? "▾ Masquer les exercices" : "▸ Voir les exercices"}
                      </button>
                    )}
                    {vus[p.id] && (
                      <ol style={{ margin: "6px 0 0 20px", padding: 0 }}>
                        {sequenceParcours(p).map((id, i) => <li key={id + i}>{p.diag && p.diagId === id && <span className="tag">Diagnostic</span>} {(p.objLiens || {})[id] !== undefined && (p.objectifs || [])[p.objLiens[id]] && <><span className="tag" title={p.objectifs[p.objLiens[id]]}>🎯 Objectif {p.objLiens[id] + 1}</span>{" "}</>}{titre(id)}{scs.find((x) => x.id === id)?.rubrique ? <span className="muted"> · {scs.find((x) => x.id === id).rubrique}</span> : null}</li>)}
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
