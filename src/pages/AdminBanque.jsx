import { useEffect, useState } from "react";
import { BANQUE_DEFAUT, CATS, retablirBanque, sauverBanque, useBanque } from "../lib/banque";

// Édition de la banque de commentaires types (administrateur général).
export default function AdminBanque() {
  const src = useBanque();
  const [l, setL] = useState(null);
  const [msg, setMsg] = useState("");
  const [conf, setConf] = useState(false);
  useEffect(() => { if (!l) setL(src.map((x) => ({ ...x }))); }, [src]); // eslint-disable-line
  if (!l) return <p>Chargement…</p>;
  const maj = (i, t) => setL(l.map((x, j) => (j === i ? { ...x, t } : x)));
  const sauver = async () => { setMsg(""); try { await sauverBanque(l); setMsg("Enregistré : les formateurs voient la nouvelle banque."); } catch (e) { setMsg("Erreur : " + (e.code || e.message)); } };
  const retablir = async () => { await retablirBanque(); setL(BANQUE_DEFAUT.map((x) => ({ ...x }))); setConf(false); setMsg("Banque par défaut rétablie."); };
  return (
    <div>
      <h2>Commentaires types</h2>
      <p className="muted">Phrases proposées aux formateurs : points forts et axes de progrès dans les fiches d'évaluation, messages de relance. Dans les relances, {"{nom}"}, {"{exercice}"} et {"{date}"} sont remplacés automatiquement. Le formateur peut modifier le texte avant d'enregistrer.</p>
      {Object.entries(CATS).map(([cat, titre]) => (
        <div className="card" key={cat}>
          <div className="row between"><strong>{titre}</strong><button className="btn" onClick={() => setL([...l, { cat, t: "" }])}>+ Ajouter</button></div>
          {l.map((x, i) => x.cat !== cat ? null : (
            <div className="row item" key={i} style={{ alignItems: "flex-start" }}>
              <textarea className="grow" rows={2} maxLength={400} value={x.t} onChange={(e) => maj(i, e.target.value)} placeholder="Texte du commentaire" />
              <button className="btn danger" onClick={() => setL(l.filter((_, j) => j !== i))}>Supprimer</button>
            </div>
          ))}
          {!l.some((x) => x.cat === cat) && <p className="muted">Aucun commentaire.</p>}
        </div>
      ))}
      <div className="row item">
        <button className="btn primary" onClick={sauver}>Enregistrer</button>
        {conf ? <button className="btn danger" onClick={retablir}>Confirmer le retour à la banque par défaut ?</button> : <button className="btn" onClick={() => setConf(true)}>Rétablir la banque par défaut</button>}
        {msg && <span className={msg.startsWith("Erreur") ? "err" : "ok-txt"}>{msg}</span>}
      </div>
    </div>
  );
}
