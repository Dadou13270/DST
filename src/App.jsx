import { useState } from "react";
import Intro from "./pages/Intro";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import Home from "./pages/Home";
import Player from "./pages/Player";
import AdminGate from "./pages/Admin";
import AdminDroits from "./pages/AdminDroits";
import AdminMenus from "./pages/AdminMenus";
import EditeurGest from "./pages/EditeurGest";
import Quiz from "./pages/Quiz";
import AdminQuiz from "./pages/AdminQuiz";
import EditeurQuizGest from "./pages/EditeurQuizGest";
import AdminList from "./pages/AdminList";
import AdminEditor from "./pages/AdminEditor";
import Carte from "./pages/Carte";
import Parametres from "./pages/Parametres";
import Jeu from "./pages/Jeu";
import Forum from "./pages/Forum";
import AdminEvenements from "./pages/AdminEvenements";
import Attribution from "./pages/Attribution";
import Departement from "./pages/Departement";
import AdminGestionnaires from "./pages/AdminGestionnaires";
import AdminSdis from "./pages/AdminSdis";
import AdminAnnonces from "./pages/AdminAnnonces";
import DemanderScenario from "./pages/DemanderScenario";
import AdminStats from "./pages/AdminStats";
import AdminUsers from "./pages/AdminUsers";
import Login from "./pages/Login";
import Contact from "./pages/Contact";
import Seance from "./pages/Seance";
import AdminCalcul from "./pages/AdminCalcul";
import { CalculExercice } from "./pages/Calculs";
import Equipe from "./pages/Equipe";
import Gestion from "./pages/Gestion";
import Profil from "./pages/Profil";
import AideEquipes from "./pages/AideEquipes";
import AideSalle from "./pages/AideSalle";
import APropos from "./pages/APropos";
import Presentation from "./pages/Presentation";
import Collaboratif from "./pages/Collaboratif";
import Nouveautes from "./pages/Nouveautes";
import Tickets from "./pages/Tickets";
import AdminTickets from "./pages/AdminTickets";
import Legal from "./pages/Legal";
import AdminLegal from "./pages/AdminLegal";
import AdminBanque from "./pages/AdminBanque";
import Relation from "./pages/Relation";
import AdminRelation from "./pages/AdminRelation";
import Site from "./pages/Site";
import Messagerie from "./pages/Messagerie";
import AdminAudit from "./pages/AdminAudit";
import AdminSite from "./pages/AdminSite";
import Salle from "./pages/Salle";
import QuizLiveHote from "./pages/QuizLiveHote";
import QuizLiveJoueur from "./pages/QuizLiveJoueur";
import SalleProjection from "./pages/SalleProjection";
import FichesMemo from "./pages/FichesMemo";
import { MesCartes, CarteVue } from "./pages/Cartes";
import { MesCours, CoursVue } from "./pages/Cours";
import Suivi from "./pages/Suivi";
import Decision from "./pages/Decision";
import Reco from "./pages/Reco";
import Webinaire from "./pages/Webinaire";
import Profils, { ProfilsVue } from "./pages/Profils";
import Roles, { RolesJouer } from "./pages/Roles";
import RequireUser from "./components/RequireUser";

const vu = () => { try { return sessionStorage.getItem("soiec-intro") === "1"; } catch { return false; } };

