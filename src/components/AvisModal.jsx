import { useState } from "react";
import { useAntiRobot } from "./AntiRobot";
import { useAuth } from "../lib/auth";
import { envoyerNetlify } from "../lib/netlify";

// Pop-up « Avis et suggestions » (formulaire Netlify « avis »).
export default function AvisModal({ onClose }) {
  const { user, profil } = useAuth() || {};
  const ar = useAntiRobot();
  const [f, setF] = useState({ type: "Avis", note: "5", nom: profil?.nom || "", email: user?.email || "", message: "", "bot-field": "" });
  const [etat, setEtat] = useState(""); // "" | envoi | ok | err | robot
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f["bot-field"]) return;
    if (ar.verifier()) return setEtat("robot");
    setEtat("envoi");
    try {
      await envoyerNetlify("avis", { ...f, note: f.type === "Avis" ? f.note : "" });
      setEtat("ok");
    } catch {
      setEtat("err");
    }
  };

  return (
    <div className="modal-fond" onClick={onClose} role="presentation">
      <div className="modal card" role="dialog" aria-modal="true" aria-label="Avis et suggestions" onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <h2 style={{ margin: 0 }}>Avis et suggestions</h2>
          <button className="btn" onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        {etat === "ok" ? (
          <>
            <p>Merci pour ton retour !</p>
            <button className="btn primary" onClick={onClose}>Fermer</button>
          </>
        ) : (
          <form className="form" onSubmit={submit}>
            <p style={{ display: "none" }}><label>Ne pas remplir <input name="bot-field" value={f["bot-field"]} onChange={set("bot-field")} /></label></p>
            <label>Tu veux…</label>
            <select value={f.type} onChange={set("type")}>
              <option>Avis</option>
              <option>Suggestion</option>
            </select>
            {f.type === "Avis" && (
              <>
                <label>Note</label>
                <select value={f.note} onChange={set("note")}>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n) + "☆".repeat(5 - n)} ({n}/5)</option>)}
                </select>
              </>
            )}
            <label>{f.type === "Avis" ? "Ton avis" : "Ta suggestion"}</label>
            <textarea required rows={5} maxLength={1000} value={f.message} onChange={set("message")} />
            <label>Nom (facultatif)</label>
            <input value={f.nom} onChange={set("nom")} maxLength={60} />
            <label>E-mail (facultatif, pour te répondre)</label>
            <input type="email" value={f.email} onChange={set("email")} />
            {ar.widget}
            {etat === "robot" && <p className="err">Vérification anti-robot incorrecte, réessaie.</p>}
            {etat === "err" && <p className="err">Envoi impossible. Vérifie ta connexion et réessaie.</p>}
            <button className="btn primary" disabled={etat === "envoi"}>{etat === "envoi" ? "Envoi…" : "Envoyer"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
