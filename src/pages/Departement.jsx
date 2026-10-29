import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { setGestionnaire } from "../lib/equipes";
import { statsOf, fmtDate, fmtDuree } from "../lib/users";
import { statutDevoir } from "../lib/devoirs";
import { traiterDemandeGest } from "../lib/gestionnaires";
import { CIBLES, creerAnnonce, listAnnonces, majAnnonce, supprimerAnnonce } from "../lib/annonces";

const lire = async (col, dept) => (await getDocs(query(collection(db, col), where("departement", "==", dept)))).docs.map((d) => ({ id: d.id, ...d.data() }));
const ms = (t) => (t?.toMillis ? t.toMillis() : t?.seconds ? t.seconds * 1000 : 0);

function Stats({ users, teams }) {
  const now = Date.now();
  const bil = {}; users.forEach((u) => Object.entries(u.bilans || {}).forEach(([k, b]) => { bil[u.id + "_" + k] = b; }));
  const st = statsOf(bil);
  const actifs = users.filter((u) => now - ms(u.derniereConnexion) < 30 * 864e5).length;
  const parCis = {};
  users.forEach((u) => { const c = u.cis || "(non renseigné)"; const o = (parCis[c] = parCis[c] || { n: 0, g: 0, b: {} }); o.n++; if (u.gestionnaire) o.g++; Object.entries(u.bilans || {}).forEach(([k, b]) => { o.b[u.id + k] = b; }); });
  const lignesTeams = teams.map((t) => {
    const m = users.filter((u) => u.equipeId === t.id);
    const retards = (t.devoirs || []).reduce((n, d) => n + m.filter((u) => statutDevoir(d, u.bilans, now, u.calculs) === "retard").length, 0);
    const rendus = (t.devoirs || []).reduce((n, d) => n + m.filter((u) => statutDevoir(d, u.bilans, now, u.calculs) === "ok").length, 0);
    return { t, n: m.length, term: m.reduce((n, u) => n + Object.keys(u.bilans || {}).length, 0), retards, rendus, attendus: (t.devoirs || []).length * m.length };
  });
  const parSc = {};
  Object.values(bil).forEach((b) => { const o = (parSc[b.titre] = parSc[b.titre] || { n: 0, e: 0, t: 0 }); o.n++; o.e += b.essOk || 0; o.t += b.essTot || 0; });
  const topSc = Object.entries(parSc).sort((a, b) => b[1].n - a[1].n).slice(0, 8);
  return (
    <>
      <div className="sv-kpis">
        {[["Utilisateurs", users.length], ["Actifs sur 30 jours", actifs], ["Gestionnaires", users.filter((u) => u.gestionnaire).length], ["Équipes", teams.length], ["Exercices terminés", st.n], ["Temps moyen", st.n ? fmtDuree(st.tmoy) : "—"], ["Questions essentielles", st.ess === null ? "—" : st.ess + " %"]]
          .map(([l, v]) => <div className="card" key={l}><div className="muted">{l}</div><h2>{v}</h2></div>)}
      </div>
      <h3>Par CIS</h3>
      <table className="cmp"><thead><tr><th>CIS</th><th>Utilisateurs</th><th>Gestionnaires</th><th>Exercices terminés</th><th>Essentielles</th></tr></thead>
        <tbody>{Object.entries(parCis).sort((a, b) => b[1].n - a[1].n).map(([c, o]) => { const s = statsOf(o.b); return <tr key={c}><td>{c}</td><td>{o.n}</td><td>{o.g}</td><td>{s.n}</td><td>{s.ess === null ? "—" : s.ess + " %"}</td></tr>; })}</tbody></table>
      <h3>Équipes</h3>
      {lignesTeams.length === 0 ? <p className="muted">Aucune équipe. Les équipes anciennes apparaissent après la prochaine connexion de leur gestionnaire.</p> : (
        <table className="cmp"><thead><tr><th>Équipe</th><th>Gestionnaire</th><th>Membres</th><th>Exercices terminés</th><th>Rendus / attendus</th><th>En retard</th></tr></thead>
          <tbody>{lignesTeams.map(({ t, n, term, retards, rendus, attendus }) => <tr key={t.id}><td>{t.nom}{t.archivee && <span className="tag"> archivée</span>}</td><td>{t.ownerNom || "—"}</td><td>{n}</td><td>{term}</td><td>{attendus ? `${rendus}/${attendus}` : "—"}</td><td>{retards ? <span className="tag late">{retards}</span> : 0}</td></tr>)}</tbody></table>
      )}
      <h3>Exercices les plus joués</h3>
      {topSc.length === 0 ? <p className="muted">Aucun exercice terminé.</p> : (
        <table className="cmp"><thead><tr><th>Exercice</th><th>Terminés</th><th>Essentielles</th></tr></thead>
          <tbody>{topSc.map(([t, o]) => <tr key={t}><td>{t}</td><td>{o.n}</td><td>{o.t ? Math.round((100 * o.e) / o.t) + " %" : "—"}</td></tr>)}</tbody></table>
      )}
      <p className="muted">Statistiques agrégées du département : aucun résultat nominatif n'est affiché dans cet espace.</p>
    </>
  );
}

