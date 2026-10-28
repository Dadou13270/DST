import TachesBilan from "../components/TachesBilan";
import AutoBilan from "../components/AutoBilan";
import { listExercices, typeExercice, listCatalogue } from "../lib/relation";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import HistoriqueSeances from "../components/HistoriqueSeances";
import { archiverEquipe, restaurerEquipe, dupliquerEquipe, listUtilisateursCis, affecterMembre, createEquipe, listMesEquipes, listMembres, regenCode, retirerMembre, supprimerEquipe, deplacerMembre, envoyerMessageFormateur, marquerFilLu, effacerFil } from "../lib/equipes";
import { fmtDate, fmtDuree, statsOf } from "../lib/users";
import { inscrireStagiaire, parseLignes } from "../lib/inscription";
import { listScenarios } from "../lib/db";
import { ajouterDevoir, retirerDevoir, statutDevoir, fmtLimite, limiteDepuisInput, assignerParcours, retirerParcours, modifierLimite, modifierLimiteParcours, inputDepuisLimite } from "../lib/devoirs";
import { listParcours } from "../lib/parcours";
import Parcours from "../components/Parcours";
import Frise from "../components/Frise";
import FilMessages, { nonLus, nonLusMembre } from "../components/FilMessages";
import TableauBord from "../components/TableauBord";
import SalleCard from "../components/SalleCard";
import { pdfEquipe } from "../lib/pdf";
import DemandeScenario from "../components/DemandeScenario";

