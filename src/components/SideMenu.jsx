import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { espaceDecision } from "../lib/decision";
import { espaceReco } from "../lib/reco";

// Menu latéral (disposition « menu à gauche », réglage admin) : chaque menu se déplie en sous-menus.
// Visible uniquement quand html[data-menu="g"] sur grand écran (voir styles.css) ; la barre du haut reste en place.
const ICO = {"Espace stagiaire": "🎓", "Espace gestionnaire": "🧑‍🏫", "Espace département": "🏛️", "Espace admin": "⚙️", "Jeu": "🎲", "Forum": "💬", "Évènements": "📅", "Accueil": "🏠", "Scénarios": "🎯", "Scénarios à décisions": "🔀", "Situations en images": "🖼️", "Mon suivi": "📈", "Séance en salle": "🏫", "Jeu de rôle": "🎭", "Mon équipe": "👥", "Fiches mémo": "📚", "Messages": "✉️", "Mon profil": "👤", "Carte des inscrits": "🗺️", "Création de l'équipe": "➕", "Gestion de l'équipe": "🛠️", "Tableau de bord": "📊", "Calendrier": "📅", "Historique des séances": "🕘", "Parcours pédagogiques": "🧭", "Mes scénarios": "✏️", "Mes quiz": "❓", "Demande de scénario": "📝", "Statistiques du département": "📊", "Utilisateurs": "🧑‍🤝‍🧑", "Gestionnaires": "🧑‍🏫", "Droits": "🔑", "Statistiques": "📊", "Attribution": "🔗", "Journal": "📜", "Annonces": "📣", "Paramètres": "⚙️", "Pages légales": "⚖️", "Tickets": "🎫", "Commentaires types": "💬", "Site": "🌐", "Trivial pompiers": "🎲", "Jouer à plusieurs": "🎮"};
const ico = (l) => ICO[String(l).replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "").replace(/\s*\(\d+\)$/, "")] || "•";
const sans = (l) => String(l).replace(/^\p{Extended_Pictographic}\uFE0F?\s*/u, "");

