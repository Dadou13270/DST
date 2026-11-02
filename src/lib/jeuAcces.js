import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./auth";

// Qui peut jouer : réglage « visibilite » du document jeuQuestions/_reglages (admin | encadrement | tous).
// Renvoie null pendant le chargement, puis true ou false.
export function useAccesJeu() {
  const { user, profil, isAdmin } = useAuth() || {};
  const [vis, setVis] = useState(null);
  useEffect(() => {
    if (!user) return;
    if (!db) { setVis("admin"); return; }
    getDoc(doc(db, "jeuQuestions", "_reglages")).then((s) => setVis(s.exists() ? s.data().visibilite || "admin" : "admin")).catch(() => setVis("admin"));
  }, [user]);
  if (isAdmin) return true;
  if (!user || vis === null) return vis === null && user ? null : false;
  if (vis === "tous") return true;
  if (vis === "encadrement") return !!(profil?.gestionnaire || profil?.adminDept);
  return false;
}
