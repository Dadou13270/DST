import { useEffect, useState } from "react";
import { FICHE_SMES, NIVEAUX, calculer, chargerModele, enregistrerModele, evaluationExistante, modeleDefaut, pdfFiche, sansSmes, sauverEvaluation, supprimerEvaluation } from "../lib/fiche";

const uid = () => "c" + Math.random().toString(36).slice(2, 8);

function Resultat({ sections }) {
  const r = calculer(sections);
  return (
    <div className="fiche-res">
      <span className="fiche-big">{r.total} / {r.max}</span>
      <span className="muted">{r.pct} % · {r.rep}/{r.nb} critères notés</span>
      <span className={"fiche-dec " + r.cls}>{r.decision}</span>
      <div className="fiche-bar"><i style={{ width: r.pct + "%" }} /></div>
      <div className="muted">{r.raison}</div>
    </div>
  );
}

// Lecture seule (espace stagiaire et fiche déjà enregistrée)
export function FicheLecture({ e }) {
  const pts = (sec) => `${sec.c.reduce((n, c) => n + (c.v ?? 0) * c.k, 0)} / ${sec.c.reduce((n, c) => n + 3 * c.k, 0)} pts`;
  return (
    <div className="fiche">
      <div className="card">
        <div className="row between"><h2 style={{ margin: 0 }}>Exercice évalué</h2><span className="muted">Évaluateur : {e.gestNom || "—"} · {new Date(e.maj || 0).toLocaleDateString("fr-FR")}</span></div>
        <div className="fiche-2" style={{ marginTop: 8 }}>
          <div><label>Scénario</label><input value={e.scTitre || ""} readOnly /></div>
          <div><label>Stagiaire</label><input value={e.stagNom || ""} readOnly /></div>
        </div>
      </div>
      {e.sections.map((s) => (
        <div key={s.id} className="card">
          <div className="row between"><h2 style={{ margin: 0 }}>{s.t}</h2><span className="muted">{pts(s)}</span></div>
          {s.c.map((c) => (
            <div key={c.id} className="fiche-crit">
              <div>{c.n} {c.e ? <span className="tag late">Éliminatoire</span> : null} <span className="tag">coef. {c.k}</span></div>
              <div className={"fiche-niv n" + (c.v ?? "x")}>{c.v === undefined || c.v === null ? "—" : `${c.v} · ${NIVEAUX[c.v]}`}</div>
            </div>
          ))}
        </div>
      ))}
      <div className="card">
        <h2 style={{ margin: 0 }}>Résultat</h2>
        <Resultat sections={e.sections} />
        {(e.forts || e.progres) && (
          <div className="fiche-2">
            <div><strong>Points forts</strong><div className="pre">{e.forts || "—"}</div></div>
            <div><strong>Axes de progrès</strong><div className="pre">{e.progres || "—"}</div></div>
          </div>
        )}
        <button className="btn" onClick={() => pdfFiche(e)}>Exporter en PDF</button>
      </div>
    </div>
  );
}

