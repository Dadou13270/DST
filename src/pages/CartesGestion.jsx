import { useEffect, useState } from "react";
import CarteMentale from "../components/CarteMentale";
import { COULEURS, arbreVide, modifier, ajouter, retirer, bouger, aplatir, masquees, juste, scoreCarte, listMesCartes, sauverCarte, supprimerCarte, attribuer, retirerAttribution, prevenirEquipe } from "../lib/cartes";
import { listMembres } from "../lib/equipes";
import { fmtLimite, limiteDepuisInput, inputDepuisLimite } from "../lib/devoirs";

// Gestionnaire : créer des cartes mentales (à consulter ou à compléter) et les proposer à ses équipes.
function Editeur({ init, user, profil, onFin }) {
  const [c, setC] = useState(init);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const exo = c.mode === "exo";
  const set = (f) => setC((x) => ({ ...x, arbre: f(x.arbre) }));
  const lignes = aplatir(c.arbre);
  const save = async () => {
    setBusy(true); setErr("");
    try { const id = await sauverCarte(c, user, profil); onFin(true, id); } catch (e) { setErr(e.message || "Erreur"); setBusy(false); }
  };
  return (
    <div className="card">
      <div className="row between item">
        <h2 style={{ margin: 0 }}>{c.id ? "Modifier la carte mentale" : "Nouvelle carte mentale"}</h2>
        <div className="row"><button className="btn" onClick={() => onFin(false)}>Annuler</button><button className="btn primary" disabled={busy} onClick={save}>{busy ? "Enregistrement…" : "Enregistrer"}</button></div>
      </div>
      {err && <p className="err">{err}</p>}
      <div className="row item" style={{ flexWrap: "wrap" }}>
        <input type="text" style={{ flex: "1 1 240px" }} value={c.titre} onChange={(e) => setC({ ...c, titre: e.target.value })} placeholder="Titre de la carte (ex. Les risques d'un feu d'habitation)" aria-label="Titre" />
        <select value={c.mode} onChange={(e) => setC({ ...c, mode: e.target.value })} aria-label="Type de carte">
          <option value="consult">À consulter (fiche visuelle)</option>
          <option value="exo">À compléter (exercice)</option>
        </select>
      </div>
      <p className="muted" style={{ margin: "6px 0" }}>{exo ? "Clique sur 🙈 pour masquer une branche : le stagiaire devra la retrouver, puis comparera avec le corrigé." : "Construis l'arbre : idée centrale, branches et sous-branches. Le stagiaire la consulte comme une fiche."}</p>
      <div style={{ marginBottom: 12 }}>
        {lignes.map(({ n, niv }) => (
          <div className="cm-ed" key={n.id} style={{ marginLeft: niv * 22 }}>
            <input type="text" value={n.t} onChange={(e) => set((a) => modifier(a, n.id, { t: e.target.value }))} aria-label="Texte de la branche" style={niv === 0 ? { fontWeight: 600 } : undefined} />
            {niv === 1 && COULEURS.map((k) => <button key={k} type="button" className={"cm-dot" + (n.c === k ? " on" : "")} style={{ background: k }} title="Couleur" onClick={() => set((a) => modifier(a, n.id, { c: k }))} />)}
            {exo && niv > 0 && n.m && <input type="text" value={n.alt || ""} onChange={(e) => set((a) => modifier(a, n.id, { alt: e.target.value }))} placeholder="Autres réponses valides (séparées par /)" aria-label="Autres réponses valides" style={{ maxWidth: 230 }} />}
            {exo && niv > 0 && <button type="button" className="btn" title={n.m ? "Branche masquée (à compléter)" : "Masquer cette branche"} style={n.m ? { background: "var(--warn)" } : undefined} onClick={() => set((a) => modifier(a, n.id, { m: !n.m }))}>🙈</button>}
            <button type="button" className="btn" title="Ajouter une sous-branche" onClick={() => set((a) => ajouter(a, n.id))}>＋</button>
            {niv > 0 && <><button type="button" className="btn" title="Monter" onClick={() => set((a) => bouger(a, n.id, -1))}>↑</button><button type="button" className="btn" title="Descendre" onClick={() => set((a) => bouger(a, n.id, 1))}>↓</button><button type="button" className="btn danger" title="Supprimer la branche" onClick={() => set((a) => retirer(a, n.id))}>✕</button></>}
          </div>
        ))}
      </div>
      <strong>Aperçu</strong>
      <CarteMentale arbre={c.arbre} exo={exo} corrige={false} />
    </div>
  );
}

