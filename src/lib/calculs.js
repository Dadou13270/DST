import { db } from "../firebase";
import { collection, doc, getDocs, setDoc, deleteDoc } from "firebase/firestore";

// Exercices de calcul « Extinction LIF » — mêmes formules que la fiche mémo / le calculateur de TOPIMI.
// Résultats du stagiaire : users/{uid}.calculs[exId] = [{ le, duree, rep:{q1..q8}, ok, tot }]
export const GALIM_DEBIT = 4000;
export const TOLERANCE = 0.02; // ±2 % (ou ±1 unité)

export const CALC_DEF = [
  { id: "c1", titre: "Bac à toit fixe — feu de cuvette", niveau: "Initiation",
    contexte: "Feu de cuvette de rétention autour d'un bac de gazole. Produit non miscible (hydrocarbure). Le réseau incendie de l'établissement est opérationnel.",
    S: 150, miscible: false, C: 3, Qref: 1200, reseau: 3000, F: 7, h: 0.15 },
  { id: "c2", titre: "Grande cuvette — réseau insuffisant", niveau: "Initiation",
    contexte: "Feu généralisé d'une cuvette de rétention de 300 m² (essence, non miscible). Le refroidissement des bacs voisins est engagé.",
    S: 300, miscible: false, C: 3, Qref: 1500, reseau: 2500, F: 7, h: 0.15 },
  { id: "c3", titre: "Poste de chargement — éthanol", niveau: "Intermédiaire",
    contexte: "Feu au poste de chargement camions : éthanol répandu sur 80 m². Produit miscible : l'émulseur polyvalent est dosé à 6 %.",
    S: 80, miscible: true, C: 6, Qref: 800, reseau: 2000, F: 7, h: 0.15 },
  { id: "c4", titre: "Sous-cuvette adjacente à protéger", niveau: "Intermédiaire",
    contexte: "Feu de sous-cuvette de 220 m² (non miscible), la sous-cuvette voisine doit recevoir un tapis préventif. Réseau largement dimensionné.",
    S: 220, miscible: false, C: 3, Qref: 1000, reseau: 4000, F: 7, h: 0.15 },
  { id: "c5", titre: "Cuvette de solvant miscible", niveau: "Avancé",
    contexte: "Feu d'une cuvette de 250 m² contenant un solvant miscible à l'eau. Émulseur polyvalent à 6 %, réseau incendie de 4 000 l/min.",
    S: 250, miscible: true, C: 6, Qref: 2000, reseau: 4000, F: 7, h: 0.15 },
  { id: "c6", titre: "Fuite alimentée sous une unité", niveau: "Avancé",
    contexte: "Fuite alimentée enflammée sous une unité de production, nappe de 120 m² (non miscible). Émulseur à 6 %, tapis préventif sur la zone adjacente.",
    S: 120, miscible: false, C: 6, Qref: 1800, reseau: 2500, F: 7, h: 0.15 },
];

// Questions (ordre d'affichage) : clé, libellé, unité, formule
export const CALC_Q = [
  ["q1", "Débit de solution moussante Qext", "l/min", "Qext = S × TA"],
  ["q2", "Débit d'eau total Qtotal", "l/min", "Qtotal = Qext + Qref"],
  ["q3", "Nombre de GALIM nécessaires", "GALIM", "Si Qtotal > débit réseau : 1 GALIM = 4 000 l/min"],
  ["q4", "Volume d'émulseur d'extinction Vext (40 min)", "L", "Vext = Qext × C(%) × t"],
  ["q5", "Volume d'émulseur d'entretien Vetm (10 min)", "L", "Vetm = Qext × C(%) × 10"],
  ["q6", "Volume tapis préventif Vtmp", "L", "Vtmp = (S × h × C) / 100 × 1000"],
  ["q7", "Volume entretien préventif Vetmp", "L", "Vetmp = 0,2 × S × C × 10"],
  ["q8", "Volume total d'émulseur", "L", "TOTAL = Vext + Vetm + Vtmp + Vetmp"],
];

export const taOf = (ex) => (ex.miscible ? 20 : 10);

