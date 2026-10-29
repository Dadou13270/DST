import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Fiches from "../components/Fiches";
import { useAuth } from "../lib/auth";
import { StagiaireNav } from "./Home";

export default function FichesMemo() {
  const { profil, logout } = useAuth();
  return (
    <Layout right={<>{profil && <span>{profil.nom}</span>}<button className="link" onClick={logout}>Déconnexion</button></>}>
      <StagiaireNav />
      <h1>Fiches mémo</h1>
      <p className="muted">Rappels courts : SOIEC, SMES, message d'ambiance, compte rendu, reconnaissance cubique, formules LIF. Aussi disponibles dans un exercice (onglet « Fiches »).</p>
      <Fiches />
    </Layout>
  );
}
