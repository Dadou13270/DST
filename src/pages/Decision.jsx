import { useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import decisionMount, { decisionDetach } from "../decision/decision";
import { listIllustrations } from "../lib/illustrations";
import { listDecision, saveDecision, deleteDecision, saveResultDecision } from "../lib/decision";

// Scénarios « Décision » (niveau chef d'équipe). Création / modification : admin et gestionnaires.
export default function Decision() {
  const { id } = useParams();
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
  return <Layout><div ref={ref} /></Layout>;
}
