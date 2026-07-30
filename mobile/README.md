# mobile/ — Expo SDK 54 (React Native) · Liquid Glass

Playground **sans App Store** : tu testes sur ton iPhone avec **Expo Go**.

> Projet en **SDK 54** (compatible Expo Go du store). Si tu vois encore
> « incompatible », mets à jour Expo Go, ou dis-moi la version affichée dans Expo Go → Profile.

## Prérequis

1. App **Expo Go** à jour (App Store)
2. Node 20+

## Lancer

```bash
cd mobile
npm install
npx expo start --tunnel
```

- Scanne le QR avec l’**appareil photo** iOS ou depuis Expo Go
- Lien type : `exp://….exp.direct`

## Ce qui est porté

Dock style App Store (5 onglets) aligné sur le look validé PWA :

- pastille plus petite au repos
- plus grande + transparente au drag
- mouvement X only + morph léger
- blur natif (`expo-blur`)

## Structure

```
mobile/
  App.tsx
  components/LiquidGlassDock.tsx
  babel.config.js
```
