import { lireLien } from "../lib/video";

// Vidéo de la situation (lien YouTube/Vimeo/externe ou fichier envoyé).
export default function VideoSituation({ video, grande }) {
  if (!video?.url) return null;
  const l = video.mode === "fichier" ? { kind: "video", src: video.url } : lireLien(video.url);
  if (!l) return null;
  const h = grande ? "min(62vh, 560px)" : undefined;
  return (
    <figure style={{ margin: "10px 0" }}>
      {l.kind === "iframe" && (
        <div style={{ position: "relative", paddingTop: "56.25%", maxHeight: h }}>
          <iframe src={l.src} title={video.titre || "Vidéo de la situation"} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, borderRadius: 10 }} />
        </div>
      )}
      {l.kind === "video" && <video src={l.src} controls preload="metadata" playsInline style={{ width: "100%", maxHeight: h || "70vh", borderRadius: 10, background: "#000" }} />}
      {l.kind === "lien" && <a className="btn" href={l.src} target="_blank" rel="noopener noreferrer">▶ Voir la vidéo (nouvel onglet)</a>}
      {video.titre && <figcaption className="muted">{video.titre}</figcaption>}
    </figure>
  );
}
