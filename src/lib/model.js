export const uid = () => Math.random().toString(36).slice(2, 10);

export const TOUS = "tous";

export const SOIEC = [
  { k: "S", titre: "Situation", aide: "Que se passe-t-il ? Où ? Qui est menacé ? Quels risques, quelle évolution probable ?" },
  { k: "O", titre: "Objectifs", aide: "Ce qu'il faut obtenir, par ordre de priorité (sauvetages, mise en sécurité, protection, extinction…)." },
  { k: "I", titre: "Idée de manœuvre", aide: "Comment atteindre les objectifs : actions, enchaînement, voies d'attaque, moyens d'action." },
  { k: "E", titre: "Exécution", aide: "Mission de chaque engin / équipe / secteur, avec moyens et consignes." },
  { k: "C", titre: "Commandement", aide: "Poste de commandement, liaisons, transmissions, renforts, sécurité, logistique." },
];

export const MESSAGE_MODELE = `ICI [indicatif], MESSAGE D'AMBIANCE
Arrivé sur les lieux de :
Situation :
Actions en cours :
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
  evolutions: [],
  suggestions: true,
  duree: 0,
  publie: false,
  afficherCorrection: true,
  cubique: false,
  reserveA: null, // uid du gestionnaire à qui le scénario est réservé (null = public)
  vignette: null,
  situation: {
    contexte: "",
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
  correction: { S: "", O: "", I: "", E: "", C: "", message: "", commentaire: "", cubique: "" },
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

export const RI = "Risques industriels";
export const RUBRIQUES = ["Incendie", "Secours à personne", "Secours routier", "Opérations diverses", "Risques industriels"];
export const rubriquesDe = (list) => {
  const x = [...RUBRIQUES];
  (list || []).forEach((s) => s.rubrique && !x.includes(s.rubrique) && x.push(s.rubrique));
  return x;
};
