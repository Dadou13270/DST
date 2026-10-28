import { useEffect, useState } from "react";
import { getEquipe, statutDevoir } from "./devoirs";

// Exercices imposés par l'équipe du stagiaire, avec leur statut.
export function useDevoirs(profil) {
  const [liste, setListe] = useState([]);
  useEffect(() => {
    if (!profil?.equipeId) { setListe([]); return; }
    getEquipe(profil.equipeId)
      .then((t) => setListe(((t && t.devoirs) || []).map((d) => ({ ...d, statut: statutDevoir(d, profil.bilans, Date.now(), profil.calculs) })).sort((a, b) => (a.limite || 0) - (b.limite || 0))))
      .catch(() => setListe([]));
  }, [profil?.equipeId, profil?.bilans, profil?.calculs]);
  return liste;
}
