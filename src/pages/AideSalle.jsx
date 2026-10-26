import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function AideSalle() {
  return (
    <Layout>
      <div className="pgrid">
      <h1>Séance en salle : mode d'emploi</h1>
      <div className="card">
        <h2>À quoi ça sert ?</h2>
        <p>Animer un devoir sur table en groupe : le formateur projette le scénario, les stagiaires interrogent les intervenants depuis leur appareil et le formateur voit leurs questions en direct pour conduire le débriefing.</p>
      </div>
      <div className="card">
        <h2>Déroulement</h2>
        <ol>
          <li>Le <strong>formateur</strong> ouvre une salle : Espace gestionnaire → carte « Séance en salle » → il choisit un scénario puis « Ouvrir une salle ». Un <strong>code de 5 caractères</strong> (ex. K7M2P) est généré.</li>
          <li>Les <strong>stagiaires</strong> rejoignent : Sur la page Exercices, carte « Séance en salle » : ils saisissent le code puis « Rejoindre ». Ils font l'exercice normalement (questions, SOIEC, message). Leur progression personnelle n'est pas écrasée.</li>
          <li>Le formateur <strong>suit en direct</strong> : Le tableau de bord affiche les stagiaires connectés, le flux des questions avec la réponse donnée (filtre par stagiaire), le nombre de questions essentielles posées au moins une fois et les questions « hors base » (non reconnues, à ajouter au scénario).</li>
          <li>Le formateur <strong>projette</strong> : Le bouton « Projeter » ouvre un écran plein format (code, photo, consigne, contexte, photos d'arrivée). « Afficher la correction » donne S/O/I/E/C, le message, les points de vigilance et la cubique pour le débriefing.</li>
          <li><strong>Clôturer</strong> la séance : « Clôturer » empêche d'autres stagiaires d'entrer ; on peut la rouvrir ou la supprimer (les questions de la salle sont alors effacées).</li>
        </ol>
      </div>
      <div className="card">
        <h2>Bon à savoir</h2>
        <ul>
          <li>Il faut être gestionnaire pour ouvrir une salle (<Link to="/contact?objet=gestionnaire">demander l'accès</Link>).</li>
          <li>Le formateur peut planifier une séance (date et heure) : le code existe dès la création mais les stagiaires ne peuvent rejoindre qu'à partir de l'heure prévue. « Ouvrir maintenant » avance le début.</li>
          <li>Le code est valable tant que la salle est ouverte ; chaque séance a son propre code.</li>
          <li>Le stagiaire doit être connecté avec son profil pour être identifié dans la salle.</li>
          <li>L'administrateur retrouve le nombre de séances dans Statistiques → Suivi de l'activité.</li>
        </ul>
      </div>
      </div>
    </Layout>
  );
}
