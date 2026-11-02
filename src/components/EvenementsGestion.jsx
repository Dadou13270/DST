import { useEffect, useMemo, useState } from "react";
import { TYPES, STATUTS, creerEvenement, modifierEvenement, majEvenement, supprimerEvenement, watchEvenements, watchPartOrg, watchToutesPart } from "../lib/evenements";
import { listScenarios } from "../lib/db";
import { idsEquipes } from "../lib/equipes";

// Création et suivi des évènements. admin : tous les évènements (généraux) ; gestionnaire autorisé : les siens, limités à son département.
function Resultat({ r }) {
  const fmt = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  return (
    <div className="ev-res">
      <p className="muted" style={{ margin: "0 0 6px" }}><b>{r.titre}</b> · temps {fmt(r.duree)} · {r.nbQ} question(s) posée(s){r.essTot ? ` · questions essentielles ${r.essOk}/${r.essTot}` : ""}{r.vars ? " · variante : " + r.vars : ""}</p>
      {r.notes?.map(([t, x]) => <div key={t} style={{ marginBottom: 6 }}><b>{t}</b><div className="pre">{x}</div></div>)}
      {r.log?.length > 0 && <details><summary>Questions posées ({r.log.length})</summary>{r.log.map((l, i) => <div key={i} className="muted">{l.who ? l.who + " : " : ""}{l.q}{l.a ? " → " + l.a : ""}</div>)}</details>}
    </div>
  );
}
const vide = { type: "flash", theme: "", desc: "", jour: "", heure: "18:00", scId: "" };
const vuLoc = () => { try { return JSON.parse(localStorage.getItem("ev-vu") || "{}"); } catch { return {}; } };
export default function EvenementsGestion({ admin, user, profil }) {
  const [tab, setTab] = useState("ev");
  const [evs, setEvs] = useState(null);
  const [parts, setParts] = useState([]);
  const [scs, setScs] = useState([]);
  const [f, setF] = useState(vide);
  const [msg, setMsg] = useState("");
  const [conf, setConf] = useState(null);
  const [edit, setEdit] = useState("");
  const [ouvert, setOuvert] = useState("");
  const [res, setRes] = useState("");
  const [vu, setVu] = useState(vuLoc);
  useEffect(() => watchEvenements(setEvs), []);
  useEffect(() => (admin ? watchToutesPart(setParts) : watchPartOrg(user.uid, setParts)), [admin, user.uid]);
  useEffect(() => { listScenarios(!admin, { uid: user.uid, equipeIds: idsEquipes(profil) }).then((l) => setScs(l.filter((s) => s.publie))).catch(() => {}); }, []); // eslint-disable-line
  const mes = useMemo(() => (evs || []).filter((e) => admin || e.par === user.uid).sort((a, b) => (a.date || 0) - (b.date || 0)), [evs, admin, user.uid]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const creer = async (e) => {
    e.preventDefault(); setMsg("");
    const d = new Date(f.jour + "T" + (f.heure || "00:00")).getTime();
    if (!f.theme.trim() || !d) return setMsg("Indique le thème, la date et l'heure.");
    if (f.type === "flash" && !f.scId) return setMsg("Un scénario flash doit avoir un scénario : choisis-le dans la liste.");
    const sc = scs.find((s) => s.id === f.scId);
    const donnees = { type: f.type, theme: f.theme, desc: f.desc, date: d, scId: f.scId, scTitre: sc?.titre || (edit && f.scId === (evs || []).find((x) => x.id === edit)?.scId ? (evs || []).find((x) => x.id === edit)?.scTitre : "") || "" };
    try {
      if (edit) { await modifierEvenement(edit, donnees); setEdit(""); setF(vide); setMsg("Évènement modifié."); }
      else { await creerEvenement(donnees, user.uid, profil?.nom || "", admin ? "" : profil?.departement || ""); setF(vide); setMsg("Évènement créé."); }
    } catch (x) { setMsg("Erreur : " + (x.code || x.message)); }
  };
  const modifier = (e) => { const d = new Date(e.date), p = (n) => String(n).padStart(2, "0"); setF({ type: e.type, theme: e.theme, desc: e.desc || "", jour: d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()), heure: p(d.getHours()) + ":" + p(d.getMinutes()), scId: e.scId || "" }); setEdit(e.id); setMsg(""); window.scrollTo(0, 0); };
  const de = (id) => parts.filter((p) => p.ev === id);
  const nvx = (e) => de(e.id).filter((p) => (p.maj || 0) > (vu[e.id] || 0)).length;
  const total = mes.reduce((n, e) => n + nvx(e), 0);
  const ouvrir = (e) => { const id = ouvert === e.id ? "" : e.id; setOuvert(id); if (id) { const v = { ...vu, [e.id]: Date.now() }; setVu(v); try { localStorage.setItem("ev-vu", JSON.stringify(v)); } catch { /* ignore */ } } };
  return (
    <div>
      <h2>Évènements</h2>
      <div className="tabs"><button className={tab === "ev" ? "on" : ""} onClick={() => setTab("ev")}>Évènements</button><button className={tab === "su" ? "on" : ""} onClick={() => setTab("su")}>Suivi des inscriptions{total ? ` (${total} nouveau${total > 1 ? "x" : ""})` : ""}</button></div>
      {tab === "ev" && (
        <>
          <p className="muted">{admin ? "Affichés à tous les utilisateurs" : "Affichés aux utilisateurs de ton département (" + (profil?.departement || "non renseigné") + ")"}, avec compte à rebours, jusqu'à 2 h après le début. Les participants s'inscrivent avec « Je participe » ; tu suis les inscriptions dans l'onglet de suivi.</p>
          <form className="card form" onSubmit={creer}>
            <div className="row item">
              <select value={f.type} onChange={set("type")}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.ic} {v.n}</option>)}</select>
              <input type="date" value={f.jour} onChange={set("jour")} required style={{ width: "auto" }} />
              <input type="time" value={f.heure} onChange={set("heure")} required style={{ width: "auto" }} />
            </div>
            <label>Thème</label>
            <input maxLength={120} value={f.theme} onChange={set("theme")} placeholder="Ex. Feu d'entrepôt : alimentation en eau" required />
            <label>{f.type === "flash" ? "Scénario à réaliser (obligatoire)" : "Scénario joint (facultatif)"}</label>
            <select value={f.scId} onChange={set("scId")}><option value="">{f.type === "flash" ? "— Choisir un scénario —" : "— Aucun —"}</option>{scs.map((s) => <option key={s.id} value={s.id}>{s.titre}</option>)}</select>
            <p className="muted" style={{ margin: "4px 0" }}>Seuls les scénarios publiés sont proposés. Pour joindre un scénario que tu viens de créer, publie-le d'abord.</p>
            <label>Précisions (facultatif)</label>
            <textarea rows={2} maxLength={400} value={f.desc} onChange={set("desc")} placeholder="Lieu, durée, ce qu'il faut préparer…" />
            <p className="muted" style={{ margin: "4px 0" }}>Organisateur : <b>{profil?.nom || "—"}</b></p>
            <button className="btn primary">{edit ? "Enregistrer les modifications" : "Créer l'évènement"}</button>{edit && <button type="button" className="btn" onClick={() => { setEdit(""); setF(vide); }}>Annuler</button>}{msg && <span className="muted"> {msg}</span>}
          </form>
          {!evs && <p>Chargement…</p>}
          {mes.map((e) => {
            const t = TYPES[e.type] || TYPES.flash, passe = e.date < Date.now() - 7200000;
            return (
              <div className="card" key={e.id}>
                <div className="row between item">
                  <div><span className={e.actif && !passe ? "tag ok" : "tag"}>{passe ? "Terminé" : e.actif ? "Actif" : "Masqué"}</span> <span className="tag">{t.ic} {t.n}</span> {e.dept && <span className="tag">{e.dept}</span>} <b>{e.theme}</b>
                    <div className="muted">{new Date(e.date).toLocaleString("fr-FR")} · organisateur : {e.parNom || "—"}{e.scTitre ? " · scénario : " + e.scTitre : ""}{e.desc ? " · " + e.desc : ""}</div></div>
                  <div className="row">
                    <button className="btn" onClick={() => modifier(e)}>Modifier</button>
                    <button className="btn" onClick={() => majEvenement(e.id, { actif: !e.actif })}>{e.actif ? "Masquer" : "Afficher"}</button>
                    {conf === e.id ? <button className="btn danger" onClick={() => supprimerEvenement(e.id).then(() => setConf(null))}>Confirmer ?</button> : <button className="btn danger" onClick={() => setConf(e.id)}>Supprimer</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
      {tab === "su" && (
        <>
          <p className="muted">Inscriptions reçues pour {admin ? "tous les évènements" : "tes évènements"}. « Terminé » : le participant a indiqué avoir fait le scénario. Un point ● signale les nouveautés depuis ta dernière consultation.</p>
          {mes.length === 0 && <div className="card">Aucun évènement.</div>}
          {mes.map((e) => {
            const l = de(e.id).sort((a, b) => (b.maj || 0) - (a.maj || 0)), n = nvx(e), fait = l.filter((p) => p.statut === "fait").length;
            return (
              <div className="card" key={e.id}>
                <div className="row between item" style={{ cursor: "pointer" }} onClick={() => ouvrir(e)}>
                  <div><b>{TYPES[e.type]?.ic} {e.theme}</b> <span className="muted">· {new Date(e.date).toLocaleDateString("fr-FR")}{admin && e.parNom ? " · " + e.parNom : ""}</span></div>
                  <div>{n > 0 && <span className="tag late">● {n} nouveau{n > 1 ? "x" : ""}</span>} <span className="tag">{l.length} inscrit{l.length > 1 ? "s" : ""}</span> <span className="tag ok">{fait} terminé{fait > 1 ? "s" : ""}</span> {ouvert === e.id ? "▲" : "▼"}</div>
                </div>
                {ouvert === e.id && (l.length ? <table className="tbl" style={{ marginTop: 8, width: "100%" }}><thead><tr><th>Participant</th><th>CIS</th><th>Département</th><th>Statut</th><th>Dernière info</th><th>Résultat</th></tr></thead><tbody>{l.map((p) => <><tr key={p.id}><td>{p.nom || "—"}</td><td>{p.cis || "—"}</td><td>{p.dept || "—"}</td><td>{STATUTS[p.statut] || p.statut}</td><td>{new Date(p.maj || p.le).toLocaleString("fr-FR")}</td><td>{p.res ? <button className="btn" onClick={() => setRes(res === p.id ? "" : p.id)}>{res === p.id ? "Masquer" : "Voir"}</button> : "—"}</td></tr>{res === p.id && p.res && <tr key={p.id + "r"}><td colSpan={6}><Resultat r={p.res} /></td></tr>}</>)}</tbody></table> : <p className="muted">Aucune inscription pour le moment.</p>)}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
