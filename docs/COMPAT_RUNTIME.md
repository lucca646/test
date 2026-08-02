# Runtime compatible — JS central × plateformes

## Principe

Les apps (iOS / web / Android) ont leurs **outils natifs prêts** (UITabBar, blur, ActivityKit, CSS…).  
Chacune **interprète** le catalogue à sa façon.  
La **source de données** reste le JS partagé.

```
packages/app-nav          → quoi afficher (onglets, HOME)
packages/island-bridge    → quoi exécuter (DSL → commandes)
        │
   adaptateurs host
   ├── ios-native     → NativeTabs / UITabBar (Apple)
   ├── web-live       → SiteBottomNav split
   ├── web-lab-*      → skins lab
   └── android-native → (à brancher, ion)
```

## Contrats versionnés

| Package | Constante | Rôle |
|---------|-----------|------|
| `app-nav` | `NAV_SCHEMA_VERSION` | Forme du catalogue onglets |
| `app-nav` | `HOME_SCHEMA_VERSION` | Forme du contenu Today |
| `island-bridge` | `PROTOCOL_VERSION` | Handshake WS `hello` → `welcome` |

Ajouter un champ = bump mineur + fallback adaptateur.  
Renommer / retirer = bump majeur + migration.

## Capabilities

`getCapabilities(platformId)` dit ce que la plateforme sait faire (`side`, `badge`, `icons`, `nativeTabBar`, `island`…).  
Un adaptateur **ignore** ce qu’il ne sait pas (ex. iOS ignore `side`) au lieu de casser.

## Règles pour changer un élément

1. Modifier le catalogue / protocole JS (`tabs.js`, `protocol.js`).
2. Lancer `npm run check:compat`.
3. Vérifier que **chaque adaptateur** mappe le nouveau champ (ou l’ignore explicitement).
4. OTA iOS / refresh web — rebuild Store seulement si nouveau plugin natif.

## iOS = composants Apple

Le chrome iOS reste **UITabBar** via `NativeTabs`.  
`toNativeTriggers()` / `mapIosNativeTabs()` ne font que du mapping data → props.
