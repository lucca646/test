# mobile/ — Expo SDK 54 · **UITabBar native Apple**

La barre d’onglets est la **vraie** `UITabBar` / `UITabBarController` iOS
via [`expo-router` NativeTabs](https://docs.expo.dev/router/advanced/native-tabs/).

Ce n’est plus le dock custom React Native.

## Lancer (Expo Go, sans App Store)

```bash
cd mobile
npm install
npx expo start --tunnel
```

Ouvre le lien `exp://…` dans **Expo Go**.

## Structure

```
app/
  _layout.tsx   ← NativeTabs (UITabBar)
  index.tsx     ← Aujourd'hui
  games.tsx
  apps.tsx
  arcade.tsx
  search.tsx
components/
  TabScreen.tsx
  LiquidGlassDock.tsx   ← ancien dock custom (conservé, non branché)
```

## Dynamic Island

Sur **Aujourd’hui** : switch Compact / Minimal / Expanded / Timer / Now Playing / Progress.

> Aperçu UI en Expo Go. Une **vraie** Dynamic Island (Live Activity / ActivityKit)
> nécessite un development build (`eas build` / `npx expo prebuild`), pas Expo Go.
