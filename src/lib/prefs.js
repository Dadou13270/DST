// Préférences d'affichage : thème (auto/clair/sombre) et taille du texte, mémorisées sur l'appareil.
const get = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignoré */ } };
export const TAILLES = [90, 100, 115, 130];
export function appliquerPrefs() {
  const t = get("soiec-theme", "");
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  document.documentElement.style.fontSize = Number(get("soiec-taille", 100)) + "%";
}
export function basculerTheme() {
  const sombre = document.documentElement.dataset.theme === "dark" ||
    (!document.documentElement.dataset.theme && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  set("soiec-theme", sombre ? "light" : "dark");
  appliquerPrefs();
}
export function changerTaille(delta) {
  const cur = Number(get("soiec-taille", 100));
  let i = TAILLES.indexOf(cur); if (i < 0) i = 1;
  i = Math.min(TAILLES.length - 1, Math.max(0, i + delta));
  set("soiec-taille", String(TAILLES[i]));
  appliquerPrefs();
}
