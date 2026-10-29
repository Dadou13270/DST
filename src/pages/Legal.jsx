import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import { aCompleter, useLegal } from "../lib/legal";

// Page publique : politique de confidentialité (k = "confidentialite") ou mentions légales (k = "mentions").
export default function Legal({ k }) {
  const d = useLegal(k);
  const { isAdmin } = useAuth();
  return (
    <Layout>
      <div className="legal">
        {!d ? <p>Chargement…</p> : (
          <>
            <h1>{d.titre}</h1>
            <p className="muted">Dernière mise à jour : {d.maj}</p>
            {isAdmin && aCompleter(d) && <div className="card warn">Il reste des champs « [À compléter] » dans ce texte. <Link to="/admin/legal">Les renseigner</Link>.</div>}
            {d.sections.map((s, i) => <div className="card" key={i}><h2>{s.t}</h2><p style={{ whiteSpace: "pre-line" }}>{s.p}</p></div>)}
            <p>Une question ? <Link to="/contact">Contacte-nous</Link>.</p>
          </>
        )}
      </div>
    </Layout>
  );
}
