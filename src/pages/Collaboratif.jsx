import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function Collaboratif() {
  return (
    <Layout>
      <div className="pgrid etroit">
        <h1 style={{ marginTop: 14 }}>Collaboratif</h1>
        <p className="muted">Une application construite avec et pour ceux qui se forment et qui forment.</p>
        <div className="card">
          <h2>🤝 L'esprit collaboratif</h2>
          <p>La Caserne Virtuelle est faite pour être partagée. Chaque stagiaire, formateur et gestionnaire peut l'enrichir : scénarios, quiz, cours, cartes mentales et fiches mémo créés par l'un profitent à tous les autres.</p>
          <p>Le forum d'entraide, les retours d'expérience, les demandes de scénarios et les commentaires aident à faire évoluer l'application selon les besoins réels du terrain. Tes idées et tes remarques sont les bienvenues.</p>
        </div>
        <div className="card">
          <h2>🚫 Sans publicité</h2>
          <p>Il n'y a aucune publicité dans l'application, et tes données ne sont ni revendues ni exploitées à des fins commerciales. L'objectif reste simple : t'aider à progresser.</p>
        </div>
        <div className="card">
          <h2>💙 Un don serait apprécié</h2>
          <p>L'hébergement des serveurs et les offres de stockage (photos, vidéos, cours en PDF) ont un coût. Pour que l'application reste gratuite et sans publicité, un don, même modeste, serait très apprécié.</p>
          <p className="muted">Pour faire un don ou proposer ton aide, écris-nous depuis la page de contact.</p>
          <Link className="btn primary" to="/contact">Nous contacter</Link>
        </div>
      </div>
    </Layout>
  );
}
