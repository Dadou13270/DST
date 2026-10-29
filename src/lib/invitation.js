import QRCode from "qrcode";
import { rvbCharte, nomApp } from "./charte";

// Invitation à une séance : image (texte + QR code) à envoyer par messagerie, et copie « riche » (texte + QR) pour un e-mail.
export const qrDataUrl = (valeur, taille = 300) => QRCode.toDataURL(valeur, { margin: 1, width: taille });
const charger = (src) => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });

export async function imageInvitation(txt, lien, legende = "Scannez pour rejoindre la séance") {
  const W = 900, pad = 36, qr = 260, tw = W - pad * 3 - qr, lh = 28, bandeau = 64;
  const c = document.createElement("canvas"), x = c.getContext("2d");
  x.font = "20px sans-serif";
  const lignes = [];
  txt.split("\n").forEach((p) => {
    if (!p.trim()) { lignes.push(""); return; }
    let l = "";
    p.split(" ").forEach((m) => { const t = l ? l + " " + m : m; if (x.measureText(t).width > tw && l) { lignes.push(l); l = m; } else l = t; });
    lignes.push(l);
  });
  const h = Math.max(lignes.length * lh + pad * 2, qr + 90 + pad * 2) + bandeau;
  c.width = W; c.height = h;
  x.fillStyle = "#fff"; x.fillRect(0, 0, W, h);
  x.fillStyle = `rgb(${rvbCharte().join(",")})`; x.fillRect(0, 0, W, bandeau);
  x.fillStyle = "#fff"; x.font = "bold 28px sans-serif"; x.textBaseline = "middle"; x.fillText(nomApp(), pad, bandeau / 2);
  x.fillStyle = "#1c2024"; x.font = "20px sans-serif"; x.textBaseline = "top";
  lignes.forEach((l, i) => { if (i === 1 || /^(Séance en salle|Rejoindre l)/.test(l)) x.font = "bold 22px sans-serif"; else x.font = "20px sans-serif"; x.fillText(l, pad, bandeau + pad + i * lh); });
  const q = await charger(await qrDataUrl(lien, qr * 2));
  x.drawImage(q, W - pad - qr, bandeau + pad, qr, qr);
  x.fillStyle = "#555"; x.font = "18px sans-serif"; x.textAlign = "center";
  x.fillText(legende, W - pad - qr / 2, bandeau + pad + qr + 12);
  return new Promise((ok) => c.toBlob(ok, "image/png"));
}
export async function copierAvecQr(txt, lien, alt = "QR code pour rejoindre la séance") {
  const url = await qrDataUrl(lien, 300);
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const html = `<div>${txt.split("\n").map((l) => esc(l) || "&nbsp;").join("<br>")}<p><img src="${url}" width="180" height="180" alt="${alt}"></p></div>`;
  await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([txt], { type: "text/plain" }) })]);
}
export function telecharger(blob, nom) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nom; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
