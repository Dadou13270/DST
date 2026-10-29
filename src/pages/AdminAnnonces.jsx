import { useEffect, useState } from "react";
import { CIBLES, creerAnnonce, listAnnonces, majAnnonce, supprimerAnnonce } from "../lib/annonces";
import { useAuth } from "../lib/auth";
import { fmtDate } from "../lib/users";

const ciblePhrase = (c = { type: "all" }) =>
  c.type === "dep" ? `Département ${c.dep}` : c.type === "cis" ? `CIS ${c.cis}${c.dep ? " (" + c.dep + ")" : ""}` : CIBLES[c.type] || CIBLES.all;

// Annonces globales : bandeau affiché à tous, ou à un département / un CIS / les gestionnaires
export default function AdminAnnonces() {
  const { profil } = useAuth();
  const [l, setL] = useState(null);
  const [f, setF] = useState({ texte: "", niveau: "info", type: "all", dep: "", cis: "", fin: "" });
  const [msg, setMsg] = useState("");
  const [conf, setConf] = useState(null);
  const charger = () => listAnnonces().then(setL).catch((e) => { setL([]); setMsg("Erreur : " + e.message); });
  useEffect(() => { charger(); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const publier = async (e) => {
    e.preventDefault(); setMsg("");
    if (f.type === "dep" && !f.dep.trim()) return setMsg("Indique le département.");
    if (f.type === "cis" && !f.cis.trim()) return setMsg("Indique le CIS.");
    try {
      await creerAnnonce({ texte: f.texte, niveau: f.niveau, cible: { type: f.type, ...(f.type === "dep" || f.type === "cis" ? { dep: f.dep.trim() } : {}), ...(f.type === "cis" ? { cis: f.cis.trim() } : {}) }, fin: f.fin ? new Date(f.fin + "T23:59:59").getTime() : 0 }, profil?.nom);
      setF({ texte: "", niveau: "info", type: "all", dep: "", cis: "", fin: "" }); setMsg("Annonce publiée."); charger();
    } catch (x) { setMsg("Erreur : " + x.message); }
  };
  return (
    <div>
      <h2>Annonces</h2>
      <form className="card form" onSubmit={publier}>
        <label>Message</label>
        <textarea rows={3} maxLength={600} required value={f.texte} onChange={set("texte")} placeholder="Ex. Maintenance ce soir à 22 h : l'application sera indisponible 30 minutes." />
        <div className="row item">
          <select value={f.niveau} onChange={set("niveau")}><option value="info">Information</option><option value="alerte">Alerte (mise en avant)</option></select>
          <select value={f.type} onChange={set("type")}>{Object.entries(CIBLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          {(f.type === "dep" || f.type === "cis") && <input placeholder="Département (ex. Bouches-du-Rhône)" value={f.dep} onChange={set("dep")} />}
          {f.type === "cis" && <input placeholder="Nom du CIS" value={f.cis} onChange={set("cis")} />}
          <label className="row" style={{ gap: 4 }}>Jusqu'au <input type="date" value={f.fin} onChange={set("fin")} style={{ width: "auto" }} /></label>
        </div>
        <button className="btn primary">Publier</button>
        {msg && <span className="muted"> {msg}</span>}
      </form>
      {!l && <p>Chargement…</p>}
      {(l || []).map((a) => {
        const exp = a.fin && a.fin < Date.now();
        return (
          <div className="card" key={a.id}>
            <div className="row between item">
              <div>
                <span className={a.actif && !exp ? "tag ok" : "tag"}>{exp ? "Expirée" : a.actif ? "Active" : "Désactivée"}</span>{" "}
                {a.niveau === "alerte" && <span className="tag late">Alerte</span>} <span className="muted">→ {ciblePhrase(a.cible)} · {fmtDate(a.le)}{a.fin ? ` · jusqu'au ${new Date(a.fin).toLocaleDateString("fr-FR")}` : ""}</span>
              </div>
              <div className="row">
                <button className="btn" onClick={() => majAnnonce(a.id, { actif: !a.actif }).then(charger)}>{a.actif ? "Désactiver" : "Réactiver"}</button>
                {conf === a.id ? <button className="btn danger" onClick={() => supprimerAnnonce(a.id).then(() => { setConf(null); charger(); })}>Confirmer ?</button> : <button className="btn danger" onClick={() => setConf(a.id)}>Supprimer</button>}
              </div>
            </div>
            <p className="pre" style={{ margin: 0 }}>{a.texte}</p>
          </div>
        );
      })}
    </div>
  );
}
