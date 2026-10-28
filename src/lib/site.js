import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { db } from "../firebase";

// Site vitrine : collection "site" — doc "config" (bandeau, textes généraux) + un doc par section (id "s-…").
export const CONFIG_DEFAUT = {
  nom: "OPS Training",
  accroche: "Préparez vos devoirs sur table avant le jour J",
  sousTitre: "Le simulateur opérationnel des sapeurs-pompiers : observez la situation, interrogez les intervenants, construisez votre SOIEC et rédigez vos messages.",
  cta: "Accéder à l'application",
  ctaLien: "/",
  cta2: "Découvrir les fonctions",
  heroImage: "",
  contact: "",
  pied: "Application réalisée par un sapeur-pompier formateur incendie.",
};

const C = (titre, texte) => ({ titre, texte });
export const SECTIONS_DEFAUT = [
  { id: "s-fonctions", type: "cartes", ordre: 10, menu: "Fonctions", titre: "Tout pour s'entraîner comme en situation réelle", texte: "Des scénarios photographiques, des interlocuteurs à interroger, une méthode guidée et une correction détaillée.", image: "", items: [
    C("Scénarios photographiques", "Une situation, une photo, un contexte : on observe, on questionne, on décide. Incendie, risque industriel, secours…"),
    C("Interlocuteurs à interroger", "Questions et réponses réalistes : seules les informations réellement demandées sont obtenues."),
    C("Méthode SOIEC et SMES", "Situation, Objectifs, Idées de manœuvre, Exécution, Commandement — et SMES quand le scénario le demande."),
    C("Message de renseignements", "Rédaction guidée « Je suis, je vois, je fais, je demande » pour le message d'ambiance et le compte rendu."),
    C("Scénarios évolutifs", "La situation change dans le temps : nouvelle information, nouvelles réponses, décisions à adapter."),
    C("Exercices de calcul", "Débits, pertes de charge, besoins en eau, fuite alimentée : des exercices illustrés et corrigés."),
  ] },
  { id: "s-etapes", type: "etapes", ordre: 20, menu: "Fonctionnement", titre: "Comment ça marche", texte: "Quatre étapes, à son rythme, sur téléphone, tablette ou ordinateur.", image: "", items: [
    C("Choisir un exercice", "Parcourez les rubriques et lancez le scénario de votre choix."),
    C("Observer et interroger", "Analysez la photo et le contexte, puis posez vos questions aux interlocuteurs."),
    C("Construire sa réponse", "Complétez le SOIEC, rédigez le message de renseignements et le compte rendu."),
    C("Comparer à la correction", "Visualisez la correction, les points de vigilance et suivez votre progression."),
  ] },
  { id: "s-equipes", type: "texte-image", ordre: 30, menu: "Équipes", titre: "Équipes, parcours et suivi", texte: "Les formateurs et gestionnaires créent des équipes, assignent des exercices ou des parcours complets avec une date limite, et suivent l'avancement de chacun.\n\nLes stagiaires voient leur progression, leur historique et la prochaine étape à réaliser.", image: "", items: [] },
  { id: "s-salle", type: "texte-image", ordre: 40, menu: "Séance en salle", titre: "Animer une séance en salle", texte: "Ouvrez une salle avec un code, projetez le tableau de bord et pilotez la séance : chrono commun, déclenchement des évolutions, réponses imposées, messages à la salle.\n\nVous suivez en direct les questions posées par chaque stagiaire et préparez le débriefing.", image: "", items: [] },
  { id: "s-atouts", type: "cartes", ordre: 50, menu: "Atouts", titre: "Pensé pour le terrain", texte: "", image: "", items: [
    C("Utilisable partout", "Application installable sur téléphone, avec une utilisation hors ligne pour les exercices déjà chargés."),
    C("Export PDF", "Conservez vos réponses et corrections au format PDF."),
    C("Collaboratif", "Proposez des scénarios, donnez votre avis : l'application s'enrichit de l'expérience de tous."),
    C("Support intégré", "Un ticket, une réponse en direct de l'équipe."),
  ] },
];

export function watchSite(cb) {
  if (!db) { cb({ config: null, sections: [], vide: true }); return () => {}; }
  return onSnapshot(collection(db, "site"), (s) => {
    let config = null; const sections = [];
    s.docs.forEach((d) => { if (d.id === "config") config = d.data(); else sections.push({ id: d.id, ...d.data() }); });
    sections.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    cb({ config, sections, vide: !config && !sections.length });
  }, () => cb({ config: null, sections: [], vide: true, erreur: true }));
}
export const saveConfig = (c) => setDoc(doc(db, "site", "config"), c);
export const saveSection = (s) => { const { id, ...r } = s; return setDoc(doc(db, "site", id), r); };
export const deleteSection = (id) => deleteDoc(doc(db, "site", id));
export const newSectionId = () => "s-" + Date.now().toString(36);
export async function chargerDefaut() {
  const b = writeBatch(db);
  b.set(doc(db, "site", "config"), CONFIG_DEFAUT);
  SECTIONS_DEFAUT.forEach(({ id, ...r }) => b.set(doc(db, "site", id), r));
  await b.commit();
}
export async function echanger(a, b) {
  const batch = writeBatch(db);
  batch.update(doc(db, "site", a.id), { ordre: b.ordre });
  batch.update(doc(db, "site", b.id), { ordre: a.ordre });
  await batch.commit();
}
