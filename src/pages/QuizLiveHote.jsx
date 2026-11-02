import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { quizLiveMount, qlLire } from "../quizlive/quizlive";
import { adaptateursQuizLive } from "../lib/quizLiveDb";

// Écran du formateur (à projeter) : quiz en direct.
export default function QuizLiveHote() {
  const { code } = useParams();
  const { user, isAdmin, profil } = useAuth();
  const nav = useNavigate();
  const ref = useRef(null);
  const [err, setErr] = useState("");
  const gest = isAdmin || !!profil?.gestionnaire;
  useEffect(() => {
    if (!user || !gest || !ref.current) return undefined;
    let inst = null, mort = false;
    const ad = adaptateursQuizLive({ uid: user.uid, nom: profil?.nom, quitter: () => nav("/gestion") });
    (async () => {
      try {
        const d = await qlLire(ad, code);
        if (!d) throw new Error("Salle de quiz introuvable.");
        const s = d.qid ? await getDoc(doc(db, "exercicesQuiz", d.qid)) : null;
        if (!s || !s.exists()) throw new Error("Le quiz de cette salle n'est plus disponible.");
        if (!mort) inst = quizLiveMount(ref.current, { ...ad, role: "hote", code, quiz: { id: s.id, ...s.data() } });
      } catch (e) { setErr(e.message); }
    })();
    return () => { mort = true; if (inst) inst.destroy(); };
  }, [user?.uid, code, gest]); // eslint-disable-line
  if (!user) return null;
  if (!gest) return <Navigate to="/" replace />;
  return <Layout wide>{err ? <div className="card warn">{err}</div> : null}<div ref={ref} /></Layout>;
}
