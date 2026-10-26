import { useEffect, useMemo, useState } from "react";
import { listScenarios } from "../lib/db";
import { norm } from "../lib/matching";
import { uid, TOUS } from "../lib/model";

// Banque de questions : pioche des questions déjà écrites dans les autres scénarios.
export default function BanqueQuestions({ s, scId, onImport, onClose }) {
  const [all, setAll] = useState(null);
  const [q, setQ] = useState("");
  const [rub, setRub] = useState("all");
  const [sel, setSel] = useState({});
  const [repli, setRepli] = useState(s.interlocuteurs[0]?.id || TOUS);
  useEffect(() => { listScenarios(false).then(setAll).catch(() => setAll([])); }, []);
  const items = useMemo(() => {
    const o = [];
    (all || []).forEach((sc) => {
      if (sc.id === scId) return;
      (sc.qa || []).forEach((x) => {
        const it = (sc.interlocuteurs || []).find((i) => i.id === x.interlocuteurId);
        o.push({ k: sc.id + "|" + x.id, sc, q: x, inter: x.interlocuteurId === TOUS ? "Tous" : it?.nom || "" });
      });
    });
    return o;
  }, [all, scId]);
  const rubs = [...new Set((all || []).map((x) => x.rubrique).filter(Boolean))];
  const mots = norm(q).split(" ").filter(Boolean);
  const f = items.filter((x) => (rub === "all" || x.sc.rubrique === rub) && mots.every((t) => norm([x.q.intitule, x.q.motsCles, x.q.reponse, x.sc.titre, x.inter].join(" ")).includes(t)));
  const aff = f.slice(0, 60);
  const n = Object.values(sel).filter(Boolean).length;

  function importer() {
    const key = (x) => x.interlocuteurId + "|" + norm(x.intitule) + "|" + norm(x.motsCles);
    const have = new Set(s.qa.map(key));
    const nouv = []; let d = 0;
    items.forEach((x) => {
      if (!sel[x.k]) return;
      const t = x.q.interlocuteurId === TOUS ? TOUS : s.interlocuteurs.find((i) => norm(i.nom) === norm(x.inter))?.id || repli;
      const y = { id: uid(), interlocuteurId: t, intitule: x.q.intitule || "", motsCles: x.q.motsCles || "", reponse: x.q.reponse || "", essentielle: !!x.q.essentielle };
      if (have.has(key(y))) { d++; return; }
      have.add(key(y)); nouv.push(y);
    });
    onImport(nouv, d);
    setSel({});
  }

  return (
    <div className="card form">
      <div className="row between">
        <b>Banque de questions ({items.length} questions)</b>
        <button className="btn" onClick={onClose}>Fermer</button>
      </div>
      {all === null ? <p className="muted">Chargement…</p> : (
        <>
          <div className="row">
            <input className="grow" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher : intitulé, mot-clé, réponse, scénario, interlocuteur…" />
            <select value={rub} onChange={(e) => setRub(e.target.value)}>
              <option value="all">Toutes rubriques</option>
              {rubs.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="row between">
            <span className="muted">{f.length} résultat(s){f.length > 60 ? " (60 premiers affichés, affine la recherche)" : ""}</span>
            <span className="row">
              <button className="btn" onClick={() => setSel((p) => { const n2 = { ...p }; aff.forEach((x) => (n2[x.k] = true)); return n2; })}>Tout cocher</button>
              <button className="btn" onClick={() => setSel({})}>Décocher</button>
            </span>
          </div>
          <div style={{ maxHeight: 360, overflow: "auto" }}>
            {aff.map((x) => (
              <label key={x.k} className="check" style={{ display: "block", borderTop: "1px solid var(--line)", padding: "6px 0" }}>
                <input type="checkbox" checked={!!sel[x.k]} onChange={(e) => setSel((p) => ({ ...p, [x.k]: e.target.checked }))} />{" "}
                <b>{x.q.intitule || "(sans intitulé)"}</b>{x.q.essentielle && <span className="tag"> essentielle</span>}
                <br /><span className="muted" style={{ fontSize: ".85rem" }}>{x.sc.titre} · {x.inter || "?"} — {(x.q.reponse || "").slice(0, 140)}</span>
              </label>
            ))}
            {!aff.length && <p className="muted">Aucune question.</p>}
          </div>
          <div className="row">
            <label>Interlocuteur de repli</label>
            <select value={repli} onChange={(e) => setRepli(e.target.value)}>
              <option value={TOUS}>Tous les interlocuteurs</option>
              {s.interlocuteurs.map((i) => <option key={i.id} value={i.id}>{i.nom}</option>)}
            </select>
            <button className="btn primary" disabled={!n} onClick={importer}>Importer {n} question(s)</button>
          </div>
          <p className="muted">Un interlocuteur de même nom est retrouvé automatiquement ; sinon la question va à l'interlocuteur de repli. Doublons ignorés ; évolutions et rubriques cubiques non reprises.</p>
        </>
      )}
    </div>
  );
}
