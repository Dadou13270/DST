import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useAntiRobot } from "../components/AntiRobot";
import TicketDialog, { TagStatut } from "../components/TicketDialog";
import { useAuth } from "../lib/auth";
import { creerTicket, OBJETS_TICKET, watchMesTickets } from "../lib/tickets";

const fmt = (t) => (t ? new Date(t).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");

// Support : l'utilisateur ouvre un ticket et suit les réponses de l'équipe en direct.
export default function Tickets() {
  const { user, profil } = useAuth();
  const [liste, setListe] = useState([]);
  const [nouveau, setNouveau] = useState(false);
  const [ouvert, setOuvert] = useState(null);
  const [f, setF] = useState({ objet: OBJETS_TICKET[0], sujet: "", message: "" });
  const [err, setErr] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const ar = useAntiRobot();

  useEffect(() => (user ? watchMesTickets(user.uid, setListe) : undefined), [user?.uid]); // eslint-disable-line
  const courant = liste.find((t) => t.id === ouvert);

  const envoyer = async (e) => {
    e.preventDefault();
    if (f.sujet.trim().length < 3 || f.message.trim().length < 5) return setErr("Renseigne le sujet et ton message.");
    if (ar.verifier()) return setErr("Vérification anti-robot incorrecte, réessaie.");
    setErr(""); setEnvoi(true);
    try {
      const id = await creerTicket({ uid: user.uid, nom: profil?.nom, email: user.email, objet: f.objet, sujet: f.sujet.trim(), message: f.message.trim() });
      setNouveau(false); setF({ objet: OBJETS_TICKET[0], sujet: "", message: "" }); setOuvert(id);
    } catch (x) { setErr(x.message); }
    setEnvoi(false);
  };

  return (
    <Layout>
      <div className="row between">
        <h1>Support : mes tickets</h1>
        {!nouveau && <button className="btn primary" onClick={() => setNouveau(true)}>+ Nouveau ticket</button>}
      </div>
      <p className="muted">Pose une question ou signale un problème : l'équipe te répond ici, en direct.</p>
      {nouveau && (
        <form className="card form" style={{ maxWidth: 780 }} onSubmit={envoyer}>
          <h3 style={{ marginTop: 0 }}>Nouveau ticket</h3>
          <label>Objet</label>
          <select value={f.objet} onChange={(e) => setF({ ...f, objet: e.target.value })}>{OBJETS_TICKET.map((o) => <option key={o}>{o}</option>)}</select>
          <label>Sujet</label>
          <input maxLength={100} value={f.sujet} onChange={(e) => setF({ ...f, sujet: e.target.value })} />
          <label>Message</label>
          <textarea rows={5} maxLength={1500} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
          {ar.widget}
          {err && <p className="err">{err}</p>}
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn primary" disabled={envoi}>{envoi ? "Envoi…" : "Envoyer"}</button>
            <button type="button" className="btn" onClick={() => setNouveau(false)}>Annuler</button>
          </div>
        </form>
      )}
      {liste.length === 0 && !nouveau && <div className="card">Aucun ticket pour le moment.</div>}
      {liste.map((t) => (
        <div className="card row between" key={t.id}>
          <div className="grow">
            <strong>{t.sujet}</strong> <TagStatut s={t.statut} />{t.nonLuUser && t.statut !== "resolu" && <> <span className="tag evo">Nouveau message</span></>}
            <div className="muted" style={{ fontSize: ".85rem" }}>{t.objet} · {fmt(t.maj)}</div>
          </div>
          <button className="btn primary" onClick={() => setOuvert(t.id)}>Ouvrir</button>
        </div>
      ))}
      {courant && <TicketDialog ticket={courant} role="user" nom={profil?.nom || ""} onClose={() => setOuvert(null)} />}
    </Layout>
  );
}
