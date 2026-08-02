# test — Coraia Glass → réplique iOS COR·ALT

| Dossier | Stack | Test |
|---------|-------|------|
| [`mobile/`](./mobile) | **Expo** · UITabBar / Liquid Glass · **COR·ALT** | Expo Go + bridge session |
| `/` (racine) | Lab web + dock glass (mêmes onglets `app-nav`) | navigateur |
| [`coralt-mobile/`](./coralt-mobile) | MVP de référence (sources reprises dans `mobile/`) | historique |
| [`docs/coralt-ios-port/`](./docs/coralt-ios-port/) | Doc API / DB / pages pour le port | référence |

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
