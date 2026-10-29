// Dictée vocale : bouton micro flottant sur les zones de texte (Web Speech API).
// Le texte transcrit s'ajoute à l'endroit du curseur ; le clavier reste utilisable.
export function initDictee(toast) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR || window.__dictee) return;
  window.__dictee = true;
  const msg = (t) => { try { toast ? toast(t) : console.info(t); } catch { /* */ } };
  const b = document.createElement("button");
  b.type = "button"; b.setAttribute("aria-label", "Dicter"); b.title = "Dicter (cliquer pour démarrer / arrêter)";
  b.textContent = "🎤";
  b.style.cssText = "position:fixed;z-index:99999;display:none;width:38px;height:38px;border-radius:50%;border:1px solid #c9cfd4;background:#fff;color:#222;font-size:1.1rem;line-height:1;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3);padding:0";
  const live = document.createElement("div");
  live.style.cssText = "position:fixed;z-index:99999;display:none;max-width:260px;padding:4px 8px;border-radius:8px;background:#222;color:#fff;font-size:.8rem;pointer-events:none";
  document.body.append(b, live);
  let cible = null, rec = null, actif = false;
  const ok = (el) => el && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && /^(text|search)?$/i.test(el.type || "")))
    && !el.readOnly && !el.disabled && !el.hasAttribute("data-no-dictee") && !/pass|mdp|email|mail/i.test((el.name || "") + (el.id || "") + (el.autocomplete || ""));
  const place = () => {
    if (!cible || !document.contains(cible)) { b.style.display = "none"; live.style.display = "none"; return; }
    const r = cible.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) { b.style.display = "none"; return; }
    b.style.display = "block";
    b.style.left = Math.max(4, Math.min(innerWidth - 44, r.right - 44)) + "px";
    b.style.top = Math.max(4, Math.min(innerHeight - 44, r.bottom - 44)) + "px";
    live.style.left = Math.max(4, r.left) + "px"; live.style.top = Math.max(4, r.bottom + 4) + "px";
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
    set(el, av + ins + ap);
    try { el.setSelectionRange(av.length + sep.length + maj.length, av.length + sep.length + maj.length); } catch { /* */ }
  };
  const visuel = () => { b.textContent = actif ? "⏹" : "🎤"; b.style.background = actif ? "#c42a1c" : "#fff"; b.style.color = actif ? "#fff" : "#222"; if (!actif) live.style.display = "none"; };
  const arret = () => { actif = false; try { rec && rec.stop(); } catch { /* */ } rec = null; visuel(); };
  const debut = () => {
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
    actif = true; visuel();
    try { rec.start(); } catch { arret(); }
  };
  b.addEventListener("mousedown", (e) => e.preventDefault());
  b.addEventListener("click", () => (actif ? arret() : debut()));
  document.addEventListener("focusin", (e) => { if (ok(e.target)) { if (actif && cible !== e.target) arret(); cible = e.target; place(); } });
  document.addEventListener("focusout", () => setTimeout(() => { if (!actif && !ok(document.activeElement)) { cible = null; place(); } }, 200));
  addEventListener("scroll", place, true); addEventListener("resize", place);
  setInterval(place, 400);
}
