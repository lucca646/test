# mobile/ — Expo SDK 54 · UITabBar native + Live Activities

## Ce qu’il y a

- **UITabBar** Apple via `expo-router` `NativeTabs`
- **Dynamic Island / Live Activities** via `expo-live-activity` (ActivityKit)

## Important

| Environnement | UITabBar | Dynamic Island réelle |
|---|---|---|
| **Expo Go** | oui | non (aperçu UI seulement) |
| **Dev Client** (`eas build`) | oui | **oui** |

## Dev Client (île système)

Sur une machine avec compte Apple :

```bash
cd mobile
npm install --legacy-peer-deps
npx expo prebuild --platform ios --clean
# Build interne installable (pas App Store) :
npx eas-cli build --profile development --platform ios
```

Ou simulateur :

```bash
npx eas-cli build --profile development-simulator --platform ios
# puis
npx expo start --dev-client
```

Sur **Aujourd’hui** : choisis un mode → **Start** / **Update** / **Stop**.
L’activité apparaît sur le Lock Screen + Dynamic Island.

## Expo Go (sans build)

```bash
npm run tunnel
# = EXPO_GO=1 npx expo start --go --tunnel
```

`EXPO_GO=1` retire `owner` / `projectId` EAS et les plugins natifs le temps du serveur
(comme au premier playground anonyme). Sans ça, en CI Expo demande un login → erreur 500.

Tu gardes la nav + l’aperçu des modes ; Start affichera que le module natif est absent.

## Fichiers clés

```
app/_layout.tsx                         ← NativeTabs
components/DynamicIslandPlayground.tsx  ← modes + Start/Update/Stop
lib/liveActivity.ts                     ← bridge ActivityKit
assets/liveActivity/                    ← images < 4KB
eas.json                                ← profils development
```
