import { useEffect, useState } from "react";
import { rubriquesDe } from "../lib/model";
import { listCalculs, deleteCalcul, dupCalcul, seedCalculs } from "../lib/calculs";
import Dominantes from "../components/Dominantes";
import { Link, useNavigate } from "react-router-dom";
import { listScenarios, deleteScenario, duplicateScenario, saveScenario, updateScenarioChamps } from "../lib/db";

export default function AdminList() {
  const nav = useNavigate();
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [rub, setRub] = useState("all");
  const [calcEx, setCalcEx] = useState(null);
  const refreshCalc = () => listCalculs(true).then(setCalcEx).catch(() => setCalcEx([]));
  useEffect(() => { refreshCalc(); }, []);

  // Import de fichiers JSON (dossier seeds/) : un fichier = un scénario, ignoré s'il existe déjà (même titre).
  const importer = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (!files.length) return;
    setInfo("Import en cours…");
    setErr("");
    const titres = new Set((list || []).map((x) => x.titre));
    const parTitre = new Map((list || []).map((x) => [x.titre, x]));
    let ok = 0, ignores = 0, maj = 0;
    try {
      for (const f of files) {
        const d = JSON.parse(await f.text());
        if (!d.titre) continue;
        if (titres.has(d.titre)) {
          // Scénario déjà présent : on complète seulement les champs manquants (dominantes, rubrique, durée, évolutif…).
          const ex = parTitre.get(d.titre);
          const patch = {};
          if (ex?.id) {
            if (!(ex.dominantes || []).length && (d.dominantes || []).length) patch.dominantes = d.dominantes;
            if (!ex.rubrique && d.rubrique) patch.rubrique = d.rubrique;
            if (!ex.duree && d.duree) patch.duree = d.duree;
            if (ex.evolutif === undefined && d.evolutif !== undefined) { patch.evolutif = d.evolutif; if (d.evolutions) patch.evolutions = d.evolutions; }
            if (ex.cubique === undefined && d.cubique !== undefined) patch.cubique = d.cubique;
          }
          if (Object.keys(patch).length) { await updateScenarioChamps(ex.id, patch); maj++; } else ignores++;
          continue;
        }
        const { photo, ...rest } = d;
        await saveScenario(null, rest, photo || undefined);
        titres.add(d.titre);
        ok++;
      }
      setInfo(`${ok} scénario(s) importé(s)${maj ? `, ${maj} existant(s) complété(s) (badges, rubrique…)` : ""}${ignores ? `, ${ignores} déjà à jour` : ""}.`);
    } catch (e2) {
      setInfo("");
      setErr("Import impossible : " + e2.message);
    }
    refresh();
  };

  const refresh = () =>
    listScenarios(false)
      .then(setList)
      .catch((e) => setErr(e.message));
  useEffect(() => {
    refresh();
  }, []);

  const del = async (s) => {
    if (!window.confirm(`Supprimer définitivement « ${s.titre} » ?`)) return;
    await deleteScenario(s.id);
    refresh();
  };
  const dup = async (s) => {
    await duplicateScenario(s.id);
    refresh();
  };

  const ce = calcEx || [];
  const nRub = (r) => (list || []).filter((x) => (x.rubrique || "Sans rubrique") === r).length + ce.filter((x) => (x.rubrique || "Sans rubrique") === r).length;
  const rubs = [...new Set([...(list || []).map((x) => x.rubrique || "Sans rubrique"), ...ce.map((x) => x.rubrique || "Sans rubrique")])].sort((a, b) => a.localeCompare(b, "fr"));
  const rubOk = rub === "all" || rubs.includes(rub) ? rub : "all";
  const shown = (list || []).filter((x) => rubOk === "all" || (x.rubrique || "Sans rubrique") === rubOk);

  return (
    <>
      <div className="row between">
        <h1>Scénarios</h1>
        <div className="row">
          <label className="btn">
            Importer des scénarios (.json)
            <input type="file" accept=".json,application/json" multiple hidden onChange={importer} />
          </label>
          <button className="btn" onClick={() => nav("/admin/calcul/nouveau")}>+ Exercice de calcul</button>
          <button className="btn primary" onClick={() => nav("/admin/scenario/nouveau")}>
            + Nouveau scénario
          </button>
        </div>
      </div>
      {info && <p className="ok-txt">{info}</p>}
      {err && <div className="card warn">Erreur : {err}</div>}
      {!list && !err && <p>Chargement…</p>}
      {list && list.length === 0 && <div className="card">Aucun scénario. Crée le premier.</div>}

      {list && (
        <div className="row" style={{ margin: "8px 0" }}>
          <label htmlFor="admrub" className="muted">Rubrique</label>
          <select id="admrub" value={rubOk} onChange={(e) => setRub(e.target.value)}>
            <option value="all">Toutes ({list.length + ce.length})</option>
            {rubs.map((r) => (
              <option key={r} value={r}>{r} ({nRub(r)})</option>
            ))}
          </select>
        </div>
      )}

      {calcEx && calcEx.length === 0 && (
        <div className="card">Aucun exercice de calcul. <button className="btn" onClick={() => seedCalculs().then(refreshCalc)}>Importer les 6 exercices de calcul LIF</button></div>
      )}
      {list && ce.filter((x) => rubOk === "all" || (x.rubrique || "Sans rubrique") === rubOk).map((ex) => (
        <div className="card row between item" key={ex.id}>
          <div className="row">
            <div className="thumb ph" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>🧮</div>
            <div>
              <strong>{ex.titre}</strong>
              <div className="meta">
                <span className={"st " + (ex.publie ? "ok" : "br")}>● {ex.publie ? "Publié" : "Brouillon"}</span>
                <span><span className="muted">Rubrique :</span> <b>{ex.rubrique || "—"}</b></span>
                <span className="tag">Exercice de calcul</span>
              </div>
              <div className="muted">{ex.niveau} · {ex.S} m² · {ex.miscible ? "miscible" : "non miscible"} · C = {ex.C} %</div>
            </div>
          </div>
          <div className="row">
            <Link className="btn" to={`/calculs/${ex.id}`}>Tester</Link>
            <Link className="btn" to={`/admin/calcul/${ex.id}`}>Modifier</Link>
            <button className="btn" onClick={() => dupCalcul(ex).then(refreshCalc)}>Dupliquer</button>
            <button className="btn danger" onClick={() => { if (window.confirm(`Supprimer définitivement « ${ex.titre} » ?`)) deleteCalcul(ex.id).then(refreshCalc); }}>Supprimer</button>
          </div>
        </div>
      ))}

      {shown.map((s) => (
        <div className="card row between item" key={s.id}>
          <div className="row">
            {s.vignette ? <img className="thumb" src={s.vignette} alt="" /> : <div className="thumb ph" />}
            <div>
              <strong>{s.titre}</strong>
              <div className="meta">
                <span className={"st " + (s.publie ? "ok" : "br")}>● {s.publie ? "Publié" : "Brouillon"}</span>
                <span><span className="muted">Rubrique :</span> <b>{s.rubrique || "—"}</b></span>
                {s.reserveA && <span className="muted">Réservé</span>}
              </div>
              <div className="muted">
                {(s.interlocuteurs || []).length} interlocuteur(s) · {(s.qa || []).length} réponse(s)
              </div>
            </div>
          </div>
          <div className="row">
            <Link className="btn" to={`/scenario/${s.id}`}>Tester</Link>
            <Link className="btn" to={`/admin/scenario/${s.id}`}>Modifier</Link>
            <button className="btn" onClick={() => dup(s)}>Dupliquer</button>
            <button className="btn danger" onClick={() => del(s)}>Supprimer</button>
          </div>
          {(s.evolutif || (s.dominantes || []).length > 0) && <div className="bdg"><Dominantes s={s} evo /></div>}
        </div>
      ))}
    </>
  );
}
