import { useState } from "react";
import { useAntiRobot } from "../components/AntiRobot";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";

const OBJETS = ["Demande d'accès gestionnaire", "Renseignement", "Aide à l'utilisation", "Demande de compte / accès", "Demande de scénario", "Signaler un problème", "Autre"];
const enc = (o) => Object.entries(o).map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v)).join("&");

// Formulaire Netlify Forms (déclaré aussi en statique dans index.html).
export default function Contact() {
  const { user, profil } = useAuth() || {};
  const [params] = useSearchParams();
  const [f, setF] = useState({ nom: profil?.nom || "", email: user?.email || "", objet: params.get("objet") === "gestionnaire" ? OBJETS[0] : OBJETS[1], message: "", fonction: "", centre: "", public: "", "bot-field": "" });
  const ar = useAntiRobot();
  const [etat, setEtat] = useState(""); // "" | envoi | ok | err
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f["bot-field"]) return;
    const m = ar.verifier();
    if (m) { setEtat("robot"); return; }
    if (f.objet === OBJETS[0] && (!f.fonction.trim() || !f.centre.trim() || !f.public.trim())) { setEtat("champs"); return; }
    setEtat("envoi");
    try {
      const r = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: enc({ "form-name": f.objet === OBJETS[0] ? "demande-gestionnaire" : f.objet === "Demande de scénario" ? "demande-scenario-contact" : "contact", ...f }),
      });
      if (!r.ok) throw new Error(r.status);
      setEtat("ok");
    } catch {
      setEtat("err");
    }
  };

  return (
    <Layout>
      <h1>Contact</h1>
      {etat === "ok" ? (
        <div className="card">Message envoyé. Merci, nous revenons vers toi rapidement.</div>
      ) : (
        <form className="card form" onSubmit={submit} style={{ maxWidth: 640 }}>
          <p style={{ display: "none" }}><label>Ne pas remplir <input name="bot-field" value={f["bot-field"]} onChange={set("bot-field")} /></label></p>
          <label>Nom</label>
          <input required value={f.nom} onChange={set("nom")} />
          <label>E-mail</label>
          <input type="email" required value={f.email} onChange={set("email")} />
          <label>Objet</label>
          <select value={f.objet} onChange={set("objet")}>{OBJETS.map((o) => <option key={o}>{o}</option>)}</select>
          {f.objet === OBJETS[0] && (
            <>
              <label>Fonction</label>
              <input required maxLength={80} placeholder="Ex. : formateur incendie, chef de centre…" value={f.fonction} onChange={set("fonction")} />
              <label>Centre / service</label>
              <input required maxLength={80} placeholder="Ex. : CIS Port-Saint-Louis-du-Rhône, service formation…" value={f.centre} onChange={set("centre")} />
              <label>Public concerné</label>
              <input required maxLength={120} placeholder="Ex. : FMPA chef d'agrès, promotion SPV, équipe de garde…" value={f.public} onChange={set("public")} />
            </>
          )}
          <label>{f.objet === OBJETS[0] ? "Précisions (facultatif)" : "Message"}</label>
          <textarea required={f.objet !== OBJETS[0]} rows={f.objet === OBJETS[0] ? 4 : 7} value={f.message} onChange={set("message")} />
          {ar.widget}
          {etat === "robot" && <p className="err">Vérification anti-robot incorrecte, réessaie.</p>}
          {etat === "champs" && <p className="err">Renseigne la fonction, le centre / service et le public concerné.</p>}
          {etat === "err" && <div className="card warn">Envoi impossible. Vérifie ta connexion et réessaie.</div>}
          <button className="btn primary big" disabled={etat === "envoi"}>{etat === "envoi" ? "Envoi…" : "Envoyer"}</button>
        </form>
      )}
    </Layout>
  );
}
