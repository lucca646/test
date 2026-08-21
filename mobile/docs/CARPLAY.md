# CarPlay — Coraia Glass

Deux approches coexistent dans l'app `mobile/` :

| Approche | Entitlement Apple ? | Ce que ça donne dans la voiture |
|----------|--------------------|---------------------------------|
| **A. Audio Now Playing** (par défaut) | ❌ Aucun | L'app apparaît sur l'écran **Now Playing** de CarPlay (pochette, titre, play/pause/suivant) dès qu'elle joue de l'audio |
| **B. Templates CarPlay** (`CARPLAY=1`) | ✅ Restreint (approbation) | **Icône dédiée** sur l'accueil CarPlay + UI par templates (onglets, listes, grille…) |

> **Pour ouvrir l'app dans ta voiture SANS Mac ni approbation Apple → approche A.**
> C'est le chemin par défaut : voir « Build sans Mac » plus bas.

---

## Approche A — Audio « Now Playing » (sans entitlement)

Toute app qui joue de l'audio en arrière-plan et publie ses métadonnées via
`MPNowPlayingInfoCenter` apparaît sur l'écran Now Playing de CarPlay — la **même
surface système** que l'écran verrouillé. Aucune demande à Apple.

Câblé dans le repo :
- `lib/carAudio.ts` — session audio (`setAudioModeAsync` playback/arrière-plan) +
  pistes de démo (à remplacer par le vrai contenu Coraia).
- `components/CarAudioPlayer.tsx` — lecteur (play/pause/suivant) qui appelle
  `player.setActiveForLockScreen(true, metadata)` → alimente le Now Playing.
- `app/arcade.tsx` — onglet « Radio Coraia » qui héberge le lecteur.
- `app.json` — `UIBackgroundModes: ["audio"]` (lecture en arrière-plan iOS) +
  plugin `expo-audio`.

Tester dans la voiture : builder (voir plus bas), installer, ouvrir l'onglet
**Radio Coraia**, lancer la lecture, brancher l'iPhone en CarPlay → l'app est sur
le Now Playing. Fonctionne aussi sur l'écran verrouillé / Centre de contrôle.

---

## Approche B — Templates CarPlay (icône dédiée, entitlement requis)

CarPlay affiche une UI **par templates natifs Apple** (pas de vues React Native
custom) : le prototype décline plusieurs pages et fonctionnalités.

## Pages & fonctionnalités

Racine = **barre d'onglets CarPlay** (`TabBarTemplate`) :

