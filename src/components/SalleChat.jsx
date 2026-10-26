import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/auth";
import { watchMessages, posterMessage } from "../lib/salles";

const hhmm = (t) => new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

// Discussion en direct de la salle (formateur et stagiaires inscrits dans la salle)
export default function SalleChat({ code, role }) {
  const { user, profil } = useAuth();
  const [msgs, setMsgs] = useState([]);
  const [txt, setTxt] = useState("");
  const [err, setErr] = useState("");
  const fin = useRef(null);
  useEffect(() => watchMessages(code, setMsgs), [code]);
  useEffect(() => { if (fin.current) fin.current.scrollTop = fin.current.scrollHeight; }, [msgs.length]);
  const send = async (e) => {
    e.preventDefault();
    const t = txt.trim();
    if (!t) return;
    setTxt("");
    setErr("");
    try { await posterMessage(code, user.uid, profil?.nom || (role === "formateur" ? "Formateur" : "Stagiaire"), role, t); } catch { setErr("Message non envoyé."); }
  };
  return (
    <div className="card" style={{ margin: "8px 0" }}>
      <strong>Discussion de la salle</strong>
      <div ref={fin} style={{ maxHeight: 170, overflow: "auto", margin: "6px 0" }}>
        {msgs.length === 0 && <p className="muted" style={{ margin: 0 }}>Aucun message. Écris le premier.</p>}
        {msgs.slice(-60).map((m) => (
          <div key={m.id} style={{ margin: "4px 0" }}>
            <strong>{m.nom}</strong> {m.role === "formateur" && <span className="tag ok">Formateur</span>} <span className="muted">{hhmm(m.le)}</span>
            <div>{m.texte}</div>
          </div>
        ))}
      </div>
      <form className="row" onSubmit={send}>
        <input className="grow" maxLength={400} autoComplete="off" placeholder="Message à toute la salle…" value={txt} onChange={(e) => setTxt(e.target.value)} />
        <button className="btn primary">Envoyer</button>
      </form>
      {err && <span className="err">{err}</span>}
    </div>
  );
}
