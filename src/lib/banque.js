import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

// Banque de commentaires types, rédigée et modifiable par l'administrateur général : document site/banque.
// Utilisée par les formateurs dans les fiches d'évaluation (points forts, axes de progrès) et dans les relances.
export const CATS = { forts: "Points forts", progres: "Axes de progrès", relance: "Relances" };
export const BANQUE_DEFAUT = [
  { cat: "forts", t: "Sécurité de l'équipe prise en compte dès le début de l'intervention." },
  { cat: "forts", t: "Questions essentielles posées de façon claire et ordonnée." },
  { cat: "forts", t: "Message d'ambiance complet, structuré et bien formulé." },
  { cat: "forts", t: "Bonne prise en compte des évolutions de la situation." },
  { cat: "progres", t: "Structurer le message d'ambiance : identification, description, actions engagées, demandes." },
  { cat: "progres", t: "Poser les questions essentielles plus tôt, avant d'engager les moyens." },
  { cat: "progres", t: "Solliciter les bons interlocuteurs selon l'information recherchée." },
  { cat: "progres", t: "Préciser les premières actions et les moyens demandés." },
  { cat: "relance", t: "Bonjour {nom}, l'exercice {exercice} devait être rendu au plus tard le {date}. Peux-tu le faire dès que possible ? Merci." },
  { cat: "relance", t: "Bonjour {nom}, petit rappel : l'exercice {exercice} était à rendre pour le {date}. Dis-moi si tu rencontres une difficulté." },
];
export const idBanque = "banque";
export function useBanque() {
  const [items, setItems] = useState(BANQUE_DEFAUT);
  useEffect(() => {
    if (!db) return undefined;
    return onSnapshot(doc(db, "site", idBanque), (s) => setItems(s.exists() && Array.isArray(s.data().items) ? s.data().items : BANQUE_DEFAUT), () => {});
  }, []);
  return items;
}
export const sauverBanque = (items) => setDoc(doc(db, "site", idBanque), { maj: Date.now(), items: items.filter((x) => x.t.trim()).map((x) => ({ cat: x.cat, t: x.t.trim() })) });
export const retablirBanque = () => deleteDoc(doc(db, "site", idBanque));
