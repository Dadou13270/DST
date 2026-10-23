import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listScenarios, deleteScenario, duplicateScenario, saveScenario } from "../lib/db";

export default function AdminList() {
  const nav = useNavigate();
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  // Import de fichiers JSON (dossier seeds/) : un fichier = un scénario, ignoré s'il existe déjà (même titre).
  const importer = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (!files.length) return;
    setInfo("Import en cours…");
    setErr("");
    const titres = new Set((list || []).map((x) => x.titre));
    let ok = 0, ignores = 0;
    try {
      for (const f of files) {
        const d = JSON.parse(await f.text());
        if (!d.titre) continue;
        if (titres.has(d.titre)) {
          ignores++;
          continue;
        }
        const { photo, ...rest } = d;
        await saveScenario(null, rest, photo || undefined);
        titres.add(d.titre);
        ok++;
      }
      setInfo(`${ok} scénario(s) importé(s)${ignores ? `, ${ignores} déjà présent(s) ignoré(s)` : ""}.`);
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

  return (
    <>
      <div className="row between">
        <h1>Scénarios</h1>
        <div className="row">
          <label className="btn">
            Importer des scénarios (.json)
            <input type="file" accept=".json,application/json" multiple hidden onChange={importer} />
          </label>
          <button className="btn primary" onClick={() => nav("/admin/scenario/nouveau")}>
            + Nouveau scénario
          </button>
        </div>
      </div>
      {info && <p className="ok-txt">{info}</p>}
      {err && <div className="card warn">Erreur : {err}</div>}
      {!list && !err && <p>Chargement…</p>}
      {list && list.length === 0 && <div className="card">Aucun scénario. Crée le premier.</div>}

      {(list || []).map((s) => (
        <div className="card row between item" key={s.id}>
          <div className="row">
            {s.vignette ? <img className="thumb" src={s.vignette} alt="" /> : <div className="thumb ph" />}
            <div>
              <strong>{s.titre}</strong>{" "}
              <span className={s.publie ? "tag ok" : "tag"}>{s.publie ? "Publié" : "Brouillon"}</span>
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
        </div>
      ))}
    </>
  );
}
