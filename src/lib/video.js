import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";

export const VIDEO_MAX_MO = 50;
export const VIDEO_MAX_S = 60;

// Lien saisi -> { kind: "iframe" | "video" | "lien", src }
export function lireLien(url) {
  const u = String(url || "").trim();
  if (!/^https?:\/\//i.test(u)) return null;
  let m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  if (m) return { kind: "iframe", src: "https://www.youtube-nocookie.com/embed/" + m[1] };
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (m) return { kind: "iframe", src: "https://player.vimeo.com/video/" + m[1] };
  m = u.match(/dailymotion\.com\/video\/([\w]+)/i);
  if (m) return { kind: "iframe", src: "https://www.dailymotion.com/embed/video/" + m[1] };
  if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(u)) return { kind: "video", src: u };
  return { kind: "lien", src: u };
}

export function dureeVideo(file) {
  return new Promise((ok, ko) => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(url); ok(v.duration); };
    v.onerror = () => { URL.revokeObjectURL(url); ko(new Error("Vidéo illisible (format non pris en charge par le navigateur).")); };
    v.src = url;
  });
}

// Vérifie (50 Mo / 1 min) puis envoie la vidéo dans Firebase Storage. onProgress(0..100)
export async function envoyerVideo(file, onProgress) {
  if (!storage) throw new Error("Firebase Storage n'est pas configuré (VITE_FIREBASE_STORAGE_BUCKET).");
  if (!file.type.startsWith("video/")) throw new Error("Le fichier n'est pas une vidéo.");
  if (file.size > VIDEO_MAX_MO * 1024 * 1024) throw new Error(`Vidéo trop lourde (${(file.size / 1048576).toFixed(1)} Mo) : maximum ${VIDEO_MAX_MO} Mo.`);
  const d = await dureeVideo(file);
  if (d > VIDEO_MAX_S + 0.5) throw new Error(`Vidéo trop longue (${Math.round(d)} s) : maximum ${VIDEO_MAX_S} s.`);
  const nom = Date.now().toString(36) + "-" + file.name.replace(/[^\w.-]+/g, "_").slice(-60);
  const r = ref(storage, "scenarios-video/" + nom);
  await new Promise((ok, ko) => {
    const t = uploadBytesResumable(r, file, { contentType: file.type });
    t.on("state_changed", (s) => onProgress?.(Math.round((100 * s.bytesTransferred) / s.totalBytes)), ko, ok);
  });
  return { url: await getDownloadURL(r), chemin: r.fullPath };
}

export async function supprimerVideo(chemin) {
  if (!storage || !chemin) return;
  try { await deleteObject(ref(storage, chemin)); } catch { /* déjà supprimée ou droits insuffisants */ }
}
