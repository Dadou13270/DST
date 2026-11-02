import { nomApp, rvbCharte } from "./charte";
import { statutDevoir, fmtLimite } from "./devoirs";
import { fmtDuree } from "./users";

// Attestation de fin de parcours : calcul à partir des exercices du parcours (teams.devoirs avec pc) et des résultats du stagiaire
// (users/{uid}.bilans pour les scénarios, users/{uid}.calculs pour calcul / relationnel / quiz / QCM / examen).

const pct = (ok, tot) => (tot ? Math.round((100 * ok) / tot) : null);
const typeDe = (d, ex) => (d.k === "rel" ? "Relationnel" : d.k === "calc" ? "Calcul LIF" : d.k === "quiz" ? (ex?.format === "cartes" ? "Flashcards" : ex?.format === "examen" ? "Examen blanc" : ex?.format === "quiz" ? "Quiz" : "QCM") : "Scénario SOIEC");

// Parcours (groupes de devoirs) d'une équipe, triés dans l'ordre du parcours.
export function parcoursDevoirs(devoirs) {
  const g = new Map();
  (devoirs || []).filter((d) => d.pc).forEach((d) => { if (!g.has(d.pc)) g.set(d.pc, []); g.get(d.pc).push(d); });
  return [...g.entries()].map(([id, items]) => {
    const tri = [...items].sort((a, b) => (a.rg || 0) - (b.rg || 0));
    return { id, titre: tri[0].pcT || "Parcours", objectif: tri.find((x) => x.pcJ)?.pcJ || "", items: tri };
  });
}

// Résultat d'un stagiaire sur un parcours. termine = tous les exercices du parcours sont rendus.
export function bilanParcours(pc, profil, catalogue = [], now = Date.now()) {
  const lignes = pc.items.map((d) => {
    const ex = catalogue.find((x) => x.id === d.scId);
    const ok = statutDevoir(d, profil?.bilans, now, profil?.calculs) === "ok";
    const b = (profil?.bilans || {})[d.scId];
    const essais = (profil?.calculs || {})[d.scId] || [];
    let note = null, detail = "—", date = 0, duree = 0, themes = null;
    if (b) {
      note = pct(b.essOk, b.essTot); detail = b.essTot ? `${b.essOk}/${b.essTot} essentielles` : "Terminé"; date = b.fin || 0; duree = b.duree || 0;
    } else if (essais.length) {
      const best = essais.reduce((m, e) => ((pct(e.ok, e.tot) ?? -1) >= (pct(m.ok, m.tot) ?? -1) ? e : m), essais[0]);
      note = pct(best.ok, best.tot); detail = best.tot ? `${best.ok}/${best.tot}` : "Terminé"; date = essais[essais.length - 1].le || 0;
      duree = essais.reduce((n, e) => n + (e.duree || 0), 0); themes = best.quiz?.themes || null;
    }
    return { scId: d.scId, dg: !!d.dg, titre: d.titre, type: (d.dg ? "Diagnostic · " : "") + typeDe(d, ex), rubrique: ex?.rubrique || "", ok, note, detail, date, duree, themes, essais: essais.length || (b ? b.nb || 1 : 0) };
  });
  const faits = lignes.filter((l) => l.ok);
  const notes = faits.filter((l) => !l.dg).map((l) => l.note).filter((n) => n !== null);
  const note = notes.length ? Math.round(notes.reduce((a, n) => a + n, 0) / notes.length) : null;
  // thèmes : rubriques des exercices + thèmes des quiz (score du meilleur essai)
  const rub = new Map();
  faits.filter((l) => !l.dg).forEach((l) => { const k = l.rubrique || "Autres"; const r = rub.get(k) || { nom: k, n: 0, notes: [] }; r.n++; if (l.note !== null) r.notes.push(l.note); rub.set(k, r); });
  const thq = new Map();
  faits.filter((l) => !l.dg).forEach((l) => Object.entries(l.themes || {}).forEach(([k, v]) => { const t = thq.get(k) || { nom: k, ok: 0, tot: 0 }; t.ok += v.ok; t.tot += v.tot; thq.set(k, t); }));
  const dates = faits.map((l) => l.date).filter(Boolean);
  return {
    pc, lignes, faits: faits.length, total: lignes.length, termine: lignes.length > 0 && faits.length === lignes.length, note,
    rubriques: [...rub.values()].map((r) => ({ nom: r.nom, n: r.n, pct: r.notes.length ? Math.round(r.notes.reduce((a, n) => a + n, 0) / r.notes.length) : null })),
    themes: [...thq.values()].map((t) => ({ nom: t.nom, ok: t.ok, tot: t.tot, pct: pct(t.ok, t.tot) })).sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0)),
    debut: dates.length ? Math.min(...dates) : 0, fin: dates.length ? Math.max(...dates) : 0, duree: faits.reduce((n, l) => n + l.duree, 0),
  };
}

