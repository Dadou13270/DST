import { useEffect, useRef, useState } from "react";

// Lecteur PDF : toutes les pages se suivent en défilement ; onFin() est appelé quand le stagiaire arrive en bas du dernier page.
export default function PdfLecteur({ data, onFin }) {
  const box = useRef(null), fin = useRef(null);
  const [etat, setEtat] = useState("Chargement du PDF…");
  const [pret, setPret] = useState(false);
  useEffect(() => {
    let vivant = true, doc = null;
    (async () => {
      try {
        const [pdfjs, w] = await Promise.all([import("pdfjs-dist"), import("pdfjs-dist/build/pdf.worker.min.js?url")]);
        pdfjs.GlobalWorkerOptions.workerSrc = w.default;
        doc = await pdfjs.getDocument({ data: data.slice() }).promise;
        const larg = Math.max(280, (box.current?.clientWidth || 800) - 2), dpr = Math.min(window.devicePixelRatio || 1, 2);
        for (let i = 1; i <= doc.numPages; i++) {
          if (!vivant) return;
          setEtat(`Page ${i} / ${doc.numPages}`);
          const p = await doc.getPage(i), v1 = p.getViewport({ scale: 1 }), s = larg / v1.width, v = p.getViewport({ scale: s * dpr });
          const c = document.createElement("canvas");
          c.width = Math.floor(v.width); c.height = Math.floor(v.height); c.style.width = "100%"; c.style.display = "block"; c.style.marginBottom = "8px"; c.style.boxShadow = "0 1px 4px rgba(0,0,0,.25)"; c.style.background = "#fff";
          box.current?.appendChild(c);
          await p.render({ canvasContext: c.getContext("2d"), viewport: v }).promise;
        }
        if (vivant) { setEtat(`${doc.numPages} page${doc.numPages > 1 ? "s" : ""}`); setPret(true); }
      } catch (e) { if (vivant) setEtat("Lecture impossible : " + (e.message || e)); }
    })();
    return () => { vivant = false; doc?.destroy?.(); };
  }, [data]);
  useEffect(() => {
    if (!pret || !fin.current) return;
    const o = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { onFin?.(); o.disconnect(); } }, { threshold: 0.1 });
    o.observe(fin.current);
    return () => o.disconnect();
  }, [pret]); // eslint-disable-line
  return (
    <div>
      <p className="muted" style={{ margin: "0 0 6px" }}>{etat}</p>
      <div ref={box} />
      <div ref={fin} style={{ height: 12 }} aria-hidden="true" />
    </div>
  );
}
