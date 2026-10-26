import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { CGU, CGU_MAJ } from "../lib/cgu";

export default function Cgu() {
  return (
    <Layout>
      <h1>Conditions générales d'utilisation</h1>
      <p className="muted">Dernière mise à jour : {CGU_MAJ}</p>
      {CGU.map(([t, p]) => (
        <div className="card" style={{ maxWidth: 820 }} key={t}>
          <h2>{t}</h2>
          <p>{p}</p>
        </div>
      ))}
      <p>Une question ? <Link to="/contact">Contacte-nous</Link>.</p>
    </Layout>
  );
}
