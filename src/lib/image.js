// Redimensionne et compresse une image en data URL JPEG (stockée dans Firestore, limite 1 Mo / document).
export function compressImage(file, maxSize = 1280, quality = 0.72, maxChars = 0) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const r = Math.min(1, maxSize / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * r);
      c.height = Math.round(img.height * r);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      let q = quality;
      let out = c.toDataURL("image/jpeg", q);
      while (maxChars && out.length > maxChars && q > 0.3) {
        q -= 0.1;
        out = c.toDataURL("image/jpeg", q);
      }
      resolve(out);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible"));
    };
    img.src = url;
  });
}
