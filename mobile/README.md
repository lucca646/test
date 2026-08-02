# mobile/ — Coraia Glass → réplique iOS COR·ALT

App Expo (UITabBar native / Liquid Glass iOS 26+) branchée sur l’API COR·ALT.

## Onglets

Entreprises · Recherche · Envois · Profil

## Démarrer

```bash
cd mobile
npm install --legacy-peer-deps
cp .env.example .env   # renseigner EXPO_PUBLIC_BRIDGE_URL si Expo Go
npm run bridge         # terminal 1 — proxy session cookie
npx expo start --go --tunnel   # terminal 2
```

Le bridge (`bridge/server.mjs`) est requis sur Expo Go : RN ne gère pas bien le cookie `coralt_session`.

## Structure

| Chemin | Rôle |
|--------|------|
| `app/(auth)/` | Login / register |
| `app/(app)/` | NativeTabs COR·ALT |
| `src/api/` | Client HTTP + session SecureStore |
| `src/auth/` | AuthContext |
| `packages/app-nav` | Catalogue onglets partagé web lab + iOS |

Playground App Store (Jeux / Arcade / Actu…) retiré de cette app — voir git history si besoin.
