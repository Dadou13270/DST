import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { compressImage } from "../lib/image";
import { watchSite, CONFIG_DEFAUT, saveConfig, saveSection, deleteSection, newSectionId, chargerDefaut, echanger } from "../lib/site";

function ImageField({ value, onChange, max = 1400 }) {
  const [err, setErr] = useState("");
  const pick = async (e) => {
    const f = e.target.files[0]; e.target.value = "";
    if (!f) return;
    try { onChange(await compressImage(f, max, 0.74, 330000)); setErr(""); } catch (x) { setErr(x.message); }
  };
  return (
    <div className="row" style={{ alignItems: "center", gap: 10 }}>
      {value ? <img src={value} alt="" style={{ height: 64, borderRadius: 6 }} /> : <span className="muted">Aucune image</span>}
      <label className="btn">Choisir une image<input type="file" accept="image/*" hidden onChange={pick} /></label>
      {value && <button className="btn" onClick={() => onChange("")}>Retirer</button>}
      {err && <span className="muted">{err}</span>}
    </div>
  );
}

function Section({ s, prev, next, msg }) {
  const [v, setV] = useState(s);
  const [conf, setConf] = useState(false);
  useEffect(() => setV(s), [s]);
  const set = (k, x) => setV({ ...v, [k]: x });
  const item = (i, k, x) => set("items", v.items.map((it, j) => (j === i ? { ...it, [k]: x } : it)));
  const sauver = () => saveSection(v).then(() => msg("Section enregistrée.")).catch((e) => msg("Erreur : " + e.message));
  const aItems = v.type !== "texte-image";
  return (
    <div className="card">
      <div className="row between">
        <h3 style={{ margin: 0 }}>{v.titre || "Sans titre"}</h3>
        <div className="row">
          <button className="btn" disabled={!prev} onClick={() => echanger(prev, s)}>↑</button>
          <button className="btn" disabled={!next} onClick={() => echanger(s, next)}>↓</button>
        </div>
      </div>
      <label className="lbl">Type</label>
      <select value={v.type} onChange={(e) => set("type", e.target.value)}>
        <option value="cartes">Cartes (liste de fonctions)</option>
        <option value="etapes">Étapes numérotées</option>
        <option value="texte-image">Texte + image</option>
      </select>
      <label className="lbl">Titre</label>
      <input value={v.titre || ""} onChange={(e) => set("titre", e.target.value)} />
      <label className="lbl">Libellé dans le menu (vide = pas dans le menu)</label>
      <input value={v.menu || ""} onChange={(e) => set("menu", e.target.value)} />
      <label className="lbl">Texte {v.type === "texte-image" ? "(ligne vide = nouveau paragraphe)" : "d'introduction"}</label>
      <textarea rows={v.type === "texte-image" ? 6 : 2} value={v.texte || ""} onChange={(e) => set("texte", e.target.value)} />
      <label className="lbl">Image</label>
      <ImageField value={v.image} onChange={(x) => set("image", x)} />
      {aItems && (
        <>
          <label className="lbl">Éléments</label>
          {(v.items || []).map((it, i) => (
            <div key={i} className="card" style={{ margin: "6px 0" }}>
              <input placeholder="Titre" value={it.titre || ""} onChange={(e) => item(i, "titre", e.target.value)} />
              <textarea rows={2} placeholder="Texte" value={it.texte || ""} onChange={(e) => item(i, "texte", e.target.value)} />
              <button className="btn" onClick={() => set("items", v.items.filter((_, j) => j !== i))}>Retirer cet élément</button>
            </div>
          ))}
          <button className="btn" onClick={() => set("items", [...(v.items || []), { titre: "", texte: "" }])}>+ Ajouter un élément</button>
        </>
      )}
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn primary" onClick={sauver}>Enregistrer la section</button>
        {conf
          ? <><button className="btn danger" onClick={() => deleteSection(s.id)}>Confirmer la suppression</button><button className="btn" onClick={() => setConf(false)}>Annuler</button></>
          : <button className="btn danger" onClick={() => setConf(true)}>Supprimer</button>}
      </div>
    </div>
  );
}

export default function AdminSite() {
  const [d, setD] = useState(null);
  const [cfg, setCfg] = useState(CONFIG_DEFAUT);
  const [msg, setMsg] = useState("");
  useEffect(() => watchSite((x) => { setD(x); if (x.config) setCfg({ ...CONFIG_DEFAUT, ...x.config }); }), []);
  const setC = (k, v) => setCfg({ ...cfg, [k]: v });
  if (!d) return <p className="muted">Chargement…</p>;
  const ajouter = () => saveSection({ id: newSectionId(), type: "cartes", ordre: (d.sections.reduce((m, s) => Math.max(m, s.ordre || 0), 0)) + 10, menu: "", titre: "Nouvelle section", texte: "", image: "", items: [] });
  return (
    <>
      <h1>Site</h1>
      <p className="muted">Gère le site vitrine public (texte et images). Adresse publique : <Link to="/site" target="_blank">/site</Link></p>
      {msg && <p className="muted">{msg}</p>}
      {d.vide && (
        <div className="card">
          <p>Le site n'est pas encore enregistré : la page publique affiche un contenu de départ.</p>
          <button className="btn primary" onClick={() => chargerDefaut().then(() => setMsg("Contenu de départ chargé.")).catch((e) => setMsg("Erreur : " + e.message))}>Charger le contenu de départ pour le modifier</button>
        </div>
      )}
      <div className="card">
        <h3>Bandeau d'accueil et général</h3>
        {[["nom", "Nom du site"], ["accroche", "Titre principal"], ["cta", "Bouton principal (texte)"], ["ctaLien", "Bouton principal (lien, ex. / ou https://…)"], ["cta2", "Bouton secondaire (texte, vide = aucun)"], ["contact", "E-mail de contact (vide = aucun)"], ["pied", "Texte du pied de page"]].map(([k, l]) => (
          <div key={k}><label className="lbl">{l}</label><input value={cfg[k] || ""} onChange={(e) => setC(k, e.target.value)} /></div>
        ))}
        <label className="lbl">Sous-titre</label>
        <textarea rows={3} value={cfg.sousTitre || ""} onChange={(e) => setC("sousTitre", e.target.value)} />
        <label className="lbl">Image du bandeau</label>
        <ImageField value={cfg.heroImage} onChange={(x) => setC("heroImage", x)} max={1200} />
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={() => saveConfig(cfg).then(() => setMsg("Bandeau enregistré.")).catch((e) => setMsg("Erreur : " + e.message))}>Enregistrer</button>
        </div>
      </div>
      {d.sections.map((s, i) => <Section key={s.id} s={s} prev={d.sections[i - 1]} next={d.sections[i + 1]} msg={setMsg} />)}
      {!d.vide && <button className="btn" onClick={ajouter}>+ Ajouter une section</button>}
    </>
  );
}
