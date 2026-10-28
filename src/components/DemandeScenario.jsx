import { useEffect, useState } from "react";
import { useAntiRobot } from "./AntiRobot";
import { envoyerNetlify } from "../lib/netlify";
import { Link } from "react-router-dom";
import { creerDemande, listMesDemandes, STATUTS } from "../lib/demandesScenario";
import { toutesRubriques } from "../lib/relation";

// Formulaire du gestionnaire : demander un scénario à l'administrateur
export default function DemandeScenario({ user, profil }) {
  const [titre, setTitre] = useState("");
  const [rubrique, setRubrique] = useState("");
  const [details, setDetails] = useState("");
  const [interet, setInteret] = useState("");
  const gest = Boolean(profil?.gestionnaire);
  const [liste, setListe] = useState([]);
  const [msg, setMsg] = useState("");
  const ar = useAntiRobot();
  const [rubs, setRubs] = useState([]);
  useEffect(() => { toutesRubriques().then(setRubs).catch(() => {}); }, []);
  const charger = () => listMesDemandes(user.uid).then(setListe).catch(() => {});
  useEffect(() => { charger(); }, []); // eslint-disable-line

  const envoyer = async (e) => {
    e.preventDefault();
    const m = ar.verifier();
    if (m) return setMsg(m);
    try {
      await creerDemande(user.uid, profil?.nom, { titre: titre.trim(), rubrique, details: details.trim(), interet: interet.trim(), role: gest ? "gestionnaire" : "stagiaire" });
      let mail = true;
      await envoyerNetlify("demande-scenario", { gestionnaire: profil?.nom || "", theme: titre.trim(), rubrique, details: (details.trim() + "\n\nIntérêt de la demande : " + interet.trim() + (gest ? "" : "\n(demande d'un stagiaire)")).trim() }).catch(() => { mail = false; });
      setTitre(""); setDetails(""); setInteret(""); setMsg(mail ? "Demande envoyée à l'administrateur." : "Demande enregistrée (la notification par e-mail n'a pas pu partir, l'administrateur la verra dans Paramètres).");
      charger();
    } catch (x) { setMsg("Erreur : " + x.message); }
  };
  return (
    <form className="card form" onSubmit={envoyer}>
      <h3>Demander un scénario</h3>
      <p className="muted">Décris le scénario souhaité.</p>
      <label>Thème</label>
      <input value={titre} onChange={(e) => setTitre(e.target.value)} required minLength={3} maxLength={100} placeholder="Ex. Feu de véhicule électrique en parking" />
      <label>Rubrique</label>
      <select value={rubrique} onChange={(e) => setRubrique(e.target.value)}>
        <option value="">—</option>
        {rubs.map((r) => <option key={r}>{r}</option>)}
      </select>
      <label>Détails (lieu, enjeux, points à travailler)</label>
      <textarea rows={3} maxLength={800} value={details} onChange={(e) => setDetails(e.target.value)} />
      <label>Intérêt de la demande <span className="muted">(pourquoi ce scénario ? qu'apporterait-il à la formation ?)</span></label>
      <textarea rows={3} maxLength={800} value={interet} onChange={(e) => setInteret(e.target.value)} required minLength={5} />
      {ar.widget}
      <div className="row"><button className="btn primary">Envoyer la demande</button></div>
      {msg && <p className="muted">{msg}</p>}
      {liste.length > 0 && (
        <>
          <h4>Mes demandes</h4>
          {liste.map((r) => (
            <div className="row between" key={r.id} style={{ margin: "4px 0" }}>
              <span>{r.titre}</span>
              <span>
                <span className={r.statut === "livree" ? "tag ok" : "tag"}>{STATUTS[r.statut] || r.statut}</span>{" "}
                {r.statut === "livree" && r.scenarioId && <Link className="btn" to={`/scenario/${r.scenarioId}`}>Ouvrir</Link>}
              </span>
            </div>
          ))}
        </>
      )}
    </form>
  );
}
