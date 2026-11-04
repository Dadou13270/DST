import { useEffect, useState } from "react";
import { listUsers } from "../lib/users";
import { MENUS_ROLES, sauverMenus, useMenusMasques } from "../lib/menusRoles";

// Admin › Menus par rôle : liste des stagiaires, gestionnaires et admins de département,
// et pages du menu à afficher (case cochée) ou cacher (case décochée) pour chaque rôle.
export default function AdminMenus() {
  const src = useMenusMasques();
  const [m, setM] = useState(null);
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState("");
  useEffect(() => { listUsers().then(setUsers).catch(() => {}); }, []);
  useEffect(() => { if (!m) setM({ stagiaire: [...(src.stagiaire || [])], gestionnaire: [...(src.gestionnaire || [])], dept: [...(src.dept || [])] }); }, [src, m]);
  if (!m) return <p>Chargement…</p>;
  const membres = {
    stagiaire: users.filter((u) => !u.admin && !u.gestionnaire && !u.adminDept),
    gestionnaire: users.filter((u) => u.gestionnaire),
    dept: users.filter((u) => u.adminDept),
  };
  const bascule = (k, p) => { setMsg(""); setM({ ...m, [k]: m[k].includes(p) ? m[k].filter((x) => x !== p) : [...m[k], p] }); };
  const sauver = async () => { setMsg(""); try { await sauverMenus(m); setMsg("Menus enregistrés."); } catch (e) { setMsg("Erreur : " + (e.code || e.message)); } };
  return (
    <div>
      <h1>Menus par rôle</h1>
      <p className="muted">Coche les pages à afficher dans le menu de gauche, décoche celles à cacher. L'administrateur voit toujours toutes les pages.</p>
      <div className="pgrid">
        {MENUS_ROLES.map((r) => {
          const l = membres[r.k] || [];
          return (
            <div className="card" key={r.k}>
              <h2 style={{ margin: "0 0 4px" }}>{r.t}</h2>
              <p className="muted" style={{ margin: "0 0 8px" }}>{l.length} inscrit(s){r.k === "stagiaire" ? " sans autre rôle" : ""}{l.length ? " : " + l.slice(0, 12).map((u) => u.nom || u.email || "—").join(", ") + (l.length > 12 ? "…" : "") : ""}</p>
              {r.note && <p className="muted" style={{ margin: "0 0 8px", fontSize: ".85rem" }}>{r.note}</p>}
              {r.pages.map((p) => (
                <label key={p} className="ck" style={{ display: "flex", gap: 8, alignItems: "center", margin: "6px 0" }}>
                  <input type="checkbox" checked={!m[r.k].includes(p)} onChange={() => bascule(r.k, p)} style={{ width: "auto" }} /> {p}
                </label>
              ))}
            </div>
          );
        })}
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn primary" onClick={sauver}>Enregistrer</button>
        {msg && <span className={msg.startsWith("Erreur") ? "err" : "muted"}>{msg}</span>}
      </div>
    </div>
  );
}
