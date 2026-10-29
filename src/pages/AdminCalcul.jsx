import { CadresEdit } from "../components/Cadres";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { listCalculs, saveCalcul, attendu, CALC_Q } from "../lib/calculs";
import { toutesRubriques } from "../lib/relation";
import { compressImage } from "../lib/image";
import { calcImg } from "../lib/calculImages";
import { listIllustrations } from "../lib/illustrations";

const VIDE = { titre: "", contexte: "", niveau: "Initiation", rubrique: "Risques industriels", publie: false, S: 100, miscible: false, C: 3, Qref: 1000, reseau: 3000, F: 7, h: 0.15 };
const NIV = ["Initiation", "Intermédiaire", "Avancé"];
const fnum = (n) => Number(n).toLocaleString("fr-FR");

export default function AdminCalcul() {
  const { id } = useParams();
  const nav = useNavigate();
  const [e, setE] = useState(id === "nouveau" ? VIDE : null);
  const [err, setErr] = useState("");
  const [rubs, setRubs] = useState([]);
  useEffect(() => { toutesRubriques().then(setRubs).catch(() => {}); }, []);
  const [libOpen, setLibOpen] = useState(false);
  const [lib, setLib] = useState(null);
  useEffect(() => {
    if (id !== "nouveau") listCalculs(true).then((l) => setE(l.find((x) => x.id === id) || VIDE));
  }, [id]);
  if (!e) return <p>Chargement…</p>;
  const set = (k, v) => setE({ ...e, [k]: v });
  const num = (k, label, step = 1) => (
    <div><label>{label}</label><input type="number" step={step} value={e[k]} onChange={(ev) => set(k, Number(ev.target.value))} /></div>
  );
  const enregistrer = async () => {
    setErr("");
    if ((e.titre || "").trim().length < 3) return setErr("Indique un titre.");
    if (!(e.S > 0 && e.C > 0 && e.Qref >= 0 && e.reseau >= 0 && e.h > 0)) return setErr("Vérifie les valeurs numériques.");
    try { await saveCalcul(id === "nouveau" ? "" : id, { ...e, titre: e.titre.trim() }); nav("/admin"); } catch (x) { setErr(x.message); }
  };
  const importerImage = async (ev) => {
    const f = ev.target.files?.[0];
    ev.target.value = "";
    if (!f) return;
    try { set("image", await compressImage(f, 900, 0.82, 380000)); setErr(""); } catch (x) { setErr(x.message || "Image illisible"); }
  };
  const ouvrirLib = () => {
    setLibOpen(!libOpen);
    if (!lib) listIllustrations().then(setLib).catch((x) => setErr(x.message));
  };
  const im = calcImg(e);
  const att = id !== "nouveau" ? attendu(e) : null;
  return (
    <>
      <div className="row between"><h1>{id === "nouveau" ? "Nouvel" : "Modifier l'"} exercice de calcul</h1><Link className="btn" to="/admin">Retour</Link></div>
      <div className="card form">
        <label>Titre</label><input maxLength={100} value={e.titre} onChange={(ev) => set("titre", ev.target.value)} />
        <label>Énoncé (contexte)</label><textarea rows={3} maxLength={600} value={e.contexte} onChange={(ev) => set("contexte", ev.target.value)} />
        <div className="row">
          <div><label>Niveau</label><select value={e.niveau} onChange={(ev) => set("niveau", ev.target.value)}>{NIV.map((n) => <option key={n}>{n}</option>)}</select></div>
          <div><label>Rubrique</label><select value={e.rubrique || ""} onChange={(ev) => set("rubrique", ev.target.value)}><option value="">— Aucune —</option>{rubs.map((r) => <option key={r}>{r}</option>)}</select></div>
          <label className="ck"><input type="checkbox" checked={!!e.publie} onChange={(ev) => set("publie", ev.target.checked)} /> Publié (visible des stagiaires)</label>
        </div>
        <CadresEdit value={e.cadres} onChange={(v) => set("cadres", v)} />
        <h3>Illustration</h3>
        <div className="row" style={{ alignItems: "flex-start" }}>
          {im ? <img src={im} alt="" style={{ width: 220, maxWidth: "100%", borderRadius: 8 }} /> : <div className="ph" style={{ width: 220, height: 120, fontSize: "2rem", borderRadius: 8 }}>🧮</div>}
          <div className="grow">
            <p className="muted" style={{ marginTop: 0 }}>Importe une image depuis ton ordinateur ou choisis-en une dans la bibliothèque d'illustrations. Elle est redimensionnée automatiquement.</p>
            <div className="row">
              <label className="btn" style={{ cursor: "pointer" }}>Importer une image<input type="file" accept="image/*" hidden onChange={importerImage} /></label>
              <button type="button" className="btn" onClick={ouvrirLib}>{libOpen ? "Fermer la bibliothèque" : "Bibliothèque d'illustrations"}</button>
              {im && <button type="button" className="btn danger" onClick={() => set("image", "")}>Retirer l'image</button>}
            </div>
          </div>
        </div>
        {libOpen && (
          <div className="card" style={{ background: "var(--soft)" }}>
            {!lib && <p>Chargement…</p>}
            {lib && lib.length === 0 && <p className="muted">Bibliothèque vide.</p>}
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
              {(lib || []).map((i) => (
                <div className="card" key={i.id} style={{ padding: 6, margin: 0 }}>
                  <img src={i.vignette || i.photo} alt="" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 6, cursor: "pointer" }} onClick={() => { set("image", i.photo || i.vignette); setLibOpen(false); }} />
                  <div style={{ fontSize: ".82rem", margin: "4px 0" }}>{i.titre}</div>
                  <button type="button" className="btn" style={{ padding: "2px 8px" }} onClick={() => { set("image", i.photo || i.vignette); setLibOpen(false); }}>Utiliser</button>
                </div>
              ))}
            </div>
          </div>
        )}
        <h3>Données de l'exercice</h3>
        <div className="row">
          {num("S", "Surface en feu S (m²)")}
          <div><label>Type de LIF</label><select value={e.miscible ? "1" : "0"} onChange={(ev) => set("miscible", ev.target.value === "1")}><option value="0">Non miscible (10 l/min/m²)</option><option value="1">Miscible (20 l/min/m²)</option></select></div>
          {num("C", "Concentration C (%)", 0.1)}
          {num("Qref", "Refroidissement Qref (l/min)")}
          {num("reseau", "Débit réseau (l/min)")}
          {num("F", "Foisonnement F")}
          {num("h", "Hauteur tapis h (m)", 0.01)}
        </div>
        {att && (<><h4>Résultats attendus (valeurs actuelles)</h4><table className="cmp" style={{ minWidth: 0 }}><tbody>{CALC_Q.map(([k, l, u]) => <tr key={k}><td>{l}</td><td><b>{fnum(att[k])}</b> {u}</td></tr>)}</tbody></table></>)}
        {err && <p className="err">{err}</p>}
        <div className="row" style={{ marginTop: 12 }}><button className="btn primary" onClick={enregistrer}>Enregistrer</button><Link className="btn" to="/admin">Annuler</Link></div>
      </div>
    </>
  );
}
