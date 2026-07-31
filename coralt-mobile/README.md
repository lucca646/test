# COR·ALT mobile (Expo)

App native MVP branchée sur **https://cal.coraia.eu**.

## Tab bar — Liquid Glass Apple

Utilise `expo-router/unstable-native-tabs` → **vraie `UITabBar` / `UITabBarController`**, pas un dock custom.

| Environnement | Résultat |
|---|---|
| **Expo Go** | UITabBar native système (blur). Pas le matériau **Liquid Glass iOS 26** (Expo Go n’est pas compilé avec Xcode 26). |
| **Dev / preview build** (Xcode 26+) | Liquid Glass Apple réel + `minimizeBehavior` |

```bash
# Voir la vraie barre glass (après login Apple Developer) :
npx eas-cli build --profile development --platform ios
```

## Session (Expo Go)

Expo Go ne gère pas le cookie Flask `HttpOnly` → bridge obligatoire :

```bash
node bridge/server.mjs
cloudflared tunnel --url http://127.0.0.1:8791
# EXPO_PUBLIC_BRIDGE_URL=https://….trycloudflare.com
npx expo start --go --tunnel --clear
```

Login doit afficher `cal.coraia.eu · bridge`.

## MVP

- Auth · Recherche · Entreprises · Envois · Profil
- Auth v1 : cookie via bridge → SecureStore → `X-Coralt-Session`
