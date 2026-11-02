import { db } from "../firebase";
import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from "firebase/firestore";
import tQcm from "../../seeds-quiz/trame-qcm.json";
import tQuiz from "../../seeds-quiz/trame-quiz.json";
import tExamen from "../../seeds-quiz/trame-examen.json";
import qcmChef from "../../seeds-quiz/qcm-chef-equipe.json";
import quizFeux from "../../seeds-quiz/quiz-feux-structure-chef-agres.json";
import qcmRoutier from "../../seeds-quiz/qcm-secours-routier-chef-equipe.json";
import tCartes from "../../seeds-quiz/trame-cartes.json";
import cartesBases from "../../seeds-quiz/flashcards-bases-chef-agres.json";
import fcFeux from "../../seeds-quiz/flashcards-feux-structure.json";
import fcRoutier from "../../seeds-quiz/flashcards-secours-routier.json";
import fcGaz from "../../seeds-quiz/flashcards-gaz.json";
import fcChef from "../../seeds-quiz/flashcards-chef-equipe.json";
import qcmGaz from "../../seeds-quiz/qcm-gaz-chef-agres-tout-engin.json";

// Quiz et QCM : exercicesQuiz/{id} (lecture : connecté, écriture : admin ou gestionnaire auteur si autorisé).
// format "qcm" : questions à choix unique / multiple. format "quiz" : + vrai/faux et réponse courte.
const col = () => collection(db, "exercicesQuiz");
const clean = (o) => JSON.parse(JSON.stringify(o));
export const TYPES_Q = { unique: "Choix unique", multiple: "Choix multiple", vf: "Vrai / faux", libre: "Réponse courte", ordre: "Remise dans l'ordre", trous: "Texte à trous", assoc: "Association", carte: "Flashcard" };
export const FORMATS = { qcm: "QCM (choix unique ou multiple)", quiz: "Quiz (tous les types de questions)", examen: "Examen blanc (chronomètre, correction à la fin)", cartes: "Flashcards (cartes à retourner)" };
export const TYPES_PAR_FORMAT = { qcm: ["unique", "multiple"], quiz: Object.keys(TYPES_Q).filter((t) => t !== "carte"), examen: Object.keys(TYPES_Q).filter((t) => t !== "carte"), cartes: ["carte"] };
export const TRAMES = { qcm: tQcm, quiz: tQuiz, examen: tExamen, cartes: tCartes };
export const libelleFormat = (f) => (f === "cartes" ? "Flashcards" : f === "examen" ? "Examen blanc" : f === "quiz" ? "Quiz" : "QCM");
// Texte à trous : « Un poteau fournit {{60}} m³/h » → segments + réponses acceptées (variantes séparées par |).
export function blancs(texte) {
  const parts = (texte || "").split(/\{\{(.*?)\}\}/);
  const textes = [], bonnes = [];
  parts.forEach((p, i) => { if (i % 2) bonnes.push(p.split("|").map((x) => x.trim()).filter(Boolean)); else textes.push(p); });
  return { textes, bonnes };
}
export function bonneReponse(q) {
  if (q.type === "carte") return q.r || "";
  if (q.type === "vf") return q.vf ? "Vrai" : "Faux";
  if (q.type === "libre") return (q.reponses || []).join(" / ");
  if (q.type === "ordre") return (q.items || []).join(" → ");
  if (q.type === "trous") return blancs(q.texte).bonnes.map((b) => b[0]).join(" ; ");
  if (q.type === "assoc") return (q.paires || []).map((p) => `${p.g} = ${p.d}`).join(" ; ");
  return (q.choix || []).filter((c) => c.ok).map((c) => c.t).join(" ; ");
}
export const SEEDS_QUIZ = [{ id: "quiz-chef-equipe", ...qcmChef }, { id: "quiz-feux-structure-agres", ...quizFeux }, { id: "qcm-secours-routier-equipe", ...qcmRoutier }, { id: "qcm-gaz-agres-tout-engin", ...qcmGaz }, { id: "flashcards-bases-agres", ...cartesBases }, { id: "fc-feux-structure", ...fcFeux }, { id: "fc-secours-routier", ...fcRoutier }, { id: "fc-gaz", ...fcGaz }, { id: "fc-chef-equipe", ...fcChef }];

