import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../lib/auth";
import forumMount, { forumDetach, forumOuvrir } from "../forum/forum";
import { forumDel, forumEstMod, forumGet, forumLs, forumPut, forumUsers } from "../lib/forumDb";

// Forum d'entraide : administré par l'admin, qui désigne les modérateurs (collection forumMods).
export default function Forum() {
  const { isAdmin, user, profil } = useAuth();
  const [params] = useSearchParams();
  const ref = useRef(null);
  const [mod, setMod] = useState(null);
  const uid = user?.uid || "";
  useEffect(() => { if (uid) forumEstMod(uid).then(setMod); }, [uid]);
  const opts = useMemo(() => ({ uid, nom: profil?.nom || profil?.prenom || "Anonyme", admin: !!isAdmin, mod: !!mod, ls: forumLs, get: forumGet, put: forumPut, del: forumDel, users: forumUsers, sujetInit: params.get("sujet") || "" }), [uid, profil, isAdmin, mod, params]);
  useEffect(() => () => forumDetach(), []);
  useEffect(() => { if (params.get("sujet")) forumOuvrir(params.get("sujet")); }, [params]);
  useEffect(() => { if (mod !== null && ref.current) forumMount(ref.current, opts); }, [mod, opts]);
  return <Layout>{mod === null ? <p style={{ textAlign: "center" }}>Chargement…</p> : <div ref={ref} />}</Layout>;
}
