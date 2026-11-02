// Objectifs intermédiaires d'un parcours (« marches ») avec progression d'après les exercices rattachés.
export default function ObjectifsPc({ items }) {
  const pcI = (items.find((d) => d.pcI) || {}).pcI || [];
  if (!pcI.length) return null;
  let courant = -1;
  const etat = pcI.map((o, k) => {
    const l = items.filter((d) => d.oi === k), ok = l.filter((d) => d.statut === "ok").length;
    const fini = l.length > 0 && ok === l.length;
    if (l.length && !fini && courant < 0) courant = k;
    return { o, k, n: l.length, ok, fini };
  });
  return (
    <div className="refdoc">
      <strong>Objectifs intermédiaires :</strong>
      <ol style={{ margin: "2px 0 0", paddingLeft: 20 }}>
        {etat.map((x) => (
          <li key={x.k} style={{ opacity: x.fini ? 0.7 : 1, fontWeight: x.k === courant ? 700 : 400 }}>
            {x.o}{" "}
            {x.n > 0 && <span className={x.fini ? "tag ok" : "tag"}>{x.fini ? "✔ atteint" : `${x.ok}/${x.n}`}</span>}
            {x.k === courant && <> <span className="tag">En cours</span></>}
          </li>
        ))}
      </ol>
    </div>
  );
}
