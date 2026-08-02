# app-nav

Source unique **partagée** web + iOS.

| Partagé | Pas partagé (adaptateurs) |
|---------|---------------------------|
| `APP_TABS` (ordre, labels, hidden, badge, `side`, icônes) | Rendu chrome : CSS web vs `SplitDock` RN |
| `NAV_TINT` | Pages riches (DeviceLab, jeux…) |
| `HOME` (titre / texte Aujourd’hui) | Lab `?lab=1` |

`side: "left" | "right"` → split G/D web **et** iOS (`tabsBySide()`). Plus de UITabBar.

Modifier `src/tabs.js` ou `src/home.js` → les deux clients suivent (OTA / Vite).
