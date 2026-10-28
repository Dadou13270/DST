import { useState } from "react";
import { initialiserVisibilite } from "../lib/db";
import { setStyle, setCartes } from "../lib/nouveautes";

export default function Parametres() {
  const [msg, setMsg] = useState("");

  return (
    <>
      <h1>Paramètres</h1>
      {msg && <p className="muted">{msg}</p>}

      <div className="card">
        <h3>Graphisme de l'application</h3>
        <p className="muted">Choisis l'apparence pour tous les utilisateurs.</p>
        <select defaultValue={document.documentElement.dataset.style === "b" ? "b" : ""}
          onChange={(e) => setStyle(e.target.value).then(() => setMsg("Graphisme enregistré.")).catch((er) => setMsg("Erreur : " + er.message))}>
          <option value="">Actuel (rouge opérationnel)</option>
          <option value="b">B · Institutionnel (bleu marine)</option>
        </select>
      </div>

      <div className="card">
        <h3>Présentation des blocs d'exercices</h3>
        <p className="muted">Disposition des exercices dans l'espace stagiaire, pour tous les utilisateurs. Chaque utilisateur peut ensuite choisir son nombre de colonnes.</p>
        <select defaultValue={document.documentElement.dataset.cartes === "h" ? "h" : ""}
          onChange={(e) => setCartes(e.target.value).then(() => setMsg("Présentation enregistrée.")).catch((er) => setMsg("Erreur : " + er.message))}>
          <option value="">Actuelle (image en haut)</option>
          <option value="h">Image à gauche, texte à droite</option>
        </select>
      </div>

      <div className="card">
        <h3>Maintenance</h3>
        <p className="muted">À lancer une fois après la mise à jour : marque les anciens scénarios comme publics (nécessaire pour la visibilité par gestionnaire).</p>
        <button className="btn" onClick={async () => setMsg(`${await initialiserVisibilite()} scénario(s) mis à jour.`)}>Initialiser la visibilité des scénarios existants</button>
      </div>
    </>
  );
}
