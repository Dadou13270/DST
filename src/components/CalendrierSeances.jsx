import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { watchMesSalles, etatSalle, fmtDebut } from "../lib/salles";
import { listSeances } from "../lib/seances";

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const JOURS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
const cle = (t) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
const LIB = { plan: "Programmée", open: "Ouverte", fait: "Réalisée" };

// Calendrier mensuel des séances en salle du gestionnaire : programmées, ouvertes, réalisées (clôturées ou archivées).
export default function CalendrierSeances({ user, onHistorique }) {
  const [salles, setSalles] = useState([]);
  const [arch, setArch] = useState([]);
  const auj = new Date();
  const [mois, setMois] = useState(new Date(auj.getFullYear(), auj.getMonth(), 1));
  const [jour, setJour] = useState(cle(auj));
  useEffect(() => watchMesSalles(user.uid, setSalles), [user.uid]);
  useEffect(() => { listSeances(user.uid).then(setArch).catch(() => {}); }, [user.uid]);

  const evts = useMemo(() => {
    const now = Date.now();
    const codes = new Set(salles.map((s) => s.code || s.id));
    const a = salles.map((s) => {
      const e = etatSalle(s, now), t = s.debut || (s.le?.seconds || 0) * 1000;
      return { id: "s" + s.id, t, titre: s.titre || "Séance", code: s.code || s.id, kind: e === "plan" ? "plan" : e === "open" ? "open" : "fait", salle: true };
    });
    const b = arch.filter((s) => !codes.has(s.code)).map((s) => ({ id: "a" + s.id, t: s.debut || s.creeLe || s.archiveLe || 0, titre: s.titre || "Séance", code: s.code, kind: "fait", salle: false, nb: (s.stagiaires || []).length }));
    return [...a, ...b].filter((e) => e.t).sort((x, y) => x.t - y.t);
  }, [salles, arch]);

  const parJour = useMemo(() => { const m = {}; evts.forEach((e) => { (m[cle(e.t)] = m[cle(e.t)] || []).push(e); }); return m; }, [evts]);
  const premier = (mois.getDay() + 6) % 7, nbJ = new Date(mois.getFullYear(), mois.getMonth() + 1, 0).getDate();
  const cases = [...Array(premier).fill(null), ...Array.from({ length: nbJ }, (_, i) => i + 1)];
  const aVenir = evts.filter((e) => e.kind === "plan").slice(0, 5);
  const sel = parJour[jour] || [];
  const bouge = (n) => setMois(new Date(mois.getFullYear(), mois.getMonth() + n, 1));

  const ligne = (e) => (
    <div className="item cal-ev" key={e.id}>
      <span className={"cal-dot " + e.kind} /> <strong>{e.titre}</strong> <span className="tag">{LIB[e.kind]}</span>
      <span className="muted"> · {fmtDebut(e.t)} · salle {e.code}{e.nb != null ? ` · ${e.nb} stagiaire(s)` : ""}</span>{" "}
      {e.salle ? <Link className="btn" to={`/gestion/salle/${e.code}`}>Ouvrir</Link> : <button className="btn" onClick={onHistorique}>Historique</button>}
    </div>
  );

  return (
    <div>
      <div className="row between item">
        <div className="row"><button className="btn" onClick={() => bouge(-1)} aria-label="Mois précédent">‹</button><h2 style={{ minWidth: 170, textAlign: "center" }}>{MOIS[mois.getMonth()]} {mois.getFullYear()}</h2><button className="btn" onClick={() => bouge(1)} aria-label="Mois suivant">›</button></div>
        <button className="btn" onClick={() => { setMois(new Date(auj.getFullYear(), auj.getMonth(), 1)); setJour(cle(auj)); }}>Aujourd'hui</button>
      </div>
      <p className="muted"><span className="cal-dot plan" /> Programmée · <span className="cal-dot open" /> Ouverte · <span className="cal-dot fait" /> Réalisée</p>
      <div className="cal">
        {JOURS.map((j) => <div className="cal-h" key={j}>{j}</div>)}
        {cases.map((n, i) => {
          if (!n) return <div key={"v" + i} className="cal-c vide" />;
          const k = `${mois.getFullYear()}-${mois.getMonth()}-${n}`, l = parJour[k] || [];
          return (
            <button key={k} className={"cal-c" + (k === jour ? " sel" : "") + (k === cle(auj) ? " auj" : "")} onClick={() => setJour(k)} aria-label={`${n} ${MOIS[mois.getMonth()]}, ${l.length} séance(s)`}>
              <span>{n}</span>
              <span className="cal-pts">{l.slice(0, 4).map((e) => <i key={e.id} className={"cal-dot " + e.kind} />)}{l.length > 4 && <b>+{l.length - 4}</b>}</span>
            </button>
          );
        })}
      </div>
      <div className="card">
        <h3>{jour ? (() => { const [y, m, d] = jour.split("-").map(Number); return `${d} ${MOIS[m]} ${y}`; })() : ""}</h3>
        {sel.length === 0 ? <p className="muted">Aucune séance ce jour.</p> : sel.map(ligne)}
      </div>
      {aVenir.length > 0 && <div className="card"><h3>Prochaines séances programmées</h3>{aVenir.map(ligne)}</div>}
    </div>
  );
}
