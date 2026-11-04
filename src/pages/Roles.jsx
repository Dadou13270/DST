import { useEffect, useMemo, useRef } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { StagiaireNav } from "./Home";
import { useAuth } from "../lib/auth";
import rolesGestMount, { rolesJoueMount, rolesDetach } from "../roles/roles";
import { adaptateurGest, adaptateurJoue } from "../lib/roles";
import { editeurAutorise, useDroits } from "../lib/droits";

const T = ({ to, l, on }) => <Link to={to} className="tablink"><button className={on ? "on" : ""}>{l}</button></Link>;

// Jeu de rôle, côté formateur (gestionnaire / admin) : scénarios, éditeur, pilotage de la séance.
export default function Roles() {
  const { user, profil, isAdmin } = useAuth();
  const droits = useDroits();
  const ref = useRef(null);
  const uid = user?.uid || "";
  const ok = !!(isAdmin || profil?.gestionnaire || profil?.adminDept);
  const opts = useMemo(() => ({ uid, nom: profil?.nom || "", dept: profil?.departement || "", isAdmin: !!isAdmin, api: adaptateurGest({ uid, nom: profil?.nom, admin: !!isAdmin }) }), [uid, isAdmin, profil?.nom, profil?.departement]);
  useEffect(() => { if (uid && ok && ref.current) rolesGestMount(ref.current, opts); return () => rolesDetach(); }, [uid, ok, opts]);
  if (user && profil && !ok) return <Navigate to="/" replace />;
  return (
    <Layout>
      <div className="tabs navmenu">
        <T to="/gestion" l="Accueil" /><T to="/gestion?onglet=eq" l="Équipes" /><T to="/gestion?onglet=sa" l="Séances" on /><T to="/gestion?onglet=pc" l="Contenus" />
      </div>
      <div className="row between item"><h1>Espace gestionnaire</h1><Link className="btn" to="/messages">✉ Messagerie</Link></div>
      <div className="tabs sub navmenu">
        <T to="/gestion?onglet=sa" l="Séance en salle" /><T to="/roles" l="Jeu de rôle" on />{(isAdmin || editeurAutorise(droits, profil, "web")) && <T to="/webinaires?esp=gestion" l="Webinaires" />}<T to="/gestion?onglet=ca" l="Calendrier" /><T to="/gestion?onglet=hs" l="Historique des séances" />
      </div>
      <div ref={ref} />
    </Layout>
  );
}

// Jeu de rôle, côté stagiaire : saisir le code, prendre un poste, répondre aux injects.
export function RolesJouer() {
  const { code } = useParams();
  const nav = useNavigate();
  const { user, profil } = useAuth();
  const ref = useRef(null);
  const uid = user?.uid || "";
  const opts = useMemo(() => ({ uid, nom: profil?.nom || "", initial: (code || "").toUpperCase(), api: adaptateurJoue({ uid }), versSalle: () => nav("/seance") }), [uid, code, profil?.nom]); // eslint-disable-line
  useEffect(() => { if (uid && profil && ref.current) rolesJoueMount(ref.current, opts); return () => rolesDetach(); }, [uid, !!profil, opts]); // eslint-disable-line
  return <Layout><StagiaireNav /><div ref={ref} /></Layout>;
}
