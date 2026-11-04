import Logo from "../components/Logo";
import { useCharte } from "../lib/charte";

export default function Intro({ onEnter }) {
  const c = useCharte();
  return (
    <div className="ip">
      <header className="ip-hero">
        <Logo size={104} />
        <h1>{c.nom}</h1>
        <p>{c.slogan}</p>
        <button className="btn primary big" onClick={onEnter} autoFocus>Entrer</button>
      </header>
      <section className="ip-sec">
        <div className="ip-cards ip-mini">
        <div className="ip-c"><span aria-hidden="true">📷</span><h3>Scénarios sur photos</h3></div>
        <div className="ip-c"><span aria-hidden="true">🧠</span><h3>Quiz et décisions</h3></div>
        <div className="ip-c"><span aria-hidden="true">🎭</span><h3>Jeu de rôle en salle</h3></div>
        <div className="ip-c"><span aria-hidden="true">🎥</span><h3>Webinaires en direct</h3></div>
        <div className="ip-c"><span aria-hidden="true">📈</span><h3>Parcours et suivi</h3></div>
        <div className="ip-c"><span aria-hidden="true">💬</span><h3>Forum et jeu</h3></div>
        </div>
      </section>
      <div className="ip-end"><small>© {new Date().getFullYear()} {c.nom}</small></div>
    </div>
  );
}
