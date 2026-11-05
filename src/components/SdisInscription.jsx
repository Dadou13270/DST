import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { getMonSdis, inscrireSdis } from "../lib/sdis";
import { DEPARTEMENTS } from "../lib/referentiels";

// Carte du profil : inscrire un SDIS (validé par l'admin, qui attribue ensuite le rôle au référent)
export default function SdisInscription() {
  const { user, profil } = useAuth();
  const [s, setS] = useState(undefined);
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState("");
  const charger = () => getMonSdis(user.uid).then(setS);
  useEffect(() => { if (user) charger(); }, [user?.uid]); // eslint-disable-line
  if (!user || !profil || s === undefined) return null;
  const k = (n) => ({ value: f?.[n] ?? "", onChange: (e) => setF({ ...f, [n]: e.target.value }) });
  const ouvrir = () => setF({ nom: s?.nom || "", departement: s?.departement || profil.departement || "", ville: s?.ville || "", refNom: s?.refNom || profil.nom || "", refFonction: s?.refFonction || "", email: s?.email || user.email || "", tel: s?.tel || "", nbCis: s?.nbCis || "", nbStagiaires: s?.nbStagiaires || "", message: s?.message || "" });
  const envoyer = async (e) => {
    e.preventDefault(); setMsg("");
    try { await inscrireSdis(user.uid, f); setF(null); await charger(); } catch (x) { setMsg("Erreur : " + x.message); }
  };
  const ROLE = { gestionnaire: "Gestionnaire", dept: "Admin de département" };
  return (
    <div className="card form">
      <h3 style={{ marginTop: 0 }}>Inscrire mon SDIS</h3>
      {s?.statut === "valide" && <p><span className="tag ok">SDIS validé</span> {s.nom} · {s.departement}{s.role ? <> · rôle attribué : <strong>{ROLE[s.role]}</strong></> : null}</p>}
      {s?.statut === "attente" && !f && <p><span className="tag">En attente</span> La demande d'inscription de « {s.nom} » est en cours de validation par l'administrateur.</p>}
      {s?.statut === "refuse" && !f && <p className="err">Inscription refusée{s.raison ? " : " + s.raison : "."}</p>}
      {!f && s?.statut !== "valide" && (
        <>
          {!s && <p className="muted">Un SDIS s'inscrit en indiquant ses informations. L'administrateur valide la demande et attribue au référent le rôle de gestionnaire ou d'admin de département.</p>}
          <button type="button" className="btn" onClick={ouvrir}>{s ? "Modifier la demande" : "Inscrire mon SDIS"}</button>
        </>
      )}
      {f && (
        <form onSubmit={envoyer}>
          <label>Nom du SDIS</label>
          <input required maxLength={120} placeholder="ex. SDIS 13" {...k("nom")} />
          <label>Département</label>
          <select required {...k("departement")}><option value="">—</option>{DEPARTEMENTS.map((d) => <option key={d}>{d}</option>)}</select>
          <label>Ville / adresse</label>
          <input maxLength={120} {...k("ville")} />
          <label>Nom du référent</label>
          <input required maxLength={100} {...k("refNom")} />
          <label>Fonction du référent</label>
          <input required maxLength={100} placeholder="ex. Chef du service formation" {...k("refFonction")} />
          <label>E-mail</label>
          <input required type="email" maxLength={120} {...k("email")} />
          <label>Téléphone</label>
          <input maxLength={30} {...k("tel")} />
          <label>Nombre de CIS</label>
          <input type="number" min="0" {...k("nbCis")} />
          <label>Nombre approximatif de stagiaires</label>
          <input type="number" min="0" {...k("nbStagiaires")} />
          <label>Message (besoin, contexte)</label>
          <textarea rows={3} maxLength={1000} {...k("message")} />
          <button className="btn primary">Envoyer l'inscription</button>{" "}
          <button type="button" className="btn" onClick={() => setF(null)}>Annuler</button> {msg && <span className="err">{msg}</span>}
        </form>
      )}
    </div>
  );
}
