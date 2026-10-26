import Layout from "../components/Layout";
import { StagiaireNav } from "./Home";
import SalleJoin from "../components/SalleJoin";

// Côté stagiaire : rejoindre une séance en salle avec le code donné par le formateur.
export default function Seance() {
  return (
    <Layout>
      <StagiaireNav />
      <h1>Séance en salle</h1>
      <p className="muted">Ton formateur projette un scénario et te donne un code : saisis-le pour interroger les intervenants depuis ton appareil.</p>
      <SalleJoin />
    </Layout>
  );
}
