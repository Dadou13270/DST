import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function APropos() {
  return (
    <Layout>
      <div className="pgrid">
      <h1>À propos</h1>
      <div className="card">
        <h2>Qui est derrière cette application ?</h2>
        <p>« OPS Training » a été réalisée par un <strong>sapeur-pompier formateur incendie</strong>, à partir de son expérience du terrain et de la formation.</p>
      </div>
      <div className="card">
        <h2>Pourquoi ?</h2>
        <p>Le constat est simple : il manquait une application de ce genre pour <strong>se préparer à une formation</strong>. S'entraîner à observer une situation, interroger les intervenants, construire son SOIEC et rédiger son message de renseignements ne pouvait se faire qu'en salle, le jour J.</p>
      </div>
      <div className="card">
        <h2>Un vrai avantage</h2>
        <ul>
          <li>S'entraîner <strong>avant</strong> la formation, à son rythme, depuis son téléphone, sa tablette ou son ordinateur.</li>
          <li>Arriver en formation mieux préparé et plus à l'aise avec la méthode.</li>
          <li>Gagner du temps de formation : le formateur peut se concentrer sur le débriefing et les points délicats.</li>
          <li>Retrouver des situations réalistes, avec correction et points de vigilance.</li>
        </ul>
      </div>
      <div className="card">
        <h2>Une application collaborative</h2>
        <p>Ici, <strong>chacun est acteur de sa formation</strong>. Les stagiaires s'entraînent et suivent leur progression, les formateurs et gestionnaires créent des équipes et animent des séances en salle, et chacun peut proposer des scénarios, donner son avis ou faire une suggestion. L'application s'enrichit avec l'expérience de tous.</p>
        <p><Link to="/contact">Nous contacter</Link></p>
      </div>
      </div>
    </Layout>
  );
}
