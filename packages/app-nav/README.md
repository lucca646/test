# app-nav

Source unique **partagée** web + iOS.

| Partagé | Pas partagé (adaptateurs) |
|---------|---------------------------|
| `APP_TABS` (ordre, labels, hidden, badge, icônes) | Chrome : `UITabBar` Apple (iOS) vs CSS web |
| `NAV_TINT` | Pages riches (DeviceLab, jeux…) |
| `HOME` (titre / texte Aujourd’hui) | Lab `?lab=1` |

`side` ne s’applique qu’au web (split CSS). iOS = NativeTabs / UITabBar.

Modifier `src/tabs.js` ou `src/home.js` → les deux clients suivent (OTA / Vite).
