import { SOIEC, SMES, CRM, MESSAGE_MODELE, CUB } from "./model";
import { CALC_Q, GALIM_DEBIT } from "./calculs";

// Fiches mémo : courtes, consultables pendant et hors exercice. Chaque fiche = { id, titre, intro, lignes:[[libellé, texte]], pre }
export const FICHES = [
  { id: "soiec", titre: "SOIEC — ordre initial", intro: "Cinq rubriques, toujours dans cet ordre.", lignes: SOIEC.map((r) => [`${r.k} — ${r.titre}`, r.aide]) },
  { id: "smes", titre: "SMES — ordre de mission", intro: "Pour donner ou recevoir une mission claire.", lignes: SMES.map((r) => [r.titre, r.aide]) },
  { id: "ambiance", titre: "Message d'ambiance — Je suis / Je vois / Je demande", intro: "Premier message radio à l'arrivée sur les lieux : court, factuel, sans interprétation. Trois rubriques, dans cet ordre. Modèle à reprendre :", lignes: [["Je suis", "Qui je suis, où je suis, ma position et mes moyens."], ["Je vois", "Ce que j'observe : la situation, les victimes, les risques, l'évolution."], ["Je demande", "Les moyens, renforts ou renseignements dont j'ai besoin."]], pre: "ICI [indicatif], MESSAGE D'AMBIANCE\nJe suis : \nJe vois : \nJe demande : \n" },
  { id: "cr", titre: "Compte rendu — Je suis / Je vois / Je fais / Je demande", intro: "Message radio en quatre rubriques, dans cet ordre. Modèle à reprendre :", lignes: CRM.map((r) => [r.titre, r.aide]), pre: "ICI [indicatif], COMPTE RENDU\nJe suis : \nJe vois : \nJe fais : \nJe demande : \n" },
  { id: "cub", titre: "Reconnaissance cubique", intro: "Onze points à passer en revue pour ne rien oublier.", lignes: CUB.map(([c, l]) => [c, l]) },
  { id: "lif", titre: "Extinction LIF — formules", intro: `Taux d'application TA : 10 l/min/m² (non miscible), 20 l/min/m² (miscible). 1 GALIM = ${GALIM_DEBIT.toLocaleString("fr-FR")} l/min.`, lignes: CALC_Q.map(([, l, u, f]) => [`${l} (${u})`, f]) },
];

export const chercherFiches = (q) => {
  const n = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const s = n(q).trim();
  if (!s) return FICHES;
  return FICHES.filter((f) => n(f.titre + " " + f.intro + " " + f.lignes.map((l) => l.join(" ")).join(" ") + (f.pre || "")).includes(s));
};
