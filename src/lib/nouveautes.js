import { appliquerCharte, initCharte } from "./charte";
import { collection, doc, onSnapshot, setDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";

// Les nouveautés sont stockées dans Firestore (collection "nouveautes"), modifiables par l'admin.
export function watchNouveautes(cb) {
  return onSnapshot(collection(db, "nouveautes"), (s) => {
    const l = s.docs.filter((d) => d.id !== "_reglages" && !d.data().enCours).map((d) => ({ id: d.id, ...d.data() }));
    l.sort((a, b) => (b.d || "").localeCompare(a.d || ""));
    cb(l);
  }, () => cb([]));
}
// Chantiers « en construction » : même collection, marqués enCours (états : en cours, prévu, bientôt).
export const ETATS_CHANTIER = { cours: "En cours", bientot: "Bientôt disponible", prevu: "Prévu" };
export function watchEnCours(cb) {
  return onSnapshot(collection(db, "nouveautes"), (s) => {
    const l = s.docs.filter((d) => d.id !== "_reglages" && d.data().enCours).map((d) => ({ id: d.id, ...d.data() }));
    l.sort((a, b) => (a.cree || 0) - (b.cree || 0));
    cb(l);
  }, () => cb([]));
}
export const addNouveaute = (n) => addDoc(collection(db, "nouveautes"), { ...n, cree: Date.now() });
export const updateNouveaute = (id, n) => updateDoc(doc(db, "nouveautes", id), n);
export const deleteNouveaute = (id) => deleteDoc(doc(db, "nouveautes", id));

// Entrées de départ (collection vide) : l'admin peut les charger depuis la page Nouveautés.
export const NOUVEAUTES_INIT = [
  {"d": "2026-10-28", "t": "Annonces, demande gestionnaire et admin de département", "l": ["Annonces de l'administrateur : un bandeau pour tous, les gestionnaires, un département ou un CIS (maintenance, nouveauté).", "Devenir gestionnaire : la demande se fait depuis le profil et l'administrateur l'accepte ou la refuse en un clic, avec le statut affiché.", "Nouveau rôle « admin de département » : statistiques de son département, validation des demandes et droit gestionnaire, annonces de son département."]},
  {"d": "2026-10-28", "t": "Relances, rapports de fin de formation et co-formateur", "l": ["Retards : bouton « Relancer » (ou « Relancer tous ») qui envoie un message privé au stagiaire, avec un texte modifiable.", "Rapport de fin de formation en PDF par stagiaire (progression, temps, essentielles, auto-évaluations, consignes, commentaires), ou pour toute l'équipe.", "Co-formateur : un second gestionnaire du même CIS peut piloter une équipe ou une séance en salle."]},
  {"d": "2026-10-27", "t": "Historique des séances, échéances modifiables, QR code et équipes archivées", "l": ["Le bilan d'une séance en salle est conservé à la suppression de la salle : historique consultable et exportable en PDF pour le débriefing.", "Les dates limites des exercices à rendre se modifient, et un parcours entier peut être décalé en une fois.", "Le message d'invitation à une séance contient un QR code : le stagiaire rejoint la salle en un scan.", "Fin de formation : une équipe peut être archivée puis restaurée, ou dupliquée avec ses exercices."]},
  {"d": "2026-10-27", "t": "Consignes en salle, auto-évaluation et nouvelle connexion", "l": ["Séance en salle : le formateur coche des consignes (message flash, message d'arrivée sur les lieux…) et lit la réponse de chaque stagiaire ; suivi des évolutions reçues et comprises.", "Avant de terminer un exercice, le stagiaire s'auto-évalue : Observer, Analyser, Décider.", "Nouvelle page de connexion et d'inscription en deux blocs, avec connexion par compte Google.", "Demande de scénario ouverte aux stagiaires ; onglet « Attribution » pour l'administrateur ; affichage des exercices en 2 à 5 colonnes."]},
  {"d": "2026-10-26", "t": "Parcours d'exercices", "l": ["Espace gestionnaire : crée des parcours (ex. « FMPA chef d'agrès ») en regroupant plusieurs exercices dans un ordre précis.", "Assigne un parcours à une équipe en une fois, avec une date limite ; retire-le aussi en un clic.", "Les stagiaires voient leur progression (ex. 4/8) et la prochaine étape si l'ordre est imposé.", "Les parcours peuvent être partagés ou dupliqués entre gestionnaires."]},
  {"d": "2026-10-25", "t": "Support : tickets avec réponse en direct", "l": ["Nouveau lien « Support » dans le pied de page : ouvre un ticket (objet, sujet, message).", "Les réponses de l'équipe arrivent en direct dans une boîte de dialogue, avec le statut du ticket (ouvert, en cours, résolu).", "Espace admin : onglet « Tickets » pour répondre, changer le statut ou supprimer."]},
  {"d": "2026-10-25", "t": "Nouveau nom : OPS Training", "l": ["L'application devient OPS Training : bandeau, pied de page, exports PDF, page « À propos » et conditions d'utilisation."]},
  {
    "d": "2026-10-25",
    "t": "Page « À propos » et blocs d'exercices repensés",
    "l": [
      "Nouvelle page « À propos » accessible depuis le pied de page.",
      "Cartes d'exercices : photo, titre, badges des dominantes, durée et bouton « Démarrer ».",
      "Espace admin : liste des scénarios plus lisible (état, rubrique, badges en bas du bloc)."
    ]
  },
  {
    "d": "2026-10-24",
    "t": "Scénarios évolutifs",
    "l": [
      "Un scénario peut évoluer dans le temps : une information apparaît au stagiaire et les questions/réponses disponibles changent.",
      "Programmation par l'éditeur : case « Évolutif », onglet « Évolutions » et délais.",
      "Nouveau scénario : feu de maison avec propagation aux combles (évolutif)."
    ]
  },
  {
    "d": "2026-10-24",
    "t": "Séance en salle",
    "l": [
      "Le formateur ouvre une salle avec un code, projette le scénario et suit les questions en direct.",
      "Planification d'une séance (date et heure) : les stagiaires rejoignent à l'heure prévue.",
      "Discussion en direct entre le formateur et les stagiaires de la salle."
    ]
  },
  {
    "d": "2026-10-23",
    "t": "Dominantes, rubriques et nouveaux scénarios",
    "l": [
      "Badges de dominantes sur chaque scénario pour aider au choix.",
      "Filtre par rubrique dans l'espace admin.",
      "Nouveaux scénarios : feu d'essieu poids lourd (GPL), feu de pavillon avec sauvetage d'enfant, évacuation d'un lycée (acide picrique).",
      "Statistiques en plusieurs onglets, suivi de l'activité et rôle affiché dans le profil."
    ]
  }
];

// Graphisme de l'application (réglage admin) : "" = actuel, "b" = institutionnel.
export function appliquerCartes(v) {
  if (v === "h") document.documentElement.dataset.cartes = "h"; else delete document.documentElement.dataset.cartes;
  try { localStorage.setItem("op-cartes", v === "h" ? "h" : ""); } catch { /* ignore */ }
}
export function appliquerStyle(v) {
  document.documentElement.dataset.style = v === "b" ? "b" : "";
  try { localStorage.setItem("op-style", v === "b" ? "b" : ""); } catch { /* ignore */ }
}
export function initStyle() {
  try { if (localStorage.getItem("op-style") === "b") document.documentElement.dataset.style = "b"; } catch { /* ignore */ }
  try { if (localStorage.getItem("op-cartes") === "h") document.documentElement.dataset.cartes = "h"; } catch { /* ignore */ }
  initCharte();
  if (!auth) return () => {};
  let off = () => {};
  const offAuth = onAuthStateChanged(auth, (u) => {
    off();
    off = u ? onSnapshot(doc(db, "nouveautes", "_reglages"), (d) => { appliquerStyle(d.exists() ? d.data().style : ""); appliquerCartes(d.exists() ? d.data().cartes : ""); appliquerCharte(d.exists() ? d.data().charte : null); }, () => {}) : () => {};
  });
  return () => { off(); offAuth(); };
}
export const setStyle = (v) => setDoc(doc(db, "nouveautes", "_reglages"), { style: v === "b" ? "b" : "" }, { merge: true });
// Présentation des blocs d'exercices : "" = vertical (image en haut), "h" = image à gauche, texte à droite.
export const setCartes = (v) => setDoc(doc(db, "nouveautes", "_reglages"), { cartes: v === "h" ? "h" : "" }, { merge: true });
