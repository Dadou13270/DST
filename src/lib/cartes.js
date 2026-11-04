import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, addDoc, setDoc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { idsEquipes } from "./equipes";

// Cartes mentales : collection « cartes » (contenu) ; attribution = teams/{id}.cartes [{id,titre,mode,type,lim}] ; progression = users/{uid}.cartes[id].
export const COULEURS = ["#1d6fb8", "#16794a", "#b8791d", "#7b3fa0", "#c42a1c", "#4a5560"];
export const nid = () => Math.random().toString(36).slice(2, 8);
export const arbreVide = () => ({ id: nid(), t: "Idée centrale", fils: [{ id: nid(), t: "Branche 1", c: COULEURS[0], fils: [] }, { id: nid(), t: "Branche 2", c: COULEURS[1], fils: [] }, { id: nid(), t: "Branche 3", c: COULEURS[2], fils: [] }] });

const map = (n, id, fn) => (n.id === id ? fn(n) : { ...n, fils: (n.fils || []).map((f) => map(f, id, fn)) });
export const modifier = (r, id, ch) => map(r, id, (n) => ({ ...n, ...ch }));
export const ajouter = (r, id) => map(r, id, (n) => {
  const nb = (n.fils || []).length, racine = n.id === r.id;
  return { ...n, fils: [...(n.fils || []), { id: nid(), t: "Nouvelle branche", ...(racine ? { c: COULEURS[nb % COULEURS.length] } : {}), fils: [] }] };
});
export const retirer = (r, id) => ({ ...r, fils: (r.fils || []).filter((f) => f.id !== id).map((f) => retirer(f, id)) });
export const bouger = (r, id, d) => {
  const fils = r.fils || [], i = fils.findIndex((f) => f.id === id);
  if (i >= 0) { const j = i + d; if (j < 0 || j >= fils.length) return r; const a = [...fils]; [a[i], a[j]] = [a[j], a[i]]; return { ...r, fils: a }; }
  return { ...r, fils: fils.map((f) => bouger(f, id, d)) };
};
export const aplatir = (n, niv = 0, col = null, acc = []) => { const c = n.c || col; acc.push({ n, niv, c }); (n.fils || []).forEach((f) => aplatir(f, niv + 1, c, acc)); return acc; };
export const masquees = (a) => aplatir(a).filter((x) => x.niv > 0 && x.n.m).map((x) => x.n);

export const listMesCartes = async (uid) => (await getDocs(query(collection(db, "cartes"), where("auteur", "==", uid)))).docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.maj || 0) - (a.maj || 0));
export const getCarte = async (id) => { const d = await getDoc(doc(db, "cartes", id)); return d.exists() ? { id: d.id, ...d.data() } : null; };
export const sauverCarte = async (c, user, profil) => {
  const data = { titre: (c.titre || "").trim() || "Sans titre", mode: c.mode === "exo" ? "exo" : "consult", arbre: c.arbre, auteur: user.uid, autNom: profil?.nom || "", departement: profil?.departement || "", maj: Date.now() };
  if (c.id) { await setDoc(doc(db, "cartes", c.id), data); return c.id; }
  return (await addDoc(collection(db, "cartes"), data)).id;
};
export const supprimerCarte = (id) => deleteDoc(doc(db, "cartes", id));

// Attribution à une équipe (type « devoir » avec échéance, ou « biblio »)
export const attribuer = (team, carte, type, lim) => {
  const l = (team.cartes || []).filter((x) => x.id !== carte.id);
  return updateDoc(doc(db, "teams", team.id), { cartes: [...l, { id: carte.id, titre: carte.titre, mode: carte.mode, type: type === "devoir" ? "devoir" : "biblio", lim: type === "devoir" ? lim || null : null }] });
};
export const retirerAttribution = (team, cid) => updateDoc(doc(db, "teams", team.id), { cartes: (team.cartes || []).filter((x) => x.id !== cid) });

// Côté stagiaire
export async function cartesDuStagiaire(profil) {
  const out = new Map();
  await Promise.all(idsEquipes(profil).map((tid) => getDoc(doc(db, "teams", tid)).then((d) => {
    if (!d.exists()) return;
    (d.data().cartes || []).forEach((c) => { const p = out.get(c.id); if (!p || (c.type === "devoir" && (p.type !== "devoir" || (c.lim || 9e15) < (p.lim || 9e15)))) out.set(c.id, { ...c, equipe: d.data().nom }); });
  }).catch(() => {})));
  return [...out.values()];
}
export const progresCarte = async (uid) => { const d = await getDoc(doc(db, "users", uid)); return d.exists() ? d.data().cartes || {} : {}; };
export const sauverProgres = (uid, cid, v) => updateDoc(doc(db, "users", uid), { ["cartes." + cid]: v });
