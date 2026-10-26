// Envoi vers Netlify Forms. Chaque formulaire doit aussi être déclaré en statique dans index.html (détection par Netlify).
const enc = (o) => Object.entries(o).map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v ?? "")).join("&");
export async function envoyerNetlify(nom, champs) {
  const r = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: enc({ "form-name": nom, ...champs }),
  });
  if (!r.ok) throw new Error("HTTP " + r.status);
}
