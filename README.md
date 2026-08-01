# test — Apple-like Liquid Glass + port COR·ALT

Playgrounds et doc native dans ce repo :

| Dossier | Stack | Test |
|---------|-------|------|
| `/` (racine) | React web + Konsta + Vite **PWA** | navigateur / tunnel Cloudflare |
| [`mobile/`](./mobile) | **Expo** · **UITabBar native** iOS | **Expo Go** — sans App Store |
| [`docs/EXPO_NATIVE_PORT.md`](./docs/EXPO_NATIVE_PORT.md) | Doc portage **COR·ALT** → Expo | plan validé |
| [`coralt-mobile/`](./coralt-mobile) | **Expo Go** COR·ALT MVP → `dev.cal.coraia.eu` | Auth + tabs |
| [`docs/EXPO_STEP2.md`](./docs/EXPO_STEP2.md) | Contrats Bearer + nav | étape 2 |

## Web (PWA)

```bash
npm install
npm run dev
```

## Mobile (Expo · recommandé pour sentir le natif)

```bash
cd mobile
npm install
npx expo start --tunnel
```

Installe **Expo Go** sur ton iPhone, scanne le QR. Détails : [`mobile/README.md`](./mobile/README.md).

## Look dock validé

Pastille inset au repos, plus grande au drag, loupe soft (web) / blur natif (Expo), bleu `#0a84ff`.