function Demandes({ dept, profil }) {
  const [l, setL] = useState(null);
  const [msg, setMsg] = useState("");
  const [raison, setRaison] = useState({});
  const charger = () => lire("demandesGest", dept).then((x) => setL(x.sort((a, b) => (b.le || 0) - (a.le || 0)))).catch((e) => { setL([]); setMsg("Erreur : " + e.message); });
  useEffect(() => { charger(); }, [dept]); // eslint-disable-line
  const go = async (d, ok) => { setMsg(""); try { await traiterDemandeGest(d, ok, profil?.nom || "Admin département", raison[d.id] || ""); setMsg(`${d.nom} : ${ok ? "droit gestionnaire accordé" : "demande refusée"}.`); charger(); } catch (e) { setMsg("Erreur : " + e.message); } };
  const att = (l || []).filter((d) => d.statut === "attente"), hist = (l || []).filter((d) => d.statut !== "attente");
  return (
    <>
      {msg && <p className="tag ok" style={{ display: "block" }}>{msg}</p>}
      {!l && <p>Chargement…</p>}
      {l && !att.length && <div className="card">Aucune demande en attente dans ton département.</div>}
      {att.map((d) => (
        <div className="card" key={d.id}>
          <div className="row between item"><div><strong>{d.nom}</strong> <span className="muted">{[d.grade, d.cis].filter(Boolean).join(" · ")} · {fmtDate(d.le)}</span></div>
            <div className="row"><button className="btn primary" onClick={() => go(d, true)}>Accepter</button><button className="btn danger" onClick={() => go(d, false)}>Refuser</button></div></div>
          <p className="pre" style={{ margin: "4px 0" }}>{d.motif}</p>
          <input placeholder="Motif du refus (facultatif)" value={raison[d.id] || ""} onChange={(e) => setRaison({ ...raison, [d.id]: e.target.value })} />
        </div>
      ))}
      {hist.length > 0 && <><h3>Historique</h3><table className="cmp"><thead><tr><th>Demandeur</th><th>Décision</th><th>Date</th></tr></thead><tbody>{hist.map((d) => <tr key={d.id}><td>{d.nom}</td><td><span className={d.statut === "acceptee" ? "tag ok" : "tag"}>{d.statut === "acceptee" ? "Acceptée" : "Refusée"}</span>{d.raison && <div className="muted">{d.raison}</div>}</td><td>{fmtDate(d.traiteLe)}</td></tr>)}</tbody></table></>}
    </>
  );
}

