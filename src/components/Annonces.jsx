import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { watchAnnonces, visiblePour } from "../lib/annonces";

const lu = () => { try { return JSON.parse(localStorage.getItem("annonces-lues") || "[]"); } catch { return []; } };

// Bandeau d'annonces de l'administrateur (fermable, une fois par annonce)
export default function Annonces() {
  const { user, profil, isAdmin } = useAuth();
  const [l, setL] = useState([]);
  const [fermees, setFermees] = useState(lu);
  useEffect(() => (user ? watchAnnonces(setL) : undefined), [user?.uid]); // eslint-disable-line
  if (!user || !profil) return null;
  const a = l.filter((x) => (isAdmin ? x.actif : visiblePour(x, profil)) && !fermees.includes(x.id)).sort((x, y) => (y.le || 0) - (x.le || 0));
  if (!a.length) return null;
  const fermer = (id) => { const n = [...fermees, id]; setFermees(n); try { localStorage.setItem("annonces-lues", JSON.stringify(n.slice(-50))); } catch { /* ignoré */ } };
  return (
    <div style={{ margin: "10px auto", maxWidth: 1100 }} role="status">
      {a.map((x) => (
        <div key={x.id} className={"card row between" + (x.niveau === "alerte" ? " alerte" : "")} style={{ margin: "6px 0", ...(x.niveau === "alerte" ? {} : { borderLeft: "5px solid var(--ok)" }) }}>
          <span>{x.niveau === "alerte" ? "⚠ " : "📢 "}{x.texte}</span>
          <button className="btn" onClick={() => fermer(x.id)} aria-label="Fermer l'annonce">✕</button>
        </div>
      ))}
    </div>
  );
}