export function attendu(ex) {
  const TA = taOf(ex), C = ex.C;
  const q1 = ex.S * TA, q2 = q1 + ex.Qref;
  const q3 = q2 > ex.reseau ? Math.max(1, Math.ceil((q2 - ex.reseau) / GALIM_DEBIT)) : 0;
  const q4 = Math.round(q1 * (C / 100) * 40), q5 = Math.round(q1 * (C / 100) * 10);
  const q6 = Math.round((ex.S * ex.h * C) / 100 * 1000), q7 = Math.round(0.2 * ex.S * C * 10);
  return { q1, q2, q3, q4, q5, q6, q7, q8: q4 + q5 + q6 + q7 };
}

// Détail de calcul affiché dans la correction
export function detail(ex) {
  const a = attendu(ex), TA = taOf(ex), C = ex.C, f = (n) => String(n).replace(".", ",");
  return {
    q1: `${ex.S} × ${TA} = ${a.q1} l/min`,
    q2: `${a.q1} + ${ex.Qref} = ${a.q2} l/min (réseau : ${ex.reseau} l/min)`,
    q3: a.q2 > ex.reseau ? `${a.q2} > ${ex.reseau} : déficit ${a.q2 - ex.reseau} l/min → ${a.q3} GALIM` : `${a.q2} ≤ ${ex.reseau} : le réseau suffit → 0 GALIM`,
    q4: `${a.q1} × ${f(C / 100)} × 40 = ${a.q4} L`,
    q5: `${a.q1} × ${f(C / 100)} × 10 = ${a.q5} L`,
    q6: `(${ex.S} × ${f(ex.h)} × ${C}) / 100 × 1000 = ${a.q6} L`,
    q7: `0,2 × ${ex.S} × ${C} × 10 = ${a.q7} L`,
    q8: `${a.q4} + ${a.q5} + ${a.q6} + ${a.q7} = ${a.q8} L`,
  };
}

export const estJuste = (rep, att) => {
  const v = Number(String(rep ?? "").replace(",", "."));
  if (rep === "" || rep == null || Number.isNaN(v)) return false;
  return Math.abs(v - att) <= Math.max(1, Math.abs(att) * TOLERANCE);
};

export function corriger(ex, rep) {
  const a = attendu(ex), res = {};
  let ok = 0;
  CALC_Q.forEach(([k]) => { res[k] = estJuste(rep[k], a[k]); if (res[k]) ok++; });
  return { res, ok, tot: CALC_Q.length, att: a };
}

export const mettreEssai = (calculs, exId, essai) => {
  const l = [...((calculs || {})[exId] || []), essai].slice(-10);
  return { ...(calculs || {}), [exId]: l };
};
export const resumeCalculs = (calculs) => {
  const o = {};
  for (const [k, l] of Object.entries(calculs || {})) if (l && l.length) o[k] = { n: l.length, best: Math.max(...l.map((x) => x.ok)), last: l[l.length - 1].ok, tot: l[l.length - 1].tot, le: l[l.length - 1].le };
  return o;
};

// ---- Exercices stockés dans Firestore : exercicesCalcul/{id} (lecture : connecté, écriture : admin)
const col = () => collection(db, "exercicesCalcul");
const clean = (o) => JSON.parse(JSON.stringify(o));
export async function listCalculs(toutes) {
  const snap = await getDocs(col());
  const l = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return l.filter((x) => toutes || x.publie).sort((a, b) => (a.o || 0) - (b.o || 0) || (a.titre || "").localeCompare(b.titre || "", "fr"));
}
export const saveCalcul = (id, d) => {
  const r = id ? doc(db, "exercicesCalcul", id) : doc(col());
  return setDoc(r, clean({ ...d, o: d.o || Date.now() }));
};
export const deleteCalcul = (id) => deleteDoc(doc(db, "exercicesCalcul", id));
export const dupCalcul = (x) => { const { id, ...d } = x; return saveCalcul("", { ...d, titre: d.titre + " (copie)", publie: false, o: Date.now() }); };
export const seedCalculs = () => Promise.all(CALC_DEF.map((x, i) => { const { id, ...d } = x; return saveCalcul(id, { ...d, rubrique: RI0, publie: true, o: i + 1 }); }));
const RI0 = "Risques industriels";
