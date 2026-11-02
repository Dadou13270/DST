import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { TYPES, STATUTS, aVenir, decompte, majPart, participer, quitter, resumeBilan, rouvrirPart, terminerPart, watchEvenements, watchMesPart } from "../lib/evenements";

// Bloc d'accueil (stagiaire et gestionnaire) : prochains évènements, compte à rebours, participation.
export default function EvenementBloc() {
  const { user, profil } = useAuth();
  const [l, setL] = useState([]);
  const [mes, setMes] = useState({});
  const [now, setNow] = useState(Date.now());
  const [err, setErr] = useState("");
  useEffect(() => watchEvenements(setL), []);
  useEffect(() => (user ? watchMesPart(user.uid, (p) => setMes(Object.fromEntries(p.map((x) => [x.ev, x])))) : undefined), [user?.uid]); // eslint-disable-line
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const ev = aVenir(l, profil, now).slice(0, 3);
  if (!ev.length) return null;
  const go = (f) => { setErr(""); f().catch((e) => setErr("Erreur : " + (e.code || e.message))); };
  return (
    <div className="card ev-bloc">
      <h3 style={{ margin: "0 0 8px" }}>📅 Prochains évènements</h3>
      {err && <p className="err">{err}</p>}
      {ev.map((e) => {
        const t = TYPES[e.type] || TYPES.flash, reste = e.date - now, p = mes[e.id];
        return (
          <div key={e.id} className="ev-it">
            <div>
              <span className="tag">{t.ic} {t.n}</span>{e.dept && <span className="tag"> {e.dept}</span>}
              <div className="ev-th">{e.theme}</div>
              {e.desc && <div className="muted">{e.desc}</div>}
              <div className="muted">{new Date(e.date).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}{e.parNom ? " · organisé par " + e.parNom : ""}</div>
              <div className="row" style={{ marginTop: 6, gap: 6 }}>
                {!p ? <button className="btn primary" onClick={() => go(() => participer(e, user.uid, profil))}>Je participe</button> : (
                  <>
                    <span className={"tag " + (p.statut === "fait" ? "ok" : "")}>{p.statut === "fait" ? "✅ " : "✔ "}{STATUTS[p.statut]}</span>
                    {e.scId && p.statut !== "fait" && <Link className="btn primary" to={"/scenario/" + e.scId} onClick={() => p.statut === "inscrit" && majPart(e.id, user.uid, "encours").catch(() => {})}>▶ Faire le scénario{e.scTitre ? " : " + e.scTitre : ""}</Link>}
                    {p.statut !== "fait" && <button className="btn" onClick={() => { const b = e.scId ? profil?.bilans?.[e.scId] : null; if (e.scId && !b) return setErr("Va jusqu'au bilan du scénario avant d'informer l'organisateur : son résultat lui sera transmis."); go(() => terminerPart(e.id, user.uid, b ? resumeBilan(b) : null)); }}>J'ai terminé (envoyer mon résultat)</button>}
                    {p.statut === "fait" && <button className="btn" title="Tu as cliqué par erreur : repasse en « Inscrit » et retire le résultat envoyé" onClick={() => go(() => rouvrirPart(e.id, user.uid))}>↩ Annuler (j'ai fait une erreur)</button>}
                    {p.statut !== "fait" && <button className="btn" onClick={() => go(() => quitter(e.id, user.uid))}>Je ne participe plus</button>}
                  </>
                )}
              </div>
            </div>
            <div className={"ev-cd" + (reste <= 0 ? " now" : "")} aria-live="off">{decompte(reste)}</div>
          </div>
        );
      })}
    </div>
  );
}
