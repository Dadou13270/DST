# Op'Training — pompiers (SOIEC)

React + Vite + Firebase (Firestore + Auth). Déploiement Netlify.

## Fonctionnement

**Stagiaire** (`/`) : choisit un scénario → arrive sur les lieux (photo + situation) → interroge les interlocuteurs (requérant, témoin, badaud…) en texte libre → remplit son SOIEC et son message → termine et compare avec la correction.

**Admin** (`/admin`) : crée / modifie / publie / duplique / supprime les scénarios : photo, situation, interlocuteurs, questions-réponses, correction SOIEC, message modèle.

### Reconnaissance des questions
Chaque réponse a des **mots-clés** (séparés par des virgules). La question du stagiaire est normalisée (accents, pluriels ignorés) ; la réponse dont les mots-clés correspondent le mieux est renvoyée. Sinon : la réponse par défaut de l'interlocuteur. Un onglet « test » dans l'éditeur permet de vérifier.
Les questions marquées « essentielles » apparaissent dans le bilan (posée ✓ / oubliée ✗).

### Suivi
Page `/suivi` (« Mon suivi ») : exercices terminés, temps, questions essentielles, revoir ses réponses. Résultats enregistrés dans `users/{uid}.bilans` à la fin de chaque exercice ; visibles par l'admin dans Paramètres → Utilisateurs → Suivi.

### Comptes
Page `/connexion` : connexion + inscription libre (e-mail / mot de passe, mot de passe oublié). Il faut être connecté pour voir les scénarios. Le premier admin se crée à la main (voir ci-dessous) ; ensuite **Paramètres → Utilisateurs** permet de suspendre / réactiver, promouvoir / retirer admin, envoyer une réinitialisation de mot de passe, supprimer un profil. Republier `firestore.rules`.

## Installation

```bash
npm install
cp .env.example .env   # puis renseigner la config Firebase
npm run dev
```

## Configuration Firebase

1. Console Firebase → créer un projet → ajouter une **app Web** → copier la config dans `.env`.
2. **Firestore Database** → créer la base (mode production).
3. **Authentication** → activer **E-mail / mot de passe** → créer ton utilisateur admin (onglet Users). Désactive l'inscription libre si l'option est proposée.
4. Copier l'**UID** de cet utilisateur → dans Firestore, créer la collection `admins`, document dont l'ID = cet UID (champ libre, ex. `actif: true`).
5. Firestore → **Règles** → coller le contenu de `firestore.rules` → Publier.

## Déploiement Netlify

- Build : `npm run build`, publish : `dist` (déjà dans `netlify.toml`, avec la redirection SPA).
- Ajouter les 6 variables `VITE_FIREBASE_*` dans Site settings → Environment variables.
- Firebase Auth → Settings → Authorized domains : ajouter le domaine Netlify.

## Données

```
scenarios/{id}            titre, description, duree, publie, afficherCorrection, vignette,
                          situation{contexte,consigne}, interlocuteurs[], qa[], correction{S,O,I,E,C,message,commentaire}
scenarios/{id}/media/photo  { data: "data:image/jpeg;base64,..." }   (photo compressée, < 1 Mo)
admins/{uid}
users/{uid}               email, nom, statut (actif|suspendu), creeLe, derniereConnexion
```

La progression du stagiaire est sauvegardée localement (navigateur) ; rien n'est écrit en base côté stagiaire.

## Scénarios fournis
Le dossier `seeds/` contient les 20 scénarios complets (SOIEC, questions/réponses, illustrations) au format JSON, un fichier par scénario. Pour les importer : Paramètres → Scénarios → « Importer des scénarios (.json) », sélectionner tous les fichiers de `seeds/` (la photo est rangée automatiquement dans `media/photo`, les scénarios déjà présents sont ignorés).
`artefact-simulateur-soiec.html` est la version autonome publiée comme artefact.

## Nouveautés

