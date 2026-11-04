import { Link } from "react-router-dom";
import BarreEquipe from "./ProgressionEquipes";
import { fmtLimite } from "../lib/devoirs";
import { CorpsEquipe } from "./DevoirsCard";
import { useEffect, useState } from "react";
import { VarianteA, VarianteB, infosEquipe } from "./EquipesVariantes";

const lien = (d) => (d.k === "dec" ? `/decision/${d.scId}` : d.k === "rel" ? `/relation/${d.scId}` : d.k === "quiz" ? `/quiz/${d.scId}` : d.k ? `/calculs/${d.scId}` : `/scenario/${d.scId}`);
const court = (ms) => new Date(ms).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

// Pastilles chiffrées : en retard, à rendre, terminés, prochaine échéance.
export function Tuiles({ devoirs }) {
  const reste = devoirs.filter((d) => d.statut !== "ok"), retard = devoirs.filter((d) => d.statut === "retard").length;
  const ech = reste.filter((d) => d.limite).map((d) => d.limite).sort((a, b) => a - b)[0];
  return (
    <div className="ac-tiles">
      <div className={"ac-t" + (retard ? " r" : "")}><small>En retard</small><b>{retard}</b></div>
      <div className="ac-t"><small>À rendre</small><b>{reste.length}</b></div>
      <div className="ac-t g"><small>Terminés</small><b>{devoirs.length - reste.length}</b></div>
      <div className="ac-t"><small>Prochaine échéance</small><b style={{ fontSize: "1.2rem" }}>{ech ? court(ech) : "—"}</b></div>
    </div>
  );
}

// Une carte par équipe : barre de progression et prochaine étape.
export function EquipesCartes({ devoirs }) {
  const [mode, setMode] = useState(() => document.documentElement.dataset.equipes || "");
  useEffect(() => { const f = () => setMode(document.documentElement.dataset.equipes || ""); window.addEventListener("op-equipes", f); return () => window.removeEventListener("op-equipes", f); }, []);
  if (!devoirs.length) return null;
  const parEq = new Map();
  devoirs.forEach((d) => { const k = d.eq || ""; if (!parEq.has(k)) parEq.set(k, []); parEq.get(k).push(d); });
  if (mode === "a" || mode === "b") {
    const groupes = [...parEq.entries()].map(([eq, l]) => infosEquipe(eq, l));
    return mode === "a" ? <VarianteA groupes={groupes} /> : <VarianteB groupes={groupes} />;
  }
  return (
    <div className="card">
      <h3 style={{ margin: "0 0 8px" }}>Mes équipes</h3>
      {[...parEq.entries()].map(([eq, liste]) => {
        const reste = liste.filter((d) => d.statut !== "ok"), retard = liste.some((d) => d.statut === "retard");
        const ordre = liste.some((d) => d.pcO);
        const nx = [...reste].sort((a, b) => (ordre ? (a.rg || 0) - (b.rg || 0) : (a.limite || 9e15) - (b.limite || 9e15)))[0];
        return (
          <div key={eq || "_"} className={"ac-eq" + (!reste.length ? " ok" : retard ? " late" : "")}>
            <strong>{eq ? `Équipe « ${eq} »` : "Mes exercices"}</strong>
            <BarreEquipe liste={liste} />
            <div className="ac-next">
              {nx
                ? <><div><span className="muted">Prochaine étape{nx.limite ? ` · avant le ${fmtLimite(nx.limite)}` : ""}</span><br /><strong>{nx.pc && nx.rg !== undefined ? `${nx.rg + 1}. ` : ""}{nx.titre}</strong></div><Link className="btn primary" to={lien(nx)}>Faire l'exercice</Link></>
                : <div><span className="muted">Tout est rendu</span><br /><strong>Bravo, rien à rendre</strong></div>}
            </div>
            {reste.length > 0 && <details open style={{ marginTop: 8 }}><summary style={{ cursor: "pointer", fontWeight: 600 }}>Exercices à rendre ({reste.length})</summary><CorpsEquipe liste={liste} /></details>}
          </div>
        );
      })}
    </div>
  );
}

// Accès rapide + prochaines échéances (colonne de droite).
export function AccesRapide({ jeu }) {
  const it = [["🎯", "Scénarios", "/scenarios"], ["🏫", "Séance en salle", "/seance"], ...(jeu ? [["🎲", "Jeu", "/jeu"]] : []), ["📚", "Fiches mémo", "/fiches"]];
  return (
    <div className="card">
      <h3 style={{ margin: "0 0 8px" }}>Accès rapide</h3>
      <div className="ac-q">{it.map(([ic, t, to]) => <Link key={to} to={to}><span>{ic}</span>{t}</Link>)}</div>
    </div>
  );
}
export function Echeances({ devoirs }) {
  const l = devoirs.filter((d) => d.statut !== "ok" && d.limite).sort((a, b) => a.limite - b.limite).slice(0, 4);
  if (!l.length) return null;
  return (
    <div className="card">
      <h3 style={{ margin: "0 0 8px" }}>Prochaines échéances</h3>
      {l.map((d) => <div key={d.key || d.scId} className="ac-ech"><b style={{ color: d.statut === "retard" ? "var(--red)" : undefined }}>{court(d.limite)}</b><Link to={lien(d)}>{d.titre}</Link></div>)}
    </div>
  );
}

// Parcours de formation : frise des étapes de chaque parcours (terminé, en cours, à venir).
export function ParcoursFormation({ devoirs }) {
  const m = new Map();
  devoirs.forEach((d) => { if (!d.pc) return; const k = (d.eq || "") + "|" + d.pc; if (!m.has(k)) m.set(k, { eq: d.eq || "", nom: d.pcT || "", it: [] }); m.get(k).it.push(d); });
  const g = [...m.values()].map((x) => ({ ...x, it: [...x.it].sort((a, b) => (a.rg || 0) - (b.rg || 0)) }));
  if (!g.length) return null;
  return (
    <div className="card">
      <h3 style={{ margin: "0 0 8px" }}>Parcours de formation</h3>
      {g.map((x) => {
        const cur = x.it.findIndex((d) => d.statut !== "ok"), fait = x.it.filter((d) => d.statut === "ok").length;
        return (
          <div key={x.eq + x.nom} className="pcf-g">
            <p className="pcf-h">{x.eq ? `Équipe « ${x.eq} » · ` : ""}Parcours « {x.nom} » · {fait}/{x.it.length} terminé(s)</p>
            <ol className="pcf-s">{x.it.map((d, i) => <li key={d.key || d.scId} className={"pcf-i" + (d.statut === "ok" ? " d" : i === cur ? " c" : "")}><span className="pcf-n">{d.statut === "ok" ? "✔" : i + 1}</span><span className="pcf-t">{d.titre}</span></li>)}</ol>
          </div>
        );
      })}
    </div>
  );
}