| Onglet | Template | Fonctionnalités |
|--------|----------|-----------------|
| Accueil | `ListTemplate` | Liste à sections → **push** d'un détail (`InformationTemplate`) avec actions Appeler / Itinéraire / Retour |
| Actions | `GridTemplate` | Boutons : **Alerte** (`AlertTemplate`), **Choix** (`ActionSheetTemplate`), **Compteur +** (état live mis à jour sur l'onglet Infos), **Média** (Now Playing) |
| Média | `ListTemplate` → `NowPlayingTemplate` | Sélection d'un titre → lecteur Now Playing natif (shuffle / repeat / more) |
| Infos | `InformationTemplate` | Valeurs mises à jour dynamiquement (état, taille écran, compteur, titre) + actions Rafraîchir / Réinitialiser |

Code : `lib/carplay/carPlayApp.ts` (templates + logique), `lib/carplay/index.ts`
(garde `setupCarPlay`, no-op hors iOS dev-client). Init appelée dans
`app/_layout.tsx`.

## Ce qui est déjà câblé

- Dépendance `react-native-carplay` (autolinkée iOS via son podspec).
- Config plugin `plugins/withCarPlay.js`, exécuté au `expo prebuild` :
  - entitlement `com.apple.developer.carplay-audio` ;
  - `UIApplicationSceneManifest` (scène `CPTemplateApplicationScene` →
    `CarSceneDelegate`) ;
  - `CarSceneDelegate` (Objective-C) relayant connect/disconnect vers
    `RNCarPlay`, ajouté à la target Xcode.
- Templates **opt-in** : le plugin `withCarPlay` n'est appliqué qu'avec
  `CARPLAY=1` (et jamais en Expo Go). L'import natif est en require paresseux →
  l'app tourne partout sans CarPlay.

## Builder & tester les templates (macOS + Xcode requis)

Les templates CarPlay ne tournent **pas** en Expo Go ni sur une VM Linux :

```bash
cd mobile
CARPLAY=1 npx expo prebuild -p ios   # génère ios/ + applique withCarPlay
npx pod-install ios                  # autolink react-native-carplay
npx expo run:ios                     # build dev-client sur simulateur
```

Puis lancer le **simulateur CarPlay** : Xcode → *Additional Tools for Xcode*
(ou, simulateur ouvert, menu **I/O → External Displays → CarPlay**).
L'écran CarPlay affiche la barre d'onglets ci-dessus.

Alternative EAS (build cloud) : `npm run build:dev` (profil `development`).

## ⚠️ Caveat entitlement (bloquant hors prototype)

`com.apple.developer.carplay-*` est un entitlement **restreint** : Apple ne
l'accorde qu'après une **demande CarPlay** validée, liée à une catégorie
(Audio, Navigation, Communication, EV charging, Parking…). Sans cette
approbation :

- OK : itération locale sur simulateur CarPlay avec un profil de dev.
- KO : distribution TestFlight / App Store et vrais boîtiers CarPlay.

Un agenda / app générique n'entre dans aucune catégorie standard : prévoir de
justifier l'usage (ou changer de catégorie) avant toute mise en production.

## Build sans Mac (EAS cloud) — recommandé

EAS Build compile iOS **dans le cloud, sans Mac**. Seul prérequis : un token EAS.

Créer un token sur https://expo.dev → Account → Access tokens, puis l'ajouter
comme **secret `EXPO_TOKEN`** (panneau Secrets de l'agent) ou dans
`mobile/.env.eas` (voir `.env.eas.example`). Ensuite :

```bash
cd mobile
# Build par défaut = approche A (Now Playing). Signe sans entitlement CarPlay,
# s'installe sur iPhone, apparaît sur le Now Playing de la voiture :
npx eas-cli build -p ios --profile preview
# → lien d'installation interne (aucun Mac requis)
```

C'est le chemin pour **ouvrir l'app dans ta voiture dès maintenant** : installe,
lance la lecture dans l'onglet Radio Coraia, branche CarPlay.

### (Optionnel) Templates CarPlay — nécessite l'entitlement Apple
`com.apple.developer.carplay-audio` est un entitlement **restreint**. EAS ne peut
PAS l'auto-provisionner : tant qu'Apple ne l'a pas accordé, un build `CARPLAY=1`
**échoue à la signature** (« provisioning profile doesn't include
com.apple.developer.carplay-* »). Étapes (titulaire du compte Apple uniquement) :
1. Demander l'entitlement : https://developer.apple.com/contact/carplay/
   (choisir une catégorie : Audio, Navigation, Communication, EV, Parking…).
2. Attendre l'approbation Apple (un playground/agenda générique risque un refus :
   prévoir de justifier la catégorie).
3. Une fois accordé, activer la capability CarPlay sur l'App ID, puis builder
   **avec** les templates (`CARPLAY=1`) et soumettre à TestFlight :

```bash
cd mobile
CARPLAY=1 npx eas-cli build -p ios --profile production --auto-submit
```

Puis installer via TestFlight sur l'iPhone → l'icône de l'app apparaît sur
l'écran d'accueil CarPlay.

> Résumé : **Now Playing dans la voiture = ✅ sans Mac ni Apple** (build par
> défaut). Icône dédiée + templates = ⛔ tant que l'entitlement CarPlay n'est pas
> approuvé par Apple.

## Notes d'intégration

- `CarSceneDelegate.m` importe `"RNCarPlay.h"` (sans `use_frameworks!`). Avec
  `use_frameworks!`, remplacer par `#import <react_native_carplay/RNCarPlay.h>`.
- Catégorie `carplay-audio` choisie car c'est la plus riche en templates pour un
  test (tab bar + list + grid + information + now playing).
