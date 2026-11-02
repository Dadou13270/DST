import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { niveau } from "../lib/xp";

// Bloc compact XP + grade (menu du compte).
export default function XpBarre() {
  const { profil } = useAuth() || {};
  const total = Number(profil?.xp?.total) || 0;
  const n = niveau(total);
  return (
    <div className="nb-row" style={{ display: "block" }} aria-label="Points d'expérience" title="Chaque scénario, quiz, QCM ou exercice terminé rapporte des XP (refaire : 25 %)">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><b>{n.e} {n.n}</b><span>{total} XP</span></div>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={n.pct} style={{ marginTop: 6, height: 6, borderRadius: 99, background: "rgba(127,127,127,.25)", overflow: "hidden" }}>
        <div style={{ width: n.pct + "%", height: "100%", background: "linear-gradient(90deg,#e5a912,#d93a2b)" }} />
      </div>
      {n.suiv && <small style={{ opacity: .75 }}>encore {n.reste} XP pour « {n.suiv.n} »</small>}
    </div>
  );
}

// Notification « +N XP » après un exercice.
export function XpToast() {
  const [g, setG] = useState(null);
  useEffect(() => {
    let t;
    const f = (e) => { setG(e.detail); clearTimeout(t); t = setTimeout(() => setG(null), 4500); };
    window.addEventListener("xp-gain", f);
    return () => { window.removeEventListener("xp-gain", f); clearTimeout(t); };
  }, []);
  if (g == null) return null;
  return <div role="status" style={{ position: "fixed", right: 16, bottom: 16, zIndex: 9999, background: "#111827", color: "#fff", padding: "12px 18px", borderRadius: 12, boxShadow: "0 6px 24px rgba(0,0,0,.35)", fontWeight: 700 }}>⭐ +{g} XP</div>;
}
