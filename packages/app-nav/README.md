# app-nav

Source unique **partagée** web + iOS — données pures (ESM, sans React).

## Architecture

| Couche | Rôle | Fichiers |
|--------|------|----------|
| **Données partagées** | Catalogue d’onglets, teinte, contenu Home | `src/tabs.js`, `src/home.js` |
| **Contrat / schéma** | Validation du catalogue (`NAV_SCHEMA_VERSION`) | `src/schema.js` |
| **Capacités plateforme** | Quel chrome, quelles icônes, badges, îlot… | `src/capabilities.js` |
| **Icônes** | Normalisation SF / F7 / Ion par onglet | `src/icons.js` |
| **Adaptateurs** | Mappers vers web ou NativeTabs (données seulement) | `src/adapters/web.js`, `src/adapters/native.js` |

Les clients (Vite web, Expo iOS) **importent** ces modules et appliquent leur propre rendu React / CSS. Ce package ne contient **pas** de composants UI.

## Partagé vs adaptateurs

| Partagé | Adaptateur (par plateforme) |
|---------|----------------------------|
| `APP_TABS` (ordre, labels, hidden, badge, icônes) | Chrome : `UITabBar` Apple (iOS) vs split-bottom / liquid-glass / M3 web |
| `NAV_TINT` | Pages riches (DeviceLab, jeux…) |
| `HOME` (titre / texte Aujourd’hui) | Lab `?lab=1` |

## iOS = NativeTabs uniquement

Sur iOS natif, la barre est **toujours** `NativeTabs` / UITabBar Apple. Utiliser `toNativeTriggers()` pour mapper `APP_TABS` → props trigger ; ne pas dupliquer la liste dans `mobile/app/_layout.tsx`.

## `side` = web uniquement

Le champ `side` (`left` | `right`) sert au split-bottom web (`toWebSplitGroups`, `tabsBySide`). iOS ignore `side` — une seule barre native.

## Capacités plateforme

```js
import { getCapabilities } from "app-nav/capabilities";

getCapabilities("web-live");    // split-bottom, f7, side, badge…
getCapabilities("ios-native");  // uitabbar, sf, nativeTabBar…
```

## Validation

```bash
npm run check -w app-nav
# ou
node packages/app-nav/scripts/check.mjs
```

Au chargement de `tabs.js`, `validateNavCatalog` logue un avertissement si le catalogue est invalide (sans throw). Le script `check.mjs` **échoue** en CI avec `assertNavCatalog`.

Modifier `src/tabs.js` ou `src/home.js` → les deux clients suivent (OTA / Vite).
