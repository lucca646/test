# Radios — app CarPlay catégorie Audio

Lecteur de radios web. Sa raison d'être : obtenir un **entitlement CarPlay
catégorie Audio**, la plus accessible du catalogue Apple, et disposer d'un
terrain de test CarPlay sur du vrai matériel.

| | |
|--|--|
| Catégorie Apple | **Audio** (`com.apple.developer.carplay-audio`) |
| UI CarPlay | `ListTemplate` (stations) → `NowPlayingTemplate` |
| Audio | `expo-audio` — lecture de fond + Now Playing |
| Stack | Expo SDK 54 · RN 0.81.5 · `react-native-carplay` 2.3.0 + patch |

## Pourquoi Audio

Apple n'exige **qu'une seule** règle spécifique pour cette catégorie : ne
jamais afficher de paroles de chanson. À comparer aux 3 intents SiriKit
obligatoires de la catégorie Communication, qui imposent une extension native.

La contrepartie est non négociable : l'app doit être *« designed primarily to
provide audio playback services »* (Guidelines §1). C'est le cas ici — c'est
un vrai lecteur, pas une coquille.

## Démarrer

```bash
npm install
npx eas-cli build -p ios --profile development-simulator
```

Installe le `.app` sur un simulateur iOS, puis :

```bash
npm start
```

Enfin dans le simulateur : **I/O → External Displays → CarPlay**.

Une fois l'entitlement accordé par Apple, pour tester en voiture réelle :

```bash
npx eas-cli build -p ios --profile development
```

## Règles Apple appliquées

- **Audio §1** — aucune parole de chanson à l'écran. On affiche le nom de la
  station et une ligne de description, rien d'autre.
- **§4** — pas d'écran de réglages, de diagnostic ni de debug dans CarPlay.
- **§2** — aucun texte ne renvoie vers l'iPhone, même en erreur.
- **§7** — la liste sert à choisir, Now Playing à lire.
- **Session audio activée au premier play, jamais au lancement.** Apple :
  *« if someone is listening to the car's FM radio and you activate your audio
  session too soon, the FM radio will stop. »* Voir `ensureSession()` dans
  [`src/player.ts`](./src/player.ts).
- **Pas d'enregistrement** — le plugin `expo-audio` est configuré sans
  permission micro. Apple : *« While in CarPlay, configure audio sessions
  without recording features. »*
- **Templates autorisés en Audio** : action sheet (iOS 17+), alert, grid, list,
  tab bar, information, now playing, search (iOS 27+), voice control (iOS 27+).
  ❌ contact, map, point of interest — exception au runtime.

## Patch obligatoire

`patches/react-native-carplay+2.3.0.patch` — identique à celui de `mobile/`.

Upstream conditionne l'émission des évènements à `RCTEventEmitter.bridge`,
**toujours nil** sous New Architecture. Sans le patch, brancher la voiture
pendant que l'app tourne n'envoie jamais `didConnect` et l'écran CarPlay reste
vide. Le bug est toujours présent en `2.4.1-beta.0`.

Appliqué par `patch-package` au `postinstall`. Sur EAS (`CI=1`), un échec
d'application fait échouer le build — pas de régression silencieuse possible.

## Flux radio

Flux publics Radio France (Icecast MP3). **Avant toute publication sur l'App
Store, vérifier les droits de diffusion.** Écouter un flux public et le
redistribuer dans une app publiée sont deux choses différentes.

## Architecture

| Fichier | Rôle |
|---|---|
| [`src/stations.ts`](./src/stations.ts) | Catalogue |
| [`src/player.ts`](./src/player.ts) | Lecteur singleton observable, partagé iPhone ↔ CarPlay |
| [`lib/carplay/index.ts`](./lib/carplay/index.ts) | Garde : ne charge le natif que si `RNCarPlay` est lié |
| [`lib/carplay/carPlayApp.ts`](./lib/carplay/carPlayApp.ts) | Templates CarPlay |
| [`plugins/withCarPlay.js`](./plugins/withCarPlay.js) | Entitlement, scène CarPlay, `CarSceneDelegate` |

L'état de lecture vit hors de React : le code CarPlay tourne dans des
templates natifs, il ne peut pas s'appuyer sur un hook. `src/player.ts` est
donc un singleton observable, et l'UI iPhone s'y abonne via
`useSyncExternalStore`.
