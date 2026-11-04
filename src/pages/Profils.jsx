import { useEffect, useMemo, useRef } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import profilsMount, { profilsDetach } from "../profils/profils";
import { listProfils, espaceProfils } from "../lib/profils";

const T = ({ to, l, on }) => <Link to={to} className="tablink"><button className={on ? "on" : ""}>{l}</button></Link>;

// Liste des profils selon l'espace : admin (tous, filtres), département, CIS du gestionnaire.
export function ProfilsVue({ esp }) {
  const { user, profil } = useAuth();
  const ref = useRef(null);
  const uid = user?.uid || "";
  const opts = useMemo(() => ({
    titre: esp === "admin" ? "Profils des inscrits" : esp === "dept" ? "Profils du département" : "Profils de mon CIS",
    portee: esp === "admin" ? "Tous les inscrits de l'application" : esp === "dept" ? `Département : ${profil?.adminDept || "—"}` : `CIS : ${profil?.cis || "non renseigné"}${profil?.departement ? " · " + profil.departement : ""}`,
    list: () => listProfils(esp, profil),
  }), [esp, profil?.adminDept, profil?.cis, profil?.departement]); // eslint-disable-line
  useEffect(() => { if (uid && profil && ref.current) profilsMount(ref.current, opts); return () => profilsDetach(); }, [uid, !!profil, opts]); // eslint-disable-line
  return <div ref={ref} />;
}

export default function Profils() {
  const loc = useLocation();
  const { profil, isAdmin } = useAuth();
  const esp = espaceProfils(loc.search, !!isAdmin, profil);
  if (profil && !esp) return <Navigate to="/" replace />;
  if (!esp) return <Layout><p>Chargement…</p></Layout>;
  if (esp === "admin") return <Navigate to="/admin/profils" replace />;
  return (
    <Layout>
      {esp === "gestion" && (
        <>
          <div className="tabs navmenu">
            <T to="/gestion" l="Accueil" /><T to="/gestion?onglet=eq" l="Équipes" on /><T to="/gestion?onglet=sa" l="Séances" /><T to="/gestion?onglet=pc" l="Contenus" />
          </div>
          <div className="tabs sub navmenu">
            <T to="/gestion?onglet=eq&sub=cr" l="Création de l'équipe" /><T to="/gestion?onglet=eq&sub=ge" l="Gestion de l'équipe" /><T to="/gestion?onglet=eq&sub=tb" l="Tableau de bord" /><T to="/profils?esp=gestion" l="Profils du CIS" on />
          </div>
        </>
      )}
      {esp === "dept" && <div className="tabs navmenu"><T to="/departement" l="Statistiques du département" /><T to="/profils?esp=dept" l="Profils du département" on /></div>}
      <ProfilsVue esp={esp} />
    </Layout>
  );
}
