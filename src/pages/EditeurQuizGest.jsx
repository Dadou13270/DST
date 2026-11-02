import { Link, Navigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { editeurAutorise, useDroits } from "../lib/droits";
import AdminQuiz from "./AdminQuiz";

// Éditeur de quiz / QCM pour les gestionnaires autorisés (Admin › Application › Droits).
export default function EditeurQuizGest() {
  const { user, profil, isAdmin, loading } = useAuth();
  const droits = useDroits();
  if (loading || !droits || (user && !profil)) return <Layout><p>Chargement…</p></Layout>;
  if (!user) return <Navigate to="/connexion" replace />;
  if (!isAdmin && !editeurAutorise(droits, profil, "quiz"))
    return <Layout><div className="card warn">Les quiz ne sont pas ouverts aux gestionnaires de ton département. <Link to="/gestion">Retour</Link></div></Layout>;
  return <Layout wide><AdminQuiz perso /></Layout>;
}