function Gestionnaires({ users, uid, onChange }) {
  const [q, setQ] = useState("");
  const [conf, setConf] = useState(null);
  const [err, setErr] = useState("");
  const l = users.filter((u) => u.id !== uid && (!q || `${u.nom} ${u.cis}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => (b.gestionnaire ? 1 : 0) - (a.gestionnaire ? 1 : 0) || (a.nom || "").localeCompare(b.nom || "", "fr"));
  const go = async (u) => { setErr(""); try { await setGestionnaire(u.id, !u.gestionnaire); setConf(null); onChange(); } catch (e) { setErr(e.message); } };
  return (
    <>
      <input placeholder="Rechercher un nom ou un CIS…" value={q} onChange={(e) => setQ(e.target.value)} />
      {err && <p className="err">{err}</p>}
      <table className="cmp"><thead><tr><th>Nom</th><th>CIS</th><th>Rôle</th><th></th></tr></thead>
        <tbody>{l.slice(0, 200).map((u) => <tr key={u.id}><td>{u.nom}</td><td>{u.cis || "—"}</td><td>{u.gestionnaire ? <span className="tag ok">Gestionnaire</span> : "Stagiaire"}</td>
          <td>{conf === u.id ? <button className="btn danger" onClick={() => go(u)}>Confirmer ?</button> : <button className="btn" onClick={() => setConf(u.id)}>{u.gestionnaire ? "Retirer le rôle" : "Accorder le rôle gestionnaire"}</button>}</td></tr>)}</tbody></table>
    </>
  );
}

function Annonces({ dept, profil }) {
  const [l, setL] = useState(null);
  const [f, setF] = useState({ texte: "", niveau: "info", cis: "", fin: "" });
  const [msg, setMsg] = useState("");
  const charger = () => listAnnonces().then((x) => setL(x.filter((a) => a.deptAuteur === dept))).catch((e) => { setL([]); setMsg("Erreur : " + e.message); });
  useEffect(() => { charger(); }, [dept]); // eslint-disable-line
  const publier = async (e) => {
    e.preventDefault(); setMsg("");
    try {
      await creerAnnonce({ texte: f.texte, niveau: f.niveau, cible: f.cis.trim() ? { type: "cis", dep: dept, cis: f.cis.trim() } : { type: "dep", dep: dept }, fin: f.fin ? new Date(f.fin + "T23:59:59").getTime() : 0 }, profil?.nom, dept);
      setF({ texte: "", niveau: "info", cis: "", fin: "" }); setMsg("Annonce publiée."); charger();
    } catch (x) { setMsg("Erreur : " + x.message); }
  };
  return (
    <>
      <form className="card form" onSubmit={publier}>
        <label>Message pour le département {dept}</label>
        <textarea rows={3} maxLength={600} required value={f.texte} onChange={(e) => setF({ ...f, texte: e.target.value })} />
        <div className="row item">
          <select value={f.niveau} onChange={(e) => setF({ ...f, niveau: e.target.value })}><option value="info">Information</option><option value="alerte">Alerte</option></select>
          <input placeholder="Limiter à un CIS (facultatif)" value={f.cis} onChange={(e) => setF({ ...f, cis: e.target.value })} />
          <label className="row" style={{ gap: 4 }}>Jusqu'au <input type="date" value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} style={{ width: "auto" }} /></label>
        </div>
        <button className="btn primary">Publier</button> {msg && <span className="muted">{msg}</span>}
      </form>
      {(l || []).map((a) => (
        <div className="card" key={a.id}>
          <div className="row between"><span><span className={a.actif ? "tag ok" : "tag"}>{a.actif ? "Active" : "Désactivée"}</span> <span className="muted">→ {a.cible?.type === "cis" ? "CIS " + a.cible.cis : CIBLES.dep + " " + dept} · {fmtDate(a.le)}</span></span>
            <span className="row"><button className="btn" onClick={() => majAnnonce(a.id, { actif: !a.actif }).then(charger)}>{a.actif ? "Désactiver" : "Réactiver"}</button><button className="btn danger" onClick={() => supprimerAnnonce(a.id).then(charger)}>Supprimer</button></span></div>
          <p className="pre" style={{ margin: "4px 0 0" }}>{a.texte}</p>
        </div>
      ))}
    </>
  );
}

// Espace de l'admin de département : statistiques agrégées, demandes et droits gestionnaire, annonces — pour son seul département
export default function Departement() {
  const { user, profil, loading } = useAuth();
  const dept = profil?.adminDept || "";
  const [onglet, setOnglet] = useState("st");
  const [users, setUsers] = useState(null);
  const [teams, setTeams] = useState(null);
  const [err, setErr] = useState("");
  const charger = () => Promise.all([lire("users", dept), lire("teams", dept)]).then(([u, t]) => { setUsers(u); setTeams(t); }).catch((e) => setErr(e.message));
  useEffect(() => { if (dept) charger(); }, [dept]); // eslint-disable-line
  const onglets = useMemo(() => [["st", "Statistiques"], ["dm", "Demandes gestionnaires"], ["gs", "Gestionnaires"], ["an", "Annonces"]], []);
  if (loading || !profil) return <Layout><p>Chargement…</p></Layout>;
  if (!user || !dept) return <Navigate to="/" replace />;
  return (
    <Layout>
      <h1>Espace département</h1>
      <p className="muted">Département : <strong>{dept}</strong></p>
      <div className="tabs" style={{ marginBottom: 14 }}>{onglets.map(([k, l]) => <button key={k} className={onglet === k ? "on" : ""} onClick={() => setOnglet(k)}>{l}</button>)}</div>
      {err && <div className="card warn">Erreur : {err} (les règles Firestore sont-elles publiées ?)</div>}
      {onglet !== "dm" && onglet !== "an" && !users && !err && <p>Chargement…</p>}
      {onglet === "st" && users && teams && <Stats users={users} teams={teams} />}
      {onglet === "dm" && <Demandes dept={dept} profil={profil} />}
      {onglet === "gs" && users && <Gestionnaires users={users} uid={user.uid} onChange={charger} />}
      {onglet === "an" && <Annonces dept={dept} profil={profil} />}
    </Layout>
  );
}
