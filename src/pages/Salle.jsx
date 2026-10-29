import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import SalleChat from "../components/SalleChat";
import FicheEval from "../components/FicheEval";
import { FriseSvg, FRISE_COL, frMmss } from "../components/Frise";
import { useAuth } from "../lib/auth";
import { getScenario } from "../lib/db";
import { archiverSalle } from "../lib/seances";
import { watchSalle, watchQuestions, watchParticipants, watchMessages, envoyerEvenement, setChrono, chronoReste, setOuverte, supprimerSalle, setTaches, TACHES_MODELES, etatSalle, libEtat, fmtDebut, setDebut, debutDepuisInput, inputDepuisDebut } from "../lib/salles";

const hhmm = (t) => new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

// Tableau de bord du formateur : participants, couverture des questions essentielles, flux en direct
// Chrono commun de la séance (affiché chez tous les stagiaires)
function ChronoCard({ code, chrono, duree, act }) {
  const [now, setNow] = useState(Date.now());
  const [min, setMin] = useState(duree || 15);
  const [conf, setConf] = useState(false);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!chrono)
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Chrono de la séance</h3>
        <p className="muted" style={{ margin: "0 0 6px" }}>Un chrono commun, affiché chez tous les stagiaires. À la fin du temps, vous pouvez terminer l'exercice pour tous.</p>
        <div className="row">
          <input type="number" min={1} max={240} value={min} onChange={(e) => setMin(e.target.value)} style={{ width: 90 }} /> <span className="muted">minutes</span>
          <button className="btn primary" onClick={act(() => setChrono(code, { duree: Math.max(1, Math.min(240, Number(min) || 15)) * 60, t0: Date.now(), pausedAt: null, fin: null }))}>Démarrer le chrono</button>
        </div>
      </div>
    );
  const rem = chronoReste(chrono, now);
  const cls = rem < 0 ? " late" : rem <= Math.max(30, chrono.duree * 0.1) ? " danger" : rem <= Math.max(60, chrono.duree * 0.25) ? " warn" : "";
  const fmt = (s) => `${s < 0 ? "-" : ""}${String(Math.floor(Math.abs(s) / 60)).padStart(2, "0")}:${String(Math.abs(s) % 60).padStart(2, "0")}`;
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Chrono de la séance</h3>
      <div className="row between">
        <span className={"timer" + cls}>{chrono.fin ? "■ " : chrono.pausedAt ? "⏸ " : ""}{fmt(rem)}</span>
        <div className="row">
          {chrono.fin ? <span className="tag">Terminé pour tous</span> : (
            <>
              {chrono.pausedAt
                ? <button className="btn primary" onClick={act(() => setChrono(code, { ...chrono, t0: chrono.t0 + (Date.now() - chrono.pausedAt), pausedAt: null }))}>▶ Reprendre</button>
                : <button className="btn" onClick={act(() => setChrono(code, { ...chrono, pausedAt: Date.now() }))}>⏸ Pause</button>}
              <button className="btn" onClick={act(() => setChrono(code, { ...chrono, duree: chrono.duree + 300 }))}>+ 5 min</button>
              {conf
                ? <button className="btn danger" onClick={act(async () => { await setChrono(code, { ...chrono, pausedAt: null, fin: Date.now() }); setConf(false); })}>Confirmer : terminer pour tous</button>
                : <button className="btn danger" onClick={() => setConf(true)}>Terminer pour tous</button>}
            </>
          )}
          <button className="btn" onClick={act(() => setChrono(code, null))}>Réinitialiser</button>
        </div>
      </div>
    </div>
  );
}

