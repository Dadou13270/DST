import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { idsEquipes, listMembres } from "./equipes";
import { envoyer } from "./messages";

// Cours en ligne : collection « cours » (fiche) + « coursPdf » (le PDF découpé en blocs base64 de 700 000 caractères).
// Attribution = teams/{id}.cours [{id,titre,type,lim}] ; lecture validée = users/{uid}.cours[id] = { fait }.
export const COURS_MAX_MO = 6;
const BLOC = 700000;

const versB64 = (buf) => { const u = new Uint8Array(buf); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const depuisB64 = (b) => { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };

export const listMesCours = async (uid) => (await getDocs(query(collection(db, "cours"), where("auteur", "==", uid)))).docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.maj || 0) - (a.maj || 0));
export const getCours = async (id) => { const d = await getDoc(doc(db, "cours", id)); return d.exists() ? { id: d.id, ...d.data() } : null; };

// Enregistre le cours ; file = nouveau PDF (obligatoire à la création, facultatif ensuite)
export async function sauverCours(c, file, user, profil, onProgress) {
  let buf = null;
  if (file) {
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") throw new Error("Le fichier doit être un PDF.");
    if (file.size > COURS_MAX_MO * 1048576) throw new Error(`PDF trop lourd (${(file.size / 1048576).toFixed(1)} Mo) : maximum ${COURS_MAX_MO} Mo.`);
    buf = await file.arrayBuffer();
    if (String.fromCharCode(...new Uint8Array(buf.slice(0, 4))) !== "%PDF") throw new Error("Ce fichier n'est pas un PDF valide.");
  } else if (!c.id) throw new Error("Choisis un fichier PDF.");
  const id = c.id || doc(collection(db, "cours")).id;
  const data = { titre: (c.titre || "").trim() || "Sans titre", description: (c.description || "").trim(), auteur: user.uid, autNom: profil?.nom || "", departement: profil?.departement || "", nbBlocs: c.nbBlocs || 0, taille: c.taille || 0, nomFichier: c.nomFichier || "", maj: Date.now() };
  if (buf) {
    const b64 = versB64(buf), n = Math.ceil(b64.length / BLOC);
    for (let i = 0; i < n; i++) { await setDoc(doc(db, "coursPdf", id + "_" + i), { c: id, n: i, d: b64.slice(i * BLOC, (i + 1) * BLOC) }); onProgress?.(Math.round(((i + 1) / n) * 100)); }
    for (let i = n; i < (c.nbBlocs || 0); i++) await deleteDoc(doc(db, "coursPdf", id + "_" + i)).catch(() => {});
    data.nbBlocs = n; data.taille = file.size; data.nomFichier = file.name;
  }
  await setDoc(doc(db, "cours", id), data);
  return id;
}
export async function supprimerCours(c) {
  for (let i = 0; i < (c.nbBlocs || 0); i++) await deleteDoc(doc(db, "coursPdf", c.id + "_" + i)).catch(() => {});
  await deleteDoc(doc(db, "cours", c.id));
}
export async function lirePdf(c) {
  const s = await getDocs(query(collection(db, "coursPdf"), where("c", "==", c.id)));
  const l = s.docs.map((d) => d.data()).sort((a, b) => a.n - b.n);
  if (!l.length || l.length < (c.nbBlocs || 1)) throw new Error("PDF incomplet ou introuvable.");
  return depuisB64(l.map((x) => x.d).join(""));
}

export const attribuerCours = (team, c, type, lim) => updateDoc(doc(db, "teams", team.id), { cours: [...(team.cours || []).filter((x) => x.id !== c.id), { id: c.id, titre: c.titre, type: type === "devoir" ? "devoir" : "biblio", lim: type === "devoir" ? lim || null : null }] });
export const retirerCoursEquipe = (team, cid) => updateDoc(doc(db, "teams", team.id), { cours: (team.cours || []).filter((x) => x.id !== cid) });
export async function prevenirCours(team, c, type, lim, user, profil) {
  const dt = lim ? new Date(lim).toLocaleDateString("fr-FR") : "";
  const texte = `Nouveau cours en ligne « ${c.titre} »${type === "devoir" && dt ? `, à lire avant le ${dt}` : ""}. Ouvre « Cours en ligne » dans le menu, fais défiler le PDF puis valide ta lecture.`;
  const m = await listMembres(team.id);
  await Promise.allSettled(m.map((u) => envoyer({ stagId: u.id, stagNom: u.nom || "", gestId: user.uid, gestNom: profil?.nom || "", de: user.uid, texte })));
}

// Côté stagiaire
export async function coursDuStagiaire(profil) {
  const out = new Map();
  await Promise.all(idsEquipes(profil).map((tid) => getDoc(doc(db, "teams", tid)).then((d) => {
    if (!d.exists()) return;
    (d.data().cours || []).forEach((c) => { const p = out.get(c.id); if (!p || (c.type === "devoir" && (p.type !== "devoir" || (c.lim || 9e15) < (p.lim || 9e15)))) out.set(c.id, { ...c, equipe: d.data().nom }); });
  }).catch(() => {})));
  return [...out.values()];
}
export const progresCours = async (uid) => { const d = await getDoc(doc(db, "users", uid)); return d.exists() ? d.data().cours || {} : {}; };
export const validerLecture = (uid, cid) => updateDoc(doc(db, "users", uid), { ["cours." + cid]: { fait: Date.now() } });
export function useCoursAFaire(user, profil, dep) {
  const [n, setN] = useState(0);
  const k = idsEquipes(profil).join();
  useEffect(() => {
    if (!user || !k) { setN(0); return; }
    let ok = true;
    Promise.all([coursDuStagiaire(profil), progresCours(user.uid)]).then(([l, p]) => { if (ok) setN(l.filter((c) => c.type === "devoir" && !p[c.id]?.fait).length); }).catch(() => {});
    return () => { ok = false; };
  }, [user?.uid, k, dep]); // eslint-disable-line
  return n;
}