const d = (t) => (t?.toDate ? t.toDate().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");

function Commentaire({ u, scId, auteur, onSaved }) {
  const c = (u.commentaires || {})[scId];
  const reps = (u.reponses || {})[scId];
  const nl = nonLus(c, reps);
  const [txt, setTxt] = useState("");
  const [etat, setEtat] = useState("");
  const [conf, setConf] = useState(false);
  const run = async (fn, ok) => {
    setEtat("…");
    try { await fn(); setEtat(ok); setTxt(""); setConf(false); onSaved(); } catch (e) { setEtat("Erreur : " + e.message); }
  };
  return (
    <div>
      {nl > 0 && <span className="tag late">{nl} réponse(s) non lue(s)</span>}
      {c && <FilMessages c={c} reps={reps} nomStagiaire={u.nom} />}
      <textarea rows={2} placeholder={c ? "Répondre au stagiaire…" : "Commentaire du formateur (visible par le stagiaire)…"} value={txt} onChange={(e) => setTxt(e.target.value)} maxLength={800} />
      <div className="row item">
        <button className="btn primary" disabled={!txt.trim()} onClick={() => run(() => envoyerMessageFormateur(u, scId, txt, auteur), "Envoyé")}>{c ? "Envoyer la réponse" : "Envoyer le commentaire"}</button>
        {nl > 0 && <button className="btn" onClick={() => run(() => marquerFilLu(u, scId), "Marqué comme lu")}>Marquer comme lu</button>}
        {c && (conf
          ? <button className="btn danger" onClick={() => run(() => effacerFil(u.id, scId), "Fil effacé")}>Confirmer ?</button>
          : <button className="btn danger" onClick={() => setConf(true)}>Effacer le fil</button>)}
        {etat && <span className="muted">{etat}</span>}
      </div>
    </div>
  );
}

function Devoirs({ team, membres, scs, pcs, onChange }) {
  const [pcId, setPcId] = useState("");
  const [pcLim, setPcLim] = useState("");
  const [scId, setScId] = useState("");
  const [lim, setLim] = useState("");
  const [err, setErr] = useState("");
  const [ed, setEd] = useState(null); // { k: "sc:<id>" | "pc:<id>", v }
  const dev = team.devoirs || [];
  const saveLim = async () => {
    if (!ed.v) return setErr("Indique une date.");
    const l = limiteDepuisInput(ed.v);
    try { await (ed.k.startsWith("pc:") ? modifierLimiteParcours(team, ed.k.slice(3), l) : modifierLimite(team, ed.k.slice(3), l)); setEd(null); setErr(""); onChange(); } catch (x) { setErr(x.message); }
  };
  const now = Date.now();
  const retards = dev.flatMap((d) => membres.filter((u) => statutDevoir(d, u.bilans, now, u.calculs) === "retard").map((u) => ({ u, d })));
  const add = async (e) => {
    e.preventDefault(); setErr("");
    const sc = scs.find((x) => x.id === scId);
    if (!sc) return setErr("Choisis un exercice.");
    if (!lim) return setErr("Indique une date limite.");
    if (dev.some((x) => x.scId === scId)) return setErr("Cet exercice est déjà dans la liste.");
    try { await ajouterDevoir(team, { scId, titre: sc.titre, limite: limiteDepuisInput(lim), ...(sc.kind && sc.kind !== "sc" ? { k: sc.kind } : {}) }); setScId(""); setLim(""); onChange(); } catch (x) { setErr(x.message); }
  };
  const assigner = async (e) => {
    e.preventDefault(); setErr("");
    const pc = pcs.find((x) => x.id === pcId);
    if (!pc) return setErr("Choisis un parcours.");
    if (!pcLim) return setErr("Indique une date limite.");
    try {
      const n = await assignerParcours(team, pc, scs, limiteDepuisInput(pcLim));
      if (!n) return setErr("Tous ces exercices sont déjà dans la liste.");
      setPcId(""); setPcLim(""); onChange();
    } catch (x) { setErr(x.message); }
  };
  const pcIds = [...new Set(dev.filter((x) => x.pc).map((x) => x.pc))];
  return (
    <div style={{ marginTop: 12 }}>
      <h3>Exercices à rendre</h3>
      {retards.length > 0 && (
        <div className="card alerte">
          <strong>Retards ({retards.length})</strong>
          {retards.map(({ u, d }) => <div key={u.id + d.scId}>{u.nom} — « {d.titre} » (échéance {fmtLimite(d.limite)})</div>)}
        </div>
      )}
      {dev.length === 0 && <p className="muted">Aucun exercice imposé. La liste est obligatoire pour les membres de l'équipe, avec une date limite.</p>}
      {dev.length > 0 && (
        <table className="cmp">
          <thead><tr><th>Exercice</th><th>Échéance</th><th>Rendus</th><th>En retard</th><th></th></tr></thead>
          <tbody>
            {dev.map((d) => {
              const ok = membres.filter((u) => statutDevoir(d, u.bilans, now, u.calculs) === "ok").length;
              const r = membres.filter((u) => statutDevoir(d, u.bilans, now, u.calculs) === "retard").length;
              return (
                <tr key={d.scId}>
                  <td>{d.pc ? `${(d.rg || 0) + 1}. ` : ""}{d.titre}{d.pcT && <div className="muted" style={{ fontSize: ".8rem" }}>Parcours « {d.pcT} »</div>}</td><td>{ed?.k === "sc:" + d.scId
                    ? <span className="row"><input type="date" value={ed.v} onChange={(e) => setEd({ ...ed, v: e.target.value })} style={{ width: "auto" }} /><button className="btn primary" onClick={saveLim}>OK</button><button className="btn" onClick={() => setEd(null)}>×</button></span>
                    : <>{fmtLimite(d.limite)} <button className="btn" title="Modifier l'échéance" onClick={() => setEd({ k: "sc:" + d.scId, v: inputDepuisLimite(d.limite) })}>Modifier</button></>}</td><td>{ok}/{membres.length}</td>
                  <td>{r > 0 ? <span className="tag late">{r}</span> : "0"}</td>
                  <td><button className="btn danger" onClick={() => retirerDevoir(team, d.scId).then(onChange)}>Retirer</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {pcIds.length > 0 && (
        <div className="item" style={{ marginTop: 8 }}>
          {pcIds.map((id) => (
            <div key={id} className="row item">
              <strong>Parcours « {dev.find((x) => x.pc === id)?.pcT} »</strong>
              {ed?.k === "pc:" + id
                ? <><input type="date" value={ed.v} onChange={(e) => setEd({ ...ed, v: e.target.value })} style={{ width: "auto" }} /><button className="btn primary" onClick={saveLim}>Décaler tout le parcours</button><button className="btn" onClick={() => setEd(null)}>Annuler</button></>
                : <button className="btn" onClick={() => setEd({ k: "pc:" + id, v: inputDepuisLimite(dev.find((x) => x.pc === id)?.limite) })}>Décaler l'échéance</button>}
              <button className="btn danger" onClick={() => retirerParcours(team, id).then(onChange)}>Retirer</button>
            </div>
          ))}
        </div>
      )}
      <form className="row item" onSubmit={assigner} style={{ marginTop: 8 }}>
        <select className="grow" value={pcId} onChange={(e) => setPcId(e.target.value)}>
          <option value="">Assigner un parcours…</option>
          {pcs.map((x) => <option key={x.id} value={x.id}>{x.titre} ({(x.scIds || []).length})</option>)}
        </select>
        <input type="date" value={pcLim} onChange={(e) => setPcLim(e.target.value)} style={{ width: "auto" }} />
        <button className="btn primary">Assigner</button>
      </form>
      <form className="row item" onSubmit={add} style={{ marginTop: 8 }}>
        <select value={scId} onChange={(e) => setScId(e.target.value)}>
          <option value="">Exercice à ajouter…</option>
          {scs.map((x) => <option key={x.id} value={x.id}>{x.titre}{x.kind === "rel" ? " · Relationnel" : x.kind === "calc" ? " · Calcul LIF" : ""}</option>)}
        </select>
        <input type="date" value={lim} onChange={(e) => setLim(e.target.value)} style={{ width: "auto" }} />
        <button className="btn primary">Ajouter</button>
      </form>
      {err && <p className="err">{err}</p>}
    </div>
  );
}

function FriseBilan({ b, sc }) {
  const [on, setOn] = useState(false);
  if (!sc) return null;
  if (!on) return <button className="btn" onClick={() => setOn(true)}>Voir la chronologie</button>;
  const sess = { log: (b.log || []).map((l) => ({ ...l, who: l.who })), start: b.fin - (b.duree || 0) * 1000, finishedAt: b.fin, evoT: b.evos };
  const interName = (id) => (sc.interlocuteurs || []).find((i) => i.id === id)?.nom || "?";
  return <Frise sc={sc} sess={sess} interName={interName} />;
}

function Equipe({ team, autres, scs, pcs, onChange }) {
  const { profil } = useAuth();
  const [m, setM] = useState(null);
  const [open, setOpen] = useState(null);
  const [conf, setConf] = useState("");
  const [err, setErr] = useState("");
  const [copie, setCopie] = useState(false);
  const [dup, setDup] = useState(null); // nom de la copie en cours de saisie
  const [decal, setDecal] = useState(0);
  const load = () => listMembres(team.id).then(setM).catch((e) => setErr(e.message));
  const [calcEx, setCalcEx] = useState([]);
  useEffect(() => { listExercices(true).then(setCalcEx).catch(() => {}); }, []);
  useEffect(() => { load(); }, [team.id]); // eslint-disable-line
  const run = async (fn) => { setErr(""); setConf(""); try { await fn(); } catch (e) { setErr(e.message); } };
  const two = (k, label, fn, cls = "") =>
    conf === k ? <button className="btn danger" onClick={() => run(fn)}>Confirmer ?</button>
      : <button className={`btn ${cls}`} onClick={() => setConf(k)}>{label}</button>;
  const tot = (m || []).reduce((a, u) => a + statsOf(u.bilans).n, 0);
  return (
    <div className="card">
      <div className="row between item">
        <div>
          <h2 style={{ margin: 0 }}>{team.nom}</h2>
          <div className="muted">{m ? `${m.length} membre(s) · ${tot} exercice(s) terminé(s)` : "Chargement…"}</div>
        </div>
        <div className="row item">
          {team.archivee ? <span className="tag">Archivée le {fmtLimite(team.archiveeLe)}</span> : <>
          <span className="muted">Code d'accès</span>
          <code style={{ fontSize: "1.3rem", letterSpacing: ".15em", fontWeight: 600 }}>{team.code}</code>
          <button className="btn" onClick={() => { navigator.clipboard?.writeText(team.code); setCopie(true); setTimeout(() => setCopie(false), 1500); }}>{copie ? "Copié" : "Copier"}</button></>}
          <button className="btn" disabled={!m} onClick={() => pdfEquipe(team, m)}>Export PDF</button>
          {!team.archivee && two("rg", "Nouveau code", async () => { await regenCode(team); onChange(); })}
          {team.archivee
            ? two("rs", "Restaurer", async () => { await restaurerEquipe(team); onChange(); }, "primary")
            : <>
                <button className="btn" onClick={() => setDup(team.nom + " (copie)")}>Dupliquer</button>
                {two("ar", "Archiver", async () => { await archiverEquipe(team); onChange(); })}
              </>}
          {two("del", "Supprimer l'équipe", async () => { await supprimerEquipe(team); onChange(); }, "danger")}
        </div>
      </div>
      {dup !== null && (
        <div className="row item">
          <input className="grow" value={dup} onChange={(e) => setDup(e.target.value)} placeholder="Nom de la nouvelle équipe" />
          <label className="row" style={{ gap: 4 }}>Décaler les échéances de <input type="number" value={decal} onChange={(e) => setDecal(Number(e.target.value) || 0)} style={{ width: 70 }} /> jours</label>
          <button className="btn primary" disabled={dup.trim().length < 2} onClick={() => run(async () => { await dupliquerEquipe(team, dup.trim(), decal); setDup(null); setDecal(0); onChange(); })}>Créer la copie</button>
          <button className="btn" onClick={() => setDup(null)}>Annuler</button>
        </div>
      )}
      {dup !== null && <p className="muted" style={{ margin: 0 }}>La copie reprend les exercices à rendre (nouveau code d'accès, sans les membres).</p>}
      {err && <p className="err">{err}</p>}
      {m && <Devoirs team={team} membres={m} scs={scs} pcs={pcs} onChange={onChange} />}
      {m && m.length === 0 && <p className="muted">Aucun membre. Donne le code aux stagiaires : ils le saisissent dans « Mon équipe ».</p>}
      {m && m.length > 0 && (
        <table className="cmp" style={{ marginTop: 10 }}>
          <thead><tr><th>Stagiaire</th><th>Terminés</th><th>Temps moyen</th><th>Essentielles</th><th>Dernière connexion</th><th></th></tr></thead>
          <tbody>
            {m.map((u) => {
              const st = statsOf(u.bilans);
              return [
                <tr key={u.id}>
                  <td><strong>{u.nom}</strong>{nonLusMembre(u) > 0 && <> <span className="tag late" title="Réponses non lues">💬 {nonLusMembre(u)}</span></>}<div className="muted">{[u.grade, u.cis].filter(Boolean).join(" · ") || u.email}</div></td>
                  <td>{st.n}</td><td>{st.n ? fmtDuree(st.tmoy) : "—"}</td><td>{st.ess === null ? "—" : st.ess + " %"}</td><td>{d(u.derniereConnexion)}</td>
                  <td>
                    <div className="row">
                      <button className="btn" onClick={() => setOpen(open === u.id ? null : u.id)}>{open === u.id ? "Masquer" : "Suivi"}</button>
                      <Link className="btn" to={`/messages?avec=${u.id}`} title="Envoyer un message privé">✉</Link>
                      {autres.length > 0 && (
                        <select value="" onChange={(e) => { const t = autres.find((x) => x.id === e.target.value); if (t) run(async () => { await deplacerMembre(u.id, t); await load(); onChange(); }); }}>
                          <option value="">Déplacer vers…</option>
                          {autres.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
                        </select>
                      )}
                      {two("rm" + u.id, "Retirer", async () => { await retirerMembre(u.id); await load(); }, "danger")}
                    </div>
                  </td>
                </tr>,
                open === u.id && (
                  <tr key={u.id + "d"}><td colSpan={6}>
                    {Object.keys(u.bilans || {}).length === 0 ? (Object.keys(u.calculs || {}).length === 0 ? <span className="muted">Aucun exercice terminé.</span> : null) : (
                      <table className="cmp">
                        <thead><tr><th>Exercice</th><th>Fin</th><th>Temps</th><th>Questions</th><th>Essentielles</th><th>Tent.</th></tr></thead>
                        <tbody>{Object.entries(u.bilans).map(([scId, b]) => [
                          <tr key={scId}><td>{b.titre}</td><td>{fmtDate(b.fin)}</td><td>{fmtDuree(b.duree || 0)}</td><td>{b.nbQ}</td><td>{b.essTot ? `${b.essOk}/${b.essTot}` : "—"}</td><td>{b.nb || 1}</td></tr>,
                          <tr key={scId + "f"}><td colSpan={6}><FriseBilan b={b} sc={scs.find((x) => x.id === scId)} /></td></tr>,
                          b.auto && <tr key={scId + "a"}><td colSpan={6}><AutoBilan auto={b.auto} /></td></tr>,
                          b.taches && <tr key={scId + "t"}><td colSpan={6}><TachesBilan taches={b.taches} /></td></tr>,
                          <tr key={scId + "c"}><td colSpan={6}><Commentaire u={u} scId={scId} auteur={profil?.nom || "Formateur"} onSaved={load} /></td></tr>,
                        ])}</tbody>
                      </table>
                    )}
                    {Object.keys(u.calculs || {}).length > 0 && (
                      <table className="cmp" style={{ marginTop: 8 }}>
                        <thead><tr><th>Exercice</th><th>Type</th><th>Essais</th><th>Dernier</th><th>Meilleur</th><th>Date</th></tr></thead>
                        <tbody>{Object.entries(u.calculs).map(([id, l]) => { const e = calcEx.find((x) => x.id === id); const d = l[l.length - 1]; return <tr key={id}><td>{e ? e.titre : id}</td><td>{typeExercice(e)}</td><td>{l.length}</td><td>{d.ok}/{d.tot}</td><td>{Math.max(...l.map((x) => x.ok))}/{d.tot}</td><td>{fmtDate(d.le)}</td></tr>; })}</tbody>
                      </table>
                    )}
                  </td></tr>
                ),
              ];
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Affectation rapide : liste déroulante des utilisateurs du CIS du gestionnaire.
function AffecterCis({ teams, profil, user, onDone }) {
  const [tid, setTid] = useState(teams[0]?.id || "");
  const [users, setUsers] = useState(null);
  const [sel, setSel] = useState([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const ok = Boolean(profil?.cis && profil?.departement);
  useEffect(() => { if (ok) listUtilisateursCis(profil.departement, profil.cis).then(setUsers).catch((e) => { setUsers([]); setMsg("Lecture impossible : " + e.message); }); else setUsers([]); }, [profil?.cis, profil?.departement]); // eslint-disable-line
  const team = teams.find((t) => t.id === (tid || teams[0]?.id));
  const dispo = (users || []).filter((u) => u.id !== user?.uid && u.equipeId !== team?.id && !sel.some((x) => x.id === u.id));
  const go = async () => {
    setBusy(true); setMsg("");
    let n = 0; const ko = [];
    for (const u of sel) { try { await affecterMembre(u.id, team); n++; } catch (e) { ko.push(`${u.nom} (${e.code || e.message})`); } }
    setSel([]); setBusy(false);
    setMsg(`${n} utilisateur(s) affecté(s) à ${team.nom}.` + (ko.length ? " Échec : " + ko.join(", ") : ""));
    listUtilisateursCis(profil.departement, profil.cis).then(setUsers).catch(() => {});
    onDone();
  };
  return (
    <div className="card form">
      <h2>Affecter des utilisateurs de mon CIS</h2>
      {!ok ? <p className="muted">Renseigne ton département et ton CIS dans <Link to="/profil">Mon profil</Link> pour voir les utilisateurs de ton centre.</p> : (
        <>
          <p className="muted">Utilisateurs déjà inscrits sur l'application et rattachés à {profil.cis} ({profil.departement}). Choisis-les dans la liste, puis affecte-les à l'équipe.</p>
          <label>Équipe</label>
          <select value={tid || teams[0]?.id} onChange={(e) => setTid(e.target.value)}>{teams.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}</select>
          <label>Utilisateur du CIS</label>
          <select value="" onChange={(e) => { const u = users.find((x) => x.id === e.target.value); if (u) setSel([...sel, u]); }} disabled={!users}>
            <option value="">{users === null ? "Chargement…" : dispo.length ? `Choisir un utilisateur (${dispo.length})…` : "Aucun autre utilisateur disponible"}</option>
            {dispo.map((u) => <option key={u.id} value={u.id}>{u.nom}{u.grade ? " — " + u.grade : ""}{u.equipeNom ? ` (équipe : ${u.equipeNom})` : ""}</option>)}
          </select>
          {sel.length > 0 && (
            <div className="chips">
              {sel.map((u) => <button type="button" key={u.id} className="chip on" onClick={() => setSel(sel.filter((x) => x.id !== u.id))} title="Retirer de la sélection">{u.nom} ✕</button>)}
            </div>
          )}
          <button className="btn primary" disabled={!sel.length || busy} onClick={go}>{busy ? "Affectation…" : `Affecter ${sel.length || ""} à l'équipe`}</button>
          {msg && <p className={msg.includes("Échec") || msg.includes("impossible") ? "err" : "ok-txt"}>{msg}</p>}
          <p className="muted">Les utilisateurs rattachés à une autre équipe d'un autre gestionnaire n'apparaissent pas comme affectables : ils doivent d'abord quitter leur équipe.</p>
        </>
      )}
    </div>
  );
}

function Inscription({ teams, user, onDone }) {
  const [tid, setTid] = useState(teams[0]?.id || "");
  const [txt, setTxt] = useState("");
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copie, setCopie] = useState(false);
  const go = async (e) => {
    e.preventDefault();
    const team = teams.find((t) => t.id === (tid || teams[0]?.id));
    if (!team) return;
    setBusy(true);
    const out = [];
    for (const l of parseLignes(txt)) {
      try { await inscrireStagiaire(l, team, user.uid); out.push({ ...l, ok: true, equipe: team.nom }); }
      catch (x) { out.push({ ...l, ok: false, err: x.message }); }
    }
    setRes(out); setBusy(false); setTxt(""); onDone();
  };
  const recap = (res || []).filter((r) => r.ok).map((r) => `${r.nom} — ${r.email} — mot de passe : ${r.mdp}`).join("\n");
  return (
    <form className="card form" onSubmit={go}>
      <h2>Inscrire des stagiaires</h2>
      <p className="muted">Un stagiaire par ligne : <code>Nom ; e-mail ; mot de passe</code> (mot de passe facultatif : généré sinon). Le stagiaire se connecte ensuite avec cet e-mail et ce mot de passe, déjà affecté à l'équipe choisie.</p>
      <label>Équipe</label>
      <select value={tid || teams[0]?.id} onChange={(e) => setTid(e.target.value)}>{teams.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}</select>
      <label>Stagiaires</label>
      <textarea rows={4} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={"Zoé Léger ; zoe@exemple.fr\nPaul Martin ; paul@exemple.fr ; Motdepasse1"} required />
      <button className="btn primary" disabled={busy}>{busy ? "Inscription…" : "Inscrire"}</button>
      {res && (
        <div style={{ marginTop: 12 }}>
          {res.map((r, i) => (
            <div key={i} className={r.ok ? "ok-txt" : "err"}>
              {r.ok ? "✓" : "✗"} {r.nom || "(sans nom)"} — {r.email || "?"} {r.ok ? `→ ${r.equipe}` : `: ${r.err}`}
            </div>
          ))}
          {recap && (
            <>
              <p className="muted">À transmettre aux stagiaires (ils pourront changer leur mot de passe dans Mon profil) :</p>
              <pre className="card pre">{recap}</pre>
              <button type="button" className="btn" onClick={() => { navigator.clipboard?.writeText(recap); setCopie(true); }}>{copie ? "Copié" : "Copier les identifiants"}</button>
            </>
          )}
        </div>
      )}
    </form>
  );
}

export default function Gestion() {
  const { user, profil, isAdmin, loading } = useAuth();
  const [teams, setTeams] = useState(null);
  const [nom, setNom] = useState("");
  const [err, setErr] = useState("");
  const [scs, setScs] = useState([]);
  const [pcs, setPcs] = useState([]);
  const [onglet, setOnglet] = useState("eq");
  const loadPcs = () => listParcours(user.uid, isAdmin).then(setPcs).catch(() => {});
  useEffect(() => { if (user) loadPcs(); }, [user?.uid, isAdmin]); // eslint-disable-line
  useEffect(() => { if (user) listCatalogue({ uid: user.uid, equipeId: profil?.equipeId }).then(setScs).catch(() => {}); }, [user?.uid]); // eslint-disable-line
  const ok = Boolean(profil?.gestionnaire || isAdmin);
  const load = () => listMesEquipes(user.uid).then(setTeams).catch((e) => setErr(e.message));
  useEffect(() => { if (user && ok) load(); }, [user, ok]); // eslint-disable-line
  if (loading || !profil) return <Layout><p>Chargement…</p></Layout>;
  if (!ok) return <Navigate to="/" replace />;
  const creer = async (e) => {
    e.preventDefault();
    setErr("");
    try { await createEquipe(user.uid, profil.nom, nom.trim()); setNom(""); await load(); } catch (x) { setErr(x.message); }
  };
  const actives = (teams || []).filter((t) => !t.archivee), archivees = (teams || []).filter((t) => t.archivee);
  const onglets = [["eq", "Équipes"], ["tb", "Tableau de bord"], ["pc", "Parcours pédagogiques"], ["sa", "Séance en salle"], ["hs", "Historique des séances"], ["dm", "Demande de scénario"]];
  return (
    <Layout>
      <div className="row between item"><h1>Espace gestionnaire</h1><Link className="btn" to="/messages">✉ Messagerie</Link></div>
      <div className="tabs" style={{ marginBottom: 14 }}>
        {onglets.map(([k, l]) => <button key={k} className={onglet === k ? "on" : ""} onClick={() => setOnglet(k)}>{l}</button>)}
      </div>
      {onglet === "eq" && (
        <>
          <form className="card row item" onSubmit={creer}>
        <input className="grow" placeholder="Nom de la nouvelle équipe (ex. FMPA Chef d'agrès 2026)" value={nom} onChange={(e) => setNom(e.target.value)} required minLength={2} />
        <button className="btn primary">Créer l'équipe</button>
      </form>
      {actives.length > 0 && <AffecterCis teams={actives} profil={profil} user={user} onDone={load} />}
      {actives.length > 0 && <Inscription teams={actives} user={user} onDone={load} />}
      {actives.length > 0 && (
        <p className="muted">
          Tu peux créer plusieurs équipes. Les stagiaires rejoignent avec le code de n'importe laquelle de tes équipes, puis tu les répartis avec « Déplacer vers… ».
        </p>
      )}
      {err && <div className="card warn">Erreur : {err} (les règles Firestore sont-elles republiées ?)</div>}
      {!teams && !err && <p>Chargement…</p>}
      {teams && actives.length === 0 && <div className="card">Aucune équipe. Crée-en une : un code d'accès est généré.</div>}
      {actives.map((t) => <Equipe key={t.id} team={t} autres={actives.filter((x) => x.id !== t.id)} scs={scs} pcs={pcs} onChange={load} />)}
      {archivees.length > 0 && (
        <>
          <h2 style={{ marginTop: 24 }}>Équipes archivées ({archivees.length})</h2>
          <p className="muted">Formations terminées : suivi conservé, plus d'inscription possible. « Restaurer » génère un nouveau code d'accès.</p>
          {archivees.map((t) => <Equipe key={t.id} team={t} autres={[]} scs={scs} pcs={pcs} onChange={load} />)}
        </>
      )}
        </>
      )}
      {onglet === "hs" && <HistoriqueSeances user={user} />}
      {onglet === "tb" && <TableauBord teams={actives} scs={scs} />}
      {onglet === "pc" && <Parcours user={user} profil={profil} isAdmin={isAdmin} scs={scs} pcs={pcs} onChange={loadPcs} />}
      {onglet === "sa" && <SalleCard scs={scs.filter((x) => x.kind === "sc")} />}
      {onglet === "dm" && <DemandeScenario user={user} profil={profil} />}
    </Layout>
  );
}
