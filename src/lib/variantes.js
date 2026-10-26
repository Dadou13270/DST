import { norm } from "./matching";
import { TOUS } from "./model";

// Variantes aléatoires : une valeur est tirée par variable à chaque tentative ; {nom} dans les textes est remplacé.
export const VAR_AUTO = [
  { nom: "heure", txt: "03 h 15\n06 h 40\n10 h 30\n14 h 20\n18 h 05\n22 h 45" },
  { nom: "meteo", txt: "ciel dégagé\nciel couvert\npluie fine\nforte pluie\nbrouillard\norage" },
  { nom: "vent", txt: "nul\nfaible (10 km/h) de secteur nord\nfaible (10 km/h) de secteur ouest\nmodéré (25 km/h) de secteur sud\nfort (40 km/h) de secteur est\nfort (50 km/h) de secteur nord-ouest" },
  { nom: "temperature", txt: "-2 °C\n5 °C\n12 °C\n20 °C\n28 °C\n35 °C" },
];
const AUTOQA = [
  ["vent", "Vent", "vent,direction du vent,souffle,rafale", "Vent {vent}."],
  ["heure", "Heure", "quelle heure,heure,horaire", "Il est environ {heure}."],
  ["meteo", "Météo", "meteo,temps,pluie,orage,brouillard,ciel,il pleut", "Météo : {meteo}."],
  ["temperature", "Température", "temperature,degres,il fait chaud,il fait froid", "Il fait {temperature}."],
];
export const varAutoOn = (sc) => (sc.variantesAuto === undefined ? sc.rubrique === "Incendie" : !!sc.variantesAuto);
export const varVals = (v) => (v.txt || "").split("\n").map((x) => x.trim()).filter(Boolean);
export const varsDe = (sc) => {
  const c = (sc.variantes || []).filter((v) => v.nom && varVals(v).length);
  const n = new Set(c.map((v) => v.nom));
  return [...(varAutoOn(sc) ? VAR_AUTO.filter((v) => !n.has(v.nom)) : []), ...c];
};
export const tirer = (sc) => {
  const o = {};
  varsDe(sc).forEach((v) => { const a = varVals(v); o[v.nom] = a[Math.floor(Math.random() * a.length)]; });
  return o;
};
const subS = (t, v) => (typeof t === "string" && t.includes("{") ? t.replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m)) : t);
const subO = (o, v) =>
  Array.isArray(o) ? o.map((x) => subO(x, v))
  : o && typeof o === "object" ? Object.fromEntries(Object.entries(o).map(([k, x]) => [k, k === "photo" || k === "photos" || k === "vignette" ? x : subO(x, v)]))
  : subS(o, v);
export function applyVars(sc, v) {
  if (!sc || !v || !Object.keys(v).length) return sc;
  const r = { ...sc, situation: subO(sc.situation, v), interlocuteurs: subO(sc.interlocuteurs, v), qa: subO(sc.qa, v), evolutions: subO(sc.evolutions, v), correction: subO(sc.correction, v), description: subS(sc.description, v) };
  if (varAutoOn(sc) && v.heure !== undefined) {
    r.situation.contexte = (r.situation.contexte ? r.situation.contexte + "\n\n" : "") + `Conditions : il est ${v.heure} · ${v.meteo} · vent ${v.vent} · ${v.temperature}.`;
    const has = (k) => sc.qa.some((x) => norm(x.motsCles).split(" ").includes(k));
    AUTOQA.forEach(([k, t, m, rp]) => { if (!has(k)) r.qa = [...r.qa, { id: "auto-" + k, interlocuteurId: TOUS, intitule: t, motsCles: m, reponse: subS(rp, v), essentielle: false }]; });
  }
  return r;
}
