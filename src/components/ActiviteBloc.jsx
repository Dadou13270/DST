import { fmtDate } from "../lib/users";
import { etatSalle, libEtat } from "../lib/salles";

const Tuile = ({ n, l }) => (
  <div className="card" style={{ flex: "1 1 130px", textAlign: "center", margin: 0 }}>
    <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{n}</div>
    <div className="muted">{l}</div>
  </div>
);

// Suivi de l'activité : équipes, stagiaires, séances en salle
export default function ActiviteBloc({ act, users, part }) {
  if (!act) return <p className="muted">Chargement du suivi de l'activité…</p>;
  const { equipes, salles } = act;
  const enEquipe = users.filter((u) => u.equipeId).length;
  const gest = users.filter((u) => u.gestionnaire).length;
  const ouvertes = salles.filter((s) => s.ouverte !== false).length;
  const j30 = Date.now() - 30 * 86400000;
  const rec = salles.filter((s) => s.le > j30).length;
  const parFormateur = Object.values(salles.reduce((o, s) => {
    const k = s.owner;
    o[k] = o[k] || { nom: s.ownerNom || "—", n: 0, p: 0, q: 0, last: 0 };
    o[k].n++; o[k].p += s.participants; o[k].q += s.questions; o[k].last = Math.max(o[k].last, s.le);
    return o;
  }, {})).sort((a, b) => b.n - a.n);
  return part === "sal" ? (
    <>
      <h3>Séances en salle par formateur</h3>
      {parFormateur.length === 0 ? <p className="muted">Aucune séance en salle pour l'instant.</p> : (
        <table className="cmp">
          <thead><tr><th>Formateur</th><th>Séances</th><th>Participants</th><th>Questions</th><th>Dernière séance</th></tr></thead>
          <tbody>{parFormateur.map((f) => <tr key={f.nom}><td>{f.nom}</td><td>{f.n}</td><td>{f.p}</td><td>{f.q}</td><td>{fmtDate(f.last)}</td></tr>)}</tbody>
        </table>
      )}
      <h3>Dernières séances</h3>
      {salles.slice(0, 10).map((s) => (
        <div className="row between item" key={s.id}>
          <span><strong style={{ letterSpacing: ".15em" }}>{s.code}</strong> {s.titre} <span className="muted">— {s.ownerNom}</span> <span className={etatSalle(s) === "open" ? "tag ok" : "tag"}>{libEtat[etatSalle(s)]}</span></span>
          <span className="muted">{fmtDate(s.le)} · {s.participants} stagiaire(s) · {s.questions} question(s)</span>
        </div>
      ))}
    </>
  ) : (
    <>
      <h2>Suivi de l'activité</h2>
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        <Tuile n={users.length} l="inscrits" />
        <Tuile n={gest} l="gestionnaires" />
        <Tuile n={equipes.length} l="équipes" />
        <Tuile n={enEquipe} l="stagiaires en équipe" />
        <Tuile n={salles.length} l={`séances en salle (${ouvertes} ouverte${ouvertes > 1 ? "s" : ""}, ${rec} sur 30 j)`} />
        <Tuile n={salles.reduce((n, s) => n + s.participants, 0)} l="participations en salle" />
        <Tuile n={salles.reduce((n, s) => n + s.questions, 0)} l="questions posées en salle" />
      </div>
      <h3>Équipes</h3>
      {equipes.length === 0 ? <p className="muted">Aucune équipe créée.</p> : (
        <table className="cmp">
          <thead><tr><th>Équipe</th><th>Gestionnaire</th><th>Stagiaires</th><th>Exercices terminés</th></tr></thead>
          <tbody>{equipes.map((e) => <tr key={e.id}><td>{e.nom}</td><td>{e.ownerNom || "—"}</td><td>{e.membres}</td><td>{e.termines}</td></tr>)}</tbody>
        </table>
      )}
    </>
  );
}
