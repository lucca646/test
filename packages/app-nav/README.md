# app-nav

Source unique **partagée** web + iOS.

| Partagé | Pas partagé (adaptateurs) |
|---------|---------------------------|
| `APP_TABS` (ordre, labels, hidden, badge, `side`) | Chrome : `UITabBar` iOS (1 barre) vs CSS web (split G/D) |
| `NAV_TINT` | Pages riches (DeviceLab, jeux…) |
| `HOME` (titre / texte Aujourd’hui) | Lab `?lab=1` |

`side: "left" | "right"` pilote le split web (`tabsBySide()`). iOS ignore `side` tant que NativeTabs / UITabBar est utilisé.

Modifier `src/tabs.js` ou `src/home.js` → les deux clients suivent (OTA / Vite).
