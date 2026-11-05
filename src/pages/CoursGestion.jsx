import { useEffect, useRef, useState } from "react";
import PdfLecteur from "../components/PdfLecteur";
import { COURS_MAX_MO, listMesCours, sauverCours, supprimerCours, lirePdf, attribuerCours, retirerCoursEquipe, prevenirCours } from "../lib/cours";
import { listMembres } from "../lib/equipes";
import { fmtLimite, limiteDepuisInput, inputDepuisLimite } from "../lib/devoirs";

// Gestionnaire autorisé : créer un cours en ligne (PDF) et le proposer à ses équipes ; suivre qui a validé sa lecture.
function Editeur({ init, user, profil, onFin }) {
  const [c, setC] = useState(init);
  const [file, setFile] = useState(null);
  const [err, setErr] = useState("");
  const [pg, setPg] = useState(null);
  const ref = useRef(null);
  const save = async () => {
    setErr(""); setPg(0);
    try { await sauverCours(c, file, user, profil, setPg); onFin(true); } catch (e) { setErr(e.message || "Erreur"); setPg(null); }
  };
  return (
    <div className="card">
      <div className="row between item">
        <h2 style={{ margin: 0 }}>{c.id ? "Modifier le cours" : "Nouveau cours en ligne"}</h2>
        <div className="row"><button className="btn" disabled={pg !== null} onClick={() => onFin(false)}>Annuler</button><button className="btn primary" disabled={pg !== null || !c.titre.trim() || (!c.id && !file)} onClick={save}>{pg === null ? "Enregistrer" : `Envoi… ${pg} %`}</button></div>
      </div>
      {err && <p className="err">{err}</p>}
      <label>Titre du cours</label>
      <input type="text" value={c.titre} onChange={(e) => setC({ ...c, titre: e.target.value })} placeholder="Ex. Les engins d'incendie" />
      <label>Description (facultative)</label>
      <textarea rows={3} value={c.description} onChange={(e) => setC({ ...c, description: e.target.value })} placeholder="Objectifs, consignes de lecture…" />
      <label>Fichier PDF {c.id ? "(laisser vide pour conserver le fichier actuel)" : ""}</label>
      <input ref={ref} type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <p className="muted" style={{ margin: "4px 0" }}>{file ? `${file.name} · ${(file.size / 1048576).toFixed(1)} Mo` : c.id ? `Fichier actuel : ${c.nomFichier || "PDF"} · ${((c.taille || 0) / 1048576).toFixed(1)} Mo` : "Aucun fichier choisi."} Maximum {COURS_MAX_MO} Mo.</p>
    </div>
  );
}

function Apercu({ c, onClose }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { lirePdf(c).then(setD).catch((e) => setErr(e.message)); }, [c.id]); // eslint-disable-line
  return (
    <div className="card">
      <div className="row between item"><strong>Aperçu : {c.titre}</strong><button className="btn" onClick={onClose}>Fermer</button></div>
      {err && <p className="err">{err}</p>}
      {!d && !err && <p>Chargement…</p>}
      {d && <PdfLecteur data={d} />}
    </div>
  );
}