- **Questions suggérées** : case « Questions suggérées » dans l'éditeur de scénario ; les stagiaires choisissent parmi les questions du scénario en plus de la saisie libre (Masquer/Afficher).
- **Reprise multi-appareils** : la session en cours est enregistrée dans `users/{uid}.encours` ; la plus récente (locale ou cloud) est reprise. Republier `firestore.rules`.
- **Bibliothèque d'illustrations** : panneau dans l'éditeur (utiliser / ajouter / supprimer / importer .json). Importer les 18 fichiers de `seeds-illustrations/`.
- **Application installable (PWA) + hors ligne** : ouvrir le site en ligne une première fois, puis « Installer l'application » / « Ajouter à l'écran d'accueil ». Les données Firestore sont mises en cache localement.

## Formulaire de contact
Page `/contact` (lien dans le pied de page), envoi via Netlify Forms (formulaire `contact`, déclaré dans `index.html`). Après déploiement : Netlify → Forms pour lire les messages, et Forms → Notifications pour recevoir un e-mail.

## Rôle gestionnaire et équipes
- Admin → Utilisateurs → « Passer gestionnaire » (champ `gestionnaire` du profil).
- Le gestionnaire ouvre « Espace gestionnaire » (`/gestion`) : il crée des équipes, chacune avec un code d'accès (6 caractères), peut le renouveler, retirer un membre ou supprimer l'équipe, et voit pour chaque membre le suivi (terminés, temps, essentielles, détail).
- Le stagiaire saisit le code dans « Mon équipe » (`/equipe`) ; il peut quitter l'équipe à tout moment.
- Collections : `teams/{id}` (nom, owner, code) et `codes/{CODE}` (teamId, owner, nom). **Republier `firestore.rules`.**

## Profil stagiaire
Page `/profil` (onglet « Mon profil ») : nom, e-mail, dates, grade, département, CIS (listes déroulantes, « Autre » pour un CIS hors liste) et affectation à l'équipe avec le nom du gestionnaire. Listes modifiables dans `src/lib/referentiels.js`. Republier `firestore.rules`. Les équipes créées avant cette version affichent le gestionnaire après « Nouveau code » côté gestionnaire.

## Aide gestionnaires / équipes
Page `/aide-equipes` (explications) et lien « Demander l'accès gestionnaire » vers `/contact?objet=gestionnaire` (formulaire Netlify). Liens affichés dans le pied de page de toutes les pages. Ensuite, l'admin attribue le rôle dans Utilisateurs.

## Plusieurs équipes par gestionnaire
Un gestionnaire peut créer autant d'équipes qu'il veut et déplacer un membre d'une de ses équipes vers une autre (« Déplacer vers… »). Republier `firestore.rules`.