export async function listQuiz(toutes) {
  const snap = await getDocs(toutes ? col() : query(col(), where("publie", "==", true))); // les règles n'autorisent que les quiz publiés (ou les siens)
  const l = snap.docs.map((d) => ({ id: d.id, kind: "quiz", ...d.data() }));
  return l.filter((x) => toutes || x.publie).sort((a, b) => (a.o || 0) - (b.o || 0) || (a.titre || "").localeCompare(b.titre || "", "fr"));
}
export async function listMesQuiz(uid) {
  const snap = await getDocs(query(col(), where("auteur", "==", uid)));
  return snap.docs.map((d) => ({ id: d.id, kind: "quiz", ...d.data() })).sort((a, b) => (a.titre || "").localeCompare(b.titre || "", "fr"));
}
export const saveQuiz = (id, d) => {
  const { kind, ...r } = d; // eslint-disable-line no-unused-vars
  const ref = id ? doc(db, "exercicesQuiz", id) : doc(col());
  return setDoc(ref, clean({ ...r, o: r.o || Date.now() })).then(() => ref.id);
};
export const deleteQuiz = (id) => deleteDoc(doc(db, "exercicesQuiz", id));
export const dupQuiz = (x) => { const { id, kind, ...d } = x; return saveQuiz("", { ...d, titre: d.titre + " (copie)", publie: false, o: Date.now() }); }; // eslint-disable-line no-unused-vars
export const seedQuiz = (existants = []) => Promise.all(SEEDS_QUIZ.map((x, i) => { const { id, ...d } = x; return existants.includes(id) ? null : saveQuiz(id, { ...d, o: 1000 + i }); }));

export const nouvelleQuestion = (type = "unique") => ({
  id: "q" + Math.random().toString(36).slice(2, 8), type, pts: 1, q: "", expl: "",
  ...(type === "unique" || type === "multiple" ? { choix: [{ t: "", ok: true }, { t: "", ok: false }, { t: "", ok: false }] } : {}),
  ...(type === "carte" ? { r: "" } : {}), ...(type === "vf" ? { vf: true } : {}), ...(type === "libre" ? { reponses: [""] } : {}),
  ...(type === "ordre" ? { items: ["", "", ""] } : {}), ...(type === "trous" ? { texte: "" } : {}), ...(type === "assoc" ? { paires: [{ g: "", d: "" }, { g: "", d: "" }, { g: "", d: "" }] } : {}),
});
export const nouveauQuiz = (format = "qcm") => JSON.parse(JSON.stringify({ ...TRAMES[format], titre: "", description: "", questions: [nouvelleQuestion(format === "cartes" ? "carte" : "unique")] }));
export const depuisTrame = (format = "qcm") => JSON.parse(JSON.stringify(TRAMES[format]));

