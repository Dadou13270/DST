export const uid = () => Math.random().toString(36).slice(2, 10);

export const TOUS = "tous";

export const SOIEC = [
  { k: "S", titre: "Situation", aide: "Que se passe-t-il ? Où ? Qui est menacé ? Quels risques, quelle évolution probable ?" },
  { k: "O", titre: "Objectifs", aide: "Ce qu'il faut obtenir, par ordre de priorité (sauvetages, mise en sécurité, protection, extinction…)." },
  { k: "I", titre: "Idée de manœuvre", aide: "Comment atteindre les objectifs : actions, enchaînement, voies d'attaque, moyens d'action." },
  { k: "E", titre: "Exécution", aide: "Mission de chaque engin / équipe / secteur, avec moyens et consignes." },
  { k: "C", titre: "Commandement", aide: "Poste de commandement, liaisons, transmissions, renforts, sécurité, logistique." },
];

export const SMES = [
  { k: "ms", titre: "Situation", aide: "Que se passe-t-il ? Où ? Qui est concerné ? Éléments connus et inconnus." },
  { k: "mm", titre: "Mission", aide: "Ce qui t'est demandé : mission reçue, objectif à atteindre." },
  { k: "me", titre: "Exécution", aide: "Comment tu vas accomplir la mission : actions, moyens, enchaînement." },
  { k: "mt", titre: "Sécurité", aide: "Risques pour les intervenants et les victimes, périmètre, mesures de sécurité, EPI." },
];

export const CRM = [
  { k: "crs", titre: "Je suis", aide: "Qui je suis, où je suis, ma position et mes moyens." },
  { k: "crv", titre: "Je vois", aide: "Ce que j'observe : la situation, les victimes, les risques, l'évolution." },
  { k: "crf", titre: "Je fais", aide: "Les actions engagées et celles que je vais engager." },
  { k: "crd", titre: "Je demande", aide: "Les moyens, renforts ou renseignements dont j'ai besoin." },
];

export const MESSAGE_MODELE = `ICI [indicatif], MESSAGE D'AMBIANCE
Je suis :
Je vois :
Je demande :
`;

export const CUB = [["1","Victimes, enjeux humains"],["2","Construction"],["3","Public et résidents"],["4","Surfaces, hauteurs, forme de la zone sinistrée"],["5","Moyens de secours du site"],["6","Ressources en eau"],["7","Conditions météorologiques"],["8","Accès, circulation, affluence"],["9","Personnels et moyens"],["10","Localisation et développement du feu"],["11","Risques particuliers et surprises"]];
// État de la reconnaissance cubique : une ligne par rubrique, "ok" si au moins une question rattachée a été posée
export const cubStat = (sc, asked) =>
  CUB.map(([c, l]) => {
    const q = sc.qa.filter((x) => x.cub === c);
    return { c, l, q, ok: q.some((x) => asked.has(x.id)) };
  });

export const newScenario = () => ({
  titre: "",
  description: "",
  rubrique: "",
  dominantes: [],
  evolutif: false,
  smes: false,
  evolutions: [],
  suggestions: true,
  duree: 0,
  publie: false,
  afficherCorrection: true,
  cubique: false,
  cadres: [],
  commandement: false, // prise de commandement (chef de groupe) : passation + actions + compte rendu
  reserveA: null, // uid du gestionnaire à qui le scénario est réservé (null = public)
  vignette: null,
  situation: {
    contexte: "",
    passation: { ambiance: "", ri: "", cr: "" }, // message d'ambiance, réactions immédiates et compte rendu du premier engin
    consigne:
      "Vous arrivez sur les lieux en tant que chef d'agrès. Observez la photo, interrogez les personnes présentes, puis rédigez votre SOIEC et votre message.",
  },
  interlocuteurs: [
    {
      id: uid(),
      nom: "Requérant",
      role: "Personne ayant appelé les secours",
      reponseDefaut: "Je ne sais pas, je n'ai pas vu ça.",
    },
  ],
  qa: [],
  variantes: [],
  correction: { actions: "", S: "", O: "", I: "", E: "", C: "", ms: "", mm: "", me: "", mt: "", crs: "", crv: "", crf: "", crd: "", message: "", commentaire: "", cubique: "" },
});

export const mergeScenario = (d) => {
  const base = newScenario();
  return {
    ...base,
    ...d,
    situation: { ...base.situation, ...(d.situation || {}) },
    correction: { ...base.correction, ...(d.correction || {}) },
    interlocuteurs: d.interlocuteurs || [],
    qa: d.qa || [],
  };
};

export const profilComplet = (p) => Boolean(p && p.nom && p.grade && p.departement && p.cis);
export const RI = "Risques industriels";
export const RUBRIQUES = ["Incendie", "Secours à personne", "Secours routier", "Opérations diverses", "Risques industriels", "Commandement", "Gestion du conflit"];
export const rubriquesDe = (list) => {
  const x = [...RUBRIQUES];
  (list || []).forEach((s) => s.rubrique && !x.includes(s.rubrique) && x.push(s.rubrique));
  return x;
};
