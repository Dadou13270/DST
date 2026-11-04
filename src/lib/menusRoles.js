import { useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

// Pages du menu, par rôle. Réglage admin « Menus par rôle » : liste des pages MASQUÉES (nouveautes/_reglages.menus).
// L'administrateur voit toujours tout. Les clés sont les libellés du menu de gauche.
export const MENUS_ROLES = [
  { k: "stagiaire", t: "Stagiaire", note: "Tous les inscrits. « Forum d'entraide », « Jeu » et « Présentation de l'application » s'appliquent à tous les rôles.",
    pages: ["Accueil", "Scénarios", "Séance en salle", "Jeu de rôle", "Situations en images", "Mon suivi", "Mon équipe", "Messages", "Mon profil", "Fiches mémo", "Cartes mentales", "Webinaires", "Forum d'entraide", "Jeu", "Présentation de l'application"] },
  { k: "gestionnaire", t: "Gestionnaire", note: "Les pages de contenu restent soumises aux droits d'édition accordés dans « Droits ».",
    pages: ["Accueil", "Création de l'équipe", "Gestion de l'équipe", "Tableau de bord", "Profils du CIS", "Séance en salle", "Jeu de rôle", "Webinaires", "Calendrier", "Historique des séances", "Parcours pédagogiques", "Mes scénarios", "Mes quiz", "Cartes mentales", "Évènements", "Scénarios à décisions", "Situations en images", "Demande de scénario"] },
  { k: "dept", t: "Admin de département", note: "",
    pages: ["Statistiques du département", "Profils du département"] },
];

let masques = {};
const ecoute = new Set();
export function majMenus(m) { masques = m && typeof m === "object" ? m : {}; ecoute.forEach((f) => f()); }
export function useMenusMasques() {
  const [, setN] = useState(0);
  useEffect(() => { const f = () => setN((n) => n + 1); ecoute.add(f); return () => { ecoute.delete(f); }; }, []);
  return masques;
}
export const cleMenu = (l) => String(l).replace(/^\p{Extended_Pictographic}️?\s*/u, "").replace(/\s*\(\d+\)$/, "").replace(/^Trivial pompiers$|^Jouer à plusieurs$/, "Jeu");
export const estMasque = (m, role, label) => (m?.[role] || []).includes(cleMenu(label));
export const sauverMenus = (m) => setDoc(doc(db, "nouveautes", "_reglages"), { menus: { stagiaire: m.stagiaire || [], gestionnaire: m.gestionnaire || [], dept: m.dept || [] } }, { merge: true });
