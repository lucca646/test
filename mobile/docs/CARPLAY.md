# Prototype CarPlay — Coraia Glass

Test CarPlay branché sur l'app `mobile/` (dev-client Expo). CarPlay affiche une UI
**par templates natifs Apple** (impossible d'y rendre des vues React Native
custom / le look liquid glass) : le prototype décline plusieurs pages et
fonctionnalités avec ces templates.

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
- Plugin retiré automatiquement en **Expo Go** (`app.config.js`), et l'import
  natif est chargé en require paresseux → l'app tourne partout sans CarPlay.

## Builder & tester (macOS + Xcode requis)

CarPlay ne tourne **pas** en Expo Go ni sur une VM Linux. Il faut un Mac :

```bash
cd mobile
npx expo prebuild -p ios        # génère ios/ + applique withCarPlay
npx pod-install ios             # autolink react-native-carplay
npx expo run:ios                # build dev-client sur simulateur
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

## Notes d'intégration

- `CarSceneDelegate.m` importe `"RNCarPlay.h"` (sans `use_frameworks!`). Avec
  `use_frameworks!`, remplacer par `#import <react_native_carplay/RNCarPlay.h>`.
- Catégorie `carplay-audio` choisie car c'est la plus riche en templates pour un
  test (tab bar + list + grid + information + now playing).