// Saisie par le gestionnaire. stag : {id, nom} · sc : {id, titre, smes} · gest : {uid, nom}
export default function FicheEval({ stag, sc, gest, src = "suivi", onSaved }) {
  const [e, setE] = useState(null);
  const [edit, setEdit] = useState(false);
  const [msg, setMsg] = useState("");
  const [conf, setConf] = useState(false);
  useEffect(() => {
    let vivant = true;
    (async () => {
      const ex = await evaluationExistante(stag.id, sc.id, gest.uid).catch(() => null);
      if (!vivant) return;
      if (ex) return setE(ex);
      let m = await chargerModele(gest.uid);
      if (!sc.smes) m = sansSmes(m);
      setE({ stagId: stag.id, stagNom: stag.nom, gestId: gest.uid, gestNom: gest.nom, scId: sc.id, scTitre: sc.titre, smes: !!sc.smes, sections: m, forts: "", progres: "", src });
    })();
    return () => { vivant = false; };
  }, [stag.id, sc.id, gest.uid]); // eslint-disable-line
  if (!e) return <p className="muted">Chargement de la fiche…</p>;
  const maj = (f) => setE((x) => { const n = JSON.parse(JSON.stringify(x)); f(n); return n; });
  const noter = (si, ci, v) => maj((n) => { n.sections[si].c[ci].v = v; });
  const ajouter = (si) => maj((n) => { n.sections[si].c.push({ id: uid(), n: "Nouveau critère", d: "", k: 2, e: 0 }); });
  const basculerSmes = async (on) => {
    const m = on ? await chargerModele(gest.uid) : null;
    const sec = on ? (m.find((x) => x.id === "smes") || FICHE_SMES) : null;
    maj((n) => { n.smes = on; n.sections = n.sections.filter((x) => x.id !== "smes"); if (on) n.sections.push(JSON.parse(JSON.stringify(sec))); });
  };
  const run = async (f, ok) => { setMsg("…"); try { await f(); setMsg(ok); } catch (x) { setMsg("Erreur : " + x.message); } };
  const save = () => run(async () => { const d = await sauverEvaluation(e); setE(d); onSaved && onSaved(d); }, "Fiche enregistrée. Le stagiaire la voit dans son suivi.");
  const r = calculer(e.sections);
  const pts = (sec) => ({ t: sec.c.reduce((n, c) => n + (c.v ?? 0) * c.k, 0), m: sec.c.reduce((n, c) => n + 3 * c.k, 0) });
  return (
    <div className="fiche">
      <div className="card">
        <div className="row between"><h2 style={{ margin: 0 }}>Exercice évalué</h2><span className="tag">Une seule fiche pour tous les cadres d'emploi</span></div>
        <div className="fiche-2" style={{ marginTop: 8 }}>
          <div><label>Scénario</label><input value={e.scTitre || ""} readOnly /></div>
          <div><label>Stagiaire / évaluateur</label><input value={`${e.stagNom || ""} — évalué par ${e.gestNom || ""}`} readOnly /></div>
        </div>
        <div className="fiche-leg"><span><b>0</b> Non acquis</span><span><b>1</b> En cours d'acquisition</span><span><b>2</b> Acquis</span><span><b>3</b> Maîtrisé</span><span className="tag late">Éliminatoire</span><span>= un « Non acquis » interdit la validation</span></div>
        <label className="check" style={{ marginTop: 10, fontWeight: 600 }}><input type="checkbox" checked={!!e.smes} onChange={(x) => basculerSmes(x.target.checked)} /> Ce scénario comporte l'ordre de mission SMES (la section 5 s'ajoute à la fiche)</label>
        <div className="row item">
          <button className={"btn" + (edit ? " primary" : "")} onClick={() => setEdit(!edit)}>{edit ? "Terminer la modification" : "Modifier / ajouter des critères"}</button>
          <button className="btn" onClick={() => pdfFiche(e)}>PDF</button>
        </div>
        {edit && <div className="card warn" style={{ margin: "8px 0 0" }}>Les changements s'appliquent à cette fiche. Utilise « Enregistrer comme fiche de référence » pour les garder pour tes prochaines évaluations.</div>}
      </div>
      {e.sections.map((sec, si) => (
        <div key={sec.id} className="card">
          <div className="row between"><h2 style={{ margin: 0 }}>{sec.t}</h2><span className="muted">{pts(sec).t} / {pts(sec).m} pts</span></div>
          {sec.c.map((c, ci) => (
            <div key={c.id} className="fiche-crit col">
              {edit ? (
                <div className="fiche-ed">
                  <input value={c.n} maxLength={80} onChange={(x) => maj((n) => { n.sections[si].c[ci].n = x.target.value; })} />
                  <textarea rows={2} maxLength={250} value={c.d || ""} placeholder="Ce qui est attendu" onChange={(x) => maj((n) => { n.sections[si].c[ci].d = x.target.value; })} />
                  <div className="row">
                    <label>Coef. <select value={c.k} onChange={(x) => maj((n) => { n.sections[si].c[ci].k = +x.target.value; })}><option>1</option><option>2</option><option>3</option></select></label>
                    <label className="check"><input type="checkbox" checked={!!c.e} onChange={(x) => maj((n) => { n.sections[si].c[ci].e = x.target.checked ? 1 : 0; })} /> Éliminatoire</label>
                    <button className="btn danger" onClick={() => maj((n) => { n.sections[si].c.splice(ci, 1); })}>Retirer</button>
                  </div>
                </div>
              ) : (
                <>
                  <div><strong>{c.n}</strong> {c.e ? <span className="tag late">Éliminatoire</span> : null} <span className="tag">coef. {c.k}</span></div>
                  {c.d && <div className="muted">{c.d}</div>}
                </>
              )}
              <div className="fiche-lv">
                {NIVEAUX.map((l, v) => <button key={v} type="button" className={"n" + v + (c.v === v ? " on" : "")} onClick={() => noter(si, ci, v)}>{v} · {l}</button>)}
              </div>
            </div>
          ))}
          {edit && <button className="btn" onClick={() => ajouter(si)}>+ Ajouter un critère</button>}
        </div>
      ))}
      <div className="card">
        <h2 style={{ margin: 0 }}>Résultat</h2>
        <Resultat sections={e.sections} />
        <div className="fiche-2">
          <div><label>Points forts</label><textarea rows={3} value={e.forts || ""} onChange={(x) => setE({ ...e, forts: x.target.value })} placeholder="Ce qui a été bien fait…" /></div>
          <div><label>Axes de progrès</label><textarea rows={3} value={e.progres || ""} onChange={(x) => setE({ ...e, progres: x.target.value })} placeholder="Ce qu'il faut retravailler avant la prochaine séance…" /></div>
        </div>
        <div className="row item">
          <button className="btn primary" onClick={save}>Enregistrer la fiche ({r.decision})</button>
          <button className="btn" onClick={() => pdfFiche(e)}>Exporter en PDF</button>
          {edit && <button className="btn" onClick={() => run(() => enregistrerModele(gest.uid, e.smes ? e.sections : [...e.sections, ...(modeleDefaut().filter((x) => x.id === "smes"))]), "Fiche de référence enregistrée.")}>Enregistrer comme fiche de référence</button>}
          {edit && <button className="btn" onClick={() => { let m = modeleDefaut(); if (!e.smes) m = sansSmes(m); maj((n) => { n.sections = m.map((x, i) => ({ ...x, c: x.c.map((c) => ({ ...c, v: (n.sections[i]?.c.find((y) => y.id === c.id) || {}).v })) })); }); }}>Rétablir la fiche d'origine</button>}
          {e.maj && (conf ? <button className="btn danger" onClick={() => run(async () => { await supprimerEvaluation(e); setE(null); onSaved && onSaved(null); }, "")}>Confirmer ?</button> : <button className="btn danger" onClick={() => setConf(true)}>Supprimer la fiche</button>)}
          {msg && <span className="muted">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