export default function App() {
  const [entre, setEntre] = useState(() => window.location.pathname.startsWith("/site") || vu());
  if (!entre)
    return <Intro onEnter={() => { try { sessionStorage.setItem("soiec-intro", "1"); } catch { /* ignoré */ } setEntre(true); }} />;
  return (
    <AuthProvider>
      <Routes>
        <Route path="/connexion" element={<Login />} />
        <Route path="/" element={<RequireUser><Home mode="accueil" /></RequireUser>} />
        <Route path="/roles" element={<RequireUser><Roles /></RequireUser>} />
        <Route path="/roles/jouer" element={<RequireUser><RolesJouer /></RequireUser>} />
        <Route path="/roles/jouer/:code" element={<RequireUser><RolesJouer /></RequireUser>} />
        <Route path="/decision" element={<RequireUser><Decision /></RequireUser>} />
        <Route path="/decision/:id" element={<RequireUser><Decision /></RequireUser>} />
        <Route path="/profils" element={<RequireUser><Profils /></RequireUser>} />
        <Route path="/webinaires" element={<RequireUser><Webinaire /></RequireUser>} />
        <Route path="/webinaire/:code" element={<RequireUser><Webinaire /></RequireUser>} />
        <Route path="/reco" element={<RequireUser><Reco /></RequireUser>} />
        <Route path="/reco/:id" element={<RequireUser><Reco /></RequireUser>} />
        <Route path="/scenarios" element={<RequireUser><Home mode="scenarios" /></RequireUser>} />
        <Route path="/aide-equipes" element={<AideEquipes />} />
        <Route path="/aide-salle" element={<AideSalle />} />
        <Route path="/site" element={<Site />} />
        <Route path="/a-propos" element={<APropos />} />
        <Route path="/presentation" element={<Presentation />} />
        <Route path="/collaboratif" element={<Collaboratif />} />
        <Route path="/nouveautes" element={<Nouveautes />} />
        <Route path="/demande-scenario" element={<RequireUser><DemanderScenario /></RequireUser>} />
        <Route path="/tickets" element={<RequireUser><Tickets /></RequireUser>} />
        <Route path="/cgu" element={<Legal k="cgu" />} />
        <Route path="/confidentialite" element={<Legal k="confidentialite" />} />
        <Route path="/mentions-legales" element={<Legal k="mentions" />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/equipe" element={<RequireUser><Equipe /></RequireUser>} />
        <Route path="/seance" element={<RequireUser><Seance /></RequireUser>} />
        <Route path="/calculs" element={<Navigate to="/scenarios" replace />} />
        <Route path="/calculs/:id" element={<RequireUser><CalculExercice /></RequireUser>} />
        <Route path="/relation/:id" element={<RequireUser><Relation /></RequireUser>} />
        <Route path="/departement" element={<RequireUser><Departement /></RequireUser>} />
        <Route path="/gestion" element={<RequireUser><Gestion /></RequireUser>} />
        <Route path="/gestion/salle/:code" element={<RequireUser><Salle /></RequireUser>} />
        <Route path="/gestion/quiz-live/:code" element={<RequireUser><QuizLiveHote /></RequireUser>} />
        <Route path="/quiz-live" element={<RequireUser><QuizLiveJoueur /></RequireUser>} />
        <Route path="/gestion/salle/:code/projection" element={<RequireUser><SalleProjection /></RequireUser>} />
        <Route path="/carte" element={<RequireUser><Carte /></RequireUser>} />
        <Route path="/profil" element={<RequireUser><Profil /></RequireUser>} />
        <Route path="/messages" element={<RequireUser><Messagerie /></RequireUser>} />
        <Route path="/fiches" element={<RequireUser><FichesMemo /></RequireUser>} />
        <Route path="/cours" element={<RequireUser><MesCours /></RequireUser>} />
        <Route path="/cours/:id" element={<RequireUser><CoursVue /></RequireUser>} />
        <Route path="/cartes" element={<RequireUser><MesCartes /></RequireUser>} />
        <Route path="/carte/:id" element={<RequireUser><CarteVue /></RequireUser>} />
        <Route path="/suivi" element={<RequireUser><Suivi /></RequireUser>} />
        <Route path="/scenario/:id" element={<RequireUser><Player /></RequireUser>} />
        <Route path="/editeur/scenario/:id" element={<EditeurGest />} />
        <Route path="/editeur/quiz/:id" element={<EditeurQuizGest />} />
        <Route path="/quiz/:id" element={<RequireUser><Quiz /></RequireUser>} />
        <Route path="/jeu" element={<RequireUser><Jeu /></RequireUser>} />
        <Route path="/forum" element={<RequireUser><Forum /></RequireUser>} />
        <Route path="/admin" element={<AdminGate />}>
          <Route index element={<AdminList />} />
          <Route path="scenario/:id" element={<AdminEditor />} />
          <Route path="calcul/:id" element={<AdminCalcul />} />
          <Route path="relation/:id" element={<AdminRelation />} />
          <Route path="quiz/:id" element={<AdminQuiz />} />
          <Route path="utilisateurs" element={<AdminUsers />} />
          <Route path="profils" element={<ProfilsVue esp="admin" />} />
          <Route path="stats" element={<AdminStats />} />
          <Route path="parametres" element={<Parametres />} />
          <Route path="attribution" element={<Attribution />} />
          <Route path="gestionnaires" element={<AdminGestionnaires />} />
          <Route path="sdis" element={<AdminSdis />} />
          <Route path="annonces" element={<AdminAnnonces />} />
          <Route path="evenements" element={<AdminEvenements />} />
          <Route path="legal" element={<AdminLegal />} />
          <Route path="banque" element={<AdminBanque />} />
          <Route path="droits" element={<AdminDroits />} />
          <Route path="menus" element={<AdminMenus />} />
          <Route path="tickets" element={<AdminTickets />} />
          <Route path="site" element={<AdminSite />} />
          <Route path="journal" element={<AdminAudit />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
