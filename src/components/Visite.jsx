import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

const ETAPES = [
  ["Bienvenue", "Cet outil te fait t'entraîner aux devoirs sur table : à partir d'une photo, tu obtiens les informations utiles puis tu construis ton SOIEC et ton message."],
  ["1. Choisis un scénario", "Sur la page Exercices, les scénarios sont classés par rubrique. Utilise la recherche et les filtres (rubrique, durée, état) pour retrouver rapidement un exercice."],
  ["2. Observe et interroge", "Regarde la photo, puis interroge les personnes présentes : écris ta question librement ou choisis une question suggérée. Les questions essentielles comptent dans ton suivi."],
  ["3. Construis ton SOIEC", "Remplis les rubriques du SOIEC (Situation, Objectifs, Idée de manœuvre, Exécution, Commandement) et rédige ton message. Termine l'exercice pour voir la correction."],
  ["4. Suis ta progression", "« Mon suivi » garde tes résultats et les commentaires de ton formateur. « Mon équipe » sert à rejoindre une équipe avec un code. « Mon profil » regroupe tes informations."],
];
const KEY = "soiec-visite";
const lu = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return true; } };
const marquer = () => { try { localStorage.setItem(KEY, "1"); } catch { /* ignoré */ } };
export const rouvrirVisite = () => window.dispatchEvent(new Event("soiec-visite"));

// Visite guidée : s'affiche une fois sur la page Exercices, puis à la demande (bouton « ? »).
export default function Visite() {
  const { user } = useAuth() || {};
  const { pathname } = useLocation();
  const [i, setI] = useState(null);
  useEffect(() => {
    const h = () => setI(0);
    window.addEventListener("soiec-visite", h);
    return () => window.removeEventListener("soiec-visite", h);
  }, []);
  useEffect(() => { if (user && pathname === "/" && !lu()) setI(0); }, [user, pathname]);
  if (i === null) return null;
  const [t, p] = ETAPES[i];
  const fin = () => { marquer(); setI(null); };
  return (
    <div className="visite" role="dialog" aria-modal="true" aria-label="Visite guidée">
      <div className="visite-box">
        <small className="muted">Étape {i + 1} / {ETAPES.length}</small>
        <h2>{t}</h2>
        <p>{p}</p>
        <div className="row between">
          <button className="btn" onClick={fin}>Passer</button>
          <div className="row">
            {i > 0 && <button className="btn" onClick={() => setI(i - 1)}>Précédent</button>}
            <button className="btn primary" onClick={() => (i === ETAPES.length - 1 ? fin() : setI(i + 1))}>{i === ETAPES.length - 1 ? "Terminer" : "Suivant"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