## Exercices à rendre, export PDF, statistiques, affichage
- **Exercices à rendre** : dans « Espace gestionnaire », chaque équipe a une liste d'exercices obligatoires avec date limite ; les retards sont signalés au gestionnaire (encadré + compteur) et au stagiaire (bandeau sur Exercices, page Mon équipe). Les rappels sont affichés dans l'application (pas d'e-mail automatique). Republier `firestore.rules` (les membres lisent leur équipe).
- **Export PDF** : bouton « Export PDF » par équipe (gestionnaire) et « Exporter en PDF » dans Mon suivi (stagiaire).
- **Statistiques globales** (admin → onglet Statistiques) : scénarios les plus joués / échoués, questions jamais posées, questions libres sans réponse (pistes de mots-clés).
- **Affichage** : boutons A− / A+ et ◐ (clair/sombre) dans la barre, mémorisés sur l'appareil.

## Commentaires du formateur et CGU
- **Commentaire du formateur** : dans l'espace gestionnaire, « Suivi » d'un membre → zone de commentaire sous chaque exercice terminé. Visible par le stagiaire dans « Mon suivi » (et dans son export PDF). Republier `firestore.rules`.
- **CGU** : page `/cgu` (texte dans `src/lib/cgu.js`, à faire valider par votre service juridique), liens dans le pied de page, case d'acceptation à l'inscription.

## Inscription de stagiaires par le gestionnaire
Dans « Espace gestionnaire » → « Inscrire des stagiaires » : une ligne par stagiaire (`Nom ; e-mail ; mot de passe`, mot de passe facultatif = généré). Le compte est créé (Firebase Authentication) avec une seconde instance Firebase, sans déconnecter le gestionnaire, et rattaché à l'équipe choisie. Le stagiaire se connecte avec l'e-mail et le mot de passe transmis ; une alerte l'invite à changer ce mot de passe provisoire dans Mon profil. Republier `firestore.rules`.

## Visite guidée et filtres
- **Visite guidée** : 5 étapes affichées au premier passage sur la page Exercices ; bouton « ? » dans la barre et lien « Visite guidée » dans le pied de page pour la revoir. Infobulles sur les onglets.
- **Filtres** sur la page Exercices : recherche texte, rubrique, durée, état (non commencé / en cours / terminé).

## Reconnaissance cubique (scénarios Incendie)

Les 11 scénarios Incendie intègrent la reconnaissance cubique du chef d'agrès (11 rubriques : victimes, construction, public, surfaces, moyens de secours, eau, météo, accès, personnels et moyens, feu, risques particuliers). Dans l'éditeur, cocher « Reconnaissance cubique » puis rattacher chaque question à une rubrique ; renseigner la synthèse attendue dans l'onglet Correction. Le stagiaire dispose d'un aide-mémoire et le bilan indique les rubriques couvertes (✓/✗ avec les réponses oubliées). Les rubriques 7 et 9 sont à apprécier via la synthèse. La liste provient d'une source communautaire : à faire valider par un formateur.

## Photos
- Onglet Général : photo du scénario (vignette de la liste et haut de l'exercice).
- Onglet Situation : jusqu'à 6 photos de la situation à l'arrivée sur les lieux, choisies sur l'ordinateur, avec légende et ordre modifiable. Stockées dans `scenarios/{id}/media/situation`. Indépendantes de la photo du scénario (identiques ou différentes).

## Paramètres admin : scénarios à la demande des gestionnaires
- Un gestionnaire remplit « Demander un scénario » (Espace gestionnaire). L'admin le voit dans **Admin > Paramètres** : « Créer le scénario et l'attribuer » ouvre l'éditeur avec le scénario déjà réservé au demandeur ; « Marquer livrée » l'indique au gestionnaire.
- Un scénario réservé (`reserveA` = uid du gestionnaire) n'est visible que par ce gestionnaire et les membres de ses équipes (règles Firestore + requêtes). L'attribution se règle dans Paramètres ou dans l'éditeur (onglet Général, « Visible par »).
- **À faire une fois après mise à jour** : republier `firestore.rules`, puis Admin > Paramètres > « Initialiser la visibilité des scénarios existants » (les anciens scénarios reçoivent `reserveA: null`).

## Carte des inscrits et compteurs
- Barre du haut : nombre d'inscrits et de connectés (passage dans les 4 dernières minutes), mis à jour chaque minute.
- Footer > « Carte des inscrits » (`/carte`) : carte de France colorée par département (département du profil), détail au clic, liste et outre-mer.
- Données : une fiche `stats/{uid}` = `{ d, seen }` par inscrit, écrite par l'utilisateur lui-même (règle dans `firestore.rules`, à republier). Un inscrit n'apparaît qu'après sa première connexion avec cette version.
- Fond de carte : @svg-maps/france.departments (Victor Cazanave), licence CC BY 4.0 (`src/lib/frmap.LICENSE.md`).

## Anti-robot
- Formulaires protégés : inscription, connexion (après 3 échecs) et mot de passe oublié, contact (Netlify), demande de scénario. Mécanisme sans service externe : champ piège invisible, délai minimum de 2,5 s, petite question de calcul (`src/components/AntiRobot.jsx`). Le formulaire Netlify garde aussi son `netlify-honeypot`.
- Protection serveur optionnelle : créer une clé reCAPTCHA v3, la mettre dans `VITE_RECAPTCHA_SITE_KEY` (.env), puis activer App Check dans la console Firebase (Authentification, Firestore). Sans clé, rien ne change.

## Avis et suggestions / formulaires Netlify
- Footer > « Avis et suggestions » : pop-up (avis avec note de 1 à 5, ou suggestion), anti-robot inclus, envoyé à Netlify Forms (formulaire `avis`).
- Formulaires détectés par Netlify (déclarés en statique dans `index.html`) : `contact`, `demande-gestionnaire` (objet « Demande d'accès gestionnaire » du formulaire de contact), `demande-scenario-contact` (objet « Demande de scénario »), `avis`, `demande-scenario` (copie e-mail de chaque demande de scénario d'un gestionnaire). Les réponses sont dans Netlify > Forms ; configurer les notifications e-mail à cet endroit.

## Séance en salle (formateur / stagiaires)

Fonctionnement :

1. **Formateur** : Espace gestionnaire → carte « Séance en salle » → choisir un scénario → « Ouvrir une salle ». Un code de 5 caractères s'affiche (ex. `K7M2P`).
2. **Stagiaires** : page d'accueil → carte « Séance en salle » → saisir le code → « Rejoindre ». Ils font l'exercice normalement (questions, SOIEC, message).
3. **Tableau de bord du formateur** (`/gestion/salle/:code`), en direct : stagiaires connectés, questions de chacun (filtre par stagiaire), couverture des questions essentielles (posées par combien de stagiaires), questions « hors base » (non reconnues : à ajouter au scénario).
4. **Projection** (`/gestion/salle/:code/projection`) : photo, situation et photos d'arrivée en grand, avec le code ; bouton « Afficher la correction » pour le débriefing.
5. **Clôturer** la salle (plus d'entrée possible), la rouvrir ou la supprimer (efface aussi les questions).

Données : `salles/{code}` + sous-collections `participants` et `questions`. Règles : seul le formateur propriétaire (ou un admin) lit les questions. Une séance en salle n'écrase pas la progression personnelle du stagiaire (session locale séparée, pas de sauvegarde « en cours » dans le profil). Penser à déployer `firestore.rules`.

La salle comporte une **discussion en direct** (sous-collection `messages`) : le formateur et les stagiaires inscrits dans la salle s'écrivent ; les messages sont supprimés avec la salle.

**Planification** : à l'ouverture, le formateur peut indiquer une date et une heure (champ `debut`, en ms). Avant cette heure la salle est « Planifiée » et les règles Firestore refusent l'entrée ; il peut reprogrammer ou « Ouvrir maintenant ».

## Dominantes

Chaque scénario peut porter des **dominantes** (badges : Reconnaissance cubique, TMD, Risque d'explosion…). L'admin les saisit dans l'éditeur (onglet Général : saisie libre ou suggestions). Elles s'affichent sur les cartes de la page d'accueil, au démarrage de l'exercice et dans la liste admin. Champ `dominantes` (tableau de textes, 8 max).

## Scénarios évolutifs

Dans l'éditeur : case « Scénario évolutif » (onglet Général) puis onglet **Évolutions** : titre, délai (minutes après le début de l'exercice du stagiaire) et information de changement de situation. Dans Questions / réponses, chaque question peut être « Disponible à partir de » une évolution et « Remplacée à partir de » une évolution (même mots-clés, nouvelle réponse).
À l'heure programmée, une alerte « Évolution de la situation » s'affiche, reste dans l'historique et les réponses changent. Les questions essentielles disponibles seulement après une évolution ne comptent dans le bilan que si l'évolution a été vue. Champs : `evolutif`, `evolutions[{id,titre,delai,message}]`, `qa[].evo`, `qa[].fin`. Exemple fourni : « Feu de maison avec propagation aux combles ».

## Nouveautés
La page « Nouveautés » (pied de page) est modifiable par l'admin (ajout, modification, suppression). Collection Firestore `nouveautes` (lecture : connecté, écriture : admin) ; si elle est vide, l'admin peut cliquer sur « Charger l'historique ».

## Support (tickets)
Lien « Support » du pied de page : le stagiaire ouvre un ticket, l'équipe répond en direct dans une boîte de dialogue (Firestore `tickets` + sous-collection `messages`). Chaque nouveau ticket et chaque réponse du stagiaire est aussi envoyé au formulaire Netlify « ticket » (notification e-mail possible : Netlify → Forms → Notifications). Admin : onglet « Tickets ». Pense à republier `firestore.rules`.
