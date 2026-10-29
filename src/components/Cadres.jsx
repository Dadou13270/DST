// Cadre d'emploi visé par un exercice (cases à cocher dans les éditeurs, petits badges sous l'image des cartes).
export const CADRES = [
  { k: "cae", l: "Chef d'agrès une équipe", c: "CA 1 équipe" },
  { k: "cate", l: "Chef d'agrès tout engin", c: "CA tout engin" },
  { k: "cg", l: "Chef de groupe", c: "Chef de groupe" },
];

export function CadresEdit({ value, onChange }) {
  const v = value || [];
  const bascule = (k) => onChange(v.includes(k) ? v.filter((x) => x !== k) : CADRES.map((c) => c.k).filter((x) => x === k || v.includes(x)));
  return (
    <div className="cadres-ed">
      <label>Cadre d'emploi</label>
      <div className="row">
        {CADRES.map((c) => (
          <label className="ck" key={c.k}><input type="checkbox" checked={v.includes(c.k)} onChange={() => bascule(c.k)} /> {c.l}</label>
        ))}
      </div>
    </div>
  );
}

export function CadresBadges({ v }) {
  const l = CADRES.filter((c) => (v || []).includes(c.k));
  if (!l.length) return null;
  return <div className="cadres-bd" title="Cadre d'emploi">{l.map((c) => <span key={c.k} className="cdr">{c.c}</span>)}</div>;
}
