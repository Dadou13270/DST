import { useEffect, useMemo, useRef } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { StagiaireNav } from "./Home";
import { useAuth } from "../lib/auth";
import { editeurAutorise, useDroits } from "../lib/droits";
import webiMount, { webiDetach, webiSoft } from "../webi/webi";
import { adaptateurWebi } from "../lib/webi";

const T = ({ to, l, on }) => <Link to={to} className="tablink"><button className={on ? "on" : ""}>{l}</button></Link>;

// Webinaires en direct. ?esp=gestion : espace gestionnaire (création de salles si droit) ; sinon espace stagiaire (rejoindre).
export default function Webinaire() {
  const { code } = useParams();
  const loc = useLocation();
  const { user, profil, isAdmin } = useAuth();
  const droits = useDroits();
  const ref = useRef(null);
  const uid = user?.uid || "";
  const gest = !!(isAdmin || profil?.gestionnaire || profil?.adminDept);
  const esp = new URLSearchParams(loc.search).get("esp") === "gestion" && gest ? "gestion" : "stagiaire";
  const webOk = !!isAdmin || editeurAutorise(droits, profil, "web");
  const canEdit = esp === "gestion" && webOk;
  const opts = useMemo(() => adaptateurWebi({ uid, nom: profil?.nom || "", dept: profil?.departement || "", canEdit, isAdmin: !!isAdmin && esp === "gestion", initial: code || "" }),
    [uid, profil?.nom, profil?.departement, canEdit, isAdmin, code, esp]);
  useEffect(() => { if (uid && profil && ref.current) webiMount(ref.current, opts); return () => webiSoft(); }, [uid, !!profil, opts]); // eslint-disable-line
  useEffect(() => () => webiDetach(), []);
  if (esp === "gestion" && droits && !webOk) return <Navigate to="/gestion" replace />;
  return (
    <Layout>
      {esp === "gestion" ? (
        <>
          <div className="tabs navmenu">
            <T to="/gestion" l="Accueil" /><T to="/gestion?onglet=eq" l="Équipes" /><T to="/gestion?onglet=sa" l="Séances" on /><T to="/gestion?onglet=pc" l="Contenus" />
          </div>
          <div className="tabs sub navmenu">
            <T to="/gestion?onglet=sa" l="Séance en salle" /><T to="/roles" l="Jeu de rôle" /><T to="/webinaires?esp=gestion" l="Webinaires" on /><T to="/gestion?onglet=ca" l="Calendrier" /><T to="/gestion?onglet=hs" l="Historique des séances" />
          </div>
        </>
      ) : <StagiaireNav />}
      <div ref={ref} />
    </Layout>
  );
}
