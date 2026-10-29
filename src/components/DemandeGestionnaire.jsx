import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { getMaDemandeGest, envoyerDemandeGest } from "../lib/gestionnaires";

// Carte du profil : le stagiaire demande le rôle de gestionnaire (validé par l'admin)
export default function DemandeGestionnaire() {
  const { user, profil, isAdmin } = useAuth();
  const [d, setD] = useState(undefined);
  const [motif, setMotif] = useState("");
  const [msg, setMsg] = useState("");
  const charger = () => getMaDemandeGest(user.uid).then(setD);
  useEffect(() => { if (user) charger(); }, [user?.uid]); // eslint-disable-line
  if (!user || !profil || d === undefined) return null;
  const gest = isAdmin || profil.gestionnaire;
  const roles = (
    <ul className="roles">
      <li><strong>Gestionnaire :</strong> {gest ? <span className="tag ok">Actif</span> : <span className="tag">Non actif</span>}{" "}
        <span className="muted">{gest ? (isAdmin ? "(inclus avec le rôle administrateur)" : d?.statut === "acceptee" ? `(demande acceptée le ${new Date(d.traiteLe).toLocaleDateString("fr-FR")})` : "") : "Équipes, suivi des stagiaires, séances en salle."}</span></li>
      {profil.adminDept && (
        <li><strong>Admin de département :</strong> <span className="tag">{profil.adminDept}</span>{" "}
          <span className="muted">Rôle distinct du rôle gestionnaire : statistiques de ce département et attribution du droit gestionnaire à ses membres. Il ne donne pas accès aux équipes.</span></li>
      )}
    </ul>
  );
  if (gest)
    return (
      <div className="card form">
        <h3 style={{ marginTop: 0 }}>Statut gestionnaire</h3>
        {roles}
      </div>
    );
  const complet = profil.nom && profil.cis && profil.departement;
  const envoyer = async (e) => {
    e.preventDefault(); setMsg("");
    try { await envoyerDemandeGest(user.uid, profil, user.email, motif); setMotif(""); await charger(); } catch (x) { setMsg("Erreur : " + x.message); }
  };
  return (
    <div className="card form">
      <h3 style={{ marginTop: 0 }}>Devenir gestionnaire</h3>
      {profil.adminDept && roles}
      {!d && <p>Statut : <span className="tag">aucune demande</span></p>}
      {d?.statut === "attente" ? (
        <p>Ta demande est <span className="tag">en attente</span> de validation par l'administrateur.</p>
      ) : (
        <>
          {d?.statut === "refusee" && <p className="err">Ta dernière demande a été refusée{d.raison ? " : " + d.raison : "."}</p>}
          <p className="muted">Le gestionnaire crée des équipes, suit les stagiaires de son CIS et anime des séances en salle. L'administrateur valide chaque demande.</p>
          {!complet ? <p className="muted">Renseigne d'abord ton nom, ton département et ton CIS ci-dessus, puis enregistre.</p> : (
            <form onSubmit={envoyer}>
              <label>Justificatif : ta fonction ou ta mission de formateur (ex. « Formateur FMPA au CIS … », nom du chef de centre qui valide)</label>
              <textarea rows={3} required minLength={10} maxLength={1000} value={motif} onChange={(e) => setMotif(e.target.value)} />
              <button className="btn primary">Envoyer la demande</button> {msg && <span className="err">{msg}</span>}
            </form>
          )}
        </>
      )}
    </div>
  );
}
