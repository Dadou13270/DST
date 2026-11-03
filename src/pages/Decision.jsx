import { useEffect, useMemo, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { StagiaireNav } from "./Home";
import { editeurAutorise, useDroits } from "../lib/droits";
import { useAuth } from "../lib/auth";
import decisionMount, { decisionDetach } from "../decision/decision";
import { listIllustrations } from "../lib/illustrations";
import { espaceDecision, listDecision, saveDecision, deleteDecision, saveResultDecision } from "../lib/decision";


// Barres de navigation comme sur les autres pages (admin, gestionnaire ou stagiaire).
function BarreDecision({ esp }) {
  const { profil, isAdmin: adm } = useAuth();
  const droits = useDroits();
  const edOk = adm || editeurAutorise(droits, profil), quizOk = adm || editeurAutorise(droits, profil, "quiz"), evtOk = adm || editeurAutorise(droits, profil, "evt");
  const isAdmin = esp === "admin", gest = esp === "gestion";
  const T = ({ to, l, on }) => <Link to={to} className="tablink"><button className={on ? "on" : ""}>{l}</button></Link>;
  if (isAdmin)
    return (
      <>
        <div className="tabs navmenu">
          <T to="/admin" l="Scénarios" on /><T to="/admin/utilisateurs" l="Inscrits" /><T to="/admin/stats" l="Gestion" /><T to="/admin/annonces" l="Application" /><T to="/admin/site" l="Site" />
        </div>
        <div className="tabs sub navmenu"><T to="/admin" l="Scénarios" /><T to="/decision?esp=admin" l="Scénarios à décisions" on /><T to="/reco?esp=admin" l="Situations en images" /></div>
      </>
    );
  if (gest)
    return (
      <>
        <div className="tabs navmenu">
          <T to="/gestion" l="Accueil" /><T to="/gestion?onglet=eq" l="Équipes" /><T to="/gestion?onglet=sa" l="Séances" /><T to="/gestion?onglet=pc" l="Contenus" on />
        </div>
        <div className="tabs sub navmenu">
          <T to="/gestion?onglet=pc" l="Parcours pédagogiques" />{edOk && <T to="/gestion?onglet=ms" l="Mes scénarios" />}{quizOk && <T to="/gestion?onglet=mq" l="Mes quiz" />}{evtOk && <T to="/gestion?onglet=ev" l="Évènements" />}<T to="/decision?esp=gestion" l="Scénarios à décisions" on /><T to="/reco?esp=gestion" l="Situations en images" /><T to="/gestion?onglet=dm" l="Demande de scénario" />
        </div>
      </>
    );
  return <StagiaireNav />;
}

// Scénarios « Décision » (niveau chef d'équipe). Création / modification : admin et gestionnaires.
export default function Decision() {
  const { id } = useParams();
  const loc = useLocation();
  const { user, profil, isAdmin, refreshProfil } = useAuth();
  const ref = useRef(null);
  const pr = useRef(profil);
  pr.current = profil;
  const uid = user?.uid || "";
  const canEdit = !!(isAdmin || profil?.gestionnaire || profil?.adminDept);
  const opts = useMemo(() => ({
    uid, nom: profil?.nom || "", dept: profil?.departement || "", canEdit, isAdmin: !!isAdmin, initial: id || "",
    list: () => listDecision(uid, !!isAdmin), illus: listIllustrations, save: saveDecision, del: deleteDecision,
    saveResult: (sc, essai) => saveResultDecision(uid, pr.current, sc, essai, refreshProfil),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [uid, canEdit, isAdmin, id]);
  useEffect(() => { if (uid && ref.current) decisionMount(ref.current, opts); return () => decisionDetach(); }, [uid, opts]);
  return <Layout><BarreDecision esp={espaceDecision(loc.pathname, loc.search, !!isAdmin, !!(profil?.gestionnaire || profil?.adminDept))} /><div ref={ref} /></Layout>;
}
