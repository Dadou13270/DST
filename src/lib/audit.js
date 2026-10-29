import { db } from "../firebase";
import { addDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";

export const ACTIONS = {
  creation_compte: "Création de compte",
  suspension: "Suspension",
  reactivation: "Réactivation",
  admin_ajout: "Droits admin accordés",
  admin_dept_ajout: "Admin de département défini",
  admin_dept_retrait: "Admin de département retiré",
  admin_retrait: "Droits admin retirés",
  gestionnaire_ajout: "Rôle gestionnaire accordé",
  gestionnaire_retrait: "Rôle gestionnaire retiré",
  reinit_mdp: "Réinitialisation du mot de passe",
  suppression_profil: "Suppression de profil (admin)",
  export_donnees: "Export de ses données",
  suppression_compte: "Suppression de son compte",
};

// Journal : jamais bloquant pour l'action elle-même.
export async function logAudit(acteur, action, cible = {}, details = "") {
  if (!db || !acteur?.uid) return;
  try {
    await addDoc(collection(db, "audit"), {
      le: Date.now(), par: acteur.uid, parNom: acteur.nom || "", action,
      cible: cible.id || "", cibleNom: cible.nom || "", details,
    });
  } catch { /* ignoré */ }
}

export async function listAudit(n = 500) {
  const s = await getDocs(query(collection(db, "audit"), orderBy("le", "desc"), limit(n)));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}
