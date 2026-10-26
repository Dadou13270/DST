import { fmtDate } from "../lib/users";

// Messages d'un fil (commentaire du formateur + suite + réponses du stagiaire), triés par date.
export function filDe(c, reps) {
  const a = [];
  if (c) {
    a.push({ de: "f", nom: c.auteur || "Formateur", texte: c.texte, le: c.le || 0 });
    (c.fil || []).forEach((x) => a.push({ de: "f", nom: x.auteur || "Formateur", texte: x.texte, le: x.le || 0 }));
  }
  (reps || []).forEach((x) => a.push({ de: "s", nom: "Stagiaire", texte: x.texte, le: x.le || 0 }));
  return a.sort((x, y) => x.le - y.le);
}
export const nonLus = (c, reps) => (c ? (reps || []).filter((x) => (x.le || 0) > (c.vu || 0)).length : 0);
export const nonLusMembre = (u) =>
  Object.keys(u.commentaires || {}).reduce((n, sc) => n + nonLus(u.commentaires[sc], (u.reponses || {})[sc]), 0);

export default function FilMessages({ c, reps, nomStagiaire }) {
  return filDe(c, reps).map((m, i) => (
    <div key={i} className="card" style={{ margin: "6px 0", padding: "6px 10px", ...(m.de === "f" ? { borderLeft: "5px solid var(--ok)" } : {}) }}>
      <strong>{m.de === "f" ? `${m.nom} · formateur` : nomStagiaire || "Stagiaire"}</strong> <span className="muted">{fmtDate(m.le)}</span>
      <div className="pre">{m.texte}</div>
    </div>
  ));
}
