import { useEffect, useState } from "react";
import { listSeances, supprimerSeance } from "../lib/seances";
import { pdfSeance } from "../lib/pdf";

const hm = (t) => (t ? new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "");
const jour = (s) => { const t = s.debut || s.creeLe || s.archiveLe; return t ? new Date(t).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—"; };

// Onglet « Historique des séances » : bilans archivés (à la suppression d'une salle ou à la demande)
export default function HistoriqueSeances({ user }) {
  const [l, setL] = useState(null);
  const [open, setOpen] = useState(null);
  const [conf, setConf] = useState(null);
  const [err, setErr] = useState("");
  const load = () => listSeances(user.uid).then(setL).catch((e) => { setL([]); setErr(e.message); });
  useEffect(() => { load(); }, [user.uid]); // eslint-disable-line
  return (
    <div>
      <p className="muted">Le bilan de chaque séance est conservé automatiquement quand tu supprimes une salle (ou avec « Archiver le bilan » dans la salle) : stagiaires, questions, évolutions, consignes et réponses.</p>
      {err && <p className="err">{err} (les règles Firestore sont-elles republiées ?)</p>}
      {!l && <p>Chargement…</p>}
      {l && l.length === 0 && <div className="card">Aucune séance archivée pour le moment.</div>}
      {(l || []).map((s) => (
        <div className="card" key={s.id}>
          <div className="row between item">
            <div>
              <strong>{s.titre || "Séance"}</strong> <span className="muted">· salle {s.code} · {jour(s)}</span>
              <div className="muted">{(s.stagiaires || []).length} stagiaire(s) · {(s.questions || []).length} question(s){s.essTot ? ` · essentielles ${s.essOk}/${s.essTot}` : ""} · {(s.evolutions || []).length} évolution(s)</div>
            </div>
            <div className="row">
              <button className="btn" onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? "Masquer" : "Détail"}</button>
              <button className="btn primary" onClick={() => pdfSeance(s)}>PDF</button>
              {conf === s.id
                ? <button className="btn danger" onClick={async () => { await supprimerSeance(s.id).catch((e) => setErr(e.message)); setConf(null); load(); }}>Confirmer ?</button>
                : <button className="btn danger" onClick={() => setConf(s.id)}>Supprimer</button>}
            </div>
          </div>
          {open === s.id && (
            <div>
              {(s.essManquantes || []).length > 0 && <p><strong>Essentielles non posées :</strong> {s.essManquantes.join(" · ")}</p>}
              <table className="cmp"><thead><tr><th>Stagiaire</th><th>Questions</th><th>Consignes rendues</th></tr></thead>
                <tbody>{(s.stagiaires || []).map((u, i) => <tr key={i}><td>{u.nom}</td><td>{u.nbQ}</td><td>{(u.taches || []).map((t) => <div key={t.titre}><strong>{t.titre}</strong> : {t.texte}</div>)}</td></tr>)}</tbody></table>
              {(s.evolutions || []).length > 0 && (
                <>
                  <h4>Évolutions</h4>
                  {s.evolutions.map((e, i) => <div key={i} className="item"><strong>{e.titre}</strong> <span className="muted">{hm(e.le)} · reçue {e.recu}/{e.dest} · comprise {e.comp}/{e.dest}</span>{e.texte && <div className="muted">{e.texte}</div>}</div>)}
                </>
              )}
              {(s.questions || []).length > 0 && (
                <>
                  <h4>Questions posées</h4>
                  {s.questions.map((q, i) => <div key={i} className="item"><span className="muted">{hm(q.le)} · {q.nom} → {q.who}</span> {q.ess && "★"} <strong>{q.q}</strong>{q.a && <div className="muted">{q.a}</div>}</div>)}
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
