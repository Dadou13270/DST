import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { quizLiveMount, qlCode } from "../quizlive/quizlive";
import { adaptateursQuizLive } from "../lib/quizLiveDb";

// Écran « manette » du participant : quiz en direct.
export default function QuizLiveJoueur() {
  const { user, profil } = useAuth();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const code = qlCode(sp.get("code") || "");
  const ref = useRef(null);
  useEffect(() => {
    if (!user || !profil || !code || !ref.current) return undefined;
    const inst = quizLiveMount(ref.current, { ...adaptateursQuizLive({ uid: user.uid, nom: profil.nom || user.email || "Stagiaire", quitter: () => nav("/seance") }), role: "joueur", code });
    return () => inst.destroy();
  }, [user?.uid, !!profil, code]); // eslint-disable-line
  if (!code) { nav("/seance", { replace: true }); return null; }
  return <Layout><div ref={ref} /></Layout>;
}
