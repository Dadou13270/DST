import { useEffect, useMemo, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { StagiaireNav } from "./Home";
import { useAuth } from "../lib/auth";
import recoMount, { recoDetach } from "../reco/reco";
import { espaceReco, listReco, saveReco, deleteReco, saveResultReco, imageExemple } from "../lib/reco";


// Barres de navigation comme sur les autres pages (admin, gestionnaire ou stagiaire).
function BarreReco({ esp }) {
  const isAdmin = esp === "admin", gest = esp === "gestion";
  const T = ({ to, l, on }) => <Link to={to} className="tablink"><button className={on ? "on" : ""}>{l}</button></Link>;
  if (isAdmin)
    return (
      <>
        <div className="tabs navmenu">
          <T to="/admin" l="Scénarios" on /><T to="/admin/utilisateurs" l="Inscrits" /><T to="/admin/stats" l="Gestion" /><T to="/admin/annonces" l="Application" /><T to="/admin/site" l="Site" />
        </div>
        <div className="tabs sub navmenu"><T to="/admin" l="Scénarios" /><T to="/decision?esp=admin" l="Scénarios à décisions" /><T to="/reco?esp=admin" l="Situations en images" on /></div>
      </>
    );
  if (gest)
    return (
      <>
        <div className="tabs navmenu">
          <T to="/gestion" l="Accueil" /><T to="/gestion?onglet=eq" l="Équipes" /><T to="/gestion?onglet=sa" l="Séances" /><T to="/gestion?onglet=pc" l="Contenus" on />
        </div>
        <div className="tabs sub navmenu">
          <T to="/gestion?onglet=pc" l="Parcours pédagogiques" /><T to="/gestion?onglet=ms" l="Mes scénarios" /><T to="/gestion?onglet=mq" l="Mes quiz" /><T to="/decision?esp=gestion" l="Scénarios à décisions" /><T to="/reco?esp=gestion" l="Situations en images" on /><T to="/gestion?onglet=dm" l="Demande de scénario" />
        </div>
      </>
    );
  return <StagiaireNav />;
}

// Situations en images. Création / modification : admin et gestionnaires.
export default function Reco() {
  const { id } = useParams();
  const loc = useLocation();
  const { user, profil, isAdmin, refreshProfil } = useAuth();
  const ref = useRef(null);
  const pr = useRef(profil);
  pr.current = profil;
  const uid = user?.uid || "";
  const esp = espaceReco(loc.pathname, loc.search, !!isAdmin, !!(profil?.gestionnaire || profil?.adminDept));
  const canEdit = esp !== "stagiaire" && !!(isAdmin || profil?.gestionnaire || profil?.adminDept);
  const opts = useMemo(() => ({
    uid, nom: profil?.nom || "", dept: profil?.departement || "", canEdit, isAdmin: !!isAdmin && esp !== "stagiaire", initial: id || "",
    list: () => listReco(uid, !!isAdmin && esp !== "stagiaire").then((l) => (esp === "stagiaire" ? l.filter((x) => x.publie) : l)), save: saveReco, del: deleteReco, imageExemple,
    saveResult: (sc, essai) => saveResultReco(uid, pr.current, sc, essai, refreshProfil),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [uid, canEdit, isAdmin, id, esp]);
  useEffect(() => { if (uid && ref.current) recoMount(ref.current, opts); return () => recoDetach(); }, [uid, opts]);
  return <Layout><BarreReco esp={esp} /><div ref={ref} /></Layout>;
}
