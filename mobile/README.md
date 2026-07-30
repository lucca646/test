# mobile/ — Expo (React Native) · Liquid Glass

Playground **sans App Store** : tu testes sur ton iPhone avec **Expo Go**.

## Prérequis

1. Compte Expo (gratuit) optionnel mais utile pour le tunnel
2. App **Expo Go** (App Store / Play Store) — c’est le runtime, pas ton app
3. Node 20+

## Lancer

```bash
cd mobile
npm install
npx expo start --tunnel
```

- Scanne le QR avec l’**appareil photo** iOS (ouvre Expo Go) ou depuis Expo Go
- Même Wi‑Fi : `npx expo start` (LAN) suffit souvent
- Web (limité) : `npx expo start --web`

## Ce qui est porté

Dock style App Store (5 onglets) aligné sur le look validé PWA :

- pastille plus petite au repos
- plus grande + transparente au drag
- mouvement X only + morph léger
- blur natif (`expo-blur`)

La loupe SDF web (`backdrop-filter: url(#…)`) n’existe pas telle quelle en RN ; ici on utilise blur + pastille glass. On pourra pousser plus loin (Skia) plus tard.

## Structure

```
mobile/
  App.tsx
  components/LiquidGlassDock.tsx
  babel.config.js   # plugin Reanimated
```

## Notes

- Pas de build native / TestFlight / App Store pour cette phase
- Pour une build installable hors Expo Go plus tard : `eas build` (toujours sans store si tu restes en internal distribution)
