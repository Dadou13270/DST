export const DOMS = ["Reconnaissance cubique", "Positionnement échelle", "Sauvetage", "Risque d'explosion", "Risque d'effondrement", "TMD", "Milieu industriel", "Hydrocarbures", "Risque électrique", "Fumées / désenfumage", "ERP / évacuation", "Lever de doute", "Véhicule", "Victimes multiples", "Commandement"];

// Badges des dominantes d'un scénario (aident le stagiaire à choisir)
export default function Dominantes({ s, evo }) {
  const l = s.dominantes || [];
  const e = evo && s.evolutif;
  if (!l.length && !e) return null;
  return <div style={{ marginTop: 6 }}>{e && <span className="tag evo" style={{ marginRight: 4 }}>Évolutif</span>}{l.map((d) => <span key={d} className="tag dom" style={{ marginRight: 4 }}>{d}</span>)}</div>;
}
