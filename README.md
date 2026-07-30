# test — Apple-like Liquid Glass

Deux playgrounds dans ce repo :

| Dossier | Stack | Test |
|---------|-------|------|
| `/` (racine) | React web + Konsta + Vite **PWA** | navigateur / tunnel Cloudflare |
| [`mobile/`](./mobile) | **Expo** (React Native) | **Expo Go** — sans App Store |

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