function Attribution({ c, teams, onChange, user, profil }) {
  const [val, setVal] = useState({});
  const [mem, setMem] = useState({});
  const [vue, setVue] = useState("");
  const [msg, setMsg] = useState("");
  const cur = (t) => (t.cours || []).find((x) => x.id === c.id);
  useEffect(() => { teams.filter(cur).forEach((t) => listMembres(t.id).then((m) => setMem((s) => ({ ...s, [t.id]: m }))).catch(() => {})); }, [c.id, teams.length]); // eslint-disable-line
  const v = (t) => val[t.id] || (cur(t) ? { type: cur(t).type, lim: inputDepuisLimite(cur(t).lim) } : { type: "devoir", lim: "" });
  const nbOk = (t) => (mem[t.id] || []).filter((u) => u.cours?.[c.id]?.fait).length;
  const go = async (fn) => { setMsg(""); try { await fn(); onChange(); setMsg("Enregistré."); } catch (e) { setMsg(e.message || "Erreur"); } };
  return (
    <div className="card" style={{ background: "var(--soft)" }}>
      <strong>Proposer « {c.titre} » aux équipes</strong>
      {teams.length === 0 && <p className="muted">Crée d'abord une équipe.</p>}
      {teams.map((t) => {
        const x = v(t), a = cur(t);
        return (
          <div key={t.id}>
            <div className="row item" style={{ flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              <strong style={{ minWidth: 140 }}>{t.nom}</strong>
              <select value={x.type} onChange={(e) => setVal({ ...val, [t.id]: { ...x, type: e.target.value } })}>
                <option value="devoir">Lecture à rendre</option>
                <option value="biblio">Bibliothèque (sans échéance)</option>
              </select>
              {x.type === "devoir" && <input type="date" value={x.lim} onChange={(e) => setVal({ ...val, [t.id]: { ...x, lim: e.target.value } })} aria-label="Date limite" />}
              <button className="btn primary" disabled={x.type === "devoir" && !x.lim} onClick={() => go(async () => { const lim = limiteDepuisInput(x.lim); await attribuerCours(t, c, x.type, lim); if (!a || a.type !== x.type || (a.lim || 0) !== (x.type === "devoir" ? lim : 0)) await prevenirCours(t, c, x.type, lim, user, profil).catch(() => {}); })}>{a ? "Mettre à jour" : "Proposer"}</button>
              {a && <button className="btn" onClick={() => { const o = vue === t.id; setVue(o ? "" : t.id); if (!o) listMembres(t.id).then((m) => setMem((s) => ({ ...s, [t.id]: m }))).catch(() => {}); }}>{vue === t.id ? "Masquer les résultats" : "Résultats"}</button>}
              {a && <button className="btn" onClick={() => go(() => retirerCoursEquipe(t, c.id))}>Retirer</button>}
              {a && <span className="muted">{a.type === "devoir" ? `À lire avant le ${fmtLimite(a.lim)}` : "Bibliothèque"}{mem[t.id] ? ` · ${nbOk(t)}/${mem[t.id].length} lu${nbOk(t) > 1 ? "s" : ""}` : ""}</span>}
            </div>
            {vue === t.id && (
              <table className="cmp" style={{ minWidth: 0, margin: "8px 0 0 12px" }}>
                <thead><tr><th>Stagiaire</th><th>Lecture validée</th></tr></thead>
                <tbody>{(mem[t.id] || []).map((u) => { const f = u.cours?.[c.id]?.fait; return <tr key={u.id}><td>{u.nom || "—"}</td><td>{f ? <span className="tag ok">✅ {new Date(f).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</span> : a.type === "devoir" && a.lim && a.lim < Date.now() ? <span className="tag late">En retard</span> : <span className="tag">Pas encore</span>}</td></tr>; })}</tbody>
              </table>
            )}
          </div>
        );
      })}
      {msg && <p className="muted">{msg}</p>}
    </div>
  );
}

export default function CoursGestion({ user, profil, teams, onChange }) {
  const [l, setL] = useState(null);
  const [ed, setEd] = useState(null);
  const [att, setAtt] = useState(null);
  const [ap, setAp] = useState(null);
  const [conf, setConf] = useState("");
  const [err, setErr] = useState("");
  const charger = () => listMesCours(user.uid).then(setL).catch((e) => setErr(e.message));
  useEffect(() => { charger(); }, []); // eslint-disable-line
  if (ed) return <Editeur init={ed} user={user} profil={profil} onFin={(ok) => { setEd(null); if (ok) { charger(); onChange?.(); } }} />;
  return (
    <>
      <div className="row between item">
        <h2 style={{ margin: 0 }}>Cours en ligne</h2>
        <button className="btn primary" onClick={() => setEd({ titre: "", description: "" })}>+ Nouveau cours</button>
      </div>
      <p className="muted">Dépose un cours au format PDF et propose-le à tes équipes, comme lecture à rendre (avec date limite) ou en bibliothèque. Le stagiaire fait défiler le PDF jusqu'à la fin puis valide sa lecture : tu le vois dans le suivi de l'équipe.</p>
      {err && <div className="card warn">Erreur : {err}. Vérifie que les règles Firestore (firestore.rules) sont publiées.</div>}
      {!l && !err && <p>Chargement…</p>}
      {l && l.length === 0 && <div className="card">Aucun cours pour le moment.</div>}
      {(l || []).map((x) => (
        <div key={x.id}>
          <div className="card row between item">
            <div>
              <strong>{x.titre}</strong>
              <div className="meta"><span className="tag">PDF</span> <span className="muted">{((x.taille || 0) / 1048576).toFixed(1)} Mo{x.nomFichier ? " · " + x.nomFichier : ""}</span></div>
              {x.description && <div className="muted">{x.description}</div>}
            </div>
            <div className="row">
              <button className="btn primary" onClick={() => setAtt(att === x.id ? null : x.id)}>{att === x.id ? "Fermer" : "Proposer"}</button>
              <button className="btn" onClick={() => setAp(ap === x.id ? null : x.id)}>Aperçu</button>
              <button className="btn" onClick={() => setEd(x)}>Modifier</button>
              {conf === x.id ? <button className="btn danger" onClick={() => supprimerCours(x).then(() => { setConf(""); charger(); }).catch((e) => setErr(e.message))}>Confirmer ?</button> : <button className="btn danger" onClick={() => setConf(x.id)}>Supprimer</button>}
            </div>
          </div>
          {ap === x.id && <Apercu c={x} onClose={() => setAp(null)} />}
          {att === x.id && <Attribution c={x} teams={teams} user={user} profil={profil} onChange={() => onChange?.()} />}
        </div>
      ))}
    </>
  );
}
