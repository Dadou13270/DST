import { db } from "../firebase";
import { collection, doc, setDoc, getDocs, getCountFromServer, query, where } from "firebase/firestore";

// Une petite fiche stats/{uid} = { d: code du département, seen: dernier passage (ms) } par inscrit.
export const codeDept = (d) => String(d || "").split(" ")[0];
export const FENETRE_CONNECTE = 4 * 60 * 1000;

export const pingStats = (uid, departement) =>
  setDoc(doc(db, "stats", uid), { d: codeDept(departement), seen: Date.now() }).catch(() => {});

export async function compteurs() {
  const col = collection(db, "stats");
  const [a, b] = await Promise.all([
    getCountFromServer(col),
    getCountFromServer(query(col, where("seen", ">", Date.now() - FENETRE_CONNECTE))),
  ]);
  return { inscrits: a.data().count, connectes: b.data().count };
}

export async function inscritsParDept() {
  const s = await getDocs(collection(db, "stats"));
  const cnt = {};
  let total = 0, online = 0;
  const lim = Date.now() - FENETRE_CONNECTE;
  s.docs.forEach((x) => {
    const d = x.data();
    cnt[d.d || ""] = (cnt[d.d || ""] || 0) + 1;
    total++;
    if ((d.seen || 0) > lim) online++;
  });
  return { cnt, total, online };
}
