import { CATS, useBanque } from "../lib/banque";

// Liste déroulante « Insérer un commentaire type » : renvoie le texte choisi (à ajouter ou à utiliser).
export default function BanqueSelect({ cat, onPick, libelle }) {
  const l = useBanque().filter((x) => x.cat === cat);
  if (!l.length) return null;
  return (
    <select value="" aria-label={libelle || CATS[cat]} onChange={(e) => { if (e.target.value !== "") onPick(l[Number(e.target.value)].t); }} style={{ marginBottom: 4, maxWidth: "100%" }}>
      <option value="">{libelle || "Insérer un commentaire type…"}</option>
      {l.map((x, i) => <option key={i} value={i}>{x.t.length > 90 ? x.t.slice(0, 88) + "…" : x.t}</option>)}
    </select>
  );
}
