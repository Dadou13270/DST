import { TOUS } from "./model";

// Minuscules, sans accents ni ponctuation.
export const norm = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const stem = (w) => (w.length > 3 ? w.replace(/[sx]$/, "") : w);

// Deux mots "correspondent" s'ils ont le même radical ou si l'un est le début de l'autre (>= 4 lettres).
const same = (a, b) => {
  a = stem(a);
  b = stem(b);
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 4) return false;
  return a.startsWith(b) || b.startsWith(a);
};

// "gaz, odeur de gaz, fuite" -> ["gaz", "odeur de gaz", "fuite"]
export const parseKeywords = (str) =>
  (str || "").split(/[,;\n]/).map(norm).filter(Boolean);

// Un mot-clé composé ("odeur gaz") ne compte que si tous ses mots sont présents dans la question.
export function scoreQA(question, qa) {
  const tokens = norm(question).split(" ").filter(Boolean);
  let score = 0;
  for (const kw of parseKeywords(qa.motsCles)) {
    const words = kw.split(" ");
    if (words.every((w) => tokens.some((t) => same(t, w)))) score += words.length;
  }
  return score;
}

export function findAnswer(question, qas, interlocuteurId) {
  let best = null;
  let bestScore = 0;
  for (const qa of qas || []) {
    if (qa.interlocuteurId !== interlocuteurId && qa.interlocuteurId !== TOUS) continue;
    const s = scoreQA(question, qa);
    if (s > bestScore) {
      bestScore = s;
      best = qa;
    }
  }
  return best;
}
