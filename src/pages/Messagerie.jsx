import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { StagiaireNav } from "./Home";
import { useAuth } from "../lib/auth";
import { useMessages, envoyer, marquerLus, conversations, monGestionnaire } from "../lib/messages";
import { listMesEquipes, listMembres } from "../lib/equipes";

const quand = (ms) => new Date(ms).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

export default function Messagerie() {
  const { user, profil } = useAuth();
  const [sp] = useSearchParams();
  const msgs = useMessages(user?.uid);
  const convs = useMemo(() => conversations(msgs, user?.uid), [msgs, user?.uid]);
  const [sel, setSel] = useState(null);
  const [txt, setTxt] = useState("");
  const [err, setErr] = useState("");
  const [gest, setGest] = useState(null);
  const [membres, setMembres] = useState([]);
  const bas = useRef(null);

  // mon gestionnaire (si stagiaire rattaché) et mes stagiaires (si gestionnaire)
  useEffect(() => { monGestionnaire(profil).then(setGest).catch(() => {}); }, [profil?.equipeId]); // eslint-disable-line
  useEffect(() => {
    if (!profil?.gestionnaire || !user) return;
    listMesEquipes(user.uid).then((ts) => Promise.all(ts.map((t) => listMembres(t.id)))).then((l) => setMembres(l.flat().filter((m) => m.id !== user.uid))).catch(() => {});
  }, [profil?.gestionnaire, user?.uid]); // eslint-disable-line

  // conversation active : choisie, ou demandée dans l'adresse (?avec=), ou la plus récente
  const nouvelle = useMemo(() => {
    const avec = sp.get("avec");
    if (sel && sel.startsWith("new:")) return sel.slice(4);
    return avec && !convs.some((c) => c.stagId === avec || c.gestId === avec) ? avec : null;
  }, [sel, sp, convs]);
  const avec = sp.get("avec");
  const parAvec = avec ? convs.find((c) => (c.stagId === avec && c.gestId === user?.uid) || (c.gestId === avec && c.stagId === user?.uid)) : null;
  const actif = convs.find((c) => c.id === sel) || (!sel && parAvec) || (!nouvelle && !sel ? convs[0] : null);
  useEffect(() => {
    if (!actif) return;
    const ids = actif.msgs.filter((m) => m.de !== user.uid && !m.lu).map((m) => m.id);
    if (ids.length) marquerLus(ids).catch(() => {});
    bas.current?.scrollIntoView?.({ block: "end" });
  }, [actif?.id, actif?.msgs.length]); // eslint-disable-line

  // destinataire courant (pour une conversation vide)
  const dest = actif
    ? { stagId: actif.stagId, stagNom: actif.stagNom, gestId: actif.gestId, gestNom: actif.gestNom }
    : nouvelle
      ? (nouvelle === gest?.id
        ? { stagId: user.uid, stagNom: profil?.nom || "", gestId: gest.id, gestNom: gest.nom }
        : (() => { const m = membres.find((x) => x.id === nouvelle); return m ? { stagId: m.id, stagNom: m.nom || "", gestId: user.uid, gestNom: profil?.nom || "" } : null; })())
      : null;
  const nomDest = actif ? actif.nomAutre : dest ? (dest.stagId === user.uid ? dest.gestNom : dest.stagNom) : "";

  const envoi = async (e) => {
    e.preventDefault();
    if (!dest || !txt.trim()) return;
    setErr("");
    try { await envoyer({ ...dest, de: user.uid, texte: txt }); setTxt(""); if (!actif) setSel(dest.stagId + "_" + dest.gestId); }
    catch (x) { setErr(x.code === "permission-denied" ? "Envoi refusé : ce contact n'est plus dans ton équipe." : x.message); }
  };
  const peutNouveau = [
    ...(gest && !convs.some((c) => c.gestId === gest.id && c.stagId === user.uid) ? [{ id: gest.id, nom: `${gest.nom} (mon gestionnaire)` }] : []),
    ...membres.filter((m) => !convs.some((c) => c.stagId === m.id && c.gestId === user.uid)).map((m) => ({ id: m.id, nom: m.nom || m.email })),
  ];

  return (
    <Layout>
      <StagiaireNav />
      <h1>Messagerie</h1>
      <p className="muted">Échanges privés entre un stagiaire et son gestionnaire. Seuls les deux participants lisent les messages.</p>
      <div className="msg-wrap">
        <aside className="msg-list card">
          {peutNouveau.length > 0 && (
            <select value="" onChange={(e) => e.target.value && setSel("new:" + e.target.value)} aria-label="Nouveau message">
              <option value="">＋ Nouveau message…</option>
              {peutNouveau.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
            </select>
          )}
          {convs.length === 0 && !nouvelle && <p className="muted">Aucune conversation.{gest ? "" : " Rejoins une équipe pour écrire à ton gestionnaire."}</p>}
          {convs.map((c) => (
            <button key={c.id} className={"msg-c" + (actif?.id === c.id ? " on" : "")} onClick={() => setSel(c.id)}>
              <span className="msg-n">{c.nomAutre}{c.nonLus > 0 && <b className="msg-badge">{c.nonLus}</b>}</span>
              <span className="muted msg-p">{c.dernier.de === user.uid ? "Moi : " : ""}{c.dernier.texte.slice(0, 60)}</span>
              <span className="muted msg-d">{quand(c.dernier.le)}</span>
            </button>
          ))}
        </aside>
        <section className="msg-fil card">
          {!actif && !dest && <p className="muted">Choisis une conversation.</p>}
          {(actif || dest) && (
            <>
              <h3 style={{ marginTop: 0 }}>{nomDest}</h3>
              <div className="msg-bulles">
                {actif && actif.msgs.map((m) => (
                  <div key={m.id} className={"msg-b" + (m.de === user.uid ? " me" : "")}>
                    <div>{m.texte}</div>
                    <small>{quand(m.le)}{m.de === user.uid ? (m.lu ? " · lu" : " · envoyé") : ""}</small>
                  </div>
                ))}
                {!actif && <p className="muted">Nouvelle conversation avec {nomDest}.</p>}
                <div ref={bas} />
              </div>
              <form onSubmit={envoi}>
                <textarea rows={3} maxLength={2000} placeholder="Écris ton message…" value={txt} onChange={(e) => setTxt(e.target.value)} />
                <div className="row between item">
                  <span className="muted">{txt.length} / 2000</span>
                  <button className="btn primary" disabled={!txt.trim()}>Envoyer</button>
                </div>
                {err && <p className="err">{err}</p>}
              </form>
            </>
          )}
        </section>
      </div>
    </Layout>
  );
}
