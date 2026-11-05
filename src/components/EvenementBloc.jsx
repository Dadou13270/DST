import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { TYPES, STATUTS, aVenir, majPart, participer, quitter, resumeBilan, rouvrirPart, terminerPart, watchEvenements, watchMesPart, watchWebinaires } from "../lib/evenements";

const OUV = 600000; // connexion aux webinaires 10 min avant le début
const hh = (t) => new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const quand = (t) => new Date(t).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
// Compte à rebours : « 2 j 05:12:09 » au-delà d'un jour, sinon hh:mm:ss.
const cdc = (ms) => {
  if (ms <= 0) return "En cours";
  const s = Math.floor(ms / 1000), j = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), p = (n) => String(n).padStart(2, "0");
  return (j ? `${j} j ` : "") + `${p(h)}:${p(m)}:${p(s % 60)}`;
};

// Bloc d'accueil (stagiaire et gestionnaire) : évènements et webinaires à venir ou en direct, en lignes compactes.
export default function EvenementBloc() {
  const { user, profil } = useAuth();
  const [l, setL] = useState([]);
  const [wl, setWl] = useState([]);
  const [mes, setMes] = useState({});
  const [now, setNow] = useState(Date.now());
  const [err, setErr] = useState("");
  useEffect(() => watchEvenements(setL), []);
  useEffect(() => watchWebinaires(setWl), []);
  useEffect(() => (user ? watchMesPart(user.uid, (p) => setMes(Object.fromEntries(p.map((x) => [x.ev, x])))) : undefined), [user?.uid]); // eslint-disable-line
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const evs = aVenir(l, profil, now).map((e) => ({ k: "ev", id: "e" + e.id, date: e.date, e }));
  const wbs = (wl || []).filter((w) => w.etat === "direct" || (w.etat !== "fini" && w.debut && w.debut > now - Math.max(Number(w.duree) || 60, 30) * 60000))
    .map((w) => ({ k: "wb", id: "w" + w.id, date: w.etat === "direct" ? 0 : w.debut, w }));
  const items = [...evs, ...wbs].sort((a, b) => a.date - b.date).slice(0, 4);
  if (!items.length) return null;
  const go = (f) => { setErr(""); f().catch((x) => setErr("Erreur : " + (x.code || x.message))); };
  return (
    <div className="card ev-bloc evc">
      <h3>📅 Évènements et webinaires</h3>
      {err && <p className="err">{err}</p>}
      <div className="evc-grid">
      {items.map((it) => {
        if (it.k === "wb") {
          const w = it.w, live = w.etat === "direct", reste = (w.debut || 0) - now, ouvert = live || !w.debut || reste <= OUV;
          return (
            <div key={it.id} className="evc-it">
              <span className="evc-ic" aria-hidden="true">🎥</span>
              <div className="evc-m"><b>{w.titre || "Webinaire"}</b><span className="muted">Webinaire{w.debut ? " · " + quand(w.debut) : ""}{w.ownerNom ? " · " + w.ownerNom : ""}{!ouvert ? " · connexion dès " + hh(w.debut - OUV) : ""}</span></div>
              <span className={"evc-cd" + (live ? " live" : "")}>{live ? "🔴 En direct" : cdc(reste)}</span>
              <div className="evc-a"><Link className={"btn sm" + (ouvert ? " primary" : "")} to={"/webinaire/" + w.id}>{live ? "▶ Rejoindre" : ouvert ? "Entrer dans la salle" : "Salle d'attente"}</Link></div>
            </div>
          );
        }
        const e = it.e, t = TYPES[e.type] || TYPES.flash, reste = e.date - now, p = mes[e.id];
        return (
          <div key={it.id} className="evc-it">
            <span className="evc-ic" aria-hidden="true" title={t.n}>{t.ic}</span>
            <div className="evc-m"><b>{e.theme}</b><span className="muted">{t.n} · {quand(e.date)}{e.parNom ? " · " + e.parNom : ""}{e.dept ? " · " + e.dept : ""}</span></div>
            <span className={"evc-cd" + (reste <= 0 ? " live" : "")}>{cdc(reste)}</span>
            <div className="evc-a">
              {!p ? <button className="btn sm primary" onClick={() => go(() => participer(e, user.uid, profil))}>Je participe</button> : (
                <>
                  <span className={"tag " + (p.statut === "fait" ? "ok" : "")}>{p.statut === "fait" ? "✅ " : "✔ "}{STATUTS[p.statut]}</span>
                  {e.scId && p.statut !== "fait" && <Link className="btn sm primary" to={"/scenario/" + e.scId} onClick={() => p.statut === "inscrit" && majPart(e.id, user.uid, "encours").catch(() => {})}>▶ Faire le scénario</Link>}
                </>
              )}
            </div>
            {p && (
              <details className="evc-more">
                <summary>Options</summary>
                {e.desc && <div className="muted">{e.desc}</div>}
                <div className="row" style={{ gap: 6, marginTop: 6 }}>
                    {p.statut !== "fait" && <button className="btn sm" onClick={() => { const b = e.scId ? profil?.bilans?.[e.scId] : null; if (e.scId && !b) return setErr("Va jusqu'au bilan du scénario avant d'informer l'organisateur : son résultat lui sera transmis."); go(() => terminerPart(e.id, user.uid, b ? resumeBilan(b) : null)); }}>J'ai terminé (envoyer mon résultat)</button>}
                    {p.statut === "fait" && <button className="btn sm" title="Tu as cliqué par erreur : repasse en « Inscrit » et retire le résultat envoyé" onClick={() => go(() => rouvrirPart(e.id, user.uid))}>↩ Annuler (j'ai fait une erreur)</button>}
                  {p.statut !== "fait" && <button className="btn sm" onClick={() => go(() => quitter(e.id, user.uid))}>Je ne participe plus</button>}
                </div>
              </details>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
