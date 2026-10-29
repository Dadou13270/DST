import { CadresEdit } from "../components/Cadres";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { listRelations, saveRelation, newRelation, controler, TECH, ETATS, BESOINS, TYPES_INTER, FINS } from "../lib/relation";
import { toutesRubriques } from "../lib/relation";
import { compressImage } from "../lib/image";
import { RelationJeu } from "./Relation";

const TABS = [["gen", "Général"], ["int", "Intervention"], ["vic", "Victime"], ["dia", "Dialogue"], ["deb", "Débriefing"], ["test", "Tester"]];
const lignes = (a) => (a || []).join("\n");
const delignes = (t) => String(t).split("\n").map((x) => x.trim()).filter(Boolean);

export default function AdminRelation() {
  const { id } = useParams();
  const nav = useNavigate();
  const [e, setE] = useState(id === "nouveau" ? newRelation() : null);
  const [tab, setTab] = useState("gen");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [rubs, setRubs] = useState([]);
  useEffect(() => { toutesRubriques().then(setRubs).catch(() => {}); }, []);
  useEffect(() => { if (id !== "nouveau") listRelations(true).then((l) => setE(l.find((x) => x.id === id) || false)).catch(() => setE(false)); }, [id]);
  if (e === null) return <p>Chargement…</p>;
  if (e === false) return <p>Exercice introuvable. <Link to="/admin">Retour</Link></p>;
  const set = (k, v) => setE({ ...e, [k]: v });
  const sub = (o, k, v) => setE({ ...e, [o]: { ...e[o], [k]: v } });
  const setN = (i, patch) => setE({ ...e, noeuds: e.noeuds.map((n, j) => (j === i ? { ...n, ...patch } : n)) });
  const setC = (i, k, patch) => setN(i, { choix: e.noeuds[i].choix.map((c, j) => (j === k ? { ...c, ...patch } : c)) });
  const probs = controler(e);
  const enregistrer = async () => {
    setErr(""); setOk("");
    if (!e.titre.trim()) return setErr("Titre obligatoire.");
    try { const nid = await saveRelation(id === "nouveau" ? "" : id, e); setOk("Enregistré."); if (id === "nouveau") nav(`/admin/relation/${nid}`, { replace: true }); }
    catch (x) { setErr(x.message); }
  };
  const photo = async (f) => { if (!f) return; try { setE({ ...e, photo: await compressImage(f, 1100, 0.7, 260000), vignette: await compressImage(f, 300, 0.6) }); } catch (x) { setErr(x.message); } };
  const nextId = () => { let i = e.noeuds.length + 1; while (e.noeuds.some((n) => n.id === "n" + i)) i++; return "n" + i; };
  const cible = (c) => <option value={c.id}>{c.id}</option>;
  const num = (o, k, l, step = 1, min = 0, max = 999) => (<div><label>{l}</label><input type="number" step={step} min={min} max={max} value={e[o][k] ?? ""} onChange={(ev) => sub(o, k, Number(ev.target.value))} style={{ width: 110 }} /></div>);
  return (
    <div className="rel-ed">
      <div className="row between"><h1>{e.titre || "Nouvel exercice relationnel"}</h1><div className="row"><button className="btn primary" onClick={enregistrer}>Enregistrer</button><Link className="btn" to="/admin">Retour</Link></div></div>
      {err && <p className="err">{err}</p>}{ok && <p className="muted">{ok}</p>}
      <div className="tabs" style={{ marginBottom: 12 }}>{TABS.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}{k === "dia" && probs.length ? ` ⚠${probs.length}` : ""}</button>)}</div>

      {tab === "gen" && (
        <div className="card">
          <label>Titre</label><input value={e.titre} onChange={(ev) => set("titre", ev.target.value)} />
          <label>Description (carte de l'exercice)</label><textarea rows={2} value={e.description} onChange={(ev) => set("description", ev.target.value)} />
          <div className="row">
            <div><label>Rubrique</label><select value={e.rubrique} onChange={(ev) => set("rubrique", ev.target.value)}>{[...new Set([...rubs, e.rubrique])].map((r) => <option key={r}>{r}</option>)}</select></div>
            <div><label>Niveau</label><select value={e.niveau} onChange={(ev) => set("niveau", ev.target.value)}><option>Initiation</option><option>Intermédiaire</option><option>Avancé</option></select></div>
            <div><label>Publié</label><select value={e.publie ? "1" : "0"} onChange={(ev) => set("publie", ev.target.value === "1")}><option value="0">Brouillon</option><option value="1">Publié</option></select></div>
            <div><label>Jauges</label><select value={e.jaugesMasquees ? "1" : "0"} onChange={(ev) => set("jaugesMasquees", ev.target.value === "1")}><option value="0">Visibles (guidé)</option><option value="1">Masquées (expert)</option></select></div>
          </div>
          <CadresEdit value={e.cadres} onChange={(v) => set("cadres", v)} />
          <label>Photo (optionnelle)</label>
          <div className="row">{e.vignette && <img src={e.vignette} alt="" style={{ height: 60, borderRadius: 6 }} />}<input type="file" accept="image/*" onChange={(ev) => photo(ev.target.files[0])} />{e.photo && <button className="btn" onClick={() => setE({ ...e, photo: "", vignette: "" })}>Retirer</button>}</div>
        </div>
      )}

      {tab === "int" && (
        <div className="card">
          <p className="muted">Ces paramètres modifient le déroulement : le public ajoute de la tension à chaque tour, l'alcool amplifie les montées et ralentit les baisses, le dépassement du temps fait monter la tension selon la gravité, le seuil de renfort sert à juger si la demande est justifiée.</p>
          <label>Situation (ce que voit le stagiaire)</label><textarea rows={4} value={e.contexte.texte} onChange={(ev) => sub("contexte", "texte", ev.target.value)} />
          <label>Objectif opérationnel à tenir</label><input value={e.contexte.objectif} onChange={(ev) => sub("contexte", "objectif", ev.target.value)} />
          <label>Lieu</label><input value={e.contexte.lieu} onChange={(ev) => sub("contexte", "lieu", ev.target.value)} />
          <div className="row">
            <div><label>Type d'intervention</label><select value={e.contexte.type} onChange={(ev) => sub("contexte", "type", ev.target.value)}>{TYPES_INTER.map((t) => <option key={t}>{t}</option>)}</select></div>
            {num("contexte", "gravite", "Gravité (1-5)", 1, 1, 5)}
            {num("contexte", "tempsMax", "Temps disponible (min)")}
            {num("contexte", "effectifs", "Effectifs présents")}
            {num("contexte", "seuilRenfort", "Seuil de renfort (tension)", 5, 10, 100)}
          </div>
          <div className="row">
            <div><label>Public</label><select value={e.contexte.public} onChange={(ev) => sub("contexte", "public", ev.target.value)}><option value="aucun">Aucun</option><option value="quelques">Quelques personnes</option><option value="foule">Foule</option></select></div>
            <div><label><input type="checkbox" checked={!!e.contexte.alcool} onChange={(ev) => sub("contexte", "alcool", ev.target.checked)} /> Alcool / stupéfiants</label></div>
            <div><label><input type="checkbox" checked={!!e.contexte.arme} onChange={(ev) => sub("contexte", "arme", ev.target.checked)} /> Arme / objet dangereux</label></div>
          </div>
        </div>
      )}

      {tab === "vic" && (
        <div className="card">
          <label>Nom / désignation de la victime</label><input value={e.victime.nom} onChange={(ev) => sub("victime", "nom", ev.target.value)} />
          <div className="row">
            <div><label>État émotionnel de départ</label><select value={e.victime.etat} onChange={(ev) => sub("victime", "etat", ev.target.value)}>{Object.entries(ETATS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            {num("victime", "tension", "Tension initiale (0-100)", 5, 0, 100)}
            {num("victime", "confiance", "Confiance initiale (0-100)", 5, 0, 100)}
            <div><label>Besoin caché</label><select value={e.victime.besoin} onChange={(ev) => sub("victime", "besoin", ev.target.value)}>{Object.entries(BESOINS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
          </div>
          <label>Explication du besoin (psychologie, révélée au débrief)</label><textarea rows={3} value={e.victime.besoinTexte} onChange={(ev) => sub("victime", "besoinTexte", ev.target.value)} />
          <label>Déclencheurs (un par ligne)</label><textarea rows={3} defaultValue={lignes(e.victime.declencheurs)} onBlur={(ev) => sub("victime", "declencheurs", delignes(ev.target.value))} />
          <label>Éléments apaisants (un par ligne)</label><textarea rows={3} defaultValue={lignes(e.victime.apaisants)} onBlur={(ev) => sub("victime", "apaisants", delignes(ev.target.value))} />
        </div>
      )}

      {tab === "dia" && (
        <>
          {probs.length > 0 && <div className="card warn"><b>À corriger :</b><ul>{probs.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
          <div className="card"><label>Nœud de départ</label><select value={e.debut} onChange={(ev) => set("debut", ev.target.value)}>{e.noeuds.map(cible)}</select></div>
          {e.noeuds.map((n, i) => (
            <div className="card" key={n.id}>
              <div className="row between"><h3 style={{ margin: 0 }}>Nœud {n.id}</h3><button className="btn danger" onClick={() => window.confirm(`Supprimer le nœud ${n.id} ?`) && setE({ ...e, noeuds: e.noeuds.filter((_, j) => j !== i) })}>Supprimer le nœud</button></div>
              <label>Réplique / attitude de la victime</label><textarea rows={3} value={n.victime} onChange={(ev) => setN(i, { victime: ev.target.value })} />
              {n.choix.map((c, k) => (
                <div className="card" key={c.id || k} style={{ margin: "8px 0" }}>
                  <label>Réponse du stagiaire</label><textarea rows={2} value={c.texte} onChange={(ev) => setC(i, k, { texte: ev.target.value })} />
                  <div className="row">
                    <div><label>Technique</label><select value={c.technique} onChange={(ev) => setC(i, k, { technique: ev.target.value })}>{Object.entries(TECH).map(([t, v]) => <option key={t} value={t}>{v.t === "piege" ? "✗ " : ""}{v.l}</option>)}</select></div>
                    <div><label>Tension</label><input type="number" value={c.dT} onChange={(ev) => setC(i, k, { dT: Number(ev.target.value) })} style={{ width: 80 }} /></div>
                    <div><label>Confiance</label><input type="number" value={c.dC} onChange={(ev) => setC(i, k, { dC: Number(ev.target.value) })} style={{ width: 80 }} /></div>
                    <div><label>Besoin</label><input type="number" value={c.dB} onChange={(ev) => setC(i, k, { dB: Number(ev.target.value) })} style={{ width: 80 }} /></div>
                    <div><label>Temps (min)</label><input type="number" min="0" value={c.temps} onChange={(ev) => setC(i, k, { temps: Number(ev.target.value) })} style={{ width: 80 }} /></div>
                    <div><label>Suite</label><select value={c.suite} onChange={(ev) => setC(i, k, { suite: ev.target.value })}>{e.noeuds.map(cible)}{Object.entries(FINS).map(([f, l]) => <option key={f} value={"fin:" + f}>{l}</option>)}</select></div>
                  </div>
                  <label>Réaction immédiate de la victime (attitude)</label><input value={c.reaction} onChange={(ev) => setC(i, k, { reaction: ev.target.value })} />
                  <label>Explication au débrief</label><textarea rows={2} value={c.conseil} onChange={(ev) => setC(i, k, { conseil: ev.target.value })} />
                  <button className="btn" onClick={() => setN(i, { choix: n.choix.filter((_, j) => j !== k) })}>Retirer cette réponse</button>
                </div>
              ))}
              <button className="btn" onClick={() => setN(i, { choix: [...n.choix, { id: "c" + Date.now().toString(36), texte: "", technique: "ecoute", dT: 0, dC: 0, dB: 0, temps: 1, suite: "fin:apaise", reaction: "", conseil: "" }] })}>+ Ajouter une réponse</button>
            </div>
          ))}
          <button className="btn" onClick={() => setE({ ...e, noeuds: [...e.noeuds, { id: nextId(), victime: "", choix: [] }] })}>+ Ajouter un nœud</button>
        </>
      )}

      {tab === "deb" && (
        <div className="card">
          {[["points", "À retenir"], ["erreurs", "Erreurs fréquentes"], ["principes", "Principes"]].map(([k, l]) => (
            <div key={k}><label>{l} (un par ligne)</label><textarea rows={4} defaultValue={lignes(e.debrief[k])} onBlur={(ev) => sub("debrief", k, delignes(ev.target.value))} /></div>))}
        </div>
      )}

      {tab === "test" && (probs.length ? <div className="card warn">Corrige d'abord l'arbre (onglet Dialogue) : {probs[0]}</div> : <RelationJeu key={JSON.stringify(e.noeuds).length + e.titre} ex={e} apercu={() => {}} />)}
    </div>
  );
}