function Attribution({ carte, teams, onChange, user, profil }) {
  const [val, setVal] = useState({});
  const [stat, setStat] = useState({});
  const [mem, setMem] = useState({});
  const [vue, setVue] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    teams.filter((t) => (t.cartes || []).some((x) => x.id === carte.id)).forEach((t) => listMembres(t.id).then((m) => { setMem((s) => ({ ...s, [t.id]: m })); setStat((s) => ({ ...s, [t.id]: { n: m.length, ok: m.filter((u) => u.cartes?.[carte.id]?.fait).length } })); }).catch(() => {}));
  }, [carte.id, teams.length]); // eslint-disable-line
  const cur = (t) => (t.cartes || []).find((x) => x.id === carte.id);
  const v = (t) => val[t.id] || (cur(t) ? { type: cur(t).type, lim: inputDepuisLimite(cur(t).lim) } : { type: "devoir", lim: "" });
  const go = async (fn) => { setMsg(""); try { await fn(); onChange(); setMsg("Enregistré."); } catch (e) { setMsg(e.message || "Erreur"); } };
  return (
    <div className="card" style={{ background: "var(--soft)" }}>
      <strong>Proposer « {carte.titre} » aux équipes</strong>
      {teams.length === 0 && <p className="muted">Crée d'abord une équipe.</p>}
      {teams.map((t) => {
        const x = v(t), a = cur(t), s = stat[t.id];
        return (
          <div className="row item" key={t.id} style={{ flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            <strong style={{ minWidth: 140 }}>{t.nom}</strong>
            <select value={x.type} onChange={(e) => setVal({ ...val, [t.id]: { ...x, type: e.target.value } })}>
              <option value="devoir">Exercice à rendre</option>
              <option value="biblio">Bibliothèque (sans échéance)</option>
            </select>
            {x.type === "devoir" && <input type="date" value={x.lim} onChange={(e) => setVal({ ...val, [t.id]: { ...x, lim: e.target.value } })} aria-label="Date limite" />}
            <button className="btn primary" disabled={x.type === "devoir" && !x.lim} title={x.type === "devoir" && !x.lim ? "Choisis une date limite" : ""} onClick={() => go(async () => { const lim = limiteDepuisInput(x.lim); await attribuer(t, carte, x.type, lim); if (!a || a.type !== x.type || (a.lim || 0) !== (x.type === "devoir" ? lim : 0)) await prevenirEquipe(t, carte, x.type, lim, user, profil).catch(() => {}); })}>{a ? "Mettre à jour" : "Proposer"}</button>
            {a && <button className="btn" onClick={() => go(() => retirerAttribution(t, carte.id))}>Retirer</button>}
            {a && <button className="btn" onClick={() => { const o = vue === t.id; setVue(o ? "" : t.id); if (!o) listMembres(t.id).then((m) => setMem((z) => ({ ...z, [t.id]: m }))).catch(() => {}); }}>{vue === t.id ? "Masquer les résultats" : "Résultats"}</button>}
            {a && <span className="muted">{a.type === "devoir" ? `À rendre avant le ${fmtLimite(a.lim)}` : "Bibliothèque"}{s ? ` · ${s.ok}/${s.n} terminée${s.ok > 1 ? "s" : ""}` : ""}</span>}
          </div>
        );
      })}
      {teams.filter((t) => vue === t.id).map((t) => (
        <div key={"r" + t.id} className="item" style={{ marginTop: 10 }}>
          <strong>Résultats — {t.nom}</strong>
          {!mem[t.id] && <p className="muted">Chargement…</p>}
          {mem[t.id] && mem[t.id].length === 0 && <p className="muted">Aucun inscrit.</p>}
          {(mem[t.id] || []).map((u) => {
            const p = u.cartes?.[carte.id], sc = p ? scoreCarte(carte.arbre, p.rep) : null, lm = masquees(carte.arbre);
            return (
              <details key={u.id} style={{ margin: "6px 0" }}>
                <summary><strong>{u.nom || "—"}</strong> {p?.fait ? <span className="tag ok">Terminée le {fmtLimite(p.fait)}</span> : p ? <span className="tag">Brouillon</span> : <span className="tag late">Pas commencée</span>}{carte.mode === "exo" && sc && sc.n > 0 && <span className="tag">{sc.ok}/{sc.n} juste{sc.ok > 1 ? "s" : ""}</span>}</summary>
                {carte.mode === "exo" && p && lm.length > 0 && (
                  <table className="cmp" style={{ minWidth: 0, margin: "6px 0 6px 16px" }}>
                    <thead><tr><th>Branche attendue</th><th>Réponse du stagiaire</th><th></th></tr></thead>
                    <tbody>{lm.map((n) => { const r = p.rep?.[n.id] || "", ok = juste(n, r); return <tr key={n.id}><td>{n.t}{n.alt ? <small className="muted"> ({n.alt})</small> : null}</td><td>{r || "—"}</td><td>{ok ? "✅" : "❌"}</td></tr>; })}</tbody>
                  </table>
                )}
                {carte.mode !== "exo" && <p className="muted" style={{ margin: "4px 0 4px 16px" }}>{p?.fait ? "A terminé la révision." : "Révision non terminée."}</p>}
              </details>
            );
          })}
        </div>
      ))}
      {msg && <p className="muted">{msg}</p>}
    </div>
  );
}

export default function CartesGestion({ user, profil, teams, onChange }) {
  const [l, setL] = useState(null);
  const [ed, setEd] = useState(null);
  const [att, setAtt] = useState(null);
  const [conf, setConf] = useState("");
  const [err, setErr] = useState("");
  const charger = () => listMesCartes(user.uid).then(setL).catch((e) => setErr(e.message));
  useEffect(() => { charger(); }, []); // eslint-disable-line
  if (ed) return <Editeur init={ed} user={user} profil={profil} onFin={(ok, id) => { setEd(null); if (ok) { charger(); onChange?.(); } }} />;
  return (
    <>
      <div className="row between item">
        <h2 style={{ margin: 0 }}>Cartes mentales</h2>
        <button className="btn primary" onClick={() => setEd({ titre: "", mode: "consult", arbre: arbreVide() })}>+ Nouvelle carte mentale</button>
      </div>
      <p className="muted">À consulter (fiche visuelle) ou à compléter (branches masquées). Tu les proposes à tes équipes comme exercice à rendre, avec une date limite, ou simplement en bibliothèque.</p>
      {err && <div className="card warn">Erreur : {err}. Vérifie que les règles Firestore (firestore.rules) sont publiées.</div>}
      {!l && !err && <p>Chargement…</p>}
      {l && l.length === 0 && <div className="card">Aucune carte mentale pour le moment.</div>}
      {(l || []).map((x) => (
        <div key={x.id}>
          <div className="card row between item">
            <div>
              <strong>{x.titre}</strong>
              <div className="meta"><span className="tag">{x.mode === "exo" ? "À compléter" : "À consulter"}</span> <span className="muted">{aplatir(x.arbre).length} élément(s)</span></div>
            </div>
            <div className="row">
              <button className="btn primary" onClick={() => setAtt(att === x.id ? null : x.id)}>{att === x.id ? "Fermer" : "Proposer"}</button>
              <button className="btn" onClick={() => setEd(x)}>Modifier</button>
              <button className="btn" onClick={() => setEd({ titre: x.titre + " (copie)", mode: x.mode, arbre: x.arbre })}>Dupliquer</button>
              {conf === x.id ? <button className="btn danger" onClick={() => supprimerCarte(x.id).then(() => { setConf(""); charger(); }).catch((e) => setErr(e.message))}>Confirmer ?</button> : <button className="btn danger" onClick={() => setConf(x.id)}>Supprimer</button>}
            </div>
          </div>
          {att === x.id && <Attribution user={user} profil={profil} carte={x} teams={teams} onChange={() => onChange?.()} />}
        </div>
      ))}
    </>
  );
}
