import { calcImg } from "../lib/calculImages";
import { useEffect, useState } from "react";
import { rubriquesDe } from "../lib/model";
import { listCalculs, deleteCalcul, dupCalcul, seedCalculs } from "../lib/calculs";
import { listRelations, deleteRelation, dupRelation, seedRelations, SEEDS_REL } from "../lib/relation";
import Dominantes from "../components/Dominantes";
import { Link, useNavigate } from "react-router-dom";
import { listScenarios, deleteScenario, duplicateScenario, saveScenario, updateScenarioChamps } from "../lib/db";

export default function AdminList() {
  const nav = useNavigate();
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [rub, setRub] = useState("all");
  const [rech, setRech] = useState("");
  const [calcEx, setCalcEx] = useState(null);
  const refreshCalc = () => Promise.all([listCalculs(true).catch(() => []), listRelations(true).catch(() => [])]).then(([a, b]) => setCalcEx([...a, ...b]));
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
            // Variantes aléatoires : on applique les variables et les textes qui les utilisent.
            if ((d.variantes || []).length && !(ex.variantes || []).length) {
              patch.variantes = d.variantes;
              patch.variantesAuto = d.variantesAuto;
              patch.qa = d.qa;
              patch.correction = d.correction;
              if (d.situation?.contexte) patch["situation.contexte"] = d.situation.contexte;
            }
            if (ex.cubique === undefined && d.cubique !== undefined) patch.cubique = d.cubique;
            if (!patch.correction) for (const k of ["crs", "crv", "crf", "crd"]) if (!ex.correction?.[k] && d.correction?.[k]) patch["correction." + k] = d.correction[k];
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
  const nq = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const mots = nq(rech).trim().split(/\s+/).filter(Boolean);
  const qok = (x) => !mots.length || mots.every((w) => nq([x.titre, x.description, x.rubrique, (x.dominantes || []).join(" "), x.niveau].join(" ")).includes(w));
  const shown = (list || []).filter((x) => qok(x) && (rubOk === "all" || (x.rubrique || "Sans rubrique") === rubOk));

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
          <button className="btn" onClick={() => nav("/admin/relation/nouveau")}>+ Exercice relationnel</button>
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
          <input type="search" className="grow" placeholder="Rechercher un scénario (titre, rubrique, dominante…)" value={rech} onChange={(e) => setRech(e.target.value)} autoComplete="off" />
          <label htmlFor="admrub" className="muted">Rubrique</label>
          <select id="admrub" value={rubOk} onChange={(e) => setRub(e.target.value)}>
            <option value="all">Toutes ({list.length + ce.length})</option>
            {rubs.map((r) => (
              <option key={r} value={r}>{r} ({nRub(r)})</option>
            ))}
          </select>
        </div>
      )}

      {calcEx && SEEDS_REL.some((_, i) => !calcEx.some((x) => x.id === "rel" + (i + 1))) && (
        <div className="card">Exercices relationnels (gestion du conflit) à importer. <button className="btn" onClick={() => seedRelations(calcEx.map((x) => x.id)).then(refreshCalc)}>Importer les exercices manquants ({SEEDS_REL.filter((_, i) => !calcEx.some((x) => x.id === "rel" + (i + 1))).length})</button></div>
      )}
      {calcEx && calcEx.length === 0 && (
        <div className="card">Aucun exercice de calcul. <button className="btn" onClick={() => seedCalculs().then(refreshCalc)}>Importer les 6 exercices de calcul LIF</button></div>
      )}
      {list && mots.length > 0 && shown.length === 0 && !ce.some(qok) && <div className="card muted">Aucun résultat pour « {rech} ». <button className="btn" onClick={() => setRech("")}>Effacer la recherche</button></div>}
      {list && ce.filter((x) => qok(x) && (rubOk === "all" || (x.rubrique || "Sans rubrique") === rubOk)).map((ex) => (
        <div className="card row between item" key={ex.id}>
          <div className="row">
            {ex.kind === "rel" && ex.vignette ? <img className="thumb" src={ex.vignette} alt="" /> : calcImg(ex) ? <img className="thumb" src={calcImg(ex)} alt="" /> : <div className="thumb ph" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{ex.kind === "rel" ? "🗣️" : "🧮"}</div>}
            <div>
              <strong>{ex.titre}</strong>
              <div className="meta">
                <span className={"st " + (ex.publie ? "ok" : "br")}>● {ex.publie ? "Publié" : "Brouillon"}</span>
                <span><span className="muted">Rubrique :</span> <b>{ex.rubrique || "—"}</b></span>
                <span className="tag">{ex.kind === "rel" ? "Exercice relationnel" : "Exercice de calcul"}</span>
              </div>
              <div className="muted">{ex.kind === "rel" ? `${ex.niveau} · ${ex.contexte?.type} · ${ex.noeuds?.length || 0} nœuds` : `${ex.niveau} · ${ex.S} m² · ${ex.miscible ? "miscible" : "non miscible"} · C = ${ex.C} %`}</div>
            </div>
          </div>
          <div className="row">
            <Link className="btn" to={ex.kind === "rel" ? `/relation/${ex.id}` : `/calculs/${ex.id}`}>Tester</Link>
            <Link className="btn" to={ex.kind === "rel" ? `/admin/relation/${ex.id}` : `/admin/calcul/${ex.id}`}>Modifier</Link>
            <button className="btn" onClick={() => (ex.kind === "rel" ? dupRelation(ex) : dupCalcul(ex)).then(refreshCalc)}>Dupliquer</button>
            <button className="btn danger" onClick={() => { if (window.confirm(`Supprimer définitivement « ${ex.titre} » ?`)) (ex.kind === "rel" ? deleteRelation(ex.id) : deleteCalcul(ex.id)).then(refreshCalc); }}>Supprimer</button>
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
