import { useEffect, useState } from "react";
import { listAudit, ACTIONS } from "../lib/audit";
import { fmtDate } from "../lib/users";

const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export default function AdminAudit() {
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [act, setAct] = useState("");
  useEffect(() => { listAudit().then(setList).catch((e) => setErr(e.message)); }, []);
  const rows = (list || []).filter((r) => {
    if (act && r.action !== act) return false;
    const t = `${r.parNom} ${r.cibleNom} ${r.details} ${ACTIONS[r.action] || r.action}`.toLowerCase();
    return !q || t.includes(q.toLowerCase());
  });
  const csv = () => {
    const l = ["Date;Acteur;Action;Cible;Détails", ...rows.map((r) => [fmtDate(r.le), r.parNom, ACTIONS[r.action] || r.action, r.cibleNom, r.details].map(esc).join(";"))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + l], { type: "text/csv;charset=utf-8" }));
    a.download = "journal-audit.csv";
    a.click();
  };
  return (
    <>
      <div className="row between"><h1>Journal des actions</h1><button className="btn" onClick={csv} disabled={!rows.length}>Exporter en CSV</button></div>
      <p className="muted">Trace des actions sensibles : comptes, rôles, suspensions, suppressions, exports de données. Les 500 dernières entrées sont affichées ; le journal ne peut être ni modifié ni effacé.</p>
      <div className="row">
        <input className="grow" placeholder="Rechercher (personne, détail)…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={act} onChange={(e) => setAct(e.target.value)}>
          <option value="">Toutes les actions</option>
          {Object.entries(ACTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {err && <div className="card warn">Erreur : {err}</div>}
      {!list && !err && <p>Chargement…</p>}
      {list && rows.length === 0 && <div className="card">Aucune entrée.</div>}
      {rows.length > 0 && (
        <table className="cmp">
          <thead><tr><th>Date</th><th>Acteur</th><th>Action</th><th>Cible</th><th>Détails</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}><td>{fmtDate(r.le)}</td><td>{r.parNom || "—"}</td><td>{ACTIONS[r.action] || r.action}</td><td>{r.cibleNom || "—"}</td><td>{r.details || ""}</td></tr>)}</tbody>
        </table>
      )}
    </>
  );
}
