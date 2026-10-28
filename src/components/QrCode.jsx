import { useEffect, useState } from "react";
import QRCode from "qrcode";

// QR code d'une adresse (image, générée dans le navigateur)
export default function QrCode({ valeur, taille = 160 }) {
  const [src, setSrc] = useState("");
  useEffect(() => { QRCode.toDataURL(valeur, { margin: 1, width: taille * 2 }).then(setSrc).catch(() => setSrc("")); }, [valeur, taille]);
  return src ? <img src={src} alt="QR code pour rejoindre la séance" width={taille} height={taille} style={{ background: "#fff", borderRadius: 6 }} /> : null;
}
