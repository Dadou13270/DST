import { useState } from "react";
import QrCode from "./QrCode";
import { copierAvecQr, imageInvitation, telecharger } from "../lib/invitation";

export const lienEquipe = (code) => `${window.location.origin}/equipe?code=${code}`;
export const texteEquipe = (team, gestNom) => `Bonjour,

Rejoindre l'équipe « ${team.nom} » sur OPS Training
Formateur : ${gestNom || team.ownerNom || "—"}

Pour vous inscrire :
1. Ouvrez ce lien (ou scannez le QR code) : ${lienEquipe(team.code)}
2. Créez votre compte (e-mail ou Google) ou connectez-vous : le code d'accès (${team.code}) est déjà saisi.
3. Renseignez votre grade, votre département et votre CIS, puis validez.

À bientôt !`;

// Message d'invitation à l'équipe : texte, QR code, copie riche et image (comme pour une séance en salle).
export default function InvitationEquipe({ team, gestNom }) {
  const txt = texteEquipe(team, gestNom), lien = lienEquipe(team.code);
  const [ok, setOk] = useState(false), [info, setInfo] = useState("");
  const copier = async () => {
    try { await navigator.clipboard.writeText(txt); } catch { document.getElementById("inveq-" + team.id)?.select(); document.execCommand("copy"); }
    setOk(true); setTimeout(() => setOk(false), 2500);
  };
  return (
    <div style={{ margin: "10px 0" }}>
      <div className="muted" style={{ marginBottom: 4 }}>Invitation à l'équipe <strong>{team.nom}</strong> · code <strong>{team.code}</strong></div>
      <div className="row" style={{ alignItems: "flex-start" }}>
        <textarea id={"inveq-" + team.id} className="grow" readOnly rows={11} value={txt} onFocus={(e) => e.target.select()} />
        <div style={{ textAlign: "center" }}><QrCode valeur={lien} /><div className="muted">Scan = rejoindre</div></div>
      </div>
      <div className="row item">
        <button className="btn primary" onClick={copier}>{ok ? "Copié ✓" : "Copier le message"}</button>
        <button className="btn" title="Texte + QR code à coller dans un e-mail" onClick={async () => { try { await copierAvecQr(txt, lien, "QR code pour rejoindre l'équipe"); setInfo("Message avec QR code copié : colle-le dans ton e-mail."); } catch { setInfo("Copie impossible ici : télécharge l'image."); } }}>Copier avec le QR code</button>
        <button className="btn" title="Image prête à envoyer par SMS, WhatsApp ou e-mail" onClick={async () => { try { telecharger(await imageInvitation(txt, lien, "Scannez pour rejoindre l'équipe"), `invitation-equipe-${team.code}.png`); setInfo("Image téléchargée : joins-la à ton message."); } catch { setInfo("Création de l'image impossible."); } }}>Télécharger l'image</button>
        {info && <span className="muted">{info}</span>}
      </div>
    </div>
  );
}
