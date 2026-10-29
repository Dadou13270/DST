import { useCallback, useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Carnet personnel (privé) : users/{uid}/perso/carnet = { favoris: [clé], notes: { clé: { texte, le } } }
// clé = "s:<idScénario>" ou "e:<idExercice>"
const ref = (uid) => doc(db, "users", uid, "perso", "carnet");
export const VIDE = { favoris: [], notes: {} };

export function useCarnet(uid) {
  const [c, setC] = useState(VIDE);
  const [pret, setPret] = useState(false);
  useEffect(() => {
    if (!uid) return;
    getDoc(ref(uid)).then((s) => { if (s.exists()) setC({ ...VIDE, ...s.data() }); }).catch(() => {}).finally(() => setPret(true));
  }, [uid]);
  const sauver = useCallback(async (nc) => {
    setC(nc);
    await setDoc(ref(uid), JSON.parse(JSON.stringify(nc)));
  }, [uid]);
  const basculerFavori = (k) => sauver({ ...c, favoris: c.favoris.includes(k) ? c.favoris.filter((x) => x !== k) : [...c.favoris, k] });
  const noter = (k, texte) => {
    const notes = { ...c.notes };
    if (texte.trim()) notes[k] = { texte: texte.trim().slice(0, 2000), le: Date.now() }; else delete notes[k];
    return sauver({ ...c, notes });
  };
  return { carnet: c, pret, basculerFavori, noter };
}
