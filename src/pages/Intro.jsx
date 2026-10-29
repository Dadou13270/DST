import Logo from "../components/Logo";
import { useCharte } from "../lib/charte";

export default function Intro({ onEnter }) {
  const c = useCharte();
  return (
    <div className="intro-page">
      <Logo size={120} />
      <h1>{c.nom}</h1>
      <p className="sub">{c.slogan}</p>
      <button className="btn primary big" onClick={onEnter} autoFocus>Entrer</button>
      <small className="muted">© {new Date().getFullYear()} {c.nom}</small>
    </div>
  );
}
