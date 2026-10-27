import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

// Les nouveautés sont stockées dans Firestore (collection "nouveautes"), modifiables par l'admin.
export function watchNouveautes(cb) {
  return onSnapshot(collection(db, "nouveautes"), (s) => {
    const l = s.docs.map((d) => ({ id: d.id, ...d.data() }));
    l.sort((a, b) => (b.d || "").localeCompare(a.d || ""));
    cb(l);
  }, () => cb([]));
}
export const addNouveaute = (n) => addDoc(collection(db, "nouveautes"), { ...n, cree: Date.now() });
export const updateNouveaute = (id, n) => updateDoc(doc(db, "nouveautes", id), n);
export const deleteNouveaute = (id) => deleteDoc(doc(db, "nouveautes", id));

// Entrées de départ (collection vide) : l'admin peut les charger depuis la page Nouveautés.
export const NOUVEAUTES_INIT = [
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
