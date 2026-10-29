import { useSyncExternalStore } from "react";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

// Charte graphique réglable par l'admin : nom, slogan, texte d'accueil, couleur principale, logo.
// Stockée dans nouveautes/_reglages.charte (lecture publique, écriture admin) et mise en cache locale.
export const CHARTE_DEF = {
  nom: "OPS Training",
  slogan: "Simulateur opérationnel collaboratif",
  accueil: "Observe la photo, interroge les personnes présentes, puis construis ton SOIEC et ton message.",
  couleur: "",
  logo: "",
};
const HEX = /^#[0-9a-fA-F]{6}$/;
let etat = { ...CHARTE_DEF };
try { const l = JSON.parse(localStorage.getItem("op-charte") || "null"); if (l) etat = { ...CHARTE_DEF, ...l }; } catch { /* ignore */ }
const abonnes = new Set();

export function assombrir(hex, k = 0.78) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function appliquerCharte(x, { garder = true } = {}) {
  const src = x || {};
  etat = {
    nom: (src.nom || "").trim() || CHARTE_DEF.nom,
    slogan: (src.slogan || "").trim() || CHARTE_DEF.slogan,
    accueil: (src.accueil || "").trim() || CHARTE_DEF.accueil,
    couleur: HEX.test(src.couleur || "") ? src.couleur : "",
    logo: typeof src.logo === "string" && src.logo.startsWith("data:image/") ? src.logo : "",
  };
  const r = document.documentElement.style;
  if (etat.couleur) { r.setProperty("--red", etat.couleur); r.setProperty("--red-d", assombrir(etat.couleur)); }
  else { r.removeProperty("--red"); r.removeProperty("--red-d"); }
  document.title = etat.nom;
  if (garder) { try { localStorage.setItem("op-charte", JSON.stringify(etat)); } catch { /* ignore */ } }
  abonnes.forEach((f) => f());
}
export const initCharte = () => appliquerCharte(etat, { garder: false });
export const useCharte = () => useSyncExternalStore((f) => { abonnes.add(f); return () => abonnes.delete(f); }, () => etat);
export const setCharte = (x) => setDoc(doc(db, "nouveautes", "_reglages"), { charte: x }, { merge: true });

// Réduit une image à 256 px max et la renvoie en PNG (data URL) : logo léger, stocké dans les réglages.
export function lireLogo(file) {
  return new Promise((ok, ko) => {
    if (!file || !file.type.startsWith("image/")) return ko(new Error("Choisis un fichier image (PNG, JPG, SVG)."));
    const fr = new FileReader();
    fr.onerror = () => ko(new Error("Lecture impossible."));
    fr.onload = () => {
      const im = new Image();
      im.onerror = () => ko(new Error("Image illisible."));
      im.onload = () => {
        const k = Math.min(1, 256 / Math.max(im.width, im.height)), cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(im.width * k)); cv.height = Math.max(1, Math.round(im.height * k));
        cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
        ok(cv.toDataURL("image/png"));
      };
      im.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

export const nomApp = () => etat.nom;
export const rvbCharte = () => { const h = etat.couleur || "#c42a1c", n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
