import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function AideEquipes() {
  return (
    <Layout>
      <h1>Gestionnaires et équipes : mode d'emploi</h1>
      <div className="card" style={{ maxWidth: 780 }}>
        <h2>À quoi ça sert ?</h2>
        <p>Un <strong>gestionnaire</strong> (formateur, chef de centre, responsable de formation…) regroupe des stagiaires dans une <strong>équipe</strong> pour suivre leur progression dans les devoirs sur table : exercices terminés, temps moyen, questions essentielles posées et détail de chaque exercice.</p>
      </div>
      <div className="card" style={{ maxWidth: 780 }}>
        <h2>Pour le stagiaire</h2>
        <ol>
          <li>Demande le <strong>code d'accès</strong> (6 caractères) à ton gestionnaire.</li>
          <li>Ouvre <Link to="/equipe">Mon équipe</Link> et saisis le code, puis « Rejoindre ».</li>
          <li>Ton gestionnaire voit alors ton suivi. Ton profil affiche ton équipe et le nom du gestionnaire.</li>
          <li>Tu peux quitter l'équipe à tout moment depuis la même page. Tu ne peux appartenir qu'à une seule équipe à la fois.</li>
        </ol>
      </div>
      <div className="card" style={{ maxWidth: 780 }}>
        <h2>Pour le gestionnaire</h2>
        <ol>
          <li>Le rôle est attribué par un administrateur (voir la demande ci-dessous). Un bouton « Espace gestionnaire » apparaît ensuite dans la barre.</li>
          <li>Crée une équipe : un code d'accès est généré. Communique-le aux stagiaires concernés.</li>
          <li>Le tableau de l'équipe liste les membres avec leurs résultats ; « Suivi » ouvre le détail par exercice.</li>
          <li>« Nouveau code » invalide l'ancien (les membres déjà inscrits restent dans l'équipe) ; « Retirer » sort un membre ; « Supprimer l'équipe » libère tous les membres.</li>
          <li>Un gestionnaire ne voit que les membres de ses propres équipes.</li>
        </ol>
      </div>
      <div className="card" style={{ maxWidth: 780 }}>
        <h2>Demander l'accès gestionnaire</h2>
        <p>Indique ta fonction et le public concerné (centre, promotion, formation).</p>
        <Link className="btn primary" to="/contact?objet=gestionnaire">Remplir le formulaire de demande</Link>
      </div>
    </Layout>
  );
}