export default function SideMenu({ isAdmin, profil, accesJeu, nonLus }) {
  const { pathname, search } = useLocation();
  const [ouvert, setOuvert] = useState(null); // un seul menu ouvert à la fois (null = celui de la page courante)
  const q = new URLSearchParams(search);
  const esp = pathname.startsWith("/decision") ? espaceDecision(pathname, search, !!isAdmin, !!profil?.gestionnaire) : pathname.startsWith("/reco") ? espaceReco(pathname, search, !!isAdmin, !!profil?.gestionnaire) : "";
  const ong = q.get("onglet") || "ac", sub = q.get("sub") || "ge";
  const gestOn = pathname.startsWith("/gestion") && !pathname.startsWith("/gestion/salle");
  const it = (l, to, on, s) => ({ l, to, on, s });
  const S = [];
  const eg = (p) => pathname === p;
  S.push({
    id: "st", t: "Espace stagiaire",
    on: !(pathname === "/roles" || pathname.startsWith("/admin") || pathname.startsWith("/gestion") || pathname.startsWith("/departement") || pathname === "/jeu" || pathname === "/forum"),
    it: [it("Accueil", "/", eg("/")), it("Scénarios", "/scenarios", eg("/scenarios") || pathname.startsWith("/scenario/") || pathname.startsWith("/calculs") || pathname.startsWith("/quiz") || pathname.startsWith("/relation")),
      it("Mon suivi", "/suivi", eg("/suivi")), it("Séance en salle", "/seance", eg("/seance")), it("Jeu de rôle", "/roles/jouer", pathname.startsWith("/roles/jouer")), it("Situations en images", "/reco", pathname.startsWith("/reco")), it("Mon équipe", "/equipe", eg("/equipe")),
      it("Fiches mémo", "/fiches", eg("/fiches")), it(`Messages${nonLus ? ` (${nonLus})` : ""}`, "/messages", eg("/messages")), it("Mon profil", "/profil", eg("/profil")), it("Carte des inscrits", "/carte", eg("/carte"))],
  });
  if (profil?.gestionnaire || isAdmin) {
    const g = (o, sb) => `/gestion?onglet=${o}${sb ? `&sub=${sb}` : ""}`;
    const on = (o, sb) => gestOn && ong === o && (!sb || sub === sb);
    S.push({
      id: "ge", t: "Espace gestionnaire", on: gestOn || esp === "gestion" || pathname === "/roles",
      it: [it("Accueil", g("ac"), on("ac")), { g: "Équipes" }, it("Création de l'équipe", g("eq", "cr"), on("eq", "cr"), 1), it("Gestion de l'équipe", g("eq", "ge"), on("eq", "ge"), 1), it("Tableau de bord", g("eq", "tb"), on("eq", "tb"), 1),
        { g: "Séances" }, it("Séance en salle", g("sa"), on("sa"), 1), it("Jeu de rôle", "/roles", pathname === "/roles", 1), it("Calendrier", g("ca"), on("ca"), 1), it("Historique des séances", g("hs"), on("hs"), 1),
        { g: "Contenus" }, it("Parcours pédagogiques", g("pc"), on("pc"), 1), it("Mes scénarios", g("ms"), on("ms"), 1), it("Mes quiz", g("mq"), on("mq"), 1), it("Scénarios à décisions", "/decision?esp=gestion", pathname.startsWith("/decision") && esp === "gestion", 1), it("Situations en images", "/reco?esp=gestion", pathname.startsWith("/reco") && esp === "gestion", 1), it("Demande de scénario", g("dm"), on("dm"), 1)],
    });
  }
  if (profil?.adminDept || isAdmin) S.push({ id: "dp", t: "Espace département", on: pathname.startsWith("/departement"), it: [it("Statistiques du département", "/departement", pathname.startsWith("/departement"))] });
  if (isAdmin) {
    const a = (p) => pathname === p;
    S.push({
      id: "ad", t: "Espace admin", on: pathname.startsWith("/admin") || esp === "admin",
      it: [{ g: "Scénarios" }, it("Scénarios", "/admin", a("/admin") || /^\/admin\/(scenario|calcul|relation|quiz)\//.test(pathname), 1),
        it("Scénarios à décisions", "/decision?esp=admin", pathname.startsWith("/decision") && esp === "admin", 1),
        it("Situations en images", "/reco?esp=admin", pathname.startsWith("/reco") && esp === "admin", 1),
        { g: "Inscrits" }, it("Utilisateurs", "/admin/utilisateurs", a("/admin/utilisateurs"), 1), it("Gestionnaires", "/admin/gestionnaires", a("/admin/gestionnaires"), 1), it("Droits", "/admin/droits", a("/admin/droits"), 1),
        { g: "Gestion" }, it("Statistiques", "/admin/stats", a("/admin/stats"), 1), it("Attribution", "/admin/attribution", a("/admin/attribution"), 1), it("Journal", "/admin/journal", a("/admin/journal"), 1),
        { g: "Application" }, it("Annonces", "/admin/annonces", a("/admin/annonces"), 1), it("Évènements", "/admin/evenements", a("/admin/evenements"), 1), it("Paramètres", "/admin/parametres", a("/admin/parametres"), 1), it("Pages légales", "/admin/legal", a("/admin/legal"), 1), it("Tickets", "/admin/tickets", a("/admin/tickets"), 1), it("Commentaires types", "/admin/banque", a("/admin/banque"), 1),
        it("Site", "/admin/site", a("/admin/site"))],
    });
  }
  S.push({ id: "fo", t: "Forum", on: pathname === "/forum", it: [it("Forum d'entraide", "/forum", pathname === "/forum")] });
  if (accesJeu) S.push({ id: "je", t: "Jeu", on: pathname === "/jeu", it: [it("🎲 Trivial pompiers", "/jeu", pathname === "/jeu"), it("Jouer à plusieurs", "/jeu", false)] });
  const actif = (S.find((x) => x.on) || {}).id || "";
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => setOuvert(null), [actif]);
  return (
    <>
      {S.map((x) => {
        const open = ouvert !== null ? ouvert === x.id : x.on;
        return (
          <div key={x.id} className={"sd-sec" + (open ? " open" : "")}>
            <button className="sd-h" aria-expanded={open} onClick={() => setOuvert(open ? "" : x.id)}><span><span className="sd-ic" aria-hidden="true">{ico(x.t)}</span>{x.t}</span><i>▾</i></button>
            <div className="sd-it">
              {x.it.map((i, k) => i.g ? <div key={k} className="sd-g">{i.g}</div> : <Link key={k} to={i.to} className={"sd-i" + (i.on ? " on" : "") + (i.s ? " sub" : "")}><span className="sd-ic" aria-hidden="true">{ico(i.l)}</span>{sans(i.l)}</Link>)}
            </div>
          </div>
        );
      })}
    </>
  );
}
