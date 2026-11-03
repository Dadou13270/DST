import { useEffect, useState } from "react";
import { getEquipe, statutDevoir } from "./devoirs";
import { idsEquipes } from "./equipes";

// Exercices imposés par les équipes du stagiaire (jusqu'à 4), avec leur statut.
export function useDevoirs(profil) {
  const [liste, setListe] = useState([]);
  const cle = idsEquipes(profil).join(",");
  useEffect(() => {
    const ids = idsEquipes(profil);
    if (!ids.length) { setListe([]); return; }
    const erreurs = [];
    Promise.all(ids.map((id) => getEquipe(id).catch((e) => { erreurs.push(e.code || e.message || "erreur"); return null; })))
      .then((ts) => {
        const multi = ts.filter(Boolean).length > 1, m = [];
        ts.filter(Boolean).forEach((t) => (t.devoirs || []).forEach((d) => {
          m.push({ ...d, pc: d.pc && multi ? t.id + "~" + d.pc : d.pc, eq: t.nom, gest: multi ? t.ownerNom : undefined, multi, key: t.id + "|" + d.scId + "|" + (d.pc || ""), statut: statutDevoir(d, profil.bilans, Date.now(), profil.calculs) });
        }));
        const l = m.sort((a, b) => (a.limite || 0) - (b.limite || 0));
        l.erreurs = erreurs; setListe(l);
      })
      .catch(() => setListe([]));
  }, [cle, profil?.bilans, profil?.calculs]); // eslint-disable-line
  return liste;
}
