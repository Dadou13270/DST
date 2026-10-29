import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { CGU, CGU_MAJ } from "./cgu";

// Pages légales modifiables par l'administrateur général : collection "site", documents "legal-confidentialite" et "legal-mentions".
// Chaque document : { titre, maj, sections: [{ t, p }] }. Sans document, le texte par défaut ci-dessous s'affiche.
export const LEGAL_IDS = { cgu: "Conditions d'utilisation", confidentialite: "Politique de confidentialité", mentions: "Mentions légales" };
export const LEGAL_DEFAUT = {
 "cgu": { titre: "Conditions générales d'utilisation", maj: CGU_MAJ, sections: CGU.map(([t, p]) => ({ t, p })) },
 "confidentialite": {
  "titre": "Politique de confidentialité",
  "maj": "29 octobre 2026",
  "sections": [
   {
    "t": "1. Responsable du traitement",
    "p": "Le responsable du traitement des données personnelles collectées par « OPS Training » est : [À compléter : nom de la structure ou de la personne responsable, adresse, adresse e-mail de contact]. Si l'application est utilisée dans le cadre d'une formation d'un service d'incendie et de secours, le service concerné est responsable de traitement pour les données de ses agents ; son délégué à la protection des données (DPO) peut être contacté à : [À compléter : adresse du DPO]."
   },
   {
    "t": "2. Données collectées",
    "p": "Compte : nom, adresse e-mail, grade, département et CIS (facultatifs), date d'inscription et de dernière connexion. Activité de formation : exercices réalisés, temps, questions posées, réponses et notes, auto-évaluations, résultats des exercices de calcul et relationnels. Suivi pédagogique : appartenance à une équipe, exercices à rendre, commentaires et messages échangés avec le formateur, fiches d'évaluation, présence aux séances en salle. Données personnelles facultatives : notes privées et favoris (visibles de toi seul), position sur la carte des inscrits si tu l'actives, demandes et tickets de support. Aucune donnée de santé ni donnée sensible n'est demandée : merci de ne pas en saisir dans les champs libres."
   },
   {
    "t": "3. Finalités et bases légales",
    "p": "Les données servent à : permettre l'accès et la sécurité du compte (exécution du service) ; proposer des exercices et suivre ta progression (mission de formation et intérêt légitime de l'organisme de formation) ; permettre au formateur d'évaluer, commenter et accompagner (formation professionnelle) ; assurer le support et améliorer l'application (intérêt légitime) ; produire des statistiques anonymisées d'usage. Elles ne sont ni vendues, ni utilisées à des fins publicitaires, ni soumises à une décision entièrement automatisée."
   },
   {
    "t": "4. Qui voit tes données",
    "p": "Ton suivi est visible par toi-même et par les administrateurs de l'application. Si tu rejoins une équipe, il est aussi visible par le gestionnaire (formateur) de cette équipe et par son co-formateur éventuel, qui peuvent y ajouter commentaires et fiches d'évaluation. Un administrateur de département voit les statistiques de son département. Tes notes personnelles et tes favoris ne sont visibles que de toi. Les autres stagiaires n'ont pas accès à tes résultats."
   },
   {
    "t": "5. Hébergement et sous-traitants",
    "p": "L'application est hébergée par Netlify, Inc. (États-Unis) pour le site, et utilise Google Firebase (Authentification et base de données Firestore, Google Cloud) pour les comptes et les données. Région de stockage des données : [À compléter : région choisie, idéalement européenne]. Ces prestataires agissent comme sous-traitants ; des clauses contractuelles types encadrent les éventuels transferts hors Union européenne. La connexion avec un compte Google est facultative."
   },
   {
    "t": "6. Durée de conservation",
    "p": "Les données sont conservées tant que ton compte est actif, puis supprimées sur demande ou à la suppression du compte. Un compte inactif depuis [À compléter : durée, par exemple 24 mois] peut être supprimé. Les fiches d'évaluation sont conservées pendant la durée de la formation et au plus [À compléter : durée] après sa fin. Les messages de support sont conservés [À compléter : durée] après leur clôture."
   },
   {
    "t": "7. Tes droits",
    "p": "Conformément au RGPD, tu disposes des droits d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité. Tu peux consulter et modifier tes informations depuis « Mon profil », télécharger ton dossier depuis « Mon suivi » (Mon dossier PDF), quitter une équipe, et demander la suppression de ton compte et de tes données. Pour exercer tes droits, écris à : [À compléter : adresse e-mail] ou utilise la page Contact. Une réponse t'est apportée dans un délai d'un mois. En cas de désaccord, tu peux introduire une réclamation auprès de la CNIL (www.cnil.fr)."
   },
   {
    "t": "8. Sécurité",
    "p": "L'accès aux données est protégé par une authentification personnelle et par des règles d'accès limitant la lecture de chaque donnée aux personnes autorisées. Les échanges sont chiffrés (HTTPS). Les actions d'administration sont journalisées. Aucune mesure ne garantit un risque nul : en cas de violation de données susceptible d'engendrer un risque pour toi, tu en serais informé conformément à la réglementation."
   },
   {
    "t": "9. Cookies et stockage local",
    "p": "L'application n'utilise aucun cookie publicitaire ni traceur de mesure d'audience. Elle enregistre dans ton navigateur uniquement des préférences et des données techniques nécessaires au service (session de connexion, thème, taille du texte, exercice en cours, copie hors ligne des exercices). Tu peux les effacer depuis les réglages de ton navigateur."
   },
   {
    "t": "10. Évolution de cette politique",
    "p": "Cette politique peut évoluer ; la date de mise à jour figure en haut de la page. En cas de changement important, une annonce est affichée dans l'application."
   }
  ]
 },
 "mentions": {
  "titre": "Mentions légales",
  "maj": "29 octobre 2026",
  "sections": [
   {
    "t": "1. Éditeur de l'application",
    "p": "« OPS Training » est éditée par : [À compléter : nom ou raison sociale, forme juridique, adresse postale, numéro SIRET le cas échéant]. Contact : [À compléter : adresse e-mail]."
   },
   {
    "t": "2. Directeur de la publication",
    "p": "[À compléter : nom et qualité du directeur de la publication]."
   },
   {
    "t": "3. Hébergement",
    "p": "Site : Netlify, Inc., 512 2nd Street, Suite 200, San Francisco, CA 94107, États-Unis (www.netlify.com). Base de données et authentification : Google Cloud / Firebase, Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande (firebase.google.com)."
   },
   {
    "t": "4. Propriété intellectuelle",
    "p": "L'application, ses scénarios, textes, illustrations, logo et éléments graphiques sont protégés par le droit de la propriété intellectuelle. Toute reproduction, représentation ou réutilisation, totale ou partielle, sans autorisation préalable de l'éditeur est interdite, hors usage personnel de formation."
   },
   {
    "t": "5. Caractère pédagogique et responsabilité",
    "p": "Les scénarios sont fictifs et proposés à titre d'entraînement. Ils ne remplacent ni la doctrine opérationnelle, ni les ordres, règlements et référentiels en vigueur dans ton service, qui font toujours foi. L'éditeur s'efforce d'assurer l'exactitude des contenus mais ne peut être tenu responsable d'une erreur, d'une interruption du service ou d'un usage des contenus en situation réelle."
   },
   {
    "t": "6. Données personnelles",
    "p": "Le traitement des données personnelles est décrit dans la politique de confidentialité, accessible depuis le pied de page de l'application."
   },
   {
    "t": "7. Droit applicable",
    "p": "Les présentes mentions sont soumises au droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux français sont compétents."
   }
  ]
 }
};
export const legalId = (k) => "legal-" + k;
export function useLegal(k) {
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!db) { setData(LEGAL_DEFAUT[k]); return undefined; }
    return onSnapshot(doc(db, "site", legalId(k)), (s) => setData(s.exists() && Array.isArray(s.data().sections) ? s.data() : LEGAL_DEFAUT[k]), () => setData(LEGAL_DEFAUT[k]));
  }, [k]);
  return data;
}
export const sauverLegal = (k, d) => setDoc(doc(db, "site", legalId(k)), { titre: d.titre, maj: d.maj, sections: d.sections.map((s) => ({ t: s.t, p: s.p })) });
export const retablirLegal = (k) => deleteDoc(doc(db, "site", legalId(k)));
export const aCompleter = (d) => (d?.sections || []).some((s) => /\[À compléter/.test(s.p || "") || /\[À compléter/.test(s.t || ""));
