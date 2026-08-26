# Coraia Drive — CarPlay « Driving Task »

App de commandes domotiques liées au trajet (portail, garage, éclairage,
chauffage, préchauffage habitacle), pensée pour l'entitlement CarPlay
**Driving Task** accordé au compte le 2026-08-25.

Elle sert deux buts à la fois : rendre un service réel depuis l'écran de la
voiture, et **exercer tous les templates que cette catégorie autorise**, pour
voir concrètement ce qu'on peut en faire.

---

## Pourquoi un projet séparé de `carplay-radio`

Les deux ne peuvent pas fusionner :

- Une app déclare **une seule** catégorie CarPlay. Mettre `carplay-audio` et
  `carplay-driving-task` dans le même fichier d'entitlements fait échouer la
  signature (le profil n'en contient qu'un) et rend la catégorie ambiguë pour
  la revue Apple.
- La catégorie Driving Task **interdit** `CPNowPlayingTemplate`, sur lequel
  repose entièrement l'app Radios. Fusionner casserait Radios au runtime.

Les deux apps partagent en revanche le même socle natif : config plugin CarPlay
identique (aux entitlements près) et même patch `react-native-carplay`.

---

## Ce qui est à l'écran de la voiture

```
TabBarTemplate  « Coraia Drive »
├── GridTemplate        « Scènes »     8 boutons, 1 tap = 1 effet
│                                      + bouton de barre → VoiceControlTemplate
├── ListTemplate        « Appareils »  2 sections (Maison / Véhicule)
│                                      + bouton de barre « Actualiser »
│   └── InformationTemplate            détail d'un appareil, action Activer/Couper
└── InformationTemplate « État »       6 lignes + 2 actions

par-dessus :
    ActionSheetTemplate    confirmation de « Tout couper »
    AlertTemplate          accusé de réception, refermé tout seul
    VoiceControlTemplate   dictée (démo — voir plus bas)
```

Soit **les sept templates** autorisés en catégorie Driving Task. Les cinq
autres (`NowPlaying`, `Contact`, `Map`, `PointOfInterest`, `Search`) lèvent une
exception au runtime dans cette catégorie et ne sont donc importés nulle part.

Fonctions de la bibliothèque exercées au passage : boutons de barre en image et
en texte, icônes d'onglet en SF Symbols, sections avec en-tête et index,
vignettes de liste, indicateur d'activité piloté par la promesse de
`onItemSelect`, `updateSections`, `updateInformationTemplateItems` /
`Actions`, `getMaximumListItemCount`, empilement / dépilement, présentation et
fermeture d'overlays, `registerOnConnect` / `registerOnDisconnect`.

---

## Règles Apple appliquées

| Règle du CarPlay Developer Guide | Où |
| --- | --- |
| Rafraîchissement des données ≥ 10 s | tick à 15 s, `src/home.ts` |
| Profondeur de navigation 2–3 | racine + détail appareil |
| Pas de réglages ni de configuration à l'écran | tout ça reste sur l'iPhone |
| Pas de texte renvoyant vers le téléphone | aucun |
| Nombre de lignes variable selon la voiture | `getMaximumListItemCount()` |
| Un seul entitlement CarPlay | `plugins/withCarPlay.js` |

**À faire avant toute soumission à Apple** : le `VoiceControlTemplate`
(`lib/carplay/overlays.ts`) enchaîne ses états sur une minuterie, il ne fait
pas de vraie reconnaissance vocale. Soit on le branche sur `SFSpeechRecognizer`
(+ `NSSpeechRecognitionUsageDescription` et `NSMicrophoneUsageDescription` dans
`app.json`), soit on retire le bouton « micro » de la grille.

---

## Structure

```
src/home.ts             état des appareils, scènes, journal — aucun réseau
lib/carplay/
  index.ts              garde : ne charge le natif que s'il est lié
  carPlayApp.ts         arborescence des templates, rendu, cycle de vie
  overlays.ts           alertes, confirmations, dictée
  icons.ts              require() des images
App.tsx                 même état, même actions, côté iPhone
plugins/withCarPlay.js  entitlement + scene manifest + delegates natifs
tools/make-icons.py     génère assets/carplay/** (glyphes blancs, @1x/@2x/@3x)
patches/                correctif New Architecture pour react-native-carplay
```

Brancher une vraie passerelle domotique = remplacer le corps de `applyMap()` et
`runScene()` dans `src/home.ts` par des appels HTTP. Rien d'autre à toucher.

---

## Builds

```bash
npm install
npm run build            # EAS distant, profil preview → lien d'installation
```

Build local sur le Mac mini (plus rapide, nécessite Xcode et un trousseau
déverrouillé) :

```bash
npm run build:local
```

Pas de `expo-dev-client` ici, volontairement : les builds sont en Release avec
le JS embarqué, donc **un seul lien à installer**, pas de Metro à lancer à côté.
La contrepartie est qu'un changement JS demande un nouveau build ; ajouter
`expo-updates` permettrait de pousser le JS sans repasser par Xcode.

Régénérer les icônes après modification de `tools/make-icons.py` :

```bash
npm run icons
```

---

## Prérequis côté compte Apple

1. Entitlement **CarPlay Driving Task** accordé au Team ID `5JUVV8Y56D` ✅
2. Capability **CarPlay** cochée sur l'App ID `eu.coraia.drive` dans
   Certificates, Identifiers & Profiles, avec l'option *Driving Task*.
   Sans ça le profil de provisionnement sort sans l'entitlement et la
   signature échoue au build — c'est exactement l'erreur rencontrée sur
   `eu.coraia.radios`.
3. Profil de provisionnement régénéré après l'étape 2 (`eas credentials`).