export default function Salle() {
  const { code } = useParams();
  const { user, isAdmin, profil } = useAuth();
  const nav = useNavigate();
  const [salle, setSalle] = useState(undefined);
  const [qs, setQs] = useState([]);
  const [ps, setPs] = useState([]);
  const [sc, setSc] = useState(null);
  const [filt, setFilt] = useState("all");
  const [conf, setConf] = useState(false);
  const [err, setErr] = useState("");
  const [deb, setDeb] = useState(null);
  const [evts, setEvts] = useState([]);
  const [feT, setFeT] = useState("");
  const [feM, setFeM] = useState("");
  const [feC, setFeC] = useState("all");
  const [repId, setRepId] = useState(null);
  const [repT, setRepT] = useState("");
  const [feTache, setFeTache] = useState("");
  const [codeGrand, setCodeGrand] = useState(false);
  const [arch, setArch] = useState(false);
  const [fiche, setFiche] = useState("");
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 15000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const u = [watchSalle(code, setSalle), watchQuestions(code, setQs), watchParticipants(code, setPs), watchMessages(code, (l) => setEvts(l.filter((m) => m.kind)))];
    return () => u.forEach((f) => f && f());
  }, [code]);
  useEffect(() => { if (salle?.scId) getScenario(salle.scId).then(setSc).catch(() => {}); }, [salle?.scId]);

  if (!user) return null;
  if (!isAdmin && !profil?.gestionnaire) return <Navigate to="/" replace />;
  if (salle === undefined) return <Layout><p>Chargement…</p></Layout>;
  if (!salle) return <Layout><h1>Séance en salle</h1><div className="card">Salle introuvable ou supprimée.</div><Link className="btn" to="/gestion">Retour</Link></Layout>;

  const ess = (sc?.qa || []).filter((x) => x.essentielle);
  const esId = new Set(ess.map((x) => x.id));
  const qui = (x) => new Set(qs.filter((q) => q.qaId === x.id).map((q) => q.uid)).size;
  const faites = ess.filter((x) => qui(x) > 0).length;
  const feed = qs.filter((x) => filt === "all" || x.uid === filt);
  const interNom = (id) => (sc?.interlocuteurs || []).find((i) => i.id === id)?.nom || "";
  const ferme = salle.ouverte === false;
  const compact = etatSalle(salle) === "open" && (ps.length > 0 || !!salle.chrono) && !codeGrand;
  const prevues = (sc?.evolutions || []).slice().sort((a, b) => (Number(a.delai) || 0) - (Number(b.delai) || 0));
  const envoyer = (d) => envoyerEvenement(code, user.uid, profil?.nom || "Formateur", { kind: "evo", texte: "", ...d });
  const taches = salle.taches || [];
  const cocher = (t) => setTaches(code, taches.some((x) => x.id === t.id) ? taches.filter((x) => x.id !== t.id) : [...taches, t]);
  const act = (f) => async () => { setErr(""); try { await f(); } catch (e) { setErr(e.message); } };

  return (
    <Layout wide>
      <div className="row between">
        <h1>Séance en salle</h1>
        <div className="row">
          <Link className="btn" to={`/gestion/salle/${code}/projection`} target="_blank">Projeter</Link>
          <button className="btn" onClick={act(async () => { await archiverSalle(code); setErr(""); setArch(true); setTimeout(() => setArch(false), 3000); })}>{arch ? "Bilan archivé ✓" : "Archiver le bilan"}</button>
          <button className="btn" onClick={act(() => setOuverte(code, ferme))}>{ferme ? "Rouvrir" : "Clôturer"}</button>
          {conf
            ? <button className="btn danger" onClick={act(async () => { await supprimerSalle(code); nav("/gestion"); })}>Confirmer la suppression</button>
            : <button className="btn danger" onClick={() => setConf(true)}>Supprimer</button>}
          <Link className="btn" to="/gestion">Retour</Link>
        </div>
      </div>
      {err && <div className="card warn">Erreur : {err}</div>}
      {compact ? (
        <div className="card row between" style={{ padding: "8px 14px" }}>
          <span><span className="muted">Salle</span> <strong style={{ fontSize: "1.5rem", letterSpacing: ".2em" }}>{salle.code}</strong> · <strong>{salle.titre}</strong> <span className="tag ok">{libEtat[etatSalle(salle)]}</span></span>
          <span className="row"><span className="muted">{ps.length} stagiaire(s) · {qs.length} question(s)</span><button className="btn" onClick={() => setCodeGrand(true)}>Agrandir le code</button></span>
        </div>
      ) : (
      <div className="card" style={{ textAlign: "center" }}>
        {codeGrand && etatSalle(salle) === "open" && <div className="row" style={{ justifyContent: "flex-end" }}><button className="btn" onClick={() => setCodeGrand(false)}>Réduire</button></div>}
        <div className="muted">Code de la salle</div>
        <div style={{ fontSize: "3.2rem", fontWeight: 800, letterSpacing: ".3em" }}>{salle.code}</div>
        <div><strong>{salle.titre}</strong> <span className={etatSalle(salle) === "open" ? "tag ok" : "tag"}>{libEtat[etatSalle(salle)]}</span></div>
        {salle.debut && <p style={{ margin: "6px 0 0" }}>Début : <strong>{fmtDebut(salle.debut)}</strong>{etatSalle(salle) === "plan" && " — les stagiaires pourront rejoindre à partir de cette heure."}</p>}
        <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
          <input type="datetime-local" value={deb ?? inputDepuisDebut(salle.debut)} onChange={(e) => setDeb(e.target.value)} />
          <button className="btn" onClick={act(async () => { await setDebut(code, debutDepuisInput(deb ?? inputDepuisDebut(salle.debut))); setDeb(null); })}>Reprogrammer</button>
          {etatSalle(salle) === "plan" && <button className="btn primary" onClick={act(() => setDebut(code, Date.now()))}>Ouvrir maintenant</button>}
        </div>
        <p className="muted" style={{ margin: "6px 0 0" }}>{ps.length} stagiaire(s) connecté(s) · {qs.length} question(s) posée(s)</p>
      </div>
      )}
      <div className="sgrid"><div className="scol">
      <ChronoCard code={code} chrono={salle.chrono} duree={sc?.duree} act={act} />
      <SalleChat code={code} role="formateur" />
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Faire évoluer la séance</h3>
        {prevues.length === 0 ? <p className="muted" style={{ margin: "0 0 6px" }}>Aucune évolution prévue dans ce scénario.</p> : (
          <>
            <p className="muted" style={{ margin: "0 0 6px" }}>Évolutions prévues (elles tombent aussi seules à l'heure prévue) :</p>
            {prevues.map((e) => (
              <div key={e.id} className="row between" style={{ margin: "4px 0" }}>
                <span><strong>{e.titre || "Évolution"}</strong> <span className="muted">T+{Number(e.delai) || 0} min</span></span>
                {evts.some((m) => m.evoId === e.id) ? <span className="tag ok">Envoyée</span> : <button className="btn" onClick={act(() => envoyer({ evoId: e.id, cible: "all" }))}>Déclencher maintenant</button>}
              </div>
            ))}
          </>
        )}
        <div style={{ borderTop: "1px solid var(--line, #ddd)", marginTop: 8, paddingTop: 8 }}>
          <strong>Message d'évolution libre</strong>
          <input maxLength={80} placeholder="Titre (ex. Le vent tourne)" value={feT} onChange={(e) => setFeT(e.target.value)} style={{ width: "100%", margin: "6px 0" }} />
          <textarea rows={2} maxLength={400} placeholder="Message affiché en bandeau aux stagiaires…" value={feM} onChange={(e) => setFeM(e.target.value)} style={{ width: "100%" }} />
          <div className="row" style={{ marginTop: 6 }}>
            <select value={feC} onChange={(e) => setFeC(e.target.value)}>
              <option value="all">À toute la salle</option>
              {ps.map((u) => <option key={u.uid || u.id} value={u.uid || u.id}>{u.nom || "Stagiaire"}</option>)}
            </select>
            <button className="btn primary" disabled={!feT.trim() && !feM.trim()} onClick={act(async () => { await envoyer({ cible: feC, titre: feT.trim().slice(0, 80), texte: feM.trim().slice(0, 400) }); setFeT(""); setFeM(""); })}>Envoyer l'évolution</button>
          </div>
        </div>
      </div>
      </div><div className="scol">
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Consignes aux stagiaires</h3>
        <p className="muted" style={{ margin: "0 0 6px" }}>Coche ce que les stagiaires doivent rédiger : ils voient les consignes cochées et y répondent. Les réponses s'affichent ici et dans leur suivi.</p>
        {[...TACHES_MODELES, ...taches.filter((t) => !TACHES_MODELES.some((m) => m.id === t.id))].map((t) => {
          const on = taches.some((x) => x.id === t.id);
          const n = ps.filter((u) => u.taches?.[t.id]?.texte).length;
          return (
            <label key={t.id} className="row between" style={{ margin: "4px 0", cursor: "pointer" }}>
              <span><input type="checkbox" checked={on} onChange={() => act(() => cocher(t))()} /> {t.titre}</span>
              {on && <span className={n && n === ps.length ? "tag ok" : "tag"}>{n} / {ps.length} réponse(s)</span>}
            </label>
          );
        })}
        <div className="row" style={{ marginTop: 6 }}>
          <input maxLength={80} placeholder="Autre consigne (ex. Rédiger le message de situation)" value={feTache} onChange={(e) => setFeTache(e.target.value)} style={{ flex: 1 }} />
          <button className="btn" disabled={!feTache.trim()} onClick={act(async () => { await cocher({ id: "libre_" + Date.now().toString(36), titre: feTache.trim().slice(0, 80) }); setFeTache(""); })}>Ajouter et cocher</button>
        </div>
        {taches.some((t) => ps.some((u) => u.taches?.[t.id]?.texte)) && (
          <div style={{ borderTop: "1px solid var(--line, #ddd)", marginTop: 8, paddingTop: 4 }}>
            {taches.map((t) => ps.filter((u) => u.taches?.[t.id]?.texte).length > 0 && (
              <div key={t.id} style={{ margin: "8px 0" }}>
                <strong>{t.titre}</strong>
                {ps.filter((u) => u.taches?.[t.id]?.texte).map((u) => (
                  <div key={u.id} style={{ margin: "4px 0 0 8px" }}>
                    <span className="muted">{u.nom} · {hhmm(u.taches[t.id].le)}</span>
                    <p className="pre" style={{ margin: "2px 0 0" }}>{u.taches[t.id].texte}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Suivi des évolutions</h3>
        {(() => {
          const lignes = [
            ...prevues.map((e) => ({ cle: e.id, titre: e.titre || "Évolution", texte: e.message || "", info: `T+${Number(e.delai) || 0} min`, le: evts.find((m) => m.kind === "evo" && m.evoId === e.id)?.le || 0 })),
            ...evts.filter((m) => m.kind === "evo" && !m.evoId).map((m) => ({ cle: "libre_" + m.id, titre: m.titre || "Évolution libre", texte: m.texte || "", info: m.cible && m.cible !== "all" ? "→ " + (ps.find((u) => (u.uid || u.id) === m.cible)?.nom || "un stagiaire") : "à toute la salle", le: m.le || 0, cible: m.cible })),
          ].map((l) => {
            const dest = l.cible && l.cible !== "all" ? ps.filter((u) => (u.uid || u.id) === l.cible) : ps;
            const recu = dest.filter((u) => u.evo?.[l.cle]?.r), comp = dest.filter((u) => u.evo?.[l.cle]?.c);
            return { ...l, dest, recu, comp };
          }).filter((l) => l.le || l.recu.length);
          if (!lignes.length) return <p className="muted" style={{ margin: 0 }}>Aucune évolution transmise pour le moment.</p>;
          return lignes.sort((a, b) => (a.le || 0) - (b.le || 0)).map((l) => {
            const attente = l.dest.filter((u) => !u.evo?.[l.cle]?.c);
            return (
              <div key={l.cle} style={{ margin: "8px 0", paddingBottom: 6, borderBottom: "1px solid var(--line, #ddd)" }}>
                <div className="row between">
                  <span><strong>{l.titre}</strong> <span className="muted">{l.info}{l.le ? ` · envoyée à ${hhmm(l.le)}` : " · tombée automatiquement"}</span></span>
                  <span className="row" style={{ gap: 6 }}>
                    <span className="tag">Reçue {l.recu.length}/{l.dest.length}</span>
                    <span className={l.dest.length && l.comp.length === l.dest.length ? "tag ok" : "tag"}>Comprise {l.comp.length}/{l.dest.length}</span>
                  </span>
                </div>
                {l.texte && <div className="muted">{l.texte}</div>}
                {l.dest.length > 0 && attente.length > 0 && <div className="muted">En attente : {attente.map((u) => u.nom || "Stagiaire").join(", ")}</div>}
              </div>
            );
          });
        })()}
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Stagiaires</h3>
        {ps.length === 0 ? <p className="muted">En attente des stagiaires…</p> : (
          <div className="chips">
            <button className={"chip" + (filt === "all" ? " on" : "")} onClick={() => setFilt("all")}>Tous ({qs.length})</button>
            {ps.map((u) => (
              <button key={u.uid} className={"chip" + (filt === u.uid ? " on" : "")} onClick={() => setFilt(u.uid)}>
                {u.nom} ({qs.filter((q) => q.uid === u.uid).length})
              </button>
            ))}
          </div>
        )}
      </div>
      {ps.length > 0 && sc && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Fiche d'évaluation</h3>
          <div className="row">
            <select value={fiche} onChange={(e) => setFiche(e.target.value)}>
              <option value="">Choisir un stagiaire…</option>
              {ps.map((u) => <option key={u.uid} value={u.uid}>{u.nom || "Stagiaire"}</option>)}
            </select>
            <span className="muted">Note en direct pendant que le stagiaire passe. La fiche est visible ensuite dans son suivi.</span>
          </div>
          {fiche && ps.find((u) => u.uid === fiche) && (
            <FicheEval key={fiche} src="salle" stag={{ id: fiche, nom: ps.find((u) => u.uid === fiche).nom || "Stagiaire" }} sc={{ id: salle.scId, titre: sc.titre, smes: !!sc.smes }} gest={{ uid: user.uid, nom: profil?.nom || "Formateur" }} />
          )}
        </div>
      )}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Questions essentielles : {faites} / {ess.length} posées au moins une fois</h3>
        <div style={{ maxHeight: 280, overflow: "auto" }}>
        {ess.map((x) => (
          <div className="row between" key={x.id} style={{ margin: "3px 0" }}>
            <span>{qui(x) ? "✅" : "⬜"} {x.intitule} <span className="muted">{interNom(x.interlocuteurId)}</span></span>
            <span className={qui(x) ? "tag ok" : "tag"}>{qui(x)} / {ps.length}</span>
          </div>
        ))}
        </div>
        {ess.length === 0 && <p className="muted">Aucune question essentielle définie.</p>}
      </div>
      {qs.length > 0 && (() => {
        const t0 = Math.min(...qs.map((q) => q.le), salle.debut && salle.debut <= Math.min(...qs.map((q) => q.le)) ? salle.debut : Infinity);
        const D = Math.max(60, ...qs.map((q) => Math.round((q.le - t0) / 1000))) + 10;
        const noms = [...new Set(qs.map((q) => q.whoNom || "?"))];
        const lanes = ps.filter((u) => qs.some((q) => q.uid === u.uid)).map((u) => ({ id: u.uid, label: u.nom }));
        const pts = qs.filter((q) => lanes.some((l) => l.id === q.uid)).map((q) => ({ t: Math.round((q.le - t0) / 1000), lane: q.uid, col: FRISE_COL[noms.indexOf(q.whoNom || "?") % FRISE_COL.length], big: esId.has(q.qaId), title: `${frMmss(Math.round((q.le - t0) / 1000))} — ${q.nom} → ${q.whoNom} : ${q.q}` }));
        return (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Chronologie de la séance</h3>
            <FriseSvg lanes={lanes} pts={pts} D={D} />
            <p className="muted" style={{ margin: "6px 0 0" }}>Une ligne par stagiaire · couleur = interlocuteur interrogé ({noms.map((n, i) => <span key={n} style={{ color: FRISE_COL[i % FRISE_COL.length] }}>● {n} </span>)}) · contour épais = question essentielle.</p>
          </div>
        );
      })()}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Questions en direct</h3>
        {feed.length === 0 && <p className="muted">Aucune question pour le moment.</p>}
        {feed.map((x) => (
          <div key={x.id} style={{ margin: "8px 0", paddingBottom: 6, borderBottom: "1px solid var(--line, #ddd)" }}>
            <div className="muted">
              {hhmm(x.le)} · <strong>{x.nom}</strong> → {x.whoNom}{" "}
              {x.qaId ? (esId.has(x.qaId) && <span className="tag ok">essentielle</span>) : <span className="tag">hors base</span>}
            </div>
            <div>{x.q}</div>
            <div className="muted">↳ {x.a}</div>
            {evts.filter((m) => m.kind === "rep" && m.qid === x.id).map((m) => <div key={m.id} className="muted">✎ Réponse du formateur : {m.texte}</div>)}
            {repId === x.id ? (
              <>
                <textarea rows={2} maxLength={400} autoFocus style={{ width: "100%", marginTop: 4 }} placeholder={`Réponse de ${x.whoNom || "l'interlocuteur"}…`} value={repT} onChange={(e) => setRepT(e.target.value)} />
                <div className="row" style={{ marginTop: 4 }}>
                  <button className="btn primary" disabled={!repT.trim()} onClick={act(async () => { await envoyerEvenement(code, user.uid, profil?.nom || "Formateur", { kind: "rep", cible: x.uid, qid: x.id, who: x.who || "", whoNom: x.whoNom || "", q: String(x.q || "").slice(0, 120), texte: repT.trim().slice(0, 400) }); setRepId(null); setRepT(""); })}>Envoyer</button>
                  <button className="btn" onClick={() => { setRepId(null); setRepT(""); }}>Annuler</button>
                </div>
              </>
            ) : <button className="btn" style={{ marginTop: 4 }} onClick={() => { setRepId(x.id); setRepT(""); }}>Répondre à la place de l'interlocuteur</button>}
          </div>
        ))}
      </div>
      </div></div>
    </Layout>
  );
}
