import { useEffect, useState } from "react";
import { listScenarios, getPhoto, getSituationPhotos } from "../lib/db";
import { listIllustrations } from "../lib/illustrations";
import { listCalculs } from "../lib/calculs";

const K = "optraining-precharge";

// Bandeau « hors ligne » + préchargement de toutes les données dans le cache local (Firestore + service worker).
export default function HorsLigne() {
  const [off, setOff] = useState(typeof navigator !== "undefined" && !navigator.onLine);
  const [etat, setEtat] = useState(null); // null | {n,t} | "ok" | "err"
  const [date, setDate] = useState(() => { try { return localStorage.getItem(K); } catch { return null; } });
  useEffect(() => {
    const a = () => setOff(true), b = () => setOff(false);
    window.addEventListener("offline", a); window.addEventListener("online", b);
    return () => { window.removeEventListener("offline", a); window.removeEventListener("online", b); };
  }, []);
  async function precharger() {
    try {
      setEtat({ n: 0, t: 1 });
      const sc = await listScenarios(false);
      const t = sc.length + 2;
      let n = 0; const tick = () => setEtat({ n: ++n, t });
      for (const s of sc) { await Promise.all([getPhoto(s.id), getSituationPhotos(s.id)]).catch(() => {}); tick(); }
      await listIllustrations().catch(() => {}); tick();
      await listCalculs(true).catch(() => {}); tick();
      const d = new Date().toLocaleString("fr-FR");
      try { localStorage.setItem(K, d); } catch {}
      setDate(d); setEtat("ok");
    } catch { setEtat("err"); }
  }
  return (
    <>
      {off && <div role="status" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999, background: "#222", color: "#fff", padding: "8px 14px", fontSize: 14, textAlign: "center" }}>
        Mode hors ligne — les exercices déjà téléchargés restent utilisables ; vos résultats se synchroniseront au retour du réseau.
      </div>}
      {!off && (
        <div style={{ textAlign: "center", margin: "10px 0", fontSize: 13 }}>
          <button className="btn" onClick={precharger} disabled={etat && typeof etat === "object"}>
            {etat && typeof etat === "object" ? `Téléchargement ${etat.n}/${etat.t}…` : "Télécharger pour le hors ligne"}
          </button>
          {etat === "ok" && <span> ✓ Prêt hors ligne</span>}
          {etat === "err" && <span> Échec, réessayez</span>}
          {!etat && date && <span> · dernier téléchargement : {date}</span>}
        </div>
      )}
    </>
  );
}