const nrm = (t) => (t || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
// rep : unique → index ; multiple → tableau d'index ; vf → booléen ; libre → texte.
export function noterQuestion(q, rep) {
  if (q.type === "carte") return rep === true; // true = sue au premier passage
  if (q.type === "unique") return rep !== undefined && rep !== null && Boolean(q.choix?.[rep]?.ok);
  if (q.type === "multiple") {
    const bons = (q.choix || []).map((c, i) => (c.ok ? i : -1)).filter((i) => i >= 0);
    const r = [...(rep || [])].sort();
    return r.length === bons.length && r.every((v, i) => v === bons[i]);
  }
  if (q.type === "vf") return rep === q.vf;
  if (q.type === "libre") return Boolean(nrm(rep)) && (q.reponses || []).some((a) => nrm(a) === nrm(rep));
  if (q.type === "ordre") return Array.isArray(rep) && rep.length === (q.items || []).length && rep.every((v, i) => v === i);
  if (q.type === "assoc") return Array.isArray(rep) && rep.length === (q.paires || []).length && rep.every((v, i) => v === i);
  if (q.type === "trous") { const b = blancs(q.texte).bonnes; return b.length > 0 && Array.isArray(rep) && b.every((v, i) => Boolean(nrm(rep[i])) && v.some((a) => nrm(a) === nrm(rep[i]))); }
  return false;
}
export function noterQuiz(ex, reps) {
  let ok = 0, tot = 0;
  const themes = {};
  const detail = ex.questions.map((q) => {
    const pts = Number(q.pts) || 1; const bon = noterQuestion(q, reps[q.id]); tot += pts; if (bon) ok += pts;
    const th = (q.theme || "").trim();
    if (th) { themes[th] = themes[th] || { ok: 0, tot: 0 }; themes[th].tot += pts; if (bon) themes[th].ok += pts; }
    return { id: q.id, bon, pts };
  });
  const pct = tot ? Math.round((ok / tot) * 100) : 0;
  return { ok, tot, pct, reussi: pct >= (ex.seuil ?? 70), detail, themes };
}
// Contrôle avant enregistrement : renvoie un message d'erreur ou "".
export function verifierQuiz(e) {
  if (!(e.titre || "").trim()) return "Le titre est obligatoire.";
  if (!e.questions?.length) return "Ajoute au moins une question.";
  for (const [i, q] of e.questions.entries()) {
    if (!(q.q || "").trim()) return `${q.type === "carte" ? "Carte" : "Question"} ${i + 1} : ${q.type === "carte" ? "le recto" : "l'énoncé"} est vide.`;
    if (q.type === "carte" && !(q.r || "").trim()) return `Carte ${i + 1} : le verso est vide.`;
    if (q.type === "unique" || q.type === "multiple") {
      const c = (q.choix || []).filter((x) => (x.t || "").trim());
      if (c.length < 2) return `Question ${i + 1} : au moins deux réponses proposées.`;
      const n = q.choix.filter((x) => x.ok && (x.t || "").trim()).length;
      if (n < 1) return `Question ${i + 1} : coche au moins une bonne réponse.`;
      if (q.type === "unique" && n > 1) return `Question ${i + 1} : une seule bonne réponse en choix unique.`;
    }
    if (q.type === "libre" && !(q.reponses || []).some((x) => (x || "").trim())) return `Question ${i + 1} : indique au moins une réponse acceptée.`;
    if (q.type === "ordre" && (q.items || []).filter((x) => (x || "").trim()).length < 2) return `Question ${i + 1} : au moins deux éléments à remettre dans l'ordre.`;
    if (q.type === "assoc" && (q.paires || []).filter((p) => (p.g || "").trim() && (p.d || "").trim()).length < 2) return `Question ${i + 1} : au moins deux paires complètes à associer.`;
    if (q.type === "trous" && !blancs(q.texte).bonnes.length) return `Question ${i + 1} : entoure au moins un mot à trouver avec {{ }}.`;
  }
  return "";
}
export const nettoyerQuiz = (e) => ({
  ...e, questions: e.questions.map((q) => ({
    ...q, q: q.q.trim(),
    ...(q.type === "carte" ? { r: (q.r || "").trim() } : {}),
    ...(q.choix ? { choix: q.choix.filter((c) => (c.t || "").trim()).map((c) => ({ t: c.t.trim(), ok: Boolean(c.ok) })) } : {}),
    ...(q.reponses ? { reponses: q.reponses.map((x) => x.trim()).filter(Boolean) } : {}),
    ...(q.paires ? { paires: q.paires.filter((p) => (p.g || "").trim() && (p.d || "").trim()).map((p) => ({ g: p.g.trim(), d: p.d.trim() })) } : {}),
    ...(q.items ? { items: q.items.map((x) => x.trim()).filter(Boolean) } : {}),
    ...(q.theme ? { theme: q.theme.trim() } : {}),
  })),
});
