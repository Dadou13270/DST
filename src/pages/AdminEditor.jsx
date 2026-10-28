import { useEffect, useState } from "react";
import { DOMS } from "../components/Dominantes";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getScenario, getPhoto, getSituationPhotos, saveScenario } from "../lib/db";
import { compressImage } from "../lib/image";
import { findAnswer } from "../lib/matching";
import { newScenario, uid, SOIEC, SMES, CRM, TOUS, CUB, rubriquesDe } from "../lib/model";
import { listScenarios } from "../lib/db";
import { toutesRubriques } from "../lib/relation";
import { varAutoOn, tirer } from "../lib/variantes";
import BanqueQuestions from "../components/BanqueQuestions";
import { listGestionnaires } from "../lib/demandesScenario";
import { listIllustrations, addIllustration, deleteIllustration } from "../lib/illustrations";

const TABS = [
  ["general", "Général"],
  ["situation", "Situation"],
  ["inter", "Interlocuteurs"],
  ["evo", "Évolutions"],
  ["var", "Variantes"],
  ["qa", "Questions / réponses"],
  ["smes", "Correction SMES"],
  ["corr", "Correction SOIEC"],
  ["msgm", "Message d'ambiance"],
  ["crm", "Message de compte rendu"],
  ["comm", "Commentaire du formateur"],
];

