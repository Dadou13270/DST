import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { creerSalle, watchMesSalles, etatSalle, libEtat, fmtDebut, debutDepuisInput, inputDepuisDebut, modifierSalle, supprimerSalle } from "../lib/salles";

// Texte d'invitation prêt à copier pour une séance programmée
export const texteInvitation = (r, nomFormateur) => {
  const quand = new Date(r.debut).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" }).replace(" à ", " à ");
  return `Bonjour,

Séance en salle OPS Training
Date et heure : ${quand}
Scénario : ${r.titre || "—"}
Formateur : ${r.ownerNom || nomFormateur || "—"}

Pour participer :
1. Connectez-vous à l'application : ${window.location.origin}
2. Dans « Exercices », saisissez le code de la séance : ${r.code}
La salle s'ouvre à l'heure indiquée ci-dessus.

À bientôt !`;
};

function Invitation({ r, nom }) {
  const [ok, setOk] = useState(false);
  const txt = texteInvitation(r, nom);
  const copier = async () => {
    try { await navigator.clipboard.writeText(txt); } catch {
      const t = document.getElementById("inv-" + r.code); t?.select(); try { document.execCommand("copy"); } catch { /* */ }
    }
    setOk(true); setTimeout(() => setOk(false), 2500);
  };
  return (
    <div style={{ margin: "10px 0" }}>
      <div className="muted" style={{ marginBottom: 4 }}>Séance <strong>{r.code}</strong> · {r.titre}</div>
      <textarea id={"inv-" + r.code} readOnly rows={11} value={txt} style={{ width: "100%" }} onFocus={(e) => e.target.select()} />
      <button className="btn primary" onClick={copier}>{ok ? "Copié ✓" : "Copier le message"}</button>
    </div>
  );
}

// Carte « Séance en salle » de l'espace gestionnaire
export default function SalleCard({ scs }) {
  const { user, profil } = useAuth();
  const nav = useNavigate();
  const [scId, setScId] = useState("");
  const [salles, setSalles] = useState([]);
  const [err, setErr] = useState("");
  const [deb, setDeb] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [edit, setEdit] = useState(null); // { code, deb, scId }
  const [conf, setConf] = useState(null);
  const enregistrer = async () => {
    setErr("");
    const debut = debutDepuisInput(edit.deb), sc = scs.find((x) => x.id === edit.scId);
    if (!debut) return setErr("Choisis une date et une heure.");
    try {
      await modifierSalle(edit.code, { debut, ...(sc ? { scId: sc.id, titre: sc.titre || "" } : {}) });
      setOkMsg(`Séance ${edit.code} modifiée : le message d'invitation est mis à jour.`); setEdit(null);
    } catch (e) { setErr(e.message); }
  };
  const supprimer = async (code) => {
    setErr("");
    try { await supprimerSalle(code); setConf(null); setOkMsg(`Séance ${code} supprimée.`); } catch (e) { setErr(e.message); }
  };
  useEffect(() => (user ? watchMesSalles(user.uid, setSalles) : undefined), [user?.uid]); // eslint-disable-line
  useEffect(() => { if (!scId && scs.length) setScId(scs[0].id); }, [scs, scId]);
  const ouvrir = async () => {
    setErr("");
    const sc = scs.find((x) => x.id === scId);
    if (!sc) return setErr("Choisis un scénario.");
    const debut = debutDepuisInput(deb);
    try {
      const code = await creerSalle(user.uid, profil?.nom, sc, debut);
      if (debut && debut > Date.now()) { setDeb(""); setOkMsg(`Séance planifiée (code ${code}) : copie le message d'invitation ci-dessous.`); } // reste sur la liste
      else nav(`/gestion/salle/${code}`);
    } catch (e) { setErr(e.message); }
  };
  const date = (t) => (t?.toDate ? t.toDate().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "");
  const prevues = salles.filter((r) => etatSalle(r) === "plan").sort((a, b) => a.debut - b.debut).slice(0, 3);
  return (
    <>
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Séance en salle</h3>
      <p className="muted">Choisis un scénario : un code de salle est généré. Les stagiaires le saisissent sur la page d'accueil. Tu vois leurs questions en direct et tu peux projeter le scénario.</p>
      <div className="row item">
        <select className="grow" value={scId} onChange={(e) => setScId(e.target.value)}>
          {scs.map((x) => <option key={x.id} value={x.id}>{x.titre}{x.rubrique ? ` — ${x.rubrique}` : ""}</option>)}
        </select>
      </div>
      <div className="row item">
        <label htmlFor="sdeb">Début de la séance</label>
        <input id="sdeb" type="datetime-local" className="grow" value={deb} onChange={(e) => setDeb(e.target.value)} />
        <button className="btn primary" onClick={ouvrir}>Ouvrir / planifier la salle</button>
      </div>
      <p className="muted" style={{ margin: "4px 0 0" }}>Laisse la date vide pour ouvrir immédiatement. Si une date est choisie, les stagiaires pourront rejoindre à partir de cette date et de cette heure.</p>
      {err && <p className="err">{err}</p>}
      {okMsg && <p className="tag ok" style={{ display: "block" }}>{okMsg}</p>}
      {salles.slice(0, 8).map((r) => (
        <div key={r.id} className="item">
          <div className="row between">
            <span><strong style={{ letterSpacing: ".15em" }}>{r.code}</strong> {r.titre} <span className={etatSalle(r) === "open" ? "tag ok" : "tag"}>{libEtat[etatSalle(r)]}</span> <span className="muted">{r.debut ? "début " + fmtDebut(r.debut) : date(r.le)}</span></span>
            <span className="row">
              {etatSalle(r) === "plan" && <button className="btn" onClick={() => setEdit({ code: r.code, deb: inputDepuisDebut(r.debut), scId: r.scId })}>Modifier</button>}
              {conf === r.code
                ? <><button className="btn danger" onClick={() => supprimer(r.code)}>Confirmer la suppression</button><button className="btn" onClick={() => setConf(null)}>Annuler</button></>
                : <button className="btn danger" onClick={() => setConf(r.code)}>Supprimer</button>}
              <Link className="btn" to={`/gestion/salle/${r.code}`}>Ouvrir</Link>
            </span>
          </div>
          {edit?.code === r.code && (
            <div className="row" style={{ marginTop: 6 }}>
              <select className="grow" value={edit.scId} onChange={(e) => setEdit({ ...edit, scId: e.target.value })}>
                {scs.map((x) => <option key={x.id} value={x.id}>{x.titre}</option>)}
              </select>
              <input type="datetime-local" value={edit.deb} onChange={(e) => setEdit({ ...edit, deb: e.target.value })} />
              <button className="btn primary" onClick={enregistrer}>Enregistrer</button>
              <button className="btn" onClick={() => setEdit(null)}>Annuler</button>
            </div>
          )}
        </div>
      ))}
    </div>
    {prevues.length > 0 && (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Message d'invitation aux stagiaires</h3>
        <p className="muted" style={{ margin: 0 }}>Séance programmée : copie ce texte et envoie-le (mail, messagerie…).</p>
        {prevues.map((r) => <Invitation key={r.id} r={r} nom={profil?.nom} />)}
      </div>
    )}
    </>
  );
}
