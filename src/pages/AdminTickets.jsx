import { useEffect, useState } from "react";
import TicketDialog, { TagStatut } from "../components/TicketDialog";
import { watchTousTickets } from "../lib/tickets";

const fmt = (t) => (t ? new Date(t).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");

// Admin : tous les tickets, réponse en direct dans la boîte de dialogue.
export default function AdminTickets() {
  const [liste, setListe] = useState([]);
  const [filtre, setFiltre] = useState("open");
  const [ouvert, setOuvert] = useState(null);
  useEffect(() => watchTousTickets(setListe), []);
  const nOuverts = liste.filter((t) => t.statut !== "resolu").length;
  const vue = liste.filter((t) => filtre === "all" || (filtre === "done" ? t.statut === "resolu" : t.statut !== "resolu"));
  const courant = liste.find((t) => t.id === ouvert);
  return (
    <>
      <h1>Tickets</h1>
      <div className="chips">
        {[["open", `Ouverts (${nOuverts})`], ["done", "Résolus"], ["all", "Tous"]].map(([k, l]) => (
          <button key={k} className={"chip " + (filtre === k ? "on" : "")} onClick={() => setFiltre(k)}>{l}</button>
        ))}
      </div>
      {vue.length === 0 && <div className="card">Aucun ticket.</div>}
      {vue.map((t) => (
        <div className="card row between" key={t.id}>
          <div className="grow">
            <strong>{t.sujet}</strong> <TagStatut s={t.statut} />{t.nonLuAdmin && t.statut !== "resolu" && <> <span className="tag evo">Nouveau message</span></>}
            <div className="muted" style={{ fontSize: ".85rem" }}>{t.nom || "—"} · {t.objet} · {fmt(t.maj)}</div>
          </div>
          <button className="btn primary" onClick={() => setOuvert(t.id)}>Répondre</button>
        </div>
      ))}
      {courant && <TicketDialog ticket={courant} role="admin" nom="Équipe Op'Training" onClose={() => setOuvert(null)} />}
    </>
  );
}
