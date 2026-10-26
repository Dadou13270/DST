import { useRef, useState } from "react";

// Anti-robot sans service externe : champ piège invisible + délai minimum + petite question de calcul.
const tirer = () => ({ a: 2 + Math.floor(Math.random() * 8), b: 2 + Math.floor(Math.random() * 8), t: Date.now() });

export function useAntiRobot() {
  const [q, setQ] = useState(tirer);
  const [rep, setRep] = useState("");
  const piege = useRef(null);

  // Renvoie null si tout va bien, sinon le message à afficher.
  const verifier = () => {
    const ok = !piege.current?.value && Date.now() - q.t > 2500 && Number(rep) === q.a + q.b;
    if (ok) return null;
    setQ(tirer());
    setRep("");
    return "Vérification anti-robot incorrecte, réessaie.";
  };
  const renouveler = () => { setQ(tirer()); setRep(""); };

  const widget = (
    <div className="ar" style={{ margin: "8px 0" }}>
      <label>Anti-robot : combien font {q.a} + {q.b} ?</label>
      <input inputMode="numeric" autoComplete="off" maxLength={3} value={rep} onChange={(e) => setRep(e.target.value)} style={{ width: 90 }} required />
      <input ref={piege} tabIndex={-1} autoComplete="off" aria-hidden="true" name="site-web" style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }} />
    </div>
  );
  return { widget, verifier, renouveler };
}
