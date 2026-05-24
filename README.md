# App Mariage — Ronan & Lorie

Application web mobile-first pour le mariage de Ronan & Lorie, **13–14 juin 2026** au Domaine de la Corbe.

Version actuelle : **v0.5.0**

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | React 18 + Vite |
| Styles | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Icônes | Lucide React |
| Backend temps réel | Firebase (Firestore + Auth + Storage) |
| Données statiques | JSON locaux (`/public/data/*.json`) |
| Données dynamiques | Google Apps Script (GAS) via JSONP |
| Hébergement | GitHub Pages (CI/CD sur branche `dev`) |

---

## Pages de l'application

| Route | Page | Description |
|---|---|---|
| `/` | Home | Grille de tuiles d'accès aux sections |
| `/programme` | Programme | Timeline dynamique du week-end |
| `/plan` | Plan | Carte interactive du domaine avec fiches lieux |
| `/chambres` | Chambres | Plan-couchage, recherche par nom |
| `/photos` | Photos | Créneaux photo de groupe avec ETA dynamique |
| `/quiz` | Quiz Hub | Portail du quiz + badge résultat persistant |
| `/quiz/jouer` | Quiz | Quiz en 10 paliers de score |
| `/leaderboard` | Leaderboard | Top 10 scores Firebase |
| `/album` | Album | Galerie photo partagée (Embla Carousel) |
| `/partager` | Partager | Page d'upload photo |
| `/infos` | Infos | Infos pratiques + QR code + install PWA |
| `/whatsapp` | WhatsApp | Redirection groupe WhatsApp |
| `/cadeaux` | Cadeaux | Urne sur place + liste voyage optionnelle |
| `/admin` | Admin Photos | Gestion des groupes et retards (voir ci-dessous) |

---

## Programme du week-end

Données dans [src/data/programme.js](src/data/programme.js).

### Samedi 13 juin 2026
| Heure | Événement | Lieu |
|---|---|---|
| 14h | Messe | Cathédrale de Luçon |
| 16h30 | Arrivée au domaine | Domaine |
| 17h00 | Photos de groupe | Le lac |
| 17h30 | Vin d'honneur | Devant le Château |
| 20h00 | Réception — dîner | Orangerie |
| 23h00 | Dancefloor | Orangerie |
| 04h00 | After | Saloon |

### Dimanche 14 juin 2026
| Heure | Événement | Lieu |
|---|---|---|
| 10h00 | Ouverture piscine | Piscine |
| 11h00 | Brunch | Saloon |
| 14h00 | Pool Party | Piscine |
| 17h00 | Fin du mariage | Domaine |

### Paramètres importants — page Programme

- **Rafraîchissement** : toutes les **30 secondes** (mode réel) — `setInterval 30_000` dans [src/pages/ProgrammePage.jsx](src/pages/ProgrammePage.jsx)
- **PROTOTYPE_MODE** : `false` en production. Passer à `true` dans [src/data/programme.js](src/data/programme.js) pour tester la rotation des états (cycle toutes les **15 s**)
- **Fin du mariage déclarée** : `2026-06-14T19:00:00+02:00` — après cette heure, la page affiche le message de remerciement
- **Calcul "prochain"** : basé sur `Date.now()` comparé aux `startsAt` ISO 8601 de chaque événement

---

## Page Admin — Gestion des photos de groupe

Route : `/admin` — accès réservé aux mariés / organisateurs.

### Fonctionnement

L'admin gère les groupes de photos en temps réel, synchronisé sur Firestore.

- **Début des photos** (défaut : `2026-06-13T17:00`) — modifiable dans l'interface
- **Intervalle entre groupes** : 10 min par défaut (modifiable, 1–60 min)
- **Retard global** : slider de **-30 à +90 min** par pas de 5 — répercuté sur tous les ETAs instantanément
- **ETA calculé** : arrondi au multiple de 5 min le plus proche ([src/utils/etaUtils.js](src/utils/etaUtils.js))
- **Heure d'arrivée conseillée** affichée aux invités sur `/photos` : ETA − 5 min

### Synchronisation

- **Firestore** : collection `photoSession`, documents `state` (groupes + retard) et `data` (personnes, groupes GAS, créneaux)
- **Debounce** : 800 ms entre la dernière modification et l'écriture Firestore
- **localStorage** : clé `mariage_admin_state_v8` — cache local pour reprise rapide

### Import depuis Google Sheets

Le bouton "Importer depuis Google Sheets" appelle l'API GAS définie dans [src/utils/constants.js](src/utils/constants.js) (`APP_CONFIG.photosApi`). Il écrase le document `photoSession/data` avec les personnes, groupes et créneaux issus du Google Sheet.

---

## Page Photos — Vue invité

Route : `/photos` — chaque invité recherche son nom pour voir son créneau.

- Données lues en **temps réel** depuis Firestore (`onSnapshot`) — mise à jour automatique quand l'admin modifie l'ordre ou le retard
- Statuts possibles : `PENDING` · `NOW` (dot pulsant) · `DONE` · `SKIP` · `REPLAN`
- L'ETA affiché intègre le retard global positionné par l'admin

---

## Firebase

Configuration via variables d'environnement (`.env.local` en local, secrets GitHub en CI) :

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Collections Firestore utilisées :

| Collection | Document | Contenu |
|---|---|---|
| `photoSession` | `state` | Groupes admin, retard, heure de début |
| `photoSession` | `data` | Personnes, groupes GAS, créneaux (seed depuis GAS) |
| `gallery` | — | Photos partagées par les invités |
| `leaderboard` | — | Scores quiz |
| `reactions` | — | Réactions sur les photos (unicité par UID, via transaction) |

---

## Données statiques

| Fichier | Contenu |
|---|---|
| `public/data/rooms.json` | Plan-couchage — 133 entrées (sync depuis GAS via `scripts/sync-rooms.js`) |
| `public/data/rooms-old.json` | Ancienne version — non tracké, à supprimer |

---

## CI/CD — Déploiement GitHub Pages

- **Déclencheur** : push sur la branche `dev` (ou déclenchement manuel)
- **Workflow** : [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
- **Node** : version 20
- **Build** : `npm run build` avec `GITHUB_PAGES=true` + injection des secrets Firebase
- **Publication** : dossier `dist/` → GitHub Pages

Pour activer GitHub Pages : `Settings → Pages → Source: GitHub Actions`

---

## Démarrage local

```bash
npm install
npm run dev
```

Créer un fichier `.env.local` à la racine avec les variables Firebase (voir section Firebase ci-dessus).

---

## Liens importants

- **Groupe WhatsApp invités** : défini dans `APP_CONFIG.whatsappLink` ([src/utils/constants.js](src/utils/constants.js))
- **API Google Apps Script** : définie dans `APP_CONFIG.photosApi` — endpoint JSONP pour les personnes/groupes/créneaux photos
