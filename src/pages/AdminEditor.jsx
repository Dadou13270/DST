import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getScenario, getPhoto, saveScenario } from "../lib/db";
import { compressImage } from "../lib/image";
import { findAnswer } from "../lib/matching";
import { newScenario, uid, SOIEC, TOUS, rubriquesDe } from "../lib/model";
import { listScenarios } from "../lib/db";

const TABS = [
  ["general", "Général"],
  ["situation", "Situation"],
  ["inter", "Interlocuteurs"],
  ["qa", "Questions / réponses"],
  ["corr", "Correction SOIEC"],
];

export default function AdminEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = id === "nouveau";

  const [s, setS] = useState(isNew ? newScenario() : null);
  const [loadedPhoto, setLoadedPhoto] = useState(null);
  const [photo, setPhoto] = useState(undefined); // undefined = inchangée
  const [tab, setTab] = useState("general");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [filtre, setFiltre] = useState("all");
  const [tw, setTw] = useState("");
  const [tq, setTq] = useState("");
  const [rubs, setRubs] = useState(rubriquesDe([]));
  const [nouvelle, setNouvelle] = useState(false);

  useEffect(() => {
    listScenarios(false).then((l) => setRubs(rubriquesDe(l))).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const d = await getScenario(id);
        if (!d) return setMsg("Scénario introuvable.");
        setS(d);
        setLoadedPhoto(await getPhoto(id));
      } catch (e) {
        setMsg("Erreur : " + e.message);
      }
    })();
  }, [id, isNew]);

  if (!s) return <p>{msg || "Chargement…"}</p>;

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
      const nid = await saveScenario(isNew ? null : id, s, photo);
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
        {TABS.map(([k, l]) => (
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
          <label>Photo de la situation</label>
          {shown && <img className="photo prev" src={shown} alt="" />}
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
              <option value="all">Tous les interlocuteurs</option>
              <option value={TOUS}>Réponses « Tous »</option>
              {s.interlocuteurs.map((i) => (
                <option key={i.id} value={i.id}>{i.nom}</option>
              ))}
            </select>
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
      {tab === "corr" && (
        <div className="card form">
          {SOIEC.map((r) => (
            <div key={r.k}>
              <label>
                <b>{r.k}</b> – {r.titre} <small className="muted">{r.aide}</small>
              </label>
              <textarea rows={3} value={s.correction[r.k]} onChange={(e) => upd((n) => (n.correction[r.k] = e.target.value))} />
            </div>
          ))}
          <label><b>Message modèle</b> (message d'ambiance / de renseignements)</label>
          <textarea rows={5} value={s.correction.message} onChange={(e) => upd((n) => (n.correction.message = e.target.value))} />
          <label>Commentaire du formateur (points de vigilance, erreurs fréquentes)</label>
          <textarea rows={4} value={s.correction.commentaire} onChange={(e) => upd((n) => (n.correction.commentaire = e.target.value))} />
        </div>
      )}
    </>
  );
}
