import { memo } from "react";
import { juste } from "../lib/cartes";

// Affichage d'une carte mentale (arbre horizontal). exo : les branches masquées sont à compléter (rep / setRep) ; corrige : montre les réponses attendues.
function Noeud({ n, niv, col, exo, rep, setRep, corrige }) {
  const c = n.c || col || "#4a5560", fils = n.fils || [];
  const cache = exo && n.m && niv > 0;
  const r = (rep || {})[n.id] || "";
  return (
    <div className="cm-n" style={{ "--cl": c }}>
      <div className={"cm-b" + (niv === 0 ? " root" : niv === 1 ? " l1" : "") + (cache ? " vide" : "")}>
        {cache && !corrige ? <input value={r} onChange={(e) => setRep && setRep({ ...(rep || {}), [n.id]: e.target.value })} placeholder="À compléter…" aria-label="Branche à compléter" disabled={!setRep} />
          : cache && corrige ? <span><span className={"cm-r " + (juste(n, r) ? "ok" : "ko")}>{r || "—"}</span><small className="cm-att">Attendu : {n.t}</small></span>
          : <span>{n.t}</span>}
      </div>
      {fils.length > 0 && <div className="cm-f">{fils.map((f) => <Noeud key={f.id} n={f} niv={niv + 1} col={c} exo={exo} rep={rep} setRep={setRep} corrige={corrige} />)}</div>}
    </div>
  );
}
export default memo(function CarteMentale({ arbre, exo, rep, setRep, corrige }) {
  if (!arbre) return null;
  return <div className="cm"><Noeud n={arbre} niv={0} exo={exo} rep={rep} setRep={setRep} corrige={corrige} /></div>;
});
