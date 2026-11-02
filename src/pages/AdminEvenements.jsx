import { useAuth } from "../lib/auth";
import EvenementsGestion from "../components/EvenementsGestion";

export default function AdminEvenements() {
  const { user, profil } = useAuth();
  return user ? <EvenementsGestion admin user={user} profil={profil} /> : null;
}
