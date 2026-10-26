import { useState } from "react";
import Intro from "./pages/Intro";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import Home from "./pages/Home";
import Player from "./pages/Player";
import AdminGate from "./pages/Admin";
import AdminList from "./pages/AdminList";
import AdminEditor from "./pages/AdminEditor";
import Carte from "./pages/Carte";
import Parametres from "./pages/Parametres";
import AdminStats from "./pages/AdminStats";
import AdminUsers from "./pages/AdminUsers";
import Login from "./pages/Login";
import Contact from "./pages/Contact";
import Seance from "./pages/Seance";
import Equipe from "./pages/Equipe";
import Gestion from "./pages/Gestion";
import Profil from "./pages/Profil";
import AideEquipes from "./pages/AideEquipes";
import AideSalle from "./pages/AideSalle";
import APropos from "./pages/APropos";
import Nouveautes from "./pages/Nouveautes";
import Tickets from "./pages/Tickets";
import AdminTickets from "./pages/AdminTickets";
import Cgu from "./pages/Cgu";
import Salle from "./pages/Salle";
import SalleProjection from "./pages/SalleProjection";
import Suivi from "./pages/Suivi";
import RequireUser from "./components/RequireUser";

const vu = () => { try { return sessionStorage.getItem("soiec-intro") === "1"; } catch { return false; } };

export default function App() {
  const [entre, setEntre] = useState(vu);
  if (!entre)
    return <Intro onEnter={() => { try { sessionStorage.setItem("soiec-intro", "1"); } catch { /* ignoré */ } setEntre(true); }} />;
  return (
    <AuthProvider>
      <Routes>
        <Route path="/connexion" element={<Login />} />
        <Route path="/" element={<RequireUser><Home /></RequireUser>} />
        <Route path="/aide-equipes" element={<AideEquipes />} />
        <Route path="/aide-salle" element={<AideSalle />} />
        <Route path="/a-propos" element={<APropos />} />
        <Route path="/nouveautes" element={<Nouveautes />} />
        <Route path="/tickets" element={<RequireUser><Tickets /></RequireUser>} />
        <Route path="/cgu" element={<Cgu />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/equipe" element={<RequireUser><Equipe /></RequireUser>} />
        <Route path="/seance" element={<RequireUser><Seance /></RequireUser>} />
        <Route path="/gestion" element={<RequireUser><Gestion /></RequireUser>} />
        <Route path="/gestion/salle/:code" element={<RequireUser><Salle /></RequireUser>} />
        <Route path="/gestion/salle/:code/projection" element={<RequireUser><SalleProjection /></RequireUser>} />
        <Route path="/carte" element={<RequireUser><Carte /></RequireUser>} />
        <Route path="/profil" element={<RequireUser><Profil /></RequireUser>} />
        <Route path="/suivi" element={<RequireUser><Suivi /></RequireUser>} />
        <Route path="/scenario/:id" element={<RequireUser><Player /></RequireUser>} />
        <Route path="/admin" element={<AdminGate />}>
          <Route index element={<AdminList />} />
          <Route path="scenario/:id" element={<AdminEditor />} />
          <Route path="utilisateurs" element={<AdminUsers />} />
          <Route path="stats" element={<AdminStats />} />
          <Route path="parametres" element={<Parametres />} />
          <Route path="tickets" element={<AdminTickets />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
