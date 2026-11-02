import { Link, Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { editeurAutorise, useDroits } from "../lib/droits";
import AdminEditor from "./AdminEditor";

// Éditeur de scénarios pour les gestionnaires autorisés (droits : Admin › Application › Droits).
export default function EditeurGest() {
  const { user, profil, isAdmin, loading } = useAuth();
  const droits = useDroits();
  if (loading || !droits || (user && !profil)) return <Layout><p>Chargement…</p></Layout>;
  if (!user) return <Navigate to="/connexion" replace />;
  if (!isAdmin && !editeurAutorise(droits, profil))
    return <Layout><div className="card warn">L'éditeur de scénarios n'est pas ouvert aux gestionnaires de ton département. <Link to="/gestion">Retour</Link></div></Layout>;
  return <Layout wide><AdminEditor perso /></Layout>;
}
