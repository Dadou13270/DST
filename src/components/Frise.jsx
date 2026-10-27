const COL = ["#c42a1c", "#1f6feb", "#2a9d5c", "#b7791f", "#7b3fb3", "#0e8f9a", "#d6336c", "#667"];
const mmss = (t) => String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
export const evTimes = (sc, sess) =>
  sess.evoT || Object.entries(sess.evo || {}).map(([id, ms]) => ({ titre: (sc.evolutions || []).find((e) => e.id === id)?.titre || sess.evoTitres?.[id] || "Évolution", t: Math.max(0, Math.round((ms - sess.start) / 1000)) }));

// Chronologie : quand chaque question a été posée et quand les évolutions sont tombées.
export default function Frise({ sc, sess, interName }) {
  const log = (sess.log || []).filter((l) => !l.sys && !l.rep && typeof l.t === "number");
  if (!log.length) return <div className="card"><h3 style={{ marginTop: 0 }}>Chronologie de l'exercice</h3><p className="muted">Pas de chronologie pour cet exercice (terminé avant l'ajout de cette fonction).</p></div>;
  const ev = evTimes(sc, sess).filter((e) => typeof e.t === "number");
  const ess = new Set((sc.qa || []).filter((x) => x.essentielle).map((x) => x.id));
  const D = Math.max(60, sess.finishedAt && sess.start ? Math.round((sess.finishedAt - sess.start) / 1000) : 0, ...log.map((l) => l.t), ...ev.map((e) => e.t)) + 10;
  const lanes = [...new Set(log.map((l) => l.who))];
  const W = 820, L = 130, R = 20, T = 34, H = T + lanes.length * 34 + 26;
  const X = (t) => L + ((W - L - R) * t) / D;
  const step = D > 1800 ? 600 : D > 900 ? 300 : D > 300 ? 120 : 60;
  const ticks = []; for (let t = 0; t <= D; t += step) ticks.push(t);
  const ts = log.map((l) => l.t).sort((a, b) => a - b);
  let gap = 0, ga = 0;
  for (let i = 1; i < ts.length; i++) if (ts[i] - ts[i - 1] > gap) { gap = ts[i] - ts[i - 1]; ga = ts[i - 1]; }
  const first = ev.length ? Math.min(...ev.map((e) => e.t)) : null;
  const late = first === null ? 0 : log.filter((l) => ess.has(l.qaId) && l.t > first).length;
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Chronologie de l'exercice</h3>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 640, width: "100%", color: "inherit" }} role="img" aria-label="Chronologie des questions et des évolutions">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={X(t)} x2={X(t)} y1={T - 6} y2={H - 20} stroke="currentColor" opacity=".12" />
              <text x={X(t)} y={H - 6} fontSize="11" textAnchor="middle" fill="currentColor" opacity=".7">{Math.round(t / 60)} min</text>
            </g>
          ))}
          {lanes.map((w, i) => (
            <g key={w}>
              <text x={L - 8} y={T + i * 34 + 20} fontSize="12" textAnchor="end" fill="currentColor">{interName(w).slice(0, 18)}</text>
              <line x1={L} x2={W - R} y1={T + i * 34 + 16} y2={T + i * 34 + 16} stroke="currentColor" opacity=".08" />
            </g>
          ))}
          {ev.map((e, k) => {
            const droite = X(e.t) > W * 0.65;
            return (
              <g key={k}>
                <line x1={X(e.t)} x2={X(e.t)} y1={T - 8} y2={H - 20} stroke="#c42a1c" strokeWidth="2" strokeDasharray="5 3"><title>{mmss(e.t) + " — " + e.titre}</title></line>
                <text x={X(e.t) + (droite ? -4 : 4)} y="12" fontSize="11" textAnchor={droite ? "end" : "start"} fill="#c42a1c">⚠ {(e.titre || "").slice(0, 26)}</text>
              </g>
            );
          })}
          {log.map((l, k) => {
            const i = lanes.indexOf(l.who), isE = ess.has(l.qaId);
            return (
              <circle key={k} cx={X(l.t)} cy={T + i * 34 + 16} r={isE ? 8 : 6} fill={COL[i % COL.length]} stroke={isE ? "currentColor" : "none"} strokeWidth="2.5">
                <title>{mmss(l.t) + " — " + l.question + " → " + (l.answer || "").slice(0, 120)}</title>
              </circle>
            );
          })}
        </svg>
      </div>
      <p className="muted" style={{ margin: "6px 0 0" }}>Pastille = question (contour épais = question essentielle) · ligne rouge = évolution · survole une pastille pour lire question et réponse.</p>
      <p className="muted" style={{ margin: "4px 0 0" }}>
        Première question à {mmss(ts[0])}{ts.length > 1 ? ` · plus long silence : ${mmss(gap)} (après ${mmss(ga)})` : ""}{late ? ` · ${late} question(s) essentielle(s) posée(s) après la 1re évolution` : ""}.
      </p>
    </div>
  );
}

// Frise générique : lanes [{id,label}], pts [{t,lane,col,title,big}], marks [{t,label,title}]
export function FriseSvg({ lanes, pts, marks = [], D }) {
  const W = 820, L = 130, R = 20, T = 34, H = T + lanes.length * 34 + 26;
  const X = (t) => L + ((W - L - R) * t) / D;
  const step = D > 3600 ? 1200 : D > 1800 ? 600 : D > 900 ? 300 : D > 300 ? 120 : 60;
  const ticks = []; for (let t = 0; t <= D; t += step) ticks.push(t);
  const li = Object.fromEntries(lanes.map((l, i) => [l.id, i]));
  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 640, width: "100%", color: "inherit" }} role="img" aria-label="Chronologie">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={X(t)} x2={X(t)} y1={T - 6} y2={H - 20} stroke="currentColor" opacity=".12" />
            <text x={X(t)} y={H - 6} fontSize="11" textAnchor="middle" fill="currentColor" opacity=".7">{Math.round(t / 60)} min</text>
          </g>
        ))}
        {lanes.map((l, i) => (
          <g key={l.id}>
            <text x={L - 8} y={T + i * 34 + 20} fontSize="12" textAnchor="end" fill="currentColor">{(l.label || "").slice(0, 18)}</text>
            <line x1={L} x2={W - R} y1={T + i * 34 + 16} y2={T + i * 34 + 16} stroke="currentColor" opacity=".08" />
          </g>
        ))}
        {marks.map((e, k) => {
          const d = X(e.t) > W * 0.65;
          return (
            <g key={k}>
              <line x1={X(e.t)} x2={X(e.t)} y1={T - 8} y2={H - 20} stroke="#c42a1c" strokeWidth="2" strokeDasharray="5 3"><title>{e.title}</title></line>
              <text x={X(e.t) + (d ? -4 : 4)} y="12" fontSize="11" textAnchor={d ? "end" : "start"} fill="#c42a1c">{e.label}</text>
            </g>
          );
        })}
        {pts.map((p, k) => (
          <circle key={k} cx={X(p.t)} cy={T + li[p.lane] * 34 + 16} r={p.big ? 8 : 6} fill={p.col} stroke={p.big ? "currentColor" : "none"} strokeWidth="2.5"><title>{p.title}</title></circle>
        ))}
      </svg>
    </div>
  );
}
export const FRISE_COL = COL;
export const frMmss = mmss;
