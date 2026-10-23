import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import Home from "./pages/Home";
import Player from "./pages/Player";
import AdminGate from "./pages/Admin";
import AdminList from "./pages/AdminList";
import AdminEditor from "./pages/AdminEditor";
import AdminUsers from "./pages/AdminUsers";
import Login from "./pages/Login";
import Suivi from "./pages/Suivi";
import RequireUser from "./components/RequireUser";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/connexion" element={<Login />} />
        <Route path="/" element={<RequireUser><Home /></RequireUser>} />
        <Route path="/suivi" element={<RequireUser><Suivi /></RequireUser>} />
        <Route path="/scenario/:id" element={<RequireUser><Player /></RequireUser>} />
        <Route path="/admin" element={<AdminGate />}>
          <Route index element={<AdminList />} />
          <Route path="scenario/:id" element={<AdminEditor />} />
          <Route path="utilisateurs" element={<AdminUsers />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
