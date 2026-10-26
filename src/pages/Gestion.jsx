import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { createEquipe, listMesEquipes, listMembres, regenCode, retirerMembre, supprimerEquipe, deplacerMembre, setCommentaire } from "../lib/equipes";
import { fmtDate, fmtDuree, statsOf } from "../lib/users";
import { inscrireStagiaire, parseLignes } from "../lib/inscription";
import { listScenarios } from "../lib/db";
import { ajouterDevoir, retirerDevoir, statutDevoir, fmtLimite, limiteDepuisInput } from "../lib/devoirs";
import SalleCard from "../components/SalleCard";
import { pdfEquipe } from "../lib/pdf";
import DemandeScenario from "../components/DemandeScenario";

const d = (t) => (t?.toDate ? t.toDate().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");

function Commentaire({ u, scId, auteur, onSaved }) {
  const c = (u.commentaires || {})[scId];
  const [txt, setTxt] = useState(c?.texte || "");
  const [etat, setEtat] = useState("");
  const save = async () => {
    setEtat("…");
    try { await setCommentaire(u.id, scId, txt, auteur); setEtat("Enregistré"); onSaved(); } catch (e) { setEtat("Erreur : " + e.message); }
  };
  return (
    <div>
      <textarea rows={2} placeholder="Commentaire du formateur (visible par le stagiaire)…" value={txt} onChange={(e) => setTxt(e.target.value)} maxLength={800} />
      <div className="row item">
        <button className="btn" onClick={save}>Enregistrer le commentaire</button>
        {etat && <span className="muted">{etat}</span>}
        {c && <span className="muted">Dernier : {c.auteur}, {fmtDate(c.le)}</span>}
      </div>
    </div>
  );
}

function Devoirs({ team, membres, scs, onChange }) {
  const [scId, setScId] = useState("");
  const [lim, setLim] = useState("");
  const [err, setErr] = useState("");
  const dev = team.devoirs || [];
  const now = Date.now();
  const retards = dev.flatMap((d) => membres.filter((u) => statutDevoir(d, u.bilans, now) === "retard").map((u) => ({ u, d })));
  const add = async (e) => {
    e.preventDefault(); setErr("");
    const sc = scs.find((x) => x.id === scId);
    if (!sc) return setErr("Choisis un exercice.");
    if (!lim) return setErr("Indique une date limite.");
    if (dev.some((x) => x.scId === scId)) return setErr("Cet exercice est déjà dans la liste.");
    try { await ajouterDevoir(team, { scId, titre: sc.titre, limite: limiteDepuisInput(lim) }); setScId(""); setLim(""); onChange(); } catch (x) { setErr(x.message); }
  };
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
              const ok = membres.filter((u) => statutDevoir(d, u.bilans, now) === "ok").length;
              const r = membres.filter((u) => statutDevoir(d, u.bilans, now) === "retard").length;
              return (
                <tr key={d.scId}>
                  <td>{d.titre}</td><td>{fmtLimite(d.limite)}</td><td>{ok}/{membres.length}</td>
                  <td>{r > 0 ? <span className="tag late">{r}</span> : "0"}</td>
                  <td><button className="btn danger" onClick={() => retirerDevoir(team, d.scId).then(onChange)}>Retirer</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <form className="row item" onSubmit={add} style={{ marginTop: 8 }}>
        <select value={scId} onChange={(e) => setScId(e.target.value)}>
          <option value="">Exercice à ajouter…</option>
          {scs.map((x) => <option key={x.id} value={x.id}>{x.titre}</option>)}
        </select>
        <input type="date" value={lim} onChange={(e) => setLim(e.target.value)} style={{ width: "auto" }} />
        <button className="btn primary">Ajouter</button>
      </form>
      {err && <p className="err">{err}</p>}
    </div>
  );
}

function Equipe({ team, autres, scs, onChange }) {
  const { profil } = useAuth();
  const [m, setM] = useState(null);
  const [open, setOpen] = useState(null);
  const [conf, setConf] = useState("");
  const [err, setErr] = useState("");
  const [copie, setCopie] = useState(false);
  const load = () => listMembres(team.id).then(setM).catch((e) => setErr(e.message));
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
          <span className="muted">Code d'accès</span>
          <code style={{ fontSize: "1.3rem", letterSpacing: ".15em", fontWeight: 600 }}>{team.code}</code>
          <button className="btn" onClick={() => { navigator.clipboard?.writeText(team.code); setCopie(true); setTimeout(() => setCopie(false), 1500); }}>{copie ? "Copié" : "Copier"}</button>
          <button className="btn" disabled={!m} onClick={() => pdfEquipe(team, m)}>Export PDF</button>
          {two("rg", "Nouveau code", async () => { await regenCode(team); onChange(); })}
          {two("del", "Supprimer l'équipe", async () => { await supprimerEquipe(team); onChange(); }, "danger")}
        </div>
      </div>
      {err && <p className="err">{err}</p>}
      {m && <Devoirs team={team} membres={m} scs={scs} onChange={onChange} />}
      {m && m.length === 0 && <p className="muted">Aucun membre. Donne le code aux stagiaires : ils le saisissent dans « Mon équipe ».</p>}
      {m && m.length > 0 && (
        <table className="cmp" style={{ marginTop: 10 }}>
          <thead><tr><th>Stagiaire</th><th>Terminés</th><th>Temps moyen</th><th>Essentielles</th><th>Dernière connexion</th><th></th></tr></thead>
          <tbody>
            {m.map((u) => {
              const st = statsOf(u.bilans);
              return [
                <tr key={u.id}>
                  <td><strong>{u.nom}</strong><div className="muted">{[u.grade, u.cis].filter(Boolean).join(" · ") || u.email}</div></td>
                  <td>{st.n}</td><td>{st.n ? fmtDuree(st.tmoy) : "—"}</td><td>{st.ess === null ? "—" : st.ess + " %"}</td><td>{d(u.derniereConnexion)}</td>
                  <td>
                    <div className="row">
                      <button className="btn" onClick={() => setOpen(open === u.id ? null : u.id)}>{open === u.id ? "Masquer" : "Suivi"}</button>
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
                    {Object.keys(u.bilans || {}).length === 0 ? <span className="muted">Aucun exercice terminé.</span> : (
                      <table className="cmp">
                        <thead><tr><th>Exercice</th><th>Fin</th><th>Temps</th><th>Questions</th><th>Essentielles</th><th>Tent.</th></tr></thead>
                        <tbody>{Object.entries(u.bilans).map(([scId, b]) => [
                          <tr key={scId}><td>{b.titre}</td><td>{fmtDate(b.fin)}</td><td>{fmtDuree(b.duree || 0)}</td><td>{b.nbQ}</td><td>{b.essTot ? `${b.essOk}/${b.essTot}` : "—"}</td><td>{b.nb || 1}</td></tr>,
                          <tr key={scId + "c"}><td colSpan={6}><Commentaire u={u} scId={scId} auteur={profil?.nom || "Formateur"} onSaved={load} /></td></tr>,
                        ])}</tbody>
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
  useEffect(() => { if (user) listScenarios(true, { uid: user.uid, equipeId: profil?.equipeId }).then(setScs).catch(() => {}); }, [user?.uid]); // eslint-disable-line
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
  return (
    <Layout>
      <h1>Espace gestionnaire</h1>
      <form className="card row item" onSubmit={creer}>
        <input className="grow" placeholder="Nom de la nouvelle équipe (ex. FMPA Chef d'agrès 2026)" value={nom} onChange={(e) => setNom(e.target.value)} required minLength={2} />
        <button className="btn primary">Créer l'équipe</button>
      </form>
      {teams && teams.length > 0 && <Inscription teams={teams} user={user} onDone={load} />}
      {teams && teams.length > 0 && (
        <p className="muted">
          Tu peux créer plusieurs équipes. Les stagiaires rejoignent avec le code de n'importe laquelle de tes équipes, puis tu les répartis avec « Déplacer vers… ».
        </p>
      )}
      {err && <div className="card warn">Erreur : {err} (les règles Firestore sont-elles republiées ?)</div>}
      {!teams && !err && <p>Chargement…</p>}
      {teams && teams.length === 0 && <div className="card">Aucune équipe. Crée-en une : un code d'accès est généré.</div>}
      {(teams || []).map((t) => <Equipe key={t.id} team={t} autres={teams.filter((x) => x.id !== t.id)} scs={scs} onChange={load} />)}
      <SalleCard scs={scs} />
      <DemandeScenario user={user} profil={profil} />
    </Layout>
  );
}
