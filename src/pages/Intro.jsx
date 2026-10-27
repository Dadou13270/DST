import Logo from "../components/Logo";

export default function Intro({ onEnter }) {
  return (
    <div className="intro-page">
      <Logo size={120} />
      <h1>OPS Training</h1>
      <p className="sub">Simulateur opérationnel collaboratif</p>
      <button className="btn primary big" onClick={onEnter} autoFocus>Entrer</button>
      <small className="muted">© {new Date().getFullYear()} OPS Training</small>
    </div>
  );
}
