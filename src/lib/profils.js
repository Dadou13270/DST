// Profils des inscrits : l'admin les voit tous ; l'admin de département ceux de son département ; le gestionnaire ceux de son CIS.
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const fiche = (d, admins) => {
  const u = { id: d.id, ...d.data() };
  u.nbEx = Object.keys(u.bilans || {}).length + Object.keys(u.calculs || {}).length;
  u.derniere = u.derniere || u.derniereConnexion;
  if (admins) u.admin = admins.has(d.id);
  return u;
};
export async function listProfils(esp, profil) {
  if (esp === "admin") {
    const [u, a] = await Promise.all([getDocs(collection(db, "users")), getDocs(collection(db, "admins"))]);
    const admins = new Set(a.docs.map((d) => d.id));
    return u.docs.map((d) => fiche(d, admins));
  }
  if (esp === "dept") return (await getDocs(query(collection(db, "users"), where("departement", "==", profil?.adminDept || "")))).docs.map((d) => fiche(d));
  if (!profil?.cis) return [];
  return (await getDocs(query(collection(db, "users"), where("cis", "==", profil.cis), where("departement", "==", profil.departement || "")))).docs.map((d) => fiche(d));
}
// Espace d'où l'on vient (?esp=admin|dept|gestion) ; sinon le plus large auquel le compte a droit.
export function espaceProfils(search, isAdmin, profil) {
  const e = new URLSearchParams(search || "").get("esp");
  if (e === "admin" && isAdmin) return "admin";
  if (e === "dept" && (profil?.adminDept || isAdmin)) return "dept";
  if (e === "gestion" && (profil?.gestionnaire || isAdmin)) return "gestion";
  return isAdmin ? "admin" : profil?.adminDept ? "dept" : profil?.gestionnaire ? "gestion" : "";
}
