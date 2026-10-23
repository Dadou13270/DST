# Devoir sur table simulateur — pompiers (SOIEC)

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
