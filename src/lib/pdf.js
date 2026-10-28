import { fmtDate, fmtDuree, statsOf } from "./users";

const dateJour = () => new Date().toLocaleDateString("fr-FR", { dateStyle: "long" });

async function nouveau(titre, sousTitre) {
  const { jsPDF } = await import("jspdf");
  const at = await import("jspdf-autotable");
  const autoTable = [at.default, at.default?.default, at.autoTable].find((f) => typeof f === "function");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFillColor(196, 42, 28); doc.rect(0, 0, 210, 18, "F");
  doc.setTextColor(255); doc.setFontSize(14); doc.text("OPS Training", 14, 12);
  doc.setTextColor(30); doc.setFontSize(16); doc.text(titre, 14, 30);
  doc.setFontSize(10); doc.setTextColor(100); doc.text(`${sousTitre} · édité le ${dateJour()}`, 14, 37);
  doc.setTextColor(30);
  return { doc, table: (opts) => autoTable(doc, { styles: { fontSize: 9 }, headStyles: { fillColor: [196, 42, 28] }, ...opts }) };
}
const y = (doc, d = 8) => (doc.lastAutoTable?.finalY || 40) + d;
const piedPages = (doc) => {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(120); doc.text(`Page ${i}/${n}`, 196, 290, { align: "right" }); }
};
const lignesBilans = (bilans) =>
  Object.values(bilans || {}).map((b) => [b.titre, fmtDate(b.fin), fmtDuree(b.duree || 0), String(b.nbQ), b.essTot ? `${b.essOk}/${b.essTot}` : "—", String(b.nb || 1)]);
const ENTETE = [["Exercice", "Fin", "Temps", "Questions", "Essentielles", "Tent."]];

export async function pdfSuivi(profil, bilans, equipe) {
  const { doc, table } = await nouveau("Suivi de formation", profil?.nom || "Stagiaire");
  const st = statsOf(bilans);
  const info = [["Nom", profil?.nom || "—"], ["Grade", profil?.grade || "—"], ["CIS", profil?.cis || "—"], ["Département", profil?.departement || "—"], ["Équipe", equipe || "—"],
    ["Exercices terminés", String(st.n)], ["Temps moyen", st.n ? fmtDuree(st.tmoy) : "—"], ["Questions essentielles", st.ess === null ? "—" : st.ess + " %"]];
  table({ startY: 42, body: info, theme: "plain", columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } } });
  table({ startY: y(doc), head: ENTETE, body: lignesBilans(bilans) });
  const com = Object.entries(profil?.commentaires || {});
  if (com.length) table({ startY: y(doc, 10), head: [["Exercice", "Commentaire du formateur"]], body: com.map(([id, c]) => [bilans?.[id]?.titre || id, `${c.texte}\n(${c.auteur}, ${fmtDate(c.le)})`]), columnStyles: { 0: { cellWidth: 50 } } });
  piedPages(doc);
  doc.save(`suivi-${(profil?.nom || "stagiaire").replace(/\W+/g, "-")}.pdf`);
}

export async function pdfEquipe(team, membres) {
  const { doc, table } = await nouveau(`Équipe : ${team.nom}`, `Gestionnaire : ${team.ownerNom || "—"}`);
  table({
    startY: 42,
    head: [["Stagiaire", "Grade", "CIS", "Terminés", "Temps moyen", "Essentielles"]],
    body: membres.map((u) => { const st = statsOf(u.bilans); return [u.nom, u.grade || "—", u.cis || "—", String(st.n), st.n ? fmtDuree(st.tmoy) : "—", st.ess === null ? "—" : st.ess + " %"]; }),
  });
  if ((team.devoirs || []).length) {
    const now = Date.now();
    table({
      startY: y(doc, 10),
      head: [["Exercice à rendre", "Échéance", "Rendus", "En retard"]],
      body: team.devoirs.map((d) => {
        const ok = membres.filter((u) => (u.bilans || {})[d.scId]).length;
        const retard = membres.filter((u) => !(u.bilans || {})[d.scId] && d.limite && d.limite < now).length;
        return [d.titre, d.limite ? new Date(d.limite).toLocaleDateString("fr-FR") : "—", `${ok}/${membres.length}`, String(retard)];
      }),
    });
  }
  for (const u of membres) {
    doc.setFontSize(11); doc.setTextColor(30);
    let top = y(doc, 12); if (top > 260) { doc.addPage(); top = 20; }
    doc.text(u.nom || "—", 14, top);
    table({ startY: top + 3, head: ENTETE, body: lignesBilans(u.bilans).length ? lignesBilans(u.bilans) : [["Aucun exercice terminé", "", "", "", "", ""]] });
  }
  piedPages(doc);
  doc.save(`equipe-${team.nom.replace(/\W+/g, "-")}.pdf`);
}

const hm = (t) => (t ? new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "—");
export async function pdfSeance(s) {
  const { doc, table } = await nouveau(`Bilan de séance : ${s.titre || "—"}`, `Formateur : ${s.ownerNom || "—"} · salle ${s.code}`);
  const quand = s.debut ? new Date(s.debut).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }) : s.creeLe ? new Date(s.creeLe).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }) : "—";
  table({ startY: 42, theme: "plain", columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } }, body: [
    ["Date", quand], ["Stagiaires", String((s.stagiaires || []).length)], ["Questions posées", String((s.questions || []).length)],
    ["Questions essentielles", s.essTot ? `${s.essOk}/${s.essTot}` : "—"], ["Évolutions transmises", String((s.evolutions || []).length)],
  ] });
  table({ startY: y(doc), head: [["Stagiaire", "Questions posées"]], body: (s.stagiaires || []).map((u) => [u.nom, String(u.nbQ)]) });
  if ((s.essManquantes || []).length) table({ startY: y(doc, 10), head: [["Questions essentielles non posées"]], body: s.essManquantes.map((x) => [x]) });
  if ((s.evolutions || []).length)
    table({ startY: y(doc, 10), head: [["Heure", "Évolution", "Reçue", "Comprise", "En attente"]],
      body: s.evolutions.map((e) => [hm(e.le), e.titre + (e.texte ? "\n" + e.texte : ""), `${e.recu}/${e.dest}`, `${e.comp}/${e.dest}`, (e.attente || []).join(", ") || "—"]) });
  if ((s.consignes || []).length)
    table({ startY: y(doc, 10), head: [["Consigne", "Stagiaire", "Réponse"]],
      body: s.consignes.flatMap((c) => (s.stagiaires || []).map((u) => [c, u.nom, (u.taches || []).find((t) => t.titre === c)?.texte || "— pas de réponse"])) });
  if ((s.questions || []).length)
    table({ startY: y(doc, 10), head: [["Heure", "Stagiaire", "Interlocuteur", "Question", "Réponse"]],
      body: s.questions.map((q) => [hm(q.le), q.nom, q.who, (q.ess ? "★ " : "") + q.q, q.a]), columnStyles: { 3: { cellWidth: 50 }, 4: { cellWidth: 55 } } });
  piedPages(doc);
  doc.save(`seance-${s.code}.pdf`);
}
