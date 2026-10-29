import { useState } from "react";
import { initialiserVisibilite } from "../lib/db";
import { setStyle, setCartes } from "../lib/nouveautes";
import { useCharte, setCharte, lireLogo, CHARTE_DEF } from "../lib/charte";

function Charte({ onMsg }) {
  const c = useCharte();
  const [f, setF] = useState({ nom: c.nom, slogan: c.slogan, accueil: c.accueil, couleur: c.couleur, logo: c.logo });
  const maj = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const enreg = (x) => setCharte(x).then(() => onMsg("Charte enregistrée pour tous les utilisateurs.")).catch((e) => onMsg("Erreur : " + e.message));
  return (
    <div className="card">
      <h3>Charte graphique</h3>
      <p className="muted">Nom, slogan, texte d'accueil, couleur principale et logo, pour tous les utilisateurs. Un champ vide revient à la valeur d'origine.</p>
      <label>Nom de l'application<input value={f.nom} maxLength={40} onChange={(e) => maj("nom", e.target.value)} /></label>
      <label>Slogan (page d'entrée et pied de page)<input value={f.slogan} maxLength={90} onChange={(e) => maj("slogan", e.target.value)} /></label>
      <label>Texte d'accueil des exercices<textarea rows={3} maxLength={300} value={f.accueil} onChange={(e) => maj("accueil", e.target.value)} /></label>
      <div className="row item">
        <label>Couleur principale <input type="color" value={f.couleur || "#c42a1c"} onChange={(e) => maj("couleur", e.target.value)} /></label>
        {f.couleur && <button className="btn" onClick={() => maj("couleur", "")}>Couleur d'origine</button>}
      </div>
      <div className="row item">
        <span>Logo : {f.logo ? <img src={f.logo} alt="" height={40} style={{ verticalAlign: "middle" }} /> : "logo d'origine"}</span>
        <input type="file" accept="image/*" onChange={(e) => lireLogo(e.target.files[0]).then((d) => maj("logo", d)).catch((er) => onMsg(er.message))} />
        {f.logo && <button className="btn" onClick={() => maj("logo", "")}>Retirer le logo</button>}
      </div>
      <div className="row item">
        <button className="btn primary" onClick={() => enreg(f)}>Enregistrer la charte</button>
        <button className="btn" onClick={() => { setF({ ...CHARTE_DEF, couleur: "", logo: "" }); enreg({}); }}>Tout réinitialiser</button>
      </div>
    </div>
  );
}

export default function Parametres() {
  const [msg, setMsg] = useState("");

  return (
    <>
      <h1>Paramètres</h1>
      {msg && <p className="muted">{msg}</p>}

      <Charte onMsg={setMsg} />

      <div className="card">
        <h3>Graphisme de l'application</h3>
        <p className="muted">Choisis l'apparence pour tous les utilisateurs.</p>
        <select defaultValue={document.documentElement.dataset.style === "b" ? "b" : ""}
          onChange={(e) => setStyle(e.target.value).then(() => setMsg("Graphisme enregistré.")).catch((er) => setMsg("Erreur : " + er.message))}>
          <option value="">Actuel (rouge opérationnel)</option>
          <option value="b">B · Institutionnel (bleu marine)</option>
        </select>
      </div>

      <div className="card">
        <h3>Présentation des blocs d'exercices</h3>
        <p className="muted">Disposition des exercices dans l'espace stagiaire, pour tous les utilisateurs. Chaque utilisateur peut ensuite choisir son nombre de colonnes.</p>
        <select defaultValue={document.documentElement.dataset.cartes === "h" ? "h" : ""}
          onChange={(e) => setCartes(e.target.value).then(() => setMsg("Présentation enregistrée.")).catch((er) => setMsg("Erreur : " + er.message))}>
          <option value="">Actuelle (image en haut)</option>
          <option value="h">Image à gauche, texte à droite</option>
        </select>
      </div>

      <div className="card">
        <h3>Maintenance</h3>
        <p className="muted">À lancer une fois après la mise à jour : marque les anciens scénarios comme publics (nécessaire pour la visibilité par gestionnaire).</p>
        <button className="btn" onClick={async () => setMsg(`${await initialiserVisibilite()} scénario(s) mis à jour.`)}>Initialiser la visibilité des scénarios existants</button>
      </div>
    </>
  );
}
