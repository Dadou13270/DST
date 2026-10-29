import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { watchSite, CONFIG_DEFAUT, SECTIONS_DEFAUT } from "../lib/site";
import { watchNouveautes, NOUVEAUTES_INIT } from "../lib/nouveautes";

const fmtJ = (d) => (d || "").split("-").reverse().join("/");
// Dernières nouveautés : celles de la base (si lisibles) complétées par la liste d'origine, sans doublon
const fusion = (l) => {
  const vus = new Set(), out = [];
  [...(l || []), ...NOUVEAUTES_INIT].forEach((n) => { const k = n.d + "|" + n.t; if (!vus.has(k)) { vus.add(k); out.push(n); } });
  return out.sort((a, b) => (b.d || "").localeCompare(a.d || "")).slice(0, 6);
};
const Para = ({ t }) => String(t || "").split(/\n\n+/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>);

export default function Site() {
  const [d, setD] = useState(null);
  const [menu, setMenu] = useState(false);
  const [nv, setNv] = useState([]);
  useEffect(() => watchSite(setD), []);
  useEffect(() => { try { return watchNouveautes(setNv); } catch { return undefined; } }, []);
  useEffect(() => { document.title = "OPS Training — Simulateur opérationnel pour sapeurs-pompiers"; }, []);
  if (!d) return <div className="vit"><p className="vit-load">Chargement…</p></div>;
  const cfg = { ...CONFIG_DEFAUT, ...(d.config || {}) };
  const base = d.vide || d.erreur ? SECTIONS_DEFAUT : d.sections;
  // la section « Nouveautés » est ajoutée d'office si le site enregistré n'en contient pas
  const secs = base.some((s) => s.type === "nouveautes") ? base : [...base, SECTIONS_DEFAUT.find((s) => s.type === "nouveautes")];
  return (
    <div className="vit">
      <header className="vit-top">
        <a href="#haut" className="vit-brand"><Logo size={34} /><b>{cfg.nom}</b></a>
        <button className="vit-burger" onClick={() => setMenu(!menu)} aria-label="Menu">☰</button>
        <nav className={menu ? "open" : ""} onClick={() => setMenu(false)}>
          {secs.filter((s) => s.menu).map((s) => <a key={s.id} href={"#" + s.id}>{s.menu}</a>)}
          {cfg.contact && <a href="#contact">Contact</a>}
          <Link className="vit-btn pri" to={cfg.ctaLien || "/"}>{cfg.cta}</Link>
        </nav>
      </header>
      <section className="vit-hero" id="haut">
        <div className="vit-hero-in">
          <div>
            <h1>{cfg.accroche}</h1>
            <p className="vit-lead">{cfg.sousTitre}</p>
            <div className="vit-cta">
              <Link className="vit-btn pri lg" to={cfg.ctaLien || "/"}>{cfg.cta}</Link>
              {cfg.cta2 && secs[0] && <a className="vit-btn ghost lg" href={"#" + secs[0].id}>{cfg.cta2}</a>}
            </div>
          </div>
          {cfg.heroImage ? <img className="vit-hero-img" src={cfg.heroImage} alt="" /> : <div className="vit-hero-img vit-ph" aria-hidden="true"><Logo size={140} /></div>}
        </div>
      </section>
      {secs.map((s, i) => (
        <section key={s.id} id={s.id} className={"vit-sec" + (i % 2 ? " alt" : "")}>
          <div className="vit-wrap">
            {s.type === "nouveautes" ? (
              <>
                <div className="vit-head"><h2>{s.titre}</h2>{s.texte && <p className="vit-lead">{s.texte}</p>}</div>
                <div className="vit-news">
                  {fusion(nv).map((n, k) => (
                    <article key={k}><time>{fmtJ(n.d)}</time><h3>{n.t}</h3><ul>{(Array.isArray(n.l) ? n.l : []).map((x, j) => <li key={j}>{x}</li>)}</ul></article>
                  ))}
                </div>
                <p style={{ marginTop: 22 }}><Link className="vit-btn ghost" to="/nouveautes">Toutes les nouveautés</Link></p>
              </>
            ) : s.type === "texte-image" ? (
              <div className={"vit-split" + (s.image && i % 2 ? " rev" : "")}>
                <div><h2>{s.titre}</h2><Para t={s.texte} /></div>
                {s.image && <img src={s.image} alt={s.titre} />}
              </div>
            ) : (
              <>
                <div className="vit-head"><h2>{s.titre}</h2>{s.texte && <p className="vit-lead">{s.texte}</p>}</div>
                {s.image && <img className="vit-banner" src={s.image} alt={s.titre} />}
                {s.type === "etapes" ? (
                  <ol className="vit-steps">{(s.items || []).map((it, k) => <li key={k}><span>{k + 1}</span><h3>{it.titre}</h3><p>{it.texte}</p></li>)}</ol>
                ) : (
                  <div className="vit-cards">{(s.items || []).map((it, k) => <article key={k}><i>{String(k + 1).padStart(2, "0")}</i><h3>{it.titre}</h3><p>{it.texte}</p></article>)}</div>
                )}
              </>
            )}
          </div>
        </section>
      ))}
      <section className="vit-final">
        <h2>Prêt à vous entraîner ?</h2>
        <Link className="vit-btn pri lg" to={cfg.ctaLien || "/"}>{cfg.cta}</Link>
        {cfg.contact && <p id="contact">Contact : <a href={"mailto:" + cfg.contact}>{cfg.contact}</a></p>}
      </section>
      <footer className="vit-foot">
        <span>© {new Date().getFullYear()} {cfg.nom}</span>
        <span>{cfg.pied}</span>
        <span><Link to="/cgu">CGU</Link> · <Link to="/a-propos">À propos</Link></span>
      </footer>
    </div>
  );
}
