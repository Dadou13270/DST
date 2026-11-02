import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { NIVEAUX, nivNorm, rubriquesDe } from "../lib/model";
import { toutesRubriques } from "../lib/relation";
import { useAuth } from "../lib/auth";
import { compressImage } from "../lib/image";
import { bonneReponse, depuisTrame, FORMATS, listMesQuiz, listQuiz, nettoyerQuiz, nouveauQuiz, nouvelleQuestion, saveQuiz, TYPES_PAR_FORMAT, TYPES_Q, verifierQuiz } from "../lib/quiz";
import { QuizJeu } from "./Quiz";

// Éditeur de quiz / QCM (admin, ou gestionnaire autorisé quand perso = true).
export default function AdminQuiz({ perso = false }) {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, profil } = useAuth();
  const base = perso ? "/editeur" : "/admin";
  const nouveau = id === "nouveau";
  const [e, setE] = useState(nouveau ? nouveauQuiz("qcm") : null);
  const [rubs, setRubs] = useState(rubriquesDe([]));
  const [msg, setMsg] = useState("");
  const [dirty, setDirty] = useState(false);
  const [apercu, setApercu] = useState(false);
  const [apercuK, setApercuK] = useState(0);
  const fichier = useRef(null);
  useEffect(() => { toutesRubriques().then(setRubs).catch(() => {}); }, []);
  useEffect(() => {
    if (nouveau || !user) return;
    (perso ? listMesQuiz(user.uid) : listQuiz(true)).then((l) => { const x = l.find((y) => y.id === id); setE(x || false); }).catch((x) => setMsg("Erreur : " + x.message));
  }, [id, user?.uid]); // eslint-disable-line
  if (e === false) return <div className="card warn">Quiz introuvable. <Link to={perso ? "/gestion?onglet=mq" : "/admin"}>Retour</Link></div>;
  if (!e) return <p>{msg || "Chargement…"}</p>;
  const maj = (f) => { const n = JSON.parse(JSON.stringify(e)); f(n); setE(n); setDirty(true); setMsg(""); };
  const majQ = (i, f) => maj((n) => f(n.questions[i]));
  const deplacer = (i, d) => maj((n) => { const j = i + d; if (j < 0 || j >= n.questions.length) return; [n.questions[i], n.questions[j]] = [n.questions[j], n.questions[i]]; });
  const format = e.format || "qcm";
  const typesOk = TYPES_PAR_FORMAT[format] || TYPES_PAR_FORMAT.quiz;
  const themes = [...new Set(e.questions.map((q) => (q.theme || "").trim()).filter(Boolean))];
  const poids = JSON.stringify(e).length;
  const changerType = (i, type) => majQ(i, (q) => {
    q.type = type;
    if ((type === "unique" || type === "multiple") && !q.choix) q.choix = [{ t: "", ok: true }, { t: "", ok: false }, { t: "", ok: false }];
    if (type === "unique" && q.choix) { let vu = false; q.choix.forEach((c) => { if (c.ok && vu) c.ok = false; if (c.ok) vu = true; }); }
    if (type === "vf" && q.vf === undefined) q.vf = true;
    if (type === "libre" && !q.reponses) q.reponses = [""];
    if (type === "ordre" && !q.items) q.items = ["", "", ""];
    if (type === "trous" && q.texte === undefined) q.texte = "";
    if (type === "assoc" && !q.paires) q.paires = [{ g: "", d: "" }, { g: "", d: "" }, { g: "", d: "" }];
  });
  const choisirImage = async (i, f) => {
    if (!f) return;
    try {
      const d = await compressImage(f, 900, 0.7, 90000);
      if (JSON.stringify(e).length + d.length > 900000) return setMsg("Erreur : document trop volumineux (limite d'environ 900 Ko), retire une image.");
      majQ(i, (q) => (q.image = d));
    } catch { setMsg("Erreur : image illisible."); }
  };
  const sauver = async () => {
    const err = verifierQuiz(e);
    if (err) return setMsg(err);
    try {
      const d = nettoyerQuiz(e);
      const plus = perso ? { auteur: user.uid, auteurNom: profil?.nom || "", departement: profil?.departement || "", cis: profil?.cis || "", reserveA: user.uid } : {};
      const nid = await saveQuiz(nouveau ? "" : id, { ...d, ...plus });
      setDirty(false); setMsg("Enregistré.");
      if (nouveau) nav(`${base}/quiz/${nid}`, { replace: true });
    } catch (x) { setMsg("Erreur : " + (x.code || x.message)); }
  };
  const importer = async (ev) => {
    const f = ev.target.files?.[0]; ev.target.value = "";
    if (!f) return;
    try { const d = JSON.parse(await f.text()); if (!Array.isArray(d.questions)) throw new Error("fichier sans questions"); setE({ ...nouveauQuiz(d.format || "qcm"), ...d, publie: false }); setDirty(true); setMsg("Fichier chargé : vérifie puis enregistre."); }
    catch (x) { setMsg("Erreur : fichier illisible (" + x.message + ")."); }
  };
  const trame = (f) => { setE({ ...depuisTrame(f), ...(e.titre ? { titre: e.titre } : {}) }); setDirty(true); setMsg("Trame chargée : remplace les textes par les tiens."); };
  return (
    <>
      <div className="row between sticky">
        <div className="row"><Link to={perso ? "/gestion?onglet=mq" : "/admin"} className="btn">← {perso ? "Mes quiz" : "Liste"}</Link><h1>{e.titre || "Nouveau quiz"}</h1></div>
        <div className="row">
          {msg && <span className={msg.startsWith("Erreur") || /obligatoire|Question|Ajoute/.test(msg) ? "err" : "ok-txt"}>{msg}</span>}
          {dirty && <span className="tag">Non enregistré</span>}
          <button className="btn" onClick={() => setApercu(!apercu)}>{apercu ? "Modifier" : "Aperçu"}</button>
          <button className="btn primary" onClick={sauver}>Enregistrer</button>
        </div>
      </div>
      {apercu ? <QuizJeu key={apercuK} ex={{ ...nettoyerQuiz(e) }} apercu={() => setApercuK(apercuK + 1)} /> : (
        <>
          <div className="card form">
            <div className="row between"><strong>Informations</strong>
              <div className="row">
                <button className="btn" onClick={() => trame("qcm")}>Trame QCM</button>
                <button className="btn" onClick={() => trame("quiz")}>Trame quiz</button>
                <button className="btn" onClick={() => trame("examen")}>Trame examen</button>
                <button className="btn" onClick={() => trame("cartes")}>Trame flashcards</button>
                <button className="btn" onClick={() => fichier.current?.click()}>Importer un .json</button>
                <input ref={fichier} type="file" accept=".json,application/json" hidden onChange={importer} />
              </div>
            </div>
            <label>Titre</label>
            <input value={e.titre || ""} maxLength={120} onChange={(x) => maj((n) => (n.titre = x.target.value))} />
            <label>Description courte (carte de l'exercice)</label>
            <textarea rows={2} value={e.description || ""} onChange={(x) => maj((n) => (n.description = x.target.value))} />
            <label>Consigne affichée avant la première question (facultatif)</label>
            <input value={e.consigne || ""} onChange={(x) => maj((n) => (n.consigne = x.target.value))} />
            <div className="row" style={{ alignItems: "flex-end" }}>
              <div><label>Format</label>
                <select value={format} onChange={(x) => maj((n) => { n.format = x.target.value; const ok = TYPES_PAR_FORMAT[n.format]; n.questions.forEach((q) => { if (n.format === "cartes") { if (q.type !== "carte") { q.r = bonneReponse(q); q.type = "carte"; } } else if (!ok.includes(q.type)) { q.type = "unique"; delete q.r; if (!q.choix) q.choix = [{ t: "", ok: true }, { t: "", ok: false }]; } }); if (n.format === "cartes") n.correction = "immediate"; if (n.format === "examen") { n.correction = "fin"; if (!n.duree) n.duree = 15; } })}>
                  {Object.entries(FORMATS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select></div>
              <div><label>Rubrique</label>
                <select value={e.rubrique || ""} onChange={(x) => maj((n) => (n.rubrique = x.target.value))}>
                  <option value="">— Aucune —</option>
                  {[...new Set([...rubs, "Quiz et QCM", e.rubrique].filter(Boolean))].map((r) => <option key={r}>{r}</option>)}
                </select></div>
              <div><label>Niveau</label>
                <select aria-label="Niveau" value={nivNorm(e.niveau) || "Débutant"} onChange={(x) => maj((n) => (n.niveau = x.target.value))}>{NIVEAUX.map((n) => <option key={n}>{n}</option>)}</select></div>
              {format === "examen" && <div><label>Durée (minutes)</label><input type="number" min="1" max="180" style={{ width: 90 }} value={e.duree ?? 15} onChange={(x) => maj((n) => (n.duree = Number(x.target.value) || 0))} /></div>}
              {format !== "cartes" && <div><label>Correction</label>
                <select value={format === "examen" ? "fin" : e.correction || "immediate"} disabled={format === "examen"} onChange={(x) => maj((n) => (n.correction = x.target.value))}><option value="immediate">Après chaque question</option><option value="fin">À la fin seulement</option></select></div>}
              <div><label>Seuil de réussite (%)</label>
                <input type="number" min="0" max="100" style={{ width: 90 }} value={e.seuil ?? 70} onChange={(x) => maj((n) => (n.seuil = Number(x.target.value)))} /></div>
            </div>
            <label className="check"><input type="checkbox" checked={!!e.melange} onChange={(x) => maj((n) => (n.melange = x.target.checked))} /> Mélanger l'ordre des questions et des réponses</label>
            <label className="check"><input type="checkbox" checked={!!e.publie} onChange={(x) => maj((n) => (n.publie = x.target.checked))} /> Publié (visible par les stagiaires{perso ? " de mes équipes" : ""}, utilisable dans un parcours)</label>
            {perso && <p className="muted">Ce quiz est rattaché à ton département{profil?.departement ? ` (${profil.departement})` : ""}, réservé à toi et à tes équipes. L'administrateur peut le consulter.</p>}
          </div>
          {e.questions.map((q, i) => (
            <div className="card form" key={q.id}>
              <div className="row between">
                <strong>{q.type === "carte" ? "Carte" : "Question"} {i + 1}</strong>
                <div className="row">
                  {q.type !== "carte" && <><select value={q.type} onChange={(x) => changerType(i, x.target.value)} aria-label="Type de question">{typesOk.map((t) => <option key={t} value={t}>{TYPES_Q[t]}</option>)}</select>
                  <input type="number" min="1" max="10" style={{ width: 70 }} value={q.pts || 1} title="Points" onChange={(x) => majQ(i, (qq) => (qq.pts = Number(x.target.value) || 1))} /></>}
                  <button className="btn" disabled={i === 0} onClick={() => deplacer(i, -1)} aria-label="Monter">↑</button>
                  <button className="btn" disabled={i === e.questions.length - 1} onClick={() => deplacer(i, 1)} aria-label="Descendre">↓</button>
                  <button className="btn danger" onClick={() => maj((n) => n.questions.splice(i, 1))}>Supprimer</button>
                </div>
              </div>
              <label>{q.type === "carte" ? "Recto (question ou notion)" : "Énoncé"}</label>
              <textarea rows={2} value={q.q} onChange={(x) => majQ(i, (qq) => (qq.q = x.target.value))} />
              {q.type === "carte" && <><label>Verso (réponse à retenir)</label><textarea rows={3} value={q.r || ""} onChange={(x) => majQ(i, (qq) => (qq.r = x.target.value))} /></>}
              <div className="row" style={{ alignItems: "flex-end" }}>
                <div className="grow"><label>Thème (facultatif : donne un score par thème)</label>
                  <input list="quiz-themes" value={q.theme || ""} maxLength={40} onChange={(x) => majQ(i, (qq) => (qq.theme = x.target.value))} /></div>
                <div><label>Image (facultatif)</label>
                  <input type="file" accept="image/*" style={{ width: "auto" }} onChange={(x) => { choisirImage(i, x.target.files?.[0]); x.target.value = ""; }} /></div>
              </div>
              {q.image && <div className="row"><img src={q.image} alt="" style={{ maxHeight: 120, borderRadius: 6 }} /><button className="btn danger" onClick={() => majQ(i, (qq) => delete qq.image)}>Retirer l'image</button></div>}
              {(q.type === "unique" || q.type === "multiple") && (
                <>
                  <label>Réponses proposées (coche {q.type === "unique" ? "la bonne réponse" : "les bonnes réponses"})</label>
                  {q.choix.map((c, k) => (
                    <div className="row" key={k} style={{ margin: "4px 0" }}>
                      <input type={q.type === "unique" ? "radio" : "checkbox"} name={"ok" + q.id} checked={!!c.ok} aria-label="Bonne réponse"
                        onChange={(x) => majQ(i, (qq) => { if (qq.type === "unique") qq.choix.forEach((cc, j) => (cc.ok = j === k)); else qq.choix[k].ok = x.target.checked; })} />
                      <input className="grow" value={c.t} placeholder={`Réponse ${k + 1}`} onChange={(x) => majQ(i, (qq) => (qq.choix[k].t = x.target.value))} />
                      <button className="btn" disabled={q.choix.length <= 2} onClick={() => majQ(i, (qq) => qq.choix.splice(k, 1))} aria-label="Retirer">✕</button>
                    </div>
                  ))}
                  {q.choix.length < 8 && <button className="btn" onClick={() => majQ(i, (qq) => qq.choix.push({ t: "", ok: false }))}>+ Réponse</button>}
                </>
              )}
              {q.type === "ordre" && (
                <>
                  <label>Éléments dans le BON ordre (ils seront mélangés pour le stagiaire)</label>
                  {q.items.map((it, k) => (
                    <div className="row" key={k} style={{ margin: "4px 0" }}>
                      <b style={{ width: 22 }}>{k + 1}.</b>
                      <input className="grow" value={it} placeholder={`Étape ${k + 1}`} onChange={(x) => majQ(i, (qq) => (qq.items[k] = x.target.value))} />
                      <button className="btn" disabled={k === 0} onClick={() => majQ(i, (qq) => { [qq.items[k - 1], qq.items[k]] = [qq.items[k], qq.items[k - 1]]; })} aria-label="Monter">↑</button>
                      <button className="btn" disabled={k === q.items.length - 1} onClick={() => majQ(i, (qq) => { [qq.items[k + 1], qq.items[k]] = [qq.items[k], qq.items[k + 1]]; })} aria-label="Descendre">↓</button>
                      <button className="btn" disabled={q.items.length <= 2} onClick={() => majQ(i, (qq) => qq.items.splice(k, 1))} aria-label="Retirer">✕</button>
                    </div>
                  ))}
                  {q.items.length < 10 && <button className="btn" onClick={() => majQ(i, (qq) => qq.items.push(""))}>+ Étape</button>}
                </>
              )}
              {q.type === "assoc" && (
                <>
                  <label>Paires à associer (élément de gauche = correspondance de droite ; les réponses seront mélangées)</label>
                  {q.paires.map((p, k) => (
                    <div className="row" key={k} style={{ margin: "4px 0" }}>
                      <input className="grow" value={p.g} placeholder={`Élément ${k + 1}`} onChange={(x) => majQ(i, (qq) => (qq.paires[k].g = x.target.value))} />
                      <span aria-hidden="true">=</span>
                      <input className="grow" value={p.d} placeholder="Correspondance" onChange={(x) => majQ(i, (qq) => (qq.paires[k].d = x.target.value))} />
                      <button className="btn" disabled={q.paires.length <= 2} onClick={() => majQ(i, (qq) => qq.paires.splice(k, 1))} aria-label="Retirer">✕</button>
                    </div>
                  ))}
                  {q.paires.length < 8 && <button className="btn" onClick={() => majQ(i, (qq) => qq.paires.push({ g: "", d: "" }))}>+ Paire</button>}
                </>
              )}
              {q.type === "trous" && (
                <>
                  <label>Texte à trous : entoure chaque mot à trouver avec {"{{ }}"} ; sépare les variantes acceptées par |</label>
                  <textarea rows={3} value={q.texte || ""} placeholder="Un poteau d'incendie fournit au moins {{60}} m³/h sous {{1|un}} bar." onChange={(x) => majQ(i, (qq) => (qq.texte = x.target.value))} />
                </>
              )}
              {q.type === "vf" && (
                <div className="row"><label className="check"><input type="radio" name={"vf" + q.id} checked={q.vf === true} onChange={() => majQ(i, (qq) => (qq.vf = true))} /> L'affirmation est vraie</label>
                  <label className="check"><input type="radio" name={"vf" + q.id} checked={q.vf === false} onChange={() => majQ(i, (qq) => (qq.vf = false))} /> L'affirmation est fausse</label></div>
              )}
              {q.type === "libre" && (
                <>
                  <label>Réponses acceptées (sans tenir compte des majuscules ni des accents)</label>
                  {q.reponses.map((r, k) => (
                    <div className="row" key={k} style={{ margin: "4px 0" }}>
                      <input className="grow" value={r} onChange={(x) => majQ(i, (qq) => (qq.reponses[k] = x.target.value))} />
                      <button className="btn" disabled={q.reponses.length <= 1} onClick={() => majQ(i, (qq) => qq.reponses.splice(k, 1))} aria-label="Retirer">✕</button>
                    </div>
                  ))}
                  <button className="btn" onClick={() => majQ(i, (qq) => qq.reponses.push(""))}>+ Variante</button>
                </>
              )}
              <label>{q.type === "carte" ? "Complément affiché sous la réponse (facultatif)" : "Explication affichée après la validation"}</label>
              <textarea rows={2} value={q.expl || ""} onChange={(x) => majQ(i, (qq) => (qq.expl = x.target.value))} />
            </div>
          ))}
          <datalist id="quiz-themes">{themes.map((x) => <option key={x} value={x} />)}</datalist>
          <div className="row">
            {typesOk.map((ty) => <button key={ty} className="btn" onClick={() => maj((n) => n.questions.push(nouvelleQuestion(ty)))}>+ {ty === "carte" ? "Carte" : TYPES_Q[ty]}</button>)}
          </div>
          <p className="muted">Taille du quiz : {Math.round(poids / 1024)} Ko sur environ 900 Ko disponibles (les images comptent le plus).</p>
        </>
      )}
    </>
  );
}
