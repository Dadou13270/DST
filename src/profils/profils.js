// Profils des inscrits : liste filtrable + fiche. Module autonome : profilsMount(element, opts).
// opts : { titre, portee, list() → [{id, nom, email, grade, cadre, departement, cis, equipeNom, gestionnaire, adminDept, admin, statut, creeLe, derniere, xp, nbEx}] }
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ms = (t) => (!t ? 0 : typeof t === "number" ? t : t.toMillis ? t.toMillis() : t.toDate ? t.toDate().getTime() : t.seconds ? t.seconds * 1000 : 0);
const dt = (t) => (ms(t) ? new Date(ms(t)).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const roles = (u) => [u.admin ? "Administrateur" : "", u.gestionnaire ? "Gestionnaire" : "", u.adminDept ? "Admin de département" : ""].filter(Boolean);
const CSS = `.pf{width:100%;font:inherit}.pf *{box-sizing:border-box}
.pf .cd{background:var(--card,#fff);border:1px solid var(--line,#d8dde1);border-radius:12px;padding:14px;margin:10px 0}
.pf .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.pf .m{color:var(--mut,#6b7280)}.pf h2,.pf h3{margin:0 0 6px}
.pf input,.pf select{font:inherit;padding:8px 10px;border:1px solid var(--line,#d8dde1);border-radius:8px;background:var(--card,#fff);color:inherit;max-width:100%}.pf input.q{flex:1;min-width:200px}
.pf .b{font:inherit;font-weight:600;padding:6px 12px;border-radius:10px;border:1px solid var(--line,#d8dde1);background:var(--card,#fff);color:inherit;cursor:pointer}
.pf .tw{overflow-x:auto}.pf table{width:100%;border-collapse:collapse}.pf th,.pf td{text-align:left;padding:8px 10px;border-bottom:1px solid rgba(127,127,127,.2);vertical-align:top}.pf th{font-size:.85em;color:var(--mut,#6b7280)}.pf tbody tr{cursor:pointer}.pf tbody tr:hover{background:rgba(127,127,127,.08)}
.pf .tg{display:inline-block;padding:2px 10px;border-radius:99px;font-size:.78rem;font-weight:700;border:1px solid var(--line,#d8dde1);white-space:nowrap;margin-right:4px}.pf .tg.ok{background:#1f8a4c;color:#fff;border-color:#1f8a4c}
.pf dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 14px;margin:8px 0 0}.pf dt{color:var(--mut,#6b7280)}.pf dd{margin:0}.pf .err{color:#b3261e;font-weight:600}`;
function css() { if (!document.getElementById("pf-css")) { const s = document.createElement("style"); s.id = "pf-css"; s.textContent = CSS; document.head.appendChild(s); } }
let S = null;

export function profilsDetach() { S = null; }

export default function profilsMount(el, o) {
  css(); el.classList.add("pf");
  if (!S || S.k !== o.portee) S = { k: o.portee, liste: null, f: { q: "", dep: "", cis: "", grade: "", cadre: "", role: "" }, sel: null, err: "" };
  const ST = S;
  const charger = () => o.list().then((l) => { ST.liste = l; rend(); }).catch((e) => { ST.liste = []; ST.err = "Lecture impossible : " + (e.message || e.code); rend(); });
  const vals = (k, l) => [...new Set(l.map((u) => u[k]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), "fr", { numeric: true }));
  const sel = (k, label, opts) => `<select data-f="${k}"><option value="">${label}</option>${opts.map((v) => `<option${ST.f[k] === v ? " selected" : ""}>${esc(v)}</option>`).join("")}</select>`;
  function rend() {
    const l = ST.liste, f = ST.f;
    let h = `<h2>${esc(o.titre)}</h2><p class="m">${esc(o.portee)}</p>${ST.err ? `<p class="err">${esc(ST.err)}</p>` : ""}`;
    if (!l) { el.innerHTML = h + '<p class="m">Chargement…</p>'; return; }
    const aRoles = l.some((u) => u.gestionnaire !== undefined || u.admin !== undefined || u.adminDept !== undefined);
    const filtres = l.filter((u) => {
      if (f.q && !norm(`${u.nom} ${u.email || ""} ${u.cis || ""}`).includes(norm(f.q))) return false;
      if (f.dep && u.departement !== f.dep) return false;
      if (f.cis && u.cis !== f.cis) return false;
      if (f.grade && u.grade !== f.grade) return false;
      if (f.cadre && u.cadre !== f.cadre) return false;
      if (f.role) { const r = roles(u); if (f.role === "Stagiaire" ? r.length : !r.includes(f.role)) return false; }
      return true;
    }).sort((a, b) => String(a.nom || "").localeCompare(String(b.nom || ""), "fr"));
    const cisOpts = vals("cis", f.dep ? l.filter((u) => u.departement === f.dep) : l);
    h += `<div class="row"><input class="q" data-f="q" placeholder="Rechercher un nom, un CIS…" value="${esc(f.q)}">`;
    if (vals("departement", l).length > 1) h += sel("dep", "Tous les départements", vals("departement", l));
    if (cisOpts.length > 1) h += sel("cis", "Tous les CIS", cisOpts);
    if (vals("grade", l).length > 1) h += sel("grade", "Tous les grades", vals("grade", l));
    if (vals("cadre", l).length > 1) h += sel("cadre", "Tous les cadres d'emploi", vals("cadre", l));
    if (aRoles) h += sel("role", "Tous les rôles", ["Stagiaire", "Gestionnaire", "Admin de département", "Administrateur"]);
    h += `<button class="b" data-a="raz">Réinitialiser</button></div><p class="m">${filtres.length} profil(s) sur ${l.length}.</p>`;
    const u = ST.sel && l.find((x) => x.id === ST.sel);
    if (u) {
      const r = roles(u);
      h += `<div class="cd"><div class="row" style="justify-content:space-between"><h3>${esc(u.nom || "Sans nom")}</h3><button class="b" data-a="fermer">Fermer</button></div>
      <p style="margin:0">${r.map((x) => `<span class="tg ok">${esc(x)}</span>`).join("")}<span class="tg">Stagiaire</span>${u.statut === "suspendu" ? '<span class="tg">Suspendu</span>' : ""}</p>
      <dl><dt>Grade</dt><dd>${esc(u.grade || "—")}</dd><dt>Cadre d'emploi</dt><dd>${esc(u.cadre || "—")}</dd><dt>Fonction</dt><dd>${esc(u.fonction || "—")}</dd><dt>Statut</dt><dd>${esc(u.statutSp || "—")}</dd><dt>Département</dt><dd>${esc(u.departement || "—")}</dd><dt>CIS</dt><dd>${esc(u.cis || "—")}</dd>${u.equipeNom ? `<dt>Équipe</dt><dd>${esc(u.equipeNom)}</dd>` : ""}${u.email ? `<dt>E-mail</dt><dd>${esc(u.email)}</dd>` : ""}${u.creeLe ? `<dt>Inscrit le</dt><dd>${dt(u.creeLe)}</dd>` : ""}${u.derniere ? `<dt>Dernière visite</dt><dd>${dt(u.derniere)}</dd>` : ""}${u.nbEx != null ? `<dt>Exercices réalisés</dt><dd>${u.nbEx}</dd>` : ""}${u.xp != null ? `<dt>XP</dt><dd>${esc(u.xp.total != null ? u.xp.total : u.xp)}</dd>` : ""}</dl></div>`;
    }
    h += filtres.length ? `<div class="cd tw"><table><thead><tr><th>Nom</th><th>Grade</th><th>Cadre d'emploi</th><th>Département</th><th>CIS</th>${aRoles ? "<th>Rôle</th>" : ""}</tr></thead><tbody>${filtres.map((x) => `<tr data-a="voir" data-i="${esc(x.id)}"><td><b>${esc(x.nom || "Sans nom")}</b></td><td>${esc(x.grade || "—")}</td><td>${esc(x.cadre || "—")}</td><td>${esc(x.departement || "—")}</td><td>${esc(x.cis || "—")}</td>${aRoles ? `<td>${roles(x).map((r) => `<span class="tg ok">${esc(r)}</span>`).join("") || "Stagiaire"}</td>` : ""}</tr>`).join("")}</tbody></table></div>` : '<div class="cd"><p class="m" style="margin:0">Aucun profil.</p></div>';
    // conserve le focus du champ de recherche pendant la frappe
    const foc = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.f === "q";
    el.innerHTML = h;
    if (foc) { const n = el.querySelector("[data-f=q]"); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }
  }
  el.oninput = (e) => { const t = e.target; if (t.dataset && t.dataset.f === "q") { ST.f.q = t.value; rend(); } };
  el.onchange = (e) => { const t = e.target; if (t.dataset && t.dataset.f && t.dataset.f !== "q") { ST.f[t.dataset.f] = t.value; if (t.dataset.f === "dep") ST.f.cis = ""; rend(); } };
  el.onclick = (e) => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    if (b.dataset.a === "raz") ST.f = { q: "", dep: "", cis: "", grade: "", cadre: "", role: "" };
    else if (b.dataset.a === "voir") ST.sel = b.dataset.i;
    else if (b.dataset.a === "fermer") ST.sel = null;
    rend();
  };
  if (ST.liste) { rend(); } else rend();
  charger();
}
