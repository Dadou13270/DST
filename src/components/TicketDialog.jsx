import { useEffect, useRef, useState } from "react";
import { marquerLu, repondre, setStatut, supprimerTicket, watchMessagesTicket } from "../lib/tickets";

export const TagStatut = ({ s }) =>
  s === "resolu" ? <span className="tag ok">Résolu</span> : s === "encours" ? <span className="tag evo">En cours</span> : <span className="tag dom">Ouvert</span>;

const fmt = (t) => (t ? new Date(t).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "");

// Boîte de dialogue d'un ticket : échange en direct (Firestore) entre le stagiaire et l'équipe.
export default function TicketDialog({ ticket, role, nom, onClose }) {
  const [msgs, setMsgs] = useState([]);
  const [txt, setTxt] = useState("");
  const [conf, setConf] = useState(false);
  const [err, setErr] = useState("");
  const fin = useRef(null);

  useEffect(() => watchMessagesTicket(ticket.id, setMsgs), [ticket.id]);
  useEffect(() => { marquerLu(ticket, role); }, [ticket.id]); // eslint-disable-line
  useEffect(() => { fin.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  const envoyer = async (e) => {
    e.preventDefault();
    const t = txt.trim();
    if (!t) return;
    setTxt("");
    try { await repondre(ticket, role, role === "admin" ? "Équipe Op'Training" : nom, t); } catch (x) { setErr(x.message); }
  };
  const st = async (s) => { try { await setStatut(ticket, role, s); } catch (x) { setErr(x.message); } };

  return (
    <div className="modal-fond" onClick={onClose} role="presentation">
      <div className="modal card" role="dialog" aria-modal="true" aria-label="Ticket" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <div>
            <strong>{ticket.sujet}</strong> <TagStatut s={ticket.statut} />
            <div className="muted" style={{ fontSize: ".85rem" }}>{role === "admin" ? `${ticket.nom || ""} · ` : ""}{ticket.objet}</div>
          </div>
          <button className="btn" onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        <div className="chat" style={{ height: 300, margin: "10px 0" }}>
          {msgs.map((m) => (
            <div key={m.id} className={"bubble " + (m.de === role ? "me" : "them")}>
              <small>{m.nom} · {fmt(m.le)}</small>
              {m.texte}
            </div>
          ))}
          <div ref={fin} />
        </div>
        {err && <p className="err">{err}</p>}
        {ticket.statut === "resolu" ? (
          <p className="muted">Ticket résolu. Rouvre-le pour continuer l'échange.</p>
        ) : (
          <form className="row" onSubmit={envoyer}>
            <textarea className="grow" rows={2} maxLength={1500} placeholder="Ta réponse…" value={txt} onChange={(e) => setTxt(e.target.value)} />
            <button className="btn primary">Envoyer</button>
          </form>
        )}
        <div className="row" style={{ marginTop: 8 }}>
          {ticket.statut === "resolu" ? (
            <button className="btn" onClick={() => st("ouvert")}>Rouvrir</button>
          ) : (
            <>
              {role === "admin" && ticket.statut === "ouvert" && <button className="btn" onClick={() => st("encours")}>Marquer en cours</button>}
              <button className="btn" onClick={() => st("resolu")}>{role === "admin" ? "Marquer résolu" : "Clôturer le ticket"}</button>
            </>
          )}
          {role === "admin" && (conf
            ? <button className="btn danger" onClick={async () => { await supprimerTicket(ticket.id); onClose(); }}>Confirmer la suppression</button>
            : <button className="btn danger" onClick={() => setConf(true)}>Supprimer</button>)}
        </div>
      </div>
    </div>
  );
}
