import Layout from "../components/Layout";

export default function Presentation() {
  return (
    <Layout>
      <div className="pgrid">
      <h1 style={{ marginTop: 14 }}>Présentation de l'application</h1>
      <p className="muted">Les fonctions disponibles pour chaque profil.</p>
      <div className="card">
        <h2>🎓 Stagiaire</h2>
        <p className="muted">S'entraîner, progresser, être suivi</p>
        <ul>
          <li>Scénarios de devoirs sur table à partir de photos : observer la situation, interroger les interlocuteurs, répondre, puis recevoir un bilan corrigé.</li>
          <li>Quiz, QCM, scénarios à décisions et situations en images pour réviser autrement.</li>
          <li>Séance en salle : rejoindre la séance du formateur avec un code.</li>
          <li>Jeu de rôle : chacun tient un poste (équipier, chef d'équipe, conducteur, chef d'agrès, chef de groupe) et réagit aux injects en direct.</li>
          <li>Webinaires : salles de formation en direct, avec lever de main et messages.</li>
          <li>Mon suivi : progression, retards, échéances, parcours de formation et compte à rebours des évènements.</li>
          <li>Mon équipe, messagerie avec le gestionnaire, profil personnel.</li>
          <li>Fiches mémo, forum d'entraide entre stagiaires et jeu Trivial pompiers (seul ou à plusieurs).</li>
        </ul>
      </div>
      <div className="card">
        <h2>🧑‍🏫 Gestionnaire</h2>
        <p className="muted">Former, animer, suivre son équipe</p>
        <ul>
          <li>Créer des équipes, partager le code d'inscription et répartir les stagiaires.</li>
          <li>Construire des parcours pédagogiques, fixer des échéances et relancer les retardataires.</li>
          <li>Animer une séance en salle, un jeu de rôle ou un webinaire ; calendrier et historique des séances.</li>
          <li>Créer ses propres scénarios, quiz, scénarios à décisions et situations en images (selon les droits accordés).</li>
          <li>Tableau de bord de l'équipe, profils du CIS, bilans et attestations de parcours.</li>
          <li>Messagerie directe avec les stagiaires.</li>
        </ul>
      </div>
      <div className="card">
        <h2>🏛️ Admin de département</h2>
        <p className="muted">Piloter la formation du département</p>
        <ul>
          <li>Statistiques du département : activité, progression et résultats des stagiaires.</li>
          <li>Profils des inscrits du département.</li>
          <li>Vision d'ensemble pour suivre la montée en compétence de tous les CIS.</li>
        </ul>
      </div>
      </div>
    </Layout>
  );
}
