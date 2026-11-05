import { useEffect, useState } from "react";
import { departementsGest, sauverDroits, useDroits } from "../lib/droits";

const OPTIONS = [
  ["aucun", "Fermé", "Aucun gestionnaire n'y a accès."],
  ["tous", "Tous les gestionnaires", "Tout gestionnaire peut créer."],
  ["choix", "Par département", "Seuls les gestionnaires des départements cochés."],
];

// Un réglage de droit : trois modes + liste de départements.
function BlocDroit({ titre, texte, v, onChange, liste, nb }) {
  const bascule = (dep) => onChange({ ...v, deps: v.deps.includes(dep) ? v.deps.filter((x) => x !== dep) : [...v.deps, dep] });
  const etat = v.mode === "tous" ? "ouvert à tous les gestionnaires" : v.mode === "choix" ? (v.deps.length ? "ouvert aux départements : " + v.deps.join(", ") : "ouvert à aucun département (aucun coché)") : "fermé";
  return (
    <div className="card">
      <h2 style={{ margin: "0 0 4px" }}>{titre}</h2>
      <p className="muted" style={{ margin: "0 0 12px" }}>{texte}</p>
      <div className="dr-opts">
        {OPTIONS.map(([k, l, t]) => (
          <button type="button" key={k} className={"dr-opt" + (v.mode === k ? " on" : "")} aria-pressed={v.mode === k} onClick={() => onChange({ ...v, mode: k })}><b>{l}</b><span>{t}</span></button>
        ))}
      </div>
      {v.mode === "choix" && (
        <>
          <h3 style={{ margin: "16px 0 8px" }}>Départements autorisés</h3>
          {liste.length === 0 && <p className="muted">Aucun gestionnaire avec département renseigné.</p>}
          <div className="dr-chips">
            {liste.map((dep) => <button type="button" key={dep} className={"dr-chip" + (v.deps.includes(dep) ? " on" : "")} aria-pressed={v.deps.includes(dep)} onClick={() => bascule(dep)}>{dep} · {nb(dep)} gest.</button>)}
          </div>
        </>
      )}
      <p className="muted" style={{ margin: "12px 0 0" }}>Actuellement choisi : <b>{etat}</b></p>
    </div>
  );
}

// Droits des gestionnaires : éditeur de scénarios, quiz et QCM (pour tous, ou par département / SDIS).
export default function AdminDroits() {
  const src = useDroits();
  const [d, setD] = useState(null);
  const [deps, setDeps] = useState([]);
  const [msg, setMsg] = useState("");
  useEffect(() => { if (src && !d) setD({ mode: src.mode, deps: [...(src.deps || [])], quiz: { mode: src.quiz.mode, deps: [...(src.quiz.deps || [])] }, evt: { mode: src.evt.mode, deps: [...(src.evt.deps || [])] }, web: { mode: src.web.mode, deps: [...(src.web.deps || [])] }, cours: { mode: src.cours.mode, deps: [...(src.cours.deps || [])] } }); }, [src]); // eslint-disable-line
  useEffect(() => { departementsGest().then(setDeps).catch(() => {}); }, []);
  if (!d) return <p>Chargement…</p>;
  const liste = [...new Set([...deps.map((x) => x[0]), ...d.deps, ...d.quiz.deps, ...d.evt.deps, ...d.web.deps, ...d.cours.deps])].sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
  const nb = (dep) => deps.find((x) => x[0] === dep)?.[1] || 0;
  const sauver = async () => { setMsg(""); try { await sauverDroits(d); setMsg("Droits enregistrés."); } catch (e) { setMsg("Erreur : " + (e.code || e.message)); } };
  return (
    <div>
      <h1>Droits</h1>
      <BlocDroit titre="Éditeur de scénarios" texte="Les scénarios créés sont affectés au département du gestionnaire, réservés à lui et à ses équipes, visibles par l'admin dans « Attribution » et « Scénarios personnalisés »."
        v={{ mode: d.mode, deps: d.deps }} onChange={(v) => setD({ ...d, ...v })} liste={liste} nb={nb} />
      <BlocDroit titre="Quiz et QCM" texte="Un gestionnaire autorisé voit « Mes quiz » dans son espace. Ses quiz sont réservés à lui et à ses équipes : il les ajoute à un parcours ou les propose en exercice libre ; l'admin les retrouve dans « Scénarios personnalisés »."
        v={d.quiz} onChange={(v) => setD({ ...d, quiz: v })} liste={liste} nb={nb} />
      <BlocDroit titre="Évènements" texte="Un gestionnaire autorisé voit « Évènements » dans Contenus : il crée des évènements (scénario flash, mise en place, retour d'expérience) affichés avec compte à rebours aux utilisateurs de son département, et suit les inscriptions."
        v={d.evt} onChange={(v) => setD({ ...d, evt: v })} liste={liste} nb={nb} />
      <BlocDroit titre="Webinaires" texte="Un gestionnaire autorisé voit « Webinaires » dans Séances : il crée des salles de webinaire en direct (lien de la salle, visio, inscrits, lever de main, messages en direct) et les anime."
        v={d.web} onChange={(v) => setD({ ...d, web: v })} liste={liste} nb={nb} />
      <BlocDroit titre="Cours en ligne" texte="Un gestionnaire autorisé voit « Cours en ligne » dans Contenus : il dépose un cours au format PDF et le propose à ses équipes. Le stagiaire fait défiler le PDF et valide sa lecture ; le suivi apparaît dans l'équipe."
        v={d.cours} onChange={(v) => setD({ ...d, cours: v })} liste={liste} nb={nb} />
      <div className="row" style={{ justifyContent: "flex-end" }}>
        {msg && <span className={msg.startsWith("Erreur") ? "err" : "ok-txt"}>{msg}</span>}
        <button className="btn primary" onClick={sauver}>Enregistrer</button>
      </div>
    </div>
  );
}
