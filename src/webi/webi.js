// Webinaires en direct : salles avec lien, visio intégrée (WebRTC, signalisation par la base), inscrits, lever de main et messages en direct.
// Module autonome : webiMount(element, opts). Utilisé tel quel par l'application React et la page hébergée.
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const br = (s) => esc(s).replace(/\n/g, "<br>");
const clone = (x) => JSON.parse(JSON.stringify(x));
const code8 = () => { const a = "abcdefghjkmnpqrstuvwxyz23456789"; let c = ""; for (let i = 0; i < 8; i++) c += a[Math.floor(Math.random() * a.length)]; return c; };
const quand = (t) => (t ? new Date(t).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) : "Date non précisée");
const heure = (t) => new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const local = (t) => { if (!t) return ""; const d = new Date(t), p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
const OUV = 600000; // les participants se connectent jusqu'à 10 min avant le début
const dec = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)), j = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60, p = (n) => String(n).padStart(2, "0"); return (j ? j + " j " : "") + (j || h ? p(h) + " h " : "") + p(m) + " min " + p(x) + " s"; };
const ETAT = { prevu: ["Prévu", ""], direct: ["🔴 En direct", "r"], fini: ["Terminé", ""] };
export const nouveau = () => ({ titre: "", description: "", debut: Date.now() + 86400000, duree: 60, etat: "prevu", now: false });
const ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  { urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443", "turns:openrelay.metered.ca:443?transport=tcp"], username: "openrelayproject", credential: "openrelayproject" }];

const CSS = `.wb{width:100%;font:inherit}.wb *{box-sizing:border-box}
.wb .cd{background:var(--card,#fff);border:1px solid var(--line,#d8dde1);border-radius:12px;padding:14px;margin:10px 0}
.wb .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.wb .bt{justify-content:space-between}.wb .m{color:var(--mut,#6b7280)}
.wb h2,.wb h3{margin:0 0 6px}.wb label{display:block;font-weight:600;margin:10px 0 4px}
.wb input,.wb select,.wb textarea{width:100%;font:inherit;padding:8px 10px;border:1px solid var(--line,#d8dde1);border-radius:8px;background:var(--card,#fff);color:inherit}.wb textarea{min-height:70px;resize:vertical}
.wb .b{font:inherit;font-weight:600;padding:8px 14px;border-radius:10px;border:1px solid var(--line,#d8dde1);background:var(--card,#fff);color:inherit;cursor:pointer;text-decoration:none;display:inline-block}.wb .b.p{background:var(--red,#c42a1c);border-color:var(--red,#c42a1c);color:#fff}.wb .b.x{color:#b3261e;border-color:#b3261e}.wb .b.s{padding:5px 10px;font-size:.88em}.wb .b.g{background:#1f8a4c;border-color:#1f8a4c;color:#fff}
.wb .tg{display:inline-block;padding:2px 10px;border-radius:99px;font-size:.78rem;font-weight:700;border:1px solid var(--line,#d8dde1);white-space:nowrap}.wb .tg.r{background:var(--red,#c42a1c);color:#fff;border-color:var(--red,#c42a1c)}
.wb .g2{display:grid;grid-template-columns:2fr 1fr;gap:12px}@media(max-width:800px){.wb .g2{grid-template-columns:1fr}}
.wb .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}.wb .err{color:#b3261e;font-weight:600}
.wb .feed{height:340px;overflow:auto;border:1px solid var(--line,#d8dde1);border-radius:10px;padding:8px;background:rgba(127,127,127,.06)}
.wb .msg{margin:0 0 8px;line-height:1.35;overflow-wrap:anywhere}.wb .msg b{margin-right:6px}.wb .msg .h{color:var(--mut,#6b7280);font-size:.8em;margin-left:6px}
.wb .pl{list-style:none;margin:0;padding:0;max-height:300px;overflow:auto}.wb .pl li{display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid rgba(127,127,127,.15)}
.wb .dot{width:9px;height:9px;border-radius:50%;background:#9aa0a6;flex:none}.wb .dot.on{background:#1f8a4c}
.wb .ban{border-left:4px solid #1f8a4c;background:rgba(31,138,76,.12);padding:10px 12px;border-radius:0 8px 8px 0;margin:10px 0;font-weight:600}
.wb .lk{font-family:monospace;font-size:.9em}
.wb .stage{position:relative;background:#000;border-radius:10px;overflow:hidden;aspect-ratio:16/9}.wb .stage video{width:100%;height:100%;object-fit:contain;display:block;background:#000}.wb .cdn{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(10,20,40,.9);color:#fff;text-align:center;padding:12px}.wb .cdt{font-size:2.4rem;font-weight:700;font-variant-numeric:tabular-nums}.wb .pvt{position:relative;width:160px;aspect-ratio:16/9;background:#000;border-radius:3px;overflow:hidden}.wb .pvt video{width:100%;height:100%;object-fit:cover;display:block}.wb .pvt span{position:absolute;left:4px;bottom:4px;color:#fff;background:rgba(0,0,0,.55);font-size:.75em;padding:1px 6px;border-radius:3px}.wb .vs{position:absolute;left:8px;bottom:8px;right:8px;color:#fff;background:rgba(0,0,0,.55);padding:3px 8px;border-radius:6px;font-size:.85em}`;
function css() { if (!document.getElementById("wb-css")) { const s = document.createElement("style"); s.id = "wb-css"; s.textContent = CSS; document.head.appendChild(s); } }

let S = null; // état conservé entre deux affichages de la page

export function webiDetach() { arreter(); coupure(); S = null; }
// Démontage léger (la page se réaffiche) : la diffusion continue.
export function webiSoft() { arreter(); }
function arreter() {
  if (!S) return;
  if (S.hb) clearInterval(S.hb); S.hb = null;
  if (S.cdT) clearInterval(S.cdT); S.cdT = null;
  if (S.un) { try { S.un(); } catch (e) { /* ignore */ } } S.un = null;
  ["un2", "un3"].forEach((k) => { if (S[k]) { try { S[k](); } catch (e) { /* ignore */ } } S[k] = null; });
}
// Arrêt complet de la visio (diffusion, connexions, micro) : en quittant la salle ou la page.
function coupure() {
  const r = S && S.R; if (!r) return;
  if (r.h) { const h = r.h; try { if (h.scr) h.scr.stop(); } catch (e) { /* ignore */ } Object.values(h.peers).forEach(fermerPeer); try { h.cam.getTracks().forEach((t) => t.stop()); h.ctx.close(); } catch (e) { /* ignore */ } }
  if (r.v) { try { if (r.v.mic) r.v.mic.getTracks().forEach((t) => t.stop()); if (r.v.cam) r.v.cam.getTracks().forEach((t) => t.stop()); if (r.v.pc) r.v.pc.close(); } catch (e) { /* ignore */ } }
  S.R = null;
}
function fermerPeer(p) {
  try { p.pc.close(); } catch (e) { /* ignore */ }
  try { if (p.au) p.au.srcObject = null; if (p.src) p.src.disconnect(); if (p.gn) p.gn.disconnect(); } catch (e) { /* ignore */ }
}

export default function webiMount(el, o) {
  css(); arreter();
  if (!S || S.uid !== o.uid) S = { uid: o.uid, vue: "liste", liste: null, dr: null, id: null, msg: "", err: "", conf: null, W: null };
  const ST = S;
  ST.o = o;
  el.classList.add("wb");

  const charger = () => o.list().then((l) => { ST.liste = l; if (ST.vue === "liste") rend(); }).catch((e) => { ST.liste = []; ST.err = "Lecture impossible : " + (e.message || e.code); if (ST.vue === "liste") rend(); });
  const peut = (w) => o.isAdmin || w.owner === o.uid;
  const ouvrable = (w) => peut(w) || !w.debut || w.etat === "direct" || w.etat === "fini" || Date.now() >= w.debut - OUV;
  const ordre = (l) => [...l].sort((a, b) => { const r = (x) => (x.etat === "direct" ? 0 : x.etat === "fini" ? 2 : 1); return r(a) - r(b) || (r(a) === 2 ? (b.debut || 0) - (a.debut || 0) : (a.debut || 0) - (b.debut || 0)); });

  // ---------- liste
  function vueListe() {
    const l = ST.liste;
    let h = `<h2>🎥 Webinaires</h2><p class="m">Salles de formation en direct : rejoins la salle par son lien, lève la main pour intervenir et écris tes messages en direct.</p>${ST.msg ? `<p class="m">${esc(ST.msg)}</p>` : ""}${ST.err ? `<p class="err">${esc(ST.err)}</p>` : ""}`;
    if (o.canEdit) h += `<div class="row"><button class="b p" data-a="new">➕ Créer une salle</button></div>`;
    if (!l) return h + `<p class="m">Chargement…</p>`;
    if (!l.length) return h + `<div class="cd"><p class="m">Aucun webinaire pour le moment.</p></div>`;
    return h + `<div class="grid" style="margin-top:12px">${ordre(l).map((w) => { const e = ETAT[w.etat] || ETAT.prevu;
      return `<div class="cd" style="margin:0"><b>${esc(w.titre || "Sans titre")}</b> <span class="tg ${e[1]}">${e[0]}</span><div class="m">${esc(quand(w.debut))}${w.duree ? " · " + w.duree + " min" : ""}</div><div class="m">Animé par ${esc(w.ownerNom || "—")}</div>${w.etat !== "fini" ? `<div class="m">🔓 Connexion possible 10 min avant le début${w.debut ? " (dès " + heure(w.debut - OUV) + ")" : ""}, avec compte à rebours.</div>` : ""}${w.description ? `<p style="margin:6px 0">${br(w.description)}</p>` : ""}
      <div class="row" style="margin-top:8px"><button class="b p s" data-a="ouvrir" data-i="${esc(w.id)}">${w.etat === "direct" ? "▶ Rejoindre" : ouvrable(w) ? "Ouvrir la salle" : "Ouvre à " + heure(w.debut - OUV)}</button>${o.canEdit && peut(w) ? `<button class="b s" data-a="edit" data-i="${esc(w.id)}">✏️ Modifier</button>${ST.conf === w.id ? `<button class="b s x" data-a="delok" data-i="${esc(w.id)}">Confirmer</button><button class="b s" data-a="delno">Annuler</button>` : `<button class="b s x" data-a="del" data-i="${esc(w.id)}">Supprimer</button>`}` : ""}</div></div>`; }).join("")}</div>`;
  }

  // ---------- édition
  function lire() {
    if (!ST.dr) return;
    el.querySelectorAll("[data-k]").forEach((x) => {
      const k = x.dataset.k;
      if (k === "now") ST.dr.now = x.checked;
      else if (k === "debut") { const t = new Date(x.value).getTime(); ST.dr.debut = isNaN(t) ? ST.dr.debut : t; }
      else if (k === "duree") ST.dr.duree = Math.max(0, Number(x.value) || 0);
      else ST.dr[k] = x.value;
    });
  }
  function vueEdit() {
    const d = ST.dr;
    return `<h2>${ST.id ? "Modifier" : "Nouvelle"} salle de webinaire</h2>${ST.err ? `<p class="err">${esc(ST.err)}</p>` : ""}
    <div class="cd"><label>Titre</label><input data-k="titre" value="${esc(d.titre)}" maxlength="120"><label>Description</label><textarea data-k="description" rows="3" maxlength="600">${esc(d.description)}</textarea>
    <div class="row" style="align-items:flex-end"><div style="flex:1;min-width:200px"><label>Date et heure</label><input type="datetime-local" data-k="debut" value="${esc(local(d.debut))}"></div><div style="width:140px"><label>Durée (min)</label><input type="number" min="0" data-k="duree" value="${esc(d.duree)}"></div></div>
    <label class="row" style="gap:8px;align-items:center;font-weight:400"><input type="checkbox" data-k="now" style="width:auto"${d.now ? " checked" : ""}> Démarrer maintenant (sans programmation)</label>
    <p class="m" style="margin:6px 0 0">Webinaire programmé : les participants peuvent se connecter 10 minutes avant l'heure prévue et voient un compte à rebours jusqu'au début.</p></div>
    <div class="row"><button class="b p" data-a="save">Enregistrer</button><button class="b" data-a="annuler">Annuler</button></div>`;
  }

  // ---------- salle
  const W = () => ST.W;
  const enLigne = (p) => Date.now() - (p.vu || 0) < 60000;
  function vueSalle() {
    const w = W().w;
    if (w === null) return `<p class="err">Salle introuvable.</p><button class="b" data-a="retour">← Webinaires</button>`;
    if (!w) return `<p class="m">Chargement…</p>`;
    const e = ETAT[w.etat] || ETAT.prevu, host = peut(w);
    if (!ouvrable(w)) return `<div class="row bt"><h2 style="margin:0">${esc(w.titre)} <span class="tg ${e[1]}">${e[0]}</span></h2><button class="b s" data-a="retour">← Webinaires</button></div>
    <p class="m">${esc(quand(w.debut))}${w.duree ? " · " + w.duree + " min" : ""} · Animé par ${esc(w.ownerNom || "—")}</p>
    <div class="cd" style="text-align:center"><p class="m" style="margin:0">La salle ouvre 10 minutes avant le début, à ${heure(w.debut - OUV)}.</p><p style="margin:10px 0 0">Ouverture dans</p><div class="cdt" id="wb-cdc" style="font-size:2rem;font-weight:700">${dec(w.debut - OUV - Date.now())}</div></div>`;
    return `<div class="row bt"><h2 style="margin:0">${esc(w.titre)} <span class="tg ${e[1]}">${e[0]}</span></h2><button class="b s" data-a="retour">← Webinaires</button></div>
    <p class="m">${esc(quand(w.debut))}${w.duree ? " · " + w.duree + " min" : ""} · Animé par ${esc(w.ownerNom || "—")}</p>
    <div class="cd">${w.description ? `<p style="margin:0 0 10px">${br(w.description)}</p>` : ""}<div id="wb-act" class="row"></div>
      <div class="row" style="margin-top:10px"><span class="m">Lien de la salle :</span><span class="lk" style="flex:1;min-width:0;overflow-wrap:anywhere">${esc(o.lien(W().code))}</span><button class="b s" data-a="copy">Copier le lien</button></div></div>
    <div class="cd"><div class="stage"><video id="wb-v" autoplay playsinline></video><div class="cdn" id="wb-cd"><div>Le webinaire commence dans</div><div class="cdt"></div><div style="margin-top:6px;font-size:.9em">${esc(quand(w.debut))}</div></div><div class="vs" id="wb-vs"></div></div><div id="wb-pv" class="row" style="margin-top:8px;gap:8px"></div><div id="wb-ctl" class="row" style="margin-top:8px"></div>
      <p class="m" style="margin:8px 0 0">Visio intégrée : caméra, micro et partage d'écran de l'animateur. Pour parler, lève la main : l'animateur peut te donner la parole, puis tu peux activer ou couper ton micro et ta caméra. Un casque évite l'écho.</p></div>
    <div id="wb-par"></div>
    <div class="g2"><div class="cd"><h3>💬 Messages en direct</h3><div class="feed" id="wb-ms"></div><div class="row" style="margin-top:8px;flex-wrap:nowrap"><input id="wb-in" maxlength="400" placeholder="Écrire un message…" autocomplete="off"><button class="b p" data-a="send">Envoyer</button></div></div>
    <div><div class="cd"><h3>✋ Mains levées</h3><div id="wb-mn"></div></div><div class="cd"><h3 id="wb-nb">👥 Inscrits</h3><ul class="pl" id="wb-ps"></ul></div></div></div>`;
  }
  function majSalle() {
    const Wd = W(); if (!Wd || !Wd.w) return;
    const w = Wd.w, host = peut(w), ps = Wd.ps || [], ms = Wd.ms || [], moi = ps.find((p) => p.uid === o.uid) || {};
    const $ = (id) => el.querySelector("#" + id); if (!$("wb-act")) return;
    let a = "";
    if (!host) a += `<button class="b ${moi.main ? "x" : ""}" data-a="main">${moi.main ? "✋ Baisser la main" : "✋ Lever la main"}</button>`;
    else a += R().h ? `<button class="b x" data-a="hstop">Terminer le webinaire</button>` : `<button class="b g" data-a="hstart">${w.etat === "fini" ? "Rouvrir et diffuser" : "📡 Démarrer le direct"}</button>`;
    $("wb-act").innerHTML = a;
    $("wb-par").innerHTML = !host && moi.parole ? `<div class="ban">🎤 L'animateur t'a donné la parole : clique sur « Prendre la parole » sous la vidéo.</div>` : "";
    if (host) hGains(ps); else { if (!moi.parole && R().v && R().v.mic) vMic().catch(() => {}); if (!moi.parole && R().v && R().v.cam) coupeCam(R().v); }
    majPv();
    ctl(host, moi, ps);
    const mains = ps.filter((p) => p.main).sort((x, y) => (x.mainT || 0) - (y.mainT || 0));
    $("wb-mn").innerHTML = mains.length ? `<ul class="pl">${mains.map((p) => `<li><span style="flex:1">✋ <b>${esc(p.nom)}</b>${p.parole ? ' <span class="tg">a la parole</span>' : ""}</span>${host ? `<button class="b s g" data-a="parole" data-u="${esc(p.uid)}">${p.parole ? "Retirer la parole" : "Donner la parole"}</button><button class="b s" data-a="baisse" data-u="${esc(p.uid)}">Baisser</button>` : ""}</li>`).join("")}</ul>` : '<p class="m" style="margin:0">Aucune main levée.</p>';
    const tri = [...ps].sort((x, y) => (enLigne(y) ? 1 : 0) - (enLigne(x) ? 1 : 0) || String(x.nom).localeCompare(String(y.nom), "fr"));
    const on = ps.filter(enLigne).length;
    $("wb-nb").textContent = `👥 Inscrits : ${ps.length}${ps.length ? " · en ligne : " + on : ""}`;
    $("wb-ps").innerHTML = tri.map((p) => `<li><span class="dot ${enLigne(p) ? "on" : ""}"></span><span style="flex:1">${esc(p.nom)}${p.uid === w.owner ? ' <span class="tg">animateur</span>' : ""}</span>${p.main ? "✋" : ""}</li>`).join("") || '<li class="m">Personne pour le moment.</li>';
    const f = $("wb-ms"), bas = f.scrollHeight - f.scrollTop - f.clientHeight < 60;
    f.innerHTML = [...ms].sort((x, y) => (x.t || 0) - (y.t || 0)).map((m) => `<p class="msg"><b>${esc(m.nom)}</b>${esc(m.txt)}<span class="h">${heure(m.t || Date.now())}</span>${host ? ` <a href="#" data-a="delmsg" data-i="${esc(m.id)}" title="Supprimer le message" style="text-decoration:none">🗑</a>` : ""}</p>`).join("") || '<p class="m">Aucun message.</p>';
    if (bas) f.scrollTop = f.scrollHeight;
  }
  // ---------- visio (WebRTC) : l'animateur diffuse vers chaque participant ; signalisation via la base
  const R = () => (ST.R = ST.R || { h: null, v: null, seen: {}, st: "", sigDocs: [] });
  const stage = () => el.querySelector("#wb-v");
  const statut = (t) => { R().st = t; const x = el.querySelector("#wb-vs"); if (x) x.textContent = t; };
  const mediaOk = () => navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  function attacherLocal() { const v = stage(), h = R().h; if (v && h) { v.muted = true; v.srcObject = new MediaStream(h.scr ? [h.scr] : h.vtrack ? [h.vtrack] : []); v.play().catch(() => {}); } }
  function brancher() { const v = stage(), r = R().v; if (!v || !r || !r.stream) return; if (v.srcObject !== r.stream) v.srcObject = r.stream; v.muted = !!r.mute; v.play().catch(() => { if (!r.mute) { r.mute = true; v.muted = true; v.play().catch(() => {}); majSalle(); } }); }
  async function hStart() {
    const r = R(); if (r.h) return;
    if (!mediaOk()) throw new Error("Caméra indisponible : ouvre l'application dans un navigateur récent (HTTPS) et autorise la caméra.");
    let cam = null;
    try { cam = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: { ideal: 1280 }, height: { ideal: 720 } } }); }
    catch (e1) { try { cam = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e2) { try { cam = await navigator.mediaDevices.getUserMedia({ video: true }); } catch (e3) { throw new Error("Accès à la caméra et au micro refusé ou impossible : autorise-les dans le navigateur."); } } }
    const AC = window.AudioContext || window.webkitAudioContext, ctx = new AC(), mix = ctx.createMediaStreamDestination();
    try { await ctx.resume(); } catch (e) { /* ignore */ }
    const h = { cam, ctx, mix, peers: {}, micOn: true, camOn: true, scr: null };
    const at = cam.getAudioTracks()[0];
    if (at) { h.micGain = ctx.createGain(); ctx.createMediaStreamSource(new MediaStream([at])).connect(h.micGain); h.micGain.connect(mix); }
    h.mixTrack = mix.stream.getAudioTracks()[0]; h.vtrack = cam.getVideoTracks()[0] || null;
    r.h = h; r.seen = {}; attacherLocal(); statut("En direct");
    await o.setEtat(W().code, "direct");
    r.sigDocs.forEach(hSig);
  }
  function hSig(d) {
    const h = R().h; if (!h || !d.viewer) return;
    const p = h.peers[d.viewer];
    if (!d.want) { if (p) { fermerPeer(p); delete h.peers[d.viewer]; } return; }
    if (!p || p.n !== d.want) { hPeer(d.viewer, d.want).catch(() => {}); return; }
    if (d.answer && d.answerN === p.n && !p.ans) { p.ans = true; p.pc.setRemoteDescription(JSON.parse(d.answer)).then(() => { p.ok = true; p.q.forEach((c) => p.pc.addIceCandidate(c).catch(() => {})); p.q = []; }).catch(() => {}); }
  }
  async function hPeer(viewer, n) {
    const h = R().h, old = h.peers[viewer]; if (old) fermerPeer(old);
    const pc = new RTCPeerConnection({ iceServers: o.ice || ICE });
    const p = h.peers[viewer] = { pc, n, q: [], ans: false, ok: false };
    pc.addTransceiver(h.mixTrack, { direction: "sendrecv" });
    p.vs = pc.addTransceiver(h.scr || h.vtrack || "video", { direction: "sendrecv" }).sender;
    pc.onicecandidate = (e) => { if (e.candidate) o.candAdd(W().code, viewer, "h", n, JSON.stringify(e.candidate)).catch(() => {}); };
    pc.ontrack = (e) => {
      if (e.track.kind === "video") { p.vin = new MediaStream([e.track]); majPv(); return; }
      if (e.track.kind !== "audio" || p.src) return;
      const st = e.streams[0] || new MediaStream([e.track]);
      const au = new Audio(); au.srcObject = st; au.muted = true; p.au = au; au.play().catch(() => {});
      p.src = h.ctx.createMediaStreamSource(st); p.gn = h.ctx.createGain(); p.gn.gain.value = 0; p.src.connect(p.gn); p.gn.connect(h.mix); p.gn.connect(h.ctx.destination);
      hGains(W().ps || []);
    };
    pc.onconnectionstatechange = () => majSalle();
    const off = await pc.createOffer(); await pc.setLocalDescription(off);
    await o.sigSet(W().code, viewer, { offer: JSON.stringify(pc.localDescription), offerN: n });
  }
  function hCand(c) {
    const h = R().h; if (!h || c.from !== "v" || R().seen[c.id]) return;
    const p = h.peers[c.viewer]; if (!p || p.n !== c.n) return;
    R().seen[c.id] = 1; const ic = JSON.parse(c.c);
    if (p.ok) p.pc.addIceCandidate(ic).catch(() => {}); else p.q.push(ic);
  }
  function hGains(ps) {
    const h = R().h; if (!h) return;
    Object.entries(h.peers).forEach(([u, p]) => {
      const x = (ps || []).find((q) => q.uid === u);
      if (p.gn) p.gn.gain.value = x && x.parole ? 1 : 0;
      if (x && Date.now() - (x.vu || 0) > 120000) { fermerPeer(p); delete h.peers[u]; }
    });
  }
  function remplacer(t) { const h = R().h; Object.values(h.peers).forEach((p) => p.vs && p.vs.replaceTrack(t).catch(() => {})); attacherLocal(); majSalle(); }
  function finEcran() { const h = R().h; if (h && h.scr) { try { h.scr.stop(); } catch (e) { /* ignore */ } h.scr = null; remplacer(h.vtrack); } }
  async function hEcran() {
    const h = R().h; if (!h) return;
    if (h.scr) { finEcran(); return; }
    if (!navigator.mediaDevices.getDisplayMedia) throw new Error("Partage d'écran non disponible sur cet appareil.");
    const st = await navigator.mediaDevices.getDisplayMedia({ video: true }); const t = st.getVideoTracks()[0];
    h.scr = t; t.onended = () => finEcran(); remplacer(t);
  }
  async function hStop() {
    const r = R(); if (r.h) { finEcran(); const h = r.h; Object.values(h.peers).forEach(fermerPeer); try { h.cam.getTracks().forEach((t) => t.stop()); h.ctx.close(); } catch (e) { /* ignore */ } r.h = null; }
    const v = stage(); if (v) v.srcObject = null;
    await o.setEtat(W().code, "fini"); statut("Webinaire terminé");
  }
  function vJoin(force) {
    const r = R(), code = W().code;
    if (r.v && !force) return;
    if (r.v && r.v.pc) { try { r.v.pc.close(); } catch (e) { /* ignore */ } }
    const n = Date.now(); r.v = { n, pc: null, q: [], ok: false, answered: false, stream: null, mute: false, mic: null, state: "" };
    statut("En attente de l'animateur…");
    o.sigSet(code, o.uid, { web: code, viewer: o.uid, nom: o.nom || "Participant", want: n }).catch(() => {});
  }
  async function vSig(d) {
    const v = R().v; if (!v || !d.offer || d.offerN !== v.n || v.answered) return;
    v.answered = true;
    const pc = v.pc = new RTCPeerConnection({ iceServers: o.ice || ICE });
    pc.onicecandidate = (e) => { if (e.candidate) o.candAdd(W().code, o.uid, "v", v.n, JSON.stringify(e.candidate)).catch(() => {}); };
    pc.ontrack = (e) => { v.stream = v.stream || new MediaStream(); v.stream.addTrack(e.track); brancher(); };
    pc.onconnectionstatechange = () => {
      v.state = pc.connectionState;
      statut(v.state === "connected" ? "En direct" : v.state === "failed" ? "Connexion impossible (réseau bloqué ?)" : "Connexion…");
      if (v.state === "failed" || v.state === "disconnected") setTimeout(() => { if (R().v === v && v.pc.connectionState !== "connected") vJoin(true); }, 4000);
      majSalle();
    };
    await pc.setRemoteDescription(JSON.parse(d.offer));
    pc.getTransceivers().forEach((t) => { if (t.receiver.track && (t.receiver.track.kind === "audio" || t.receiver.track.kind === "video")) t.direction = "sendrecv"; });
    v.ok = true; v.q.forEach((c) => pc.addIceCandidate(c).catch(() => {})); v.q = [];
    const ans = await pc.createAnswer(); await pc.setLocalDescription(ans);
    await o.sigSet(W().code, o.uid, { answer: JSON.stringify(pc.localDescription), answerN: v.n });
  }
  function vCand(c) {
    const v = R().v; if (!v || c.from !== "h" || c.n !== v.n || R().seen[c.id]) return;
    R().seen[c.id] = 1; const ic = JSON.parse(c.c);
    if (v.ok) v.pc.addIceCandidate(ic).catch(() => {}); else v.q.push(ic);
  }
  async function vMic() {
    const v = R().v; if (!v || !v.pc) return;
    const t = v.pc.getTransceivers().find((x) => x.receiver.track && x.receiver.track.kind === "audio"); if (!t) return;
    if (v.mic) { v.mic.getTracks().forEach((x) => x.stop()); v.mic = null; await t.sender.replaceTrack(null); majSalle(); return; }
    if (!mediaOk()) throw new Error("Micro indisponible sur cet appareil.");
    v.mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    await t.sender.replaceTrack(v.mic.getAudioTracks()[0]); majSalle();
  }
  function coupeCam(v) {
    if (!v || !v.cam) return;
    v.cam.getTracks().forEach((x) => x.stop()); v.cam = null;
    const t = v.pc && v.pc.getTransceivers().find((x) => x.receiver.track && x.receiver.track.kind === "video"); if (t) t.sender.replaceTrack(null).catch(() => {});
    o.maj(W().code, { cam: false }).catch(() => {});
  }
  async function vCam() {
    const v = R().v; if (!v || !v.pc) return;
    if (v.cam) { coupeCam(v); majSalle(); return; }
    const t = v.pc.getTransceivers().find((x) => x.receiver.track && x.receiver.track.kind === "video"); if (!t) throw new Error("Vidéo pas encore connectée : réessaie dans un instant.");
    if (!mediaOk()) throw new Error("Caméra indisponible sur cet appareil.");
    v.cam = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 360 } } });
    await t.sender.replaceTrack(v.cam.getVideoTracks()[0]);
    o.maj(W().code, { cam: true }).catch(() => {}); majSalle();
  }
  // Vignettes caméra : l'animateur voit les participants qui ont la parole et la caméra active ; chaque participant voit sa propre caméra.
  function majPv() {
    const box = el.querySelector("#wb-pv"), Wd = W(); if (!box || !Wd || !Wd.w) return;
    const r = R(), host = peut(Wd.w), ps = Wd.ps || [], want = [];
    if (host) { if (r.h) Object.entries(r.h.peers).forEach(([u, p]) => { const x = ps.find((q) => q.uid === u); if (p.vin && x && x.cam && x.parole) want.push([u, (x.nom || "Participant"), p.vin]); }); }
    else if (r.v && r.v.cam) want.push(["moi", "Ma caméra", r.v.cam]);
    [...box.children].forEach((c) => { const w = want.find((q) => q[0] === c.dataset.u); if (!w) c.remove(); });
    want.forEach(([u, nom, st]) => {
      let c = [...box.children].find((x) => x.dataset.u === u);
      if (!c) { c = document.createElement("div"); c.className = "pvt"; c.dataset.u = u; c.innerHTML = '<video autoplay playsinline muted></video><span></span>'; box.appendChild(c); }
      c.querySelector("span").textContent = nom;
      const vid = c.querySelector("video"); if (vid.srcObject !== st) { vid.srcObject = st; vid.play().catch(() => {}); }
    });
  }
  function ctl(host, moi, ps) {
    const c = el.querySelector("#wb-ctl"); if (!c) return;
    const r = R();
    if (host) {
      const h = r.h;
      if (!h) { c.innerHTML = '<span class="m">Clique sur « Démarrer le direct » : autorise la caméra et le micro, puis les participants te voient et t\'entendent.</span>'; return; }
      const nb = Object.values(h.peers).filter((p) => p.pc.connectionState === "connected").length;
      c.innerHTML = `<button class="b s ${h.micOn ? "" : "x"}" data-a="hmic">${h.micOn ? "🎤 Micro actif" : "🔇 Micro coupé"}</button><button class="b s ${h.camOn ? "" : "x"}" data-a="hcam">${h.vtrack ? (h.camOn ? "📷 Caméra active" : "🚫 Caméra coupée") : "Pas de caméra"}</button><button class="b s ${h.scr ? "g" : ""}" data-a="hecran">${h.scr ? "⏹ Arrêter le partage" : "🖥 Partager l'écran"}</button><span class="m">${nb} participant(s) connecté(s) à la visio</span>`;
      return;
    }
    const v = r.v;
    let h = "";
    if (v && v.mute) h += `<button class="b s p" data-a="son">🔊 Activer le son</button>`;
    if (moi.parole) h += `<button class="b s ${v && v.cam ? "x" : "g"}" data-a="vcam">${v && v.cam ? "🚫 Couper ma caméra" : "📷 Activer ma caméra"}</button>`;
    if (moi.parole) h += `<button class="b s ${v && v.mic ? "x" : "g"}" data-a="vmic">${v && v.mic ? "🔇 Couper mon micro" : "🎤 Prendre la parole"}</button>`;
    h += `<button class="b s" data-a="reco">🔄 Reconnecter la vidéo</button>`;
    c.innerHTML = h;
  }
  function brancherSig(w) {
    const code = W().code, host = peut(w), r = R();
    if (ST.un2) return;
    ST.un2 = o.sigWatch(code, host ? null : o.uid, (docs) => { if (host) { r.sigDocs = docs; if (r.h) docs.forEach(hSig); } else if (docs[0]) vSig(docs[0]).catch(() => {}); });
    ST.un3 = o.candWatch(code, host ? null : o.uid, (docs) => docs.forEach((c) => (host ? hCand(c) : vCand(c))));
    if (!host) vJoin(); else if (r.h) attacherLocal();
  }
  function entrer(code) {
    arreter();
    const Wd = ST.W && ST.W.code === code ? ST.W : (ST.W = { code, w: undefined, ps: [], ms: [], vu: false });
    ST.vue = "salle"; rend();
    ST.un = o.watch(code, (d) => {
      Object.assign(Wd, d); if (d.ps) Wd.psL = true;
      if (ST.vue !== "salle" || ST.W !== Wd) return;
      if (d.w !== undefined && (d.w === null) !== (Wd._nul)) { Wd._nul = d.w === null; rend(); }
      else if (d.w && !Wd._init) { Wd._init = true; rend(); }
      if (Wd.w && ouvrable(Wd.w)) brancherSig(Wd.w);
      majSalle();
      if (Wd.w && Wd.psL && !Wd.vu && ouvrable(Wd.w)) { Wd.vu = true; const moi = (Wd.ps || []).find((p) => p.uid === o.uid); o.maj(code, { web: code, uid: o.uid, nom: o.nom || "Participant", vu: Date.now(), t: (moi && moi.t) || Date.now() }).catch(() => {}); }
    });
    ST.cdT = setInterval(tickCd, 1000);
    ST.hb = setInterval(() => { if (ST.vue === "salle" && Wd.vu) o.maj(code, { vu: Date.now() }).catch(() => {}); majSalle(); }, 25000);
  }
  function tickCd() {
    const Wd = W(); if (!Wd || !Wd.w || ST.vue !== "salle") return;
    const w = Wd.w, now = Date.now(), c = el.querySelector("#wb-cdc");
    if (c) { if (ouvrable(w)) { entrer(Wd.code); return; } c.textContent = dec(w.debut - OUV - now); return; }
    const ov = el.querySelector("#wb-cd"); if (!ov) return;
    const att = w.debut && now < w.debut && w.etat !== "direct";
    ov.style.display = att ? "flex" : "none";
    if (att) ov.querySelector(".cdt").textContent = dec(w.debut - now);
  }
  function sortir() {
    const Wd = ST.W; arreter();
    const hostAvant = ST.R && ST.R.h, vAvant = ST.R && ST.R.v;
    if (vAvant && Wd) o.sigSet(Wd.code, o.uid, { want: 0 }).catch(() => {});
    if (hostAvant && Wd) o.setEtat(Wd.code, "fini").catch(() => {});
    coupure();
    if (Wd && Wd.vu) o.maj(Wd.code, { vu: 0, main: false, cam: false }).catch(() => {});
    ST.W = null; ST.vue = "liste"; ST.liste = null; charger();
  }

  // ---------- rendu
  function rend() {
    const h = ST.vue === "edit" ? vueEdit() : ST.vue === "salle" ? vueSalle() : vueListe();
    el.innerHTML = h;
    if (ST.vue === "salle") { majSalle(); const r = ST.R; if (r && r.h) attacherLocal(); else if (r && r.v) { brancher(); statut(r.st); } }
  }
  const pageHide = () => { const Wd = S && S.W; if (Wd && Wd.vu && S.vue === "salle") S.o.maj(Wd.code, { vu: 0 }).catch(() => {}); if (S && S.R && S.R.v && Wd) S.o.sigSet(Wd.code, S.o.uid, { want: 0 }).catch(() => {}); };
  window.removeEventListener("pagehide", window.__wbHide || (() => {})); window.__wbHide = pageHide; window.addEventListener("pagehide", pageHide);

  el.onclick = async (e) => {
    const b = e.target.closest("[data-a]"); if (!b) return;
    const a = b.dataset.a, d = b.dataset; ST.err = ""; ST.msg = "";
    if (a === "delmsg") e.preventDefault();
    try {
      if (a === "new") { ST.dr = nouveau(); ST.id = null; ST.vue = "edit"; }
      else if (a === "edit") { const w = ST.liste.find((x) => x.id === d.i); ST.dr = clone(w); ST.id = d.i; ST.vue = "edit"; }
      else if (a === "annuler") { ST.vue = "liste"; }
      else if (a === "save") {
        lire(); const r = ST.dr; if (!(r.titre || "").trim()) throw new Error("Donne un titre au webinaire.");
        if (r.now) r.debut = Date.now(); else if (!r.debut) throw new Error("Choisis la date et l'heure du webinaire, ou coche « Démarrer maintenant ».");
        delete r.now;
        const id = ST.id || code8(); r.owner = r.owner || o.uid; r.ownerNom = r.ownerNom || o.nom || ""; r.departement = r.departement || o.dept || ""; r.etat = r.etat || "prevu";
        await o.save(id, r); ST.vue = "liste"; ST.liste = null; ST.msg = ST.id ? "Salle modifiée." : "Salle créée : ouvre-la pour copier son lien."; charger();
      }
      else if (a === "del") { ST.conf = d.i; }
      else if (a === "delno") { ST.conf = null; }
      else if (a === "delok") { await o.del(d.i); ST.conf = null; ST.liste = null; charger(); ST.msg = "Salle supprimée."; }
      else if (a === "ouvrir") { const w = ST.liste && ST.liste.find((x) => x.id === d.i); if (w && !ouvrable(w)) { ST.msg = "La salle ouvre à " + heure(w.debut - OUV) + " (10 min avant le début)."; rend(); return; } entrer(d.i); return; }
      else if (a === "retour") { sortir(); return; }
      else if (a === "copy") { try { await navigator.clipboard.writeText(o.lien(W().code)); b.textContent = "Lien copié ✓"; } catch (x) { window.prompt("Copie le lien :", o.lien(W().code)); } return; }
      else if (a === "hstart") { await hStart(); }
      else if (a === "hstop") { await hStop(); }
      else if (a === "hmic") { const h = R().h; h.micOn = !h.micOn; if (h.micGain) h.micGain.gain.value = h.micOn ? 1 : 0; majSalle(); return; }
      else if (a === "hcam") { const h = R().h; h.camOn = !h.camOn; if (h.vtrack) h.vtrack.enabled = h.camOn; majSalle(); return; }
      else if (a === "hecran") { await hEcran(); return; }
      else if (a === "vmic") { await vMic(); return; }
      else if (a === "vcam") { await vCam(); return; }
      else if (a === "son") { const v = R().v; if (v) { v.mute = false; brancher(); majSalle(); } return; }
      else if (a === "reco") { vJoin(true); return; }
      else if (a === "main") { const moi = (W().ps || []).find((p) => p.uid === o.uid) || {}; await o.maj(W().code, moi.main ? { main: false, parole: false } : { main: true, mainT: Date.now(), parole: false }); return; }
      else if (a === "parole") { const p = (W().ps || []).find((x) => x.uid === d.u); if (p) await o.hote(W().code, d.u, { parole: !p.parole }); return; }
      else if (a === "baisse") { await o.hote(W().code, d.u, { main: false, parole: false }); return; }
      else if (a === "delmsg") { await o.delMsg(d.i); return; }
      else if (a === "send") { await envoyer(); return; }
    } catch (x) { ST.err = x.message || String(x); if (ST.vue === "salle") alert(ST.err); }
    rend();
  };
  async function envoyer() {
    const i = el.querySelector("#wb-in"); const t = (i && i.value || "").trim(); if (!t) return;
    i.value = ""; await o.envoyer(W().code, { uid: o.uid, nom: o.nom || "Participant", txt: t.slice(0, 400), t: Date.now() });
  }
  el.onkeydown = (e) => { if (e.key === "Enter" && e.target.id === "wb-in") { e.preventDefault(); envoyer().catch((x) => alert(x.message || x)); } };

  const ini = o.initial; // lu une seule fois (peut être consommé à la lecture)
  if (ini) { ST.liste = ST.liste || []; entrer(ini); }
  else if (ST.vue === "salle" && ST.W) entrer(ST.W.code);
  else if (ST.liste && ST.vue === "liste") { rend(); charger(); } else if (ST.vue === "edit") rend(); else { ST.vue = "liste"; rend(); charger(); }
}
