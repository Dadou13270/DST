// État d'un exercice pour le stagiaire : "termine" | "encours" | "nouveau"
export function etatExercice(profil, id) {
  if ((profil?.bilans || {})[id]) return "termine";
  try {
    const v = JSON.parse(localStorage.getItem(`soiec-session-${id}`));
    if (v && v.start && !v.finished) return "encours";
  } catch { /* ignoré */ }
  return profil?.encours?.[id] ? "encours" : "nouveau";
}
