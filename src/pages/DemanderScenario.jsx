import Layout from "../components/Layout";
import DemandeScenario from "../components/DemandeScenario";
import { useAuth } from "../lib/auth";

export default function DemanderScenario() {
  const { user, profil } = useAuth();
  if (!user) return null;
  return (
    <Layout>
      <h1>Demander un scénario</h1>
      <DemandeScenario user={user} profil={profil} />
    </Layout>
  );
}
