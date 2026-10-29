// Dictée vocale : bouton micro flottant sur les zones de texte (Web Speech API).
// Le texte transcrit s'ajoute à l'endroit du curseur ; le clavier reste utilisable.
export function initDictee(toast) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR || window.__dictee) return;
  window.__dictee = true;
  const msg = (t) => { try { toast ? toast(t) : console.info(t); } catch { /* */ } };
  const STYLE = "position:fixed;z-index:99999;display:none;width:38px;height:38px;border-radius:50%;border:1px solid #c9cfd4;background:#fff;color:#222;font-size:1.1rem;line-height:1;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3);padding:0";
  const live = document.createElement("div");
  live.style.cssText = "position:fixed;z-index:99999;display:none;max-width:260px;padding:4px 8px;border-radius:8px;background:#222;color:#fff;font-size:.8rem;pointer-events:none";
  document.body.append(live);
  const btns = new Map(); // zone de texte -> bouton
  let cible = null, rec = null, actif = false;
  const ok = (el) => el && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && /^(text|search)?$/i.test(el.type || "")))
    && !el.readOnly && !el.disabled && !el.hasAttribute("data-no-dictee") && !/pass|mdp|email|mail/i.test((el.name || "") + (el.id || "") + (el.autocomplete || ""));
  const creer = (el) => {
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("aria-label", "Dicter"); b.title = "Dicter (cliquer pour démarrer / arrêter)";
    b.textContent = "🎤"; b.style.cssText = STYLE;
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", () => { if (actif && cible === el) arret(); else { if (actif) arret(); cible = el; debut(); } });
    document.body.appendChild(b); btns.set(el, b); return b;
  };
  const place = () => {
    const els = new Set([...document.querySelectorAll("textarea")].filter(ok));
    if (ok(document.activeElement)) els.add(document.activeElement);
    for (const [el, b] of btns) if (!els.has(el) || !document.contains(el)) { b.remove(); btns.delete(el); if (cible === el && actif) arret(); }
    for (const el of els) {
      const b = btns.get(el) || creer(el), r = el.getBoundingClientRect();
      const vis = r.width > 40 && r.height > 20 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(el).visibility !== "hidden";
      b.style.display = vis ? "block" : "none";
      if (vis) { b.style.left = Math.max(4, Math.min(innerWidth - 44, r.right - 44)) + "px"; b.style.top = Math.max(4, Math.min(innerHeight - 44, r.bottom - 44)) + "px"; }
      const on = actif && cible === el; b.textContent = on ? "⏹" : "🎤"; b.style.background = on ? "#c42a1c" : "#fff"; b.style.color = on ? "#fff" : "#222";
      if (on) { live.style.left = Math.max(4, r.left) + "px"; live.style.top = Math.min(innerHeight - 30, r.bottom + 4) + "px"; }
    }
    if (!actif) live.style.display = "none";
  };
  const set = (el, v) => {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const insere = (el, t) => {
    const v = el.value, d = el.selectionStart ?? v.length, f = el.selectionEnd ?? d;
    const av = v.slice(0, d), ap = v.slice(f);
    const sep = av && !/[\s'’(]$/.test(av) ? " " : "";
    const maj = !av.trim() || /[.!?]\s*$/.test(av) ? t.charAt(0).toUpperCase() + t.slice(1) : t;
    const ins = sep + maj + (ap && !/^[\s.,;:!?]/.test(ap) ? " " : "");
    const pos = av.length + sep.length + maj.length;
    set(el, av + ins + ap);
    try { el.setSelectionRange(pos, pos); } catch { /* */ }
  };
  function arret() { actif = false; try { rec && rec.stop(); } catch { /* */ } rec = null; place(); }
  function debut() {
    if (!cible) return;
    const el = cible; el.focus();
    rec = new SR(); rec.lang = "fr-FR"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e) => {
      let prov = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i], t = r[0].transcript.trim();
        if (r.isFinal) { if (t) insere(el, t); } else prov += r[0].transcript;
      }
      live.textContent = prov ? "… " + prov : ""; live.style.display = prov ? "block" : "none";
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") msg("Micro refusé : autorisez-le dans le navigateur.");
      else if (e.error === "no-speech") return;
      else if (e.error !== "aborted") msg("Dictée interrompue (" + e.error + ").");
      arret();
    };
    rec.onend = () => { if (actif) { try { rec.start(); } catch { arret(); } } };
    actif = true; place();
    try { rec.start(); } catch { arret(); }
  }
  document.addEventListener("focusin", (e) => { if (ok(e.target) && !actif) cible = e.target; });
  addEventListener("scroll", place, true); addEventListener("resize", place);
  setInterval(place, 400);
  place();
}
