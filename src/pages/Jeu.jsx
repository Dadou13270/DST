import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import jeuMount, { multiDetach, questionsDeQuiz } from "../jeu/jeu";
import banqueBase from "../jeu/banque";
import { useAccesJeu } from "../lib/jeuAcces";
import { listQuiz } from "../lib/quiz";
import { deleteQuestionJeu, listPartiesJeu, listQuestionsJeu, logPartieJeu, saveQuestionJeu, salleQr, salleSet, salleWatchCode, salleWatchDoc } from "../lib/jeuDb";

// Jeu « Trivial pompiers » (version test, réservé à l'admin pour l'instant).
// Banque = questions intégrées + questions ajoutées (jeuQuestions) + quiz et QCM publiés (classés par mots-clés).
export default function Jeu() {
  const { isAdmin, user, profil } = useAuth();
  const [params] = useSearchParams();
  const codeInitial = params.get("salle") || "";
  const acces = useAccesJeu();
  const ref = useRef(null);
  const [perso, setPerso] = useState([]);
  const [quiz, setQuiz] = useState([]);
  useEffect(() => {
    listQuestionsJeu().then(setPerso).catch(() => {});
    listQuiz(false).then((l) => setQuiz(questionsDeQuiz(l, banqueBase))).catch(() => {});
  }, []);
  const banque = useMemo(() => [...banqueBase, ...quiz, ...perso.filter((d) => !String(d.id).startsWith("_") && d.actif !== false).map((d) => ({ id: d.id, c: d.c, n: d.n, q: d.q, o: d.o, a: d.a, e: d.e || "", s: "perso" }))], [perso, quiz]);
  const reglages = perso.find((d) => d.id === "_reglages");
  const themes = (perso.find((d) => d.id === "_themes") || {}).themes;
  const uid = user?.uid || "";
  const salle = useMemo(() => ({ uid: () => uid, nom: () => profil?.nom || profil?.prenom || "", peutCreer: () => !!(isAdmin || profil?.gestionnaire || profil?.adminDept), set: salleSet, watchDoc: salleWatchDoc, watchCode: salleWatchCode, qr: salleQr, lien: (c) => window.location.origin + "/jeu?salle=" + c }), [uid, profil, isAdmin]);
  const opts = useMemo(() => ({ themes, reglages, admin: !!isAdmin, listQ: listQuestionsJeu, saveQ: saveQuestionJeu, delQ: deleteQuestionJeu, listP: listPartiesJeu, logP: logPartieJeu, salle, codeInitial }), [isAdmin, themes, reglages, salle, codeInitial]);
  useEffect(() => () => multiDetach(), []);
  useEffect(() => { if (acces && ref.current) jeuMount(ref.current, banque, opts); }, [acces, banque, opts]);
  if (acces === false) return <Layout><div className="box" style={{ maxWidth: 560, margin: "24px auto" }}><h2>Jeu non disponible</h2><p>Le jeu n'est pas encore ouvert à votre profil.</p></div></Layout>;
  return <Layout>{acces === null ? <p style={{ textAlign: "center" }}>Chargement…</p> : <div ref={ref} />}</Layout>;
}
