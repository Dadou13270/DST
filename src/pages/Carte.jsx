import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { inscritsParDept } from "../lib/inscrits";
import { DEPARTEMENTS } from "../lib/referentiels";
import FRM from "../lib/frmap.json";

export default function Carte() {
  const [data, setData] = useState(null);
  const [sel, setSel] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => { inscritsParDept().then(setData).catch((e) => setErr(e.message)); }, []);

  const metro = new Set(FRM.d.map((x) => x[0]));
  const nom = (c) => FRM.d.find((x) => x[0] === c)?.[1] || DEPARTEMENTS.find((d) => d.split(" ")[0] === c)?.slice(c.length + 1) || c || "Non renseigné";
  const cnt = data?.cnt || {};
  const max = Math.max(1, ...Object.values(cnt));
  const rows = Object.entries(cnt).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const k = (c) => cnt[c] || 0;

  return (
    <Layout>
      <h1>Carte des inscrits</h1>
      {err && <p className="err">{err}</p>}
      {!data && !err && <p className="muted">Chargement…</p>}
      {data && (
        <>
          <p className="muted">{data.total} inscrit{data.total > 1 ? "s" : ""} · {data.online} connecté{data.online > 1 ? "s" : ""}. Département renseigné dans Mon profil.</p>
          <div className="card">
            <svg className="fmap" viewBox={FRM.vb} role="img" aria-label="Carte de France des inscrits par département">
              {FRM.d.map(([c, n, p]) => (
                <path
                  key={c}
                  d={p}
                  className={sel === c ? "sel" : ""}
                  style={{ fill: k(c) ? `color-mix(in srgb, var(--red) ${Math.round(25 + (75 * k(c)) / max)}%, var(--card, #fff))` : "var(--soft)" }}
                  onClick={() => setSel(sel === c ? "" : c)}
                >
                  <title>{`${c} ${n} : ${k(c)} inscrit${k(c) > 1 ? "s" : ""}`}</title>
                </path>
              ))}
            </svg>
            <p><strong>{sel ? `${sel} ${nom(sel)} : ${k(sel)} inscrit${k(sel) > 1 ? "s" : ""}` : "Touche un département pour voir le détail."}</strong></p>
          </div>
          <div className="card">
            <h3>Par département</h3>
            <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
              {rows.map(([c, n]) => <span className="tag" key={c || "x"}>{c ? `${c} ${nom(c)}` : "Non renseigné"} : {n}</span>)}
            </div>
            {rows.some(([c]) => c && !metro.has(c)) && <p className="muted">Les départements d'outre-mer ne figurent pas sur la carte mais sont comptés ci-dessus.</p>}
          </div>
          <p className="muted" style={{ fontSize: ".8rem" }}>Fond de carte : « France departments » (@svg-maps, Victor Cazanave), licence CC BY 4.0.</p>
        </>
      )}
    </Layout>
  );
}
