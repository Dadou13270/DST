// Logo OPS Training : plan de table quadrillé avec flamme.
export default function Logo({ size = 96 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" role="img" aria-label="Logo OPS Training">
      <rect x="6" y="14" width="84" height="68" rx="12" fill="#c42a1c" stroke="#fff" strokeWidth="4"/>
      <path d="M34 14v68M62 14v68M6 37h84M6 59h84" stroke="#fff" strokeOpacity=".3" strokeWidth="2"/>
      <g transform="translate(13.4 15.6) scale(.72)"><path d="M48 10C52 25 71 33 71 57A23 23 0 0 1 25 57C25 46 31 40 36 33C37 40 40 43 43 44C42 31 44 21 48 10Z" fill="#fff"/>
      <path d="M48 40C50 48 58 52 58 61A10 10 0 0 1 38 61C38 56 41 53 43 50C44 53 45 54 46 54C46 48 46 44 48 40Z" fill="#c42a1c"/></g>
    </svg>
  );
}