export default function AdminEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = id === "nouveau";

  const [s, setS] = useState(isNew ? newScenario() : null);
  const [loadedPhoto, setLoadedPhoto] = useState(null);
  const [photo, setPhoto] = useState(undefined); // undefined = inchangée
  const [loadedSit, setLoadedSit] = useState([]);
  const [sit, setSit] = useState(undefined); // photos de la situation, undefined = inchangées
  const [tab, setTab] = useState("general");
  const [domTxt, setDomTxt] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [filtre, setFiltre] = useState("all");
  const [tw, setTw] = useState("");
  const [tq, setTq] = useState("");
  const [rubs, setRubs] = useState(rubriquesDe([]));
  const [nouvelle, setNouvelle] = useState(false);
  const [libOpen, setLibOpen] = useState(false);
  const [bqOpen, setBqOpen] = useState(false);
  const [gests, setGests] = useState([]);
  useEffect(() => { listGestionnaires().then(setGests).catch(() => {}); }, []);
  const [lib, setLib] = useState(null);
  const [libTitre, setLibTitre] = useState("");
  const [libDel, setLibDel] = useState(null);
  const [libMsg, setLibMsg] = useState("");
  const chargerLib = () => listIllustrations().then(setLib).catch((e) => setLibMsg("Erreur : " + e.message));
  const importerLib = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    let n = 0, ign = 0;
    try {
      const deja = new Set((await listIllustrations()).map((x) => x.titre));
      for (const f of files) {
        const d = JSON.parse(await f.text());
        if (d.titre && d.photo && d.vignette) {
          if (deja.has(d.titre)) { ign++; continue; } // évite les doublons à chaque réimport
          await addIllustration(d.titre, d.photo, d.vignette, d.tags || "");
          deja.add(d.titre);
          n++;
        }
      }
      setLibMsg(`${n} illustration(s) importée(s)${ign ? `, ${ign} déjà présente(s) ignorée(s)` : ""}.`);
      chargerLib();
    } catch (e2) {
      setLibMsg("Import impossible : " + e2.message);
    }
  };

  const dedoublonnerLib = async () => {
    try {
      const vus = new Set();
      let n = 0;
      for (const x of await listIllustrations()) {
        if (vus.has(x.titre)) { await deleteIllustration(x.id); n++; } else vus.add(x.titre);
      }
      setLibMsg(`${n} doublon(s) supprimé(s).`);
      chargerLib();
    } catch (e2) {
      setLibMsg("Erreur : " + e2.message);
    }
  };

  useEffect(() => {
    toutesRubriques().then(setRubs).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const d = await getScenario(id);
        if (!d) return setMsg("Scénario introuvable.");
        setS(d);
        setLoadedPhoto(await getPhoto(id));
        let sp = await getSituationPhotos(id);
        if (!sp.length && d.situation?.photos?.length) {
          sp = d.situation.photos; // photos intégrées (seeds) : migrées vers media/situation à l'enregistrement
          setSit(sp);
        }
        setLoadedSit(sp);
      } catch (e) {
        setMsg("Erreur : " + e.message);
      }
    })();
  }, [id, isNew]);

  if (!s) return <p>{msg || "Chargement…"}</p>;

  const ajouterDom = (v) => {
    const t = (v || "").trim();
    if (!t) return;
    upd((n) => {
      n.dominantes = n.dominantes || [];
      if (n.dominantes.length < 8 && !n.dominantes.some((x) => x.toLowerCase() === t.toLowerCase())) n.dominantes.push(t);
    });
    setDomTxt("");
  };
  const upd = (fn) => {
    setS((p) => {
      const n = structuredClone(p);
      fn(n);
      return n;
    });
    setDirty(true);
    setMsg("");
  };
  const shown = photo !== undefined ? photo : loadedPhoto;
  const sitList = sit !== undefined ? sit : loadedSit;
  const MAXSIT = 6;
  const setSitList = (l) => {
    setSit(l);
    setDirty(true);
    setMsg("");
  };
  const onSitPhotos = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    let l = [...sitList];
    try {
      for (const f of files) {
        if (l.length >= MAXSIT) break;
        l.push({ id: uid(), data: await compressImage(f, 1100, 0.7, 140000), legende: "" });
      }
      setSitList(l);
    } catch {
      setMsg("Image illisible.");
    }
  };

  const onPhoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const big = await compressImage(f, 1280, 0.72, 800000);
      const small = await compressImage(f, 320, 0.7);
      setPhoto(big);
      upd((n) => {
        n.vignette = small;
      });
    } catch {
      setMsg("Image illisible.");
    }
  };

  const save = async () => {
    if (!s.titre.trim()) return setMsg("Le titre est obligatoire.");
    setBusy(true);
    try {
      const nid = await saveScenario(isNew ? null : id, s, photo, sit);
      if (sit !== undefined) {
        setLoadedSit(sit);
        setSit(undefined);
      }
      if (photo !== undefined) {
        setLoadedPhoto(photo);
        setPhoto(undefined);
      }
      setDirty(false);
      setMsg("Enregistré.");
      if (isNew) nav(`/admin/scenario/${nid}`, { replace: true });
    } catch (e) {
      setMsg("Erreur : " + e.message);
    }
    setBusy(false);
  };

  const interName = (iid) => (iid === TOUS ? "Tous" : s.interlocuteurs.find((i) => i.id === iid)?.nom || "?");
  const testQa = tq && tw ? findAnswer(tq, s.qa, tw) : null;

  return (
    <>
      <div className="row between sticky">
        <div className="row">
          <Link to="/admin" className="btn">← Liste</Link>
          <h1>{s.titre || "Nouveau scénario"}</h1>
        </div>
        <div className="row">
          {msg && <span className={msg.startsWith("Erreur") || msg.includes("obligatoire") ? "err" : "ok-txt"}>{msg}</span>}
          {dirty && <span className="tag">Non enregistré</span>}
          <button className="btn primary" disabled={busy} onClick={save}>
            {busy ? "…" : "Enregistrer"}
          </button>
        </div>
      </div>

      <div className="tabs">
        {TABS.filter(([k]) => (k !== "evo" || s.evolutif) && (k !== "smes" || s.smes)).map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>

      {/* ---------- GÉNÉRAL ---------- */}
      {tab === "general" && (
        <div className="card form">
          <label>Titre</label>
          <input value={s.titre} onChange={(e) => upd((n) => (n.titre = e.target.value))} />
          <label>Description courte (affichée dans la liste)</label>
          <textarea rows={2} value={s.description} onChange={(e) => upd((n) => (n.description = e.target.value))} />
          <label>Rubrique</label>
          <div className="row">
            <select
              value={nouvelle ? "__new" : s.rubrique || ""}
              onChange={(e) => {
                if (e.target.value === "__new") {
                  setNouvelle(true);
                  upd((n) => (n.rubrique = ""));
                } else {
                  setNouvelle(false);
                  upd((n) => (n.rubrique = e.target.value));
                }
              }}
            >
              <option value="">— Aucune —</option>
              {rubs.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
              <option value="__new">+ Nouvelle rubrique…</option>
            </select>
            {nouvelle && (
              <input className="grow" placeholder="Nom de la nouvelle rubrique" maxLength={40} value={s.rubrique || ""} onChange={(e) => upd((n) => (n.rubrique = e.target.value))} />
            )}
          </div>
          <label className="check">
            <input type="checkbox" checked={s.suggestions !== false} onChange={(e) => upd((n) => (n.suggestions = e.target.checked))} />
            Proposer des questions suggérées aux stagiaires (à partir des intitulés des questions)
          </label>
          <div className="domblk">
          <label>Dominantes du scénario (badges affichés aux stagiaires pour guider leur choix)</label>
          <div className="doml">
            {(s.dominantes || []).map((d, i) => (
              <span key={d} className="tag dom" style={{ marginRight: 4 }}>
                {d} <button type="button" className="linkbtn" title="Retirer" onClick={() => upd((n) => { n.dominantes = (n.dominantes || []).filter((_, k) => k !== i); })}>✕</button>
              </span>
            ))}
            {!(s.dominantes || []).length && <span className="muted">Aucune dominante.</span>}
          </div>
          <div className="row item">
            <input className="grow" maxLength={40} placeholder="Ajouter une dominante (ex. Risque d'explosion)" value={domTxt} onChange={(e) => setDomTxt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ajouterDom(domTxt); } }} />
            <button type="button" className="btn" onClick={() => ajouterDom(domTxt)}>Ajouter</button>
          </div>
          <div className="chips">
            {DOMS.filter((d) => !(s.dominantes || []).includes(d)).map((d) => <button type="button" className="chip" key={d} onClick={() => ajouterDom(d)}>+ {d}</button>)}
          </div>
          </div>
          <label>Durée conseillée en minutes (0 = chronomètre simple, sans limite)</label>
          <input type="number" min="0" value={s.duree} onChange={(e) => upd((n) => (n.duree = Number(e.target.value) || 0))} />
          <label className="check">
            <input type="checkbox" checked={s.publie} onChange={(e) => upd((n) => (n.publie = e.target.checked))} />
            Publié (visible par les stagiaires)
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={s.afficherCorrection}
              onChange={(e) => upd((n) => (n.afficherCorrection = e.target.checked))}
            />
            Afficher la correction au stagiaire à la fin
          </label>
          <label className="check">
            <input type="checkbox" checked={!!s.cubique} onChange={(e) => upd((n) => (n.cubique = e.target.checked))} />
            Reconnaissance cubique (chef d'agrès, incendie)
          </label>
          <label className="check">
            <input type="checkbox" checked={!!s.smes} onChange={(e) => upd((n) => (n.smes = e.target.checked))} />
            Faire un SMES (le stagiaire rédige un SMES avant le SOIEC et le message)
          </label>
          <label className="check">
            <input type="checkbox" checked={!!s.evolutif} onChange={(e) => upd((n) => (n.evolutif = e.target.checked))} />
            Scénario évolutif (la situation change à des moments programmés : onglet Évolutions)
          </label>
          <label>Visible par</label>
          <select value={s.reserveA || ""} onChange={(e) => upd((n) => (n.reserveA = e.target.value || null))}>
            <option value="">Tous les stagiaires (public)</option>
            {gests.map((g) => <option key={g.id} value={g.id}>Réservé au gestionnaire : {g.nom} (et ses équipes)</option>)}
          </select>
          <label>Photo du scénario (vignette de la liste et haut de l'exercice)</label>
          {shown && <img className="photo prev" src={shown} alt="" />}
          <div className="row">
            <button
              type="button"
              className="btn"
              onClick={() => {
                setLibOpen(!libOpen);
                if (!lib) chargerLib();
              }}
            >
              {libOpen ? "Fermer la bibliothèque" : "Bibliothèque d'illustrations" + (lib ? ` (${lib.length})` : "")}
            </button>
          </div>
          {libOpen && (
            <div className="card" style={{ background: "var(--soft)" }}>
              {libMsg && <p className={libMsg.startsWith("Erreur") || libMsg.startsWith("Import imp") ? "err" : "ok-txt"}>{libMsg}</p>}
              {!lib && <p>Chargement…</p>}
              {lib && lib.length === 0 && <p className="muted">Bibliothèque vide : importe le dossier seeds-illustrations/ ou ajoute une image ci-dessous.</p>}
              <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
                {(lib || []).map((i) => (
                  <div className="card" key={i.id} style={{ padding: 6, margin: 0 }}>
                    <img
                      src={i.vignette}
                      alt=""
                      style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 6, cursor: "pointer" }}
                      onClick={() => {
                        setPhoto(i.photo);
                        upd((n) => (n.vignette = i.vignette));
                        setLibOpen(false);
                      }}
                    />
                    <div style={{ fontSize: ".82rem", margin: "4px 0" }}>{i.titre}</div>
                    <div className="row">
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: "2px 8px" }}
                        onClick={() => {
                          setPhoto(i.photo);
                          upd((n) => (n.vignette = i.vignette));
                          setLibOpen(false);
                        }}
                      >
                        Utiliser
                      </button>
                      {libDel === i.id ? (
                        <button
                          type="button"
                          className="btn danger"
                          style={{ padding: "2px 8px" }}
                          onClick={async () => {
                            await deleteIllustration(i.id);
                            setLibDel(null);
                            chargerLib();
                          }}
                        >
                          Confirmer ?
                        </button>
                      ) : (
                        <button type="button" className="btn danger" style={{ padding: "2px 8px" }} onClick={() => setLibDel(i.id)}>
                          Suppr.
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                {shown && s.vignette && (
                  <>
                    <input className="grow" placeholder="Titre de l'image dans la bibliothèque" maxLength={60} value={libTitre} onChange={(e) => setLibTitre(e.target.value)} />
                    <button
                      type="button"
                      className="btn primary"
                      onClick={async () => {
                        if (!libTitre.trim()) return setLibMsg("Erreur : donne un titre à l'image.");
                        await addIllustration(libTitre.trim(), shown, s.vignette);
                        setLibTitre("");
                        setLibMsg("Ajoutée à la bibliothèque.");
                        chargerLib();
                      }}
                    >
                      Ajouter l'image actuelle
                    </button>
                  </>
                )}
                <label className="btn">
                  Importer (.json)
                  <input type="file" accept=".json,application/json" multiple hidden onChange={importerLib} />
                </label>
                <button type="button" className="btn" onClick={dedoublonnerLib}>Supprimer les doublons</button>
              </div>
            </div>
          )}
          <div className="row">
            <input type="file" accept="image/*" onChange={onPhoto} />
            {shown && (
              <button
                className="btn danger"
                onClick={() => {
                  setPhoto(null);
                  upd((n) => (n.vignette = null));
                }}
              >
                Retirer la photo
              </button>
            )}
          </div>
          <p className="muted">L'image est redimensionnée et compressée automatiquement avant stockage.</p>
        </div>
      )}

      {/* ---------- SITUATION ---------- */}
      {tab === "situation" && (
        <div className="card form">
          <label>Situation initiale (départ reçu, heure, engins engagés, informations connues à l'arrivée)</label>
          <textarea rows={6} value={s.situation.contexte} onChange={(e) => upd((n) => (n.situation.contexte = e.target.value))} />
          <label>Consigne donnée au stagiaire</label>
          <textarea rows={4} value={s.situation.consigne} onChange={(e) => upd((n) => (n.situation.consigne = e.target.value))} />
          <label>Photos de la situation à l'arrivée sur les lieux ({sitList.length}/{MAXSIT}), choisies sur ton ordinateur</label>
          <div className="grid">
            {sitList.map((p, i) => (
              <div className="card" key={p.id || i} style={{ padding: 6, margin: 0 }}>
                <img src={p.data} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6 }} />
                <input
                  value={p.legende || ""}
                  placeholder="Légende (facultatif)"
                  maxLength={80}
                  onChange={(e) => setSitList(sitList.map((x, j) => (j === i ? { ...x, legende: e.target.value } : x)))}
                />
                <div className="row">
                  <button className="btn" disabled={i === 0} onClick={() => { const l = [...sitList]; [l[i - 1], l[i]] = [l[i], l[i - 1]]; setSitList(l); }}>←</button>
                  <button className="btn" disabled={i === sitList.length - 1} onClick={() => { const l = [...sitList]; [l[i + 1], l[i]] = [l[i], l[i + 1]]; setSitList(l); }}>→</button>
                  <button className="btn danger" onClick={() => setSitList(sitList.filter((_, j) => j !== i))}>Retirer</button>
                </div>
              </div>
            ))}
          </div>
          {sitList.length < MAXSIT ? <input type="file" accept="image/*" multiple onChange={onSitPhotos} /> : <p className="muted">Maximum atteint.</p>}
          <p className="muted">Indépendantes de la photo du scénario (onglet Général) : elles peuvent être identiques ou différentes. Redimensionnées et compressées automatiquement.</p>
        </div>
      )}

      {/* ---------- INTERLOCUTEURS ---------- */}
      {tab === "inter" && (
        <>
          {s.interlocuteurs.map((it, i) => (
            <div className="card form" key={it.id}>
              <div className="row between">
                <strong>Interlocuteur {i + 1}</strong>
                <button
                  className="btn danger"
                  onClick={() => {
                    if (window.confirm(`Supprimer « ${it.nom} » et ses réponses ?`))
                      upd((n) => {
                        n.interlocuteurs = n.interlocuteurs.filter((x) => x.id !== it.id);
                        n.qa = n.qa.filter((x) => x.interlocuteurId !== it.id);
                      });
                  }}
                >
                  Supprimer
                </button>
              </div>
              <div className="cols">
                <div>
                  <label>Nom (ex. Requérant, Témoin 1, Badaud)</label>
                  <input value={it.nom} onChange={(e) => upd((n) => (n.interlocuteurs[i].nom = e.target.value))} />
                </div>
                <div>
                  <label>Rôle / description</label>
                  <input value={it.role} onChange={(e) => upd((n) => (n.interlocuteurs[i].role = e.target.value))} />
                </div>
              </div>
              <label>Réponse par défaut (quand la question n'est pas reconnue)</label>
              <input
                value={it.reponseDefaut}
                onChange={(e) => upd((n) => (n.interlocuteurs[i].reponseDefaut = e.target.value))}
              />
            </div>
          ))}
          <button
            className="btn"
            onClick={() =>
              upd((n) =>
                n.interlocuteurs.push({
                  id: uid(),
                  nom: "",
                  role: "",
                  reponseDefaut: "Je ne sais pas, je n'ai pas vu ça.",
                })
              )
            }
          >
            + Ajouter un interlocuteur
          </button>
        </>
      )}

      {/* ---------- QUESTIONS / RÉPONSES ---------- */}
      {tab === "var" && (
        <>
          <div className="card form">
            <p className="muted">À chaque tentative, une valeur est tirée au hasard pour chaque variable. Écris <b>{"{nom}"}</b> dans le contexte, les réponses, les évolutions ou la correction : le texte est remplacé par la valeur tirée.</p>
            <label className="check">
              <input type="checkbox" checked={varAutoOn(s)} onChange={(e) => upd((n) => (n.variantesAuto = e.target.checked))} />
              Conditions du jour automatiques (heure, météo, vent, température) : ajoutées à la situation et répondues si le stagiaire pose la question (activées par défaut pour la rubrique Incendie)
            </label>
            <p className="muted">Variables automatiques : {"{heure} {meteo} {vent} {temperature}"}.</p>
          </div>
          {(s.variantes || []).map((v, i) => (
            <div className="card form" key={i}>
              <div className="row between"><b>Variable {i + 1}</b><button className="btn danger" onClick={() => upd((n) => n.variantes.splice(i, 1))}>Supprimer</button></div>
              <label>Nom (sans espace ni accent, ex. nb_victimes)</label>
              <input value={v.nom || ""} onChange={(e) => upd((n) => (n.variantes[i].nom = e.target.value))} />
              <label>Valeurs possibles (une par ligne)</label>
              <textarea rows={4} value={v.txt || ""} onChange={(e) => upd((n) => (n.variantes[i].txt = e.target.value))} />
              <p className="muted">Utilisation : {"{" + (v.nom || "nom") + "}"}</p>
            </div>
          ))}
          <div className="row">
            <button className="btn" onClick={() => upd((n) => { n.variantes = n.variantes || []; n.variantes.push({ nom: "", txt: "" }); })}>+ Ajouter une variable</button>
            <button className="btn" onClick={() => { const v = tirer(s); setMsg(Object.keys(v).length ? Object.entries(v).map(([k, x]) => k + " = " + x).join(" · ") : "Aucune variable active."); }}>Voir un tirage</button>
          </div>
        </>
      )}

      {tab === "evo" && (
        <>
          <div className="card form">
            <p className="muted">
              Chaque évolution se déclenche automatiquement N minutes après le début de l'exercice du stagiaire. Le message s'affiche en alerte et reste dans l'historique.
              Dans l'onglet Questions / réponses, indique pour chaque question à partir de quelle évolution elle est disponible et quand elle est remplacée (mêmes mots-clés, nouvelle réponse).
            </p>
          </div>
          {(s.evolutions || []).map((ev, i) => (
            <div className="card form" key={ev.id}>
              <div className="row between">
                <strong>Évolution {i + 1}</strong>
                <button className="btn danger" onClick={() => upd((n) => {
                  const id = n.evolutions[i].id;
                  n.evolutions.splice(i, 1);
                  n.qa.forEach((x) => { if (x.evo === id) x.evo = ""; if (x.fin === id) x.fin = ""; });
                })}>Supprimer</button>
              </div>
              <div className="cols">
                <div>
                  <label>Titre (ex. Le feu gagne les combles)</label>
                  <input value={ev.titre} onChange={(e) => upd((n) => (n.evolutions[i].titre = e.target.value))} />
                </div>
                <div>
                  <label>Déclenchement : minutes après le début</label>
                  <input type="number" min="0" value={ev.delai} onChange={(e) => upd((n) => (n.evolutions[i].delai = Number(e.target.value) || 0))} />
                </div>
              </div>
              <label>Information donnée au stagiaire (changement de situation)</label>
              <textarea rows={4} value={ev.message} onChange={(e) => upd((n) => (n.evolutions[i].message = e.target.value))} />
            </div>
          ))}
          <button className="btn" onClick={() => upd((n) => { n.evolutions = n.evolutions || []; n.evolutions.push({ id: "e" + uid(), titre: "", delai: 10, message: "" }); })}>
            + Ajouter une évolution
          </button>
        </>
      )}

      {tab === "qa" && (
        <>
          <div className="card form">
            <strong>Tester la reconnaissance d'une question</strong>
            <div className="row">
              <select value={tw} onChange={(e) => setTw(e.target.value)}>
                <option value="">Interlocuteur…</option>
                {s.interlocuteurs.map((i) => (
                  <option key={i.id} value={i.id}>{i.nom}</option>
                ))}
              </select>
              <input className="grow" value={tq} onChange={(e) => setTq(e.target.value)} placeholder="Tape une question comme le stagiaire…" />
            </div>
            {tq && tw && (
              <p className={testQa ? "ok-txt" : "muted"}>
                {testQa ? `Réponse trouvée : « ${testQa.reponse} »` : "Aucune correspondance → réponse par défaut."}
              </p>
            )}
          </div>

          <div className="row between">
            <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
              <option value="all">Tous les interlocuteurs ({s.qa.length})</option>
              <option value={TOUS}>Réponses « Tous » ({s.qa.filter((x) => x.interlocuteurId === TOUS).length})</option>
              {s.interlocuteurs.map((i) => (
                <option key={i.id} value={i.id}>{i.nom} ({s.qa.filter((x) => x.interlocuteurId === i.id).length})</option>
              ))}
            </select>
            <b>
              {filtre === "all" ? s.qa.length : `${s.qa.filter((x) => x.interlocuteurId === filtre).length} / ${s.qa.length}`} question(s)
            </b>
            <button className="btn" onClick={() => setBqOpen((v) => !v)}>Banque de questions</button>
            <button
              className="btn primary"
              onClick={() =>
                upd((n) =>
                  n.qa.push({
                    id: uid(),
                    interlocuteurId: filtre !== "all" ? filtre : n.interlocuteurs[0]?.id || TOUS,
                    intitule: "",
                    motsCles: "",
                    reponse: "",
                    essentielle: false,
                  })
                )
              }
            >
              + Ajouter une question / réponse
            </button>
          </div>

          {bqOpen && (
            <BanqueQuestions s={s} scId={isNew ? null : id} onClose={() => setBqOpen(false)}
              onImport={(nouv, d) => { upd((n) => n.qa.push(...nouv)); setMsg(`${nouv.length} question(s) importée(s)${d ? `, ${d} doublon(s) ignoré(s)` : ""} (pense à enregistrer).`); }} />
          )}

          {s.qa.map((x, i) =>
            filtre === "all" || x.interlocuteurId === filtre ? (
              <div className="card form" key={x.id}>
                <div className="row between">
                  <select value={x.interlocuteurId} onChange={(e) => upd((n) => (n.qa[i].interlocuteurId = e.target.value))}>
                    <option value={TOUS}>Tous les interlocuteurs</option>
                    {s.interlocuteurs.map((it) => (
                      <option key={it.id} value={it.id}>{it.nom}</option>
                    ))}
                  </select>
                  <div className="row">
                    {s.cubique && (
                      <select value={x.cub || ""} onChange={(e) => upd((n) => (n.qa[i].cub = e.target.value))} title="Rubrique de la reconnaissance cubique">
                        <option value="">Cubique : aucune</option>
                        {CUB.map(([c, l]) => <option key={c} value={c}>{c}. {l}</option>)}
                      </select>
                    )}
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={x.essentielle}
                        onChange={(e) => upd((n) => (n.qa[i].essentielle = e.target.checked))}
                      />
                      Question essentielle
                    </label>
                    <button className="btn danger" onClick={() => upd((n) => n.qa.splice(i, 1))}>
                      Supprimer
                    </button>
                  </div>
                </div>
                {s.evolutif && (
                  <div className="cols">
                    <div>
                      <label>Disponible</label>
                      <select value={x.evo || ""} onChange={(e) => upd((n) => (n.qa[i].evo = e.target.value))}>
                        <option value="">Dès le départ</option>
                        {(s.evolutions || []).map((ev, k) => <option key={ev.id} value={ev.id}>À partir de : {ev.titre || "Évolution " + (k + 1)} ({Number(ev.delai) || 0} min)</option>)}
                      </select>
                    </div>
                    <div>
                      <label>Remplacée</label>
                      <select value={x.fin || ""} onChange={(e) => upd((n) => (n.qa[i].fin = e.target.value))}>
                        <option value="">Jamais</option>
                        {(s.evolutions || []).map((ev, k) => <option key={ev.id} value={ev.id}>À partir de : {ev.titre || "Évolution " + (k + 1)} ({Number(ev.delai) || 0} min)</option>)}
                      </select>
                    </div>
                  </div>
                )}
                <label>Intitulé (pour toi, et pour le bilan) — ex. « Y a-t-il des victimes ? »</label>
                <input value={x.intitule} onChange={(e) => upd((n) => (n.qa[i].intitule = e.target.value))} />
                <label>Mots-clés déclencheurs, séparés par des virgules (sans accent ni pluriel nécessaires)</label>
                <input
                  value={x.motsCles}
                  placeholder="victime, blessé, personne, quelqu'un dedans"
                  onChange={(e) => upd((n) => (n.qa[i].motsCles = e.target.value))}
                />
                <label>Réponse donnée par {interName(x.interlocuteurId)}</label>
                <textarea rows={3} value={x.reponse} onChange={(e) => upd((n) => (n.qa[i].reponse = e.target.value))} />
              </div>
            ) : null
          )}
          <p className="muted">
            Astuce : plusieurs mots dans un même mot-clé (« odeur gaz ») doivent tous apparaître dans la question. Les
            mots proches (singulier/pluriel, « habitant » / « habitants ») sont reconnus.
          </p>
        </>
      )}

      {/* ---------- CORRECTION ---------- */}
      {tab === "smes" && s.smes && (
        <div className="card form">
          {SMES.map((r) => (
            <div key={r.k}>
              <label>
                <b>{r.k === "ms" ? "S" : r.k === "mm" ? "M" : r.k === "me" ? "E" : "S"}</b> – {r.titre} <small className="muted">{r.aide}</small>
              </label>
              <textarea rows={3} value={s.correction[r.k] || ""} onChange={(e) => upd((n) => (n.correction[r.k] = e.target.value))} />
            </div>
          ))}
        </div>
      )}

      {tab === "corr" && (
        <div className="card form">
          {SOIEC.map((r) => (
            <div key={r.k}>
              <label>
                <b>{r.k} – {r.titre}</b> <small className="muted">{r.aide}</small>
              </label>
              <textarea rows={3} value={s.correction[r.k] || ""} onChange={(e) => upd((n) => (n.correction[r.k] = e.target.value))} />
            </div>
          ))}
        </div>
      )}

      {tab === "msgm" && (
        <div className="card form">
          <label><b>Message d'ambiance</b> – message modèle (ambiance / renseignements)</label>
          <textarea rows={9} value={s.correction.message} onChange={(e) => upd((n) => (n.correction.message = e.target.value))} />
        </div>
      )}

      {tab === "crm" && (
        <div className="card form">
          {CRM.map((r) => (
            <div key={r.k}>
              <label><b>{r.titre}</b> <small className="muted">{r.aide}</small></label>
              <textarea rows={3} value={s.correction[r.k] || ""} onChange={(e) => upd((n) => (n.correction[r.k] = e.target.value))} />
            </div>
          ))}
        </div>
      )}

      {tab === "comm" && (
        <div className="card form">
          <label>Commentaire du formateur (points de vigilance, erreurs fréquentes)</label>
          <textarea rows={4} value={s.correction.commentaire} onChange={(e) => upd((n) => (n.correction.commentaire = e.target.value))} />
          {s.cubique && (
            <>
              <label><b>Reconnaissance cubique</b> – synthèse attendue</label>
              <textarea rows={6} value={s.correction.cubique || ""} onChange={(e) => upd((n) => (n.correction.cubique = e.target.value))} />
            </>
          )}
        </div>
      )}
    </>
  );
}