const fd = (ms) => (ms ? new Date(ms).toLocaleDateString("fr-FR", { dateStyle: "long" }) : "—");
const noteSur20 = (p) => (p === null ? "—" : (p / 5).toFixed(1).replace(".", ",") + " / 20");

// items : [{ profil, bp (bilanParcours), equipe, gest }] -> un PDF, une attestation par élément.
export async function pdfAttestations(items, nomFichier = "attestation") {
  const { jsPDF } = await import("jspdf");
  const at = await import("jspdf-autotable");
  const autoTable = [at.default, at.default?.default, at.autoTable].find((f) => typeof f === "function");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const [r, g, b] = rvbCharte();
  items.forEach(({ profil, bp, equipe, gest }, n) => {
    if (n) doc.addPage();
    doc.setDrawColor(r, g, b); doc.setLineWidth(1); doc.rect(7, 7, 196, 283);
    doc.setLineWidth(0.3); doc.rect(9.5, 9.5, 191, 278);
    doc.setFillColor(r, g, b); doc.rect(9.5, 9.5, 191, 16, "F");
    doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text(nomApp(), 105, 20, { align: "center" });
    doc.setTextColor(30); doc.setFontSize(21); doc.text("ATTESTATION DE FIN DE PARCOURS", 105, 40, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(90);
    doc.text("Il est attesté que", 105, 50, { align: "center" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(30); doc.text(profil?.nom || "Stagiaire", 105, 59, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(90);
    const qui = [profil?.grade, profil?.cis, profil?.departement ? "SDIS " + profil.departement : ""].filter(Boolean).join("  ·  ");
    if (qui) doc.text(qui, 105, 65, { align: "center" });
    doc.text("a suivi et terminé le parcours de formation", 105, 72, { align: "center" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(r, g, b);
    const tt = doc.splitTextToSize("« " + bp.pc.titre + " »", 170); doc.text(tt, 105, 80, { align: "center" });
    let yy = 80 + tt.length * 6;
    if (bp.pc.objectif) {
      doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(90);
      const ob = doc.splitTextToSize("Objectif : " + bp.pc.objectif.replace(/\s+/g, " "), 165).slice(0, 4);
      doc.text(ob, 105, yy + 2, { align: "center" }); yy += 2 + ob.length * 4;
    }
    // encadrés de synthèse
    yy += 5;
    const cases = [["Note de fin de parcours", bp.note === null ? "—" : bp.note + " %", noteSur20(bp.note)], ["Exercices réalisés", `${bp.faits} / ${bp.total}`, ""], ["Période", fd(bp.debut), "au " + fd(bp.fin)], ["Durée cumulée", bp.duree ? fmtDuree(bp.duree) : "—", ""]];
    const w = 43.5;
    cases.forEach(([l, v, s], i) => {
      const x = 14 + i * (w + 2.7);
      doc.setDrawColor(200); doc.setFillColor(i === 0 ? 245 : 250, i === 0 ? 247 : 250, 250); doc.roundedRect(x, yy, w, 22, 2, 2, "FD");
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(110); doc.text(l.toUpperCase(), x + w / 2, yy + 5, { align: "center" });
      doc.setFont("helvetica", "bold"); doc.setFontSize(i === 2 ? 8.5 : 15); doc.setTextColor(i === 0 ? r : 30, i === 0 ? g : 30, i === 0 ? b : 30); doc.text(v, x + w / 2, yy + 13, { align: "center" });
      if (s) { doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(90); doc.text(s, x + w / 2, yy + 18.5, { align: "center" }); }
    });
    yy += 28;
    const dgl = bp.lignes.find((l) => l.dg && l.ok);
    if (dgl) { doc.setFont("helvetica", "italic"); doc.setFontSize(8.5); doc.setTextColor(90); doc.text(`Diagnostic initial : ${dgl.note === null ? dgl.detail : dgl.note + " %"} (${dgl.titre}) - présenté pour information, non comptabilisé dans la note de fin de parcours.`, 14, yy - 2, { maxWidth: 182 }); yy += 6; }
    const tab = (opts) => { autoTable(doc, { margin: { left: 14, right: 14 }, styles: { fontSize: 8.5, cellPadding: 1.8 }, headStyles: { fillColor: [r, g, b] }, ...opts }); yy = doc.lastAutoTable.finalY + 6; };
    tab({ startY: yy, head: [["N°", "Exercice", "Type", "Rubrique", "Date", "Résultat"]], body: bp.pc.items.map((d, i) => { const l = bp.lignes[i]; return [String(i + 1), l.titre, l.type, l.rubrique || "—", l.ok && l.date ? fmtLimite(l.date) : "—", l.ok ? (l.note === null ? l.detail : `${l.note} %  (${l.detail})`) + (l.dg ? " - non noté" : "") : "Non réalisé"]; }), columnStyles: { 0: { cellWidth: 9 }, 4: { cellWidth: 22 }, 5: { cellWidth: 38 } } });
    const th = [...bp.rubriques.map((x) => [x.nom, "Rubrique", `${x.n} exercice(s)`, x.pct === null ? "—" : x.pct + " %"]), ...bp.themes.map((x) => [x.nom, "Thème de quiz", `${x.ok}/${x.tot} point(s)`, x.pct === null ? "—" : x.pct + " %"])];
    if (th.length) tab({ startY: yy, head: [["Thèmes du parcours", "Origine", "Volume", "Résultat"]], body: th, columnStyles: { 3: { cellWidth: 24 } } });
    if (yy > 232) { doc.addPage(); doc.setDrawColor(r, g, b); doc.setLineWidth(1); doc.rect(7, 7, 196, 283); yy = 24; }
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60);
    doc.text(`Fait le ${fd(Date.now())}`, 14, yy + 4);
    doc.text(`Équipe : ${equipe || "—"}`, 14, yy + 9);
    doc.text("Le formateur :", 120, yy + 4); doc.setFont("helvetica", "bold"); doc.text(gest || "—", 120, yy + 9);
    doc.setDrawColor(150); doc.line(120, yy + 24, 190, yy + 24); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(120); doc.text("Signature et cachet", 120, yy + 28);
    const ref = `ATT-${(profil?.id || profil?.uid || "xxxxxx").slice(0, 6).toUpperCase()}-${bp.pc.id.slice(0, 6).toUpperCase()}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
    doc.setFontSize(7); doc.text("La note de fin de parcours est la moyenne des résultats obtenus à chaque exercice, hors diagnostic initial (meilleur essai pour les quiz, QCM et exercices de calcul ; questions essentielles pour les scénarios).", 14, 277, { maxWidth: 182 });
    doc.text(`Référence : ${ref}`, 14, 285);
  });
  doc.save(`${nomFichier}.pdf`);
}
export const slug = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\W+/g, "-").replace(/^-|-$/g, "").toLowerCase();
