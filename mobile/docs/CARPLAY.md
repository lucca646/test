# CarPlay — COR·ALT

Interface voiture via **templates natifs Apple** (onglets, listes, grilles) —
pas un simple lecteur Now Playing.

| | |
|--|--|
| Icône sur l’accueil CarPlay | Oui (après entitlement Apple) |
| UI | `TabBar` · Accueil · Messages · Actions · Infos |
| Code | `lib/carplay/` + plugin `plugins/withCarPlay.js` |
| Dépendance | `react-native-carplay` |

## Onglets

| Onglet | Template | Contenu |
|--------|----------|---------|
| Accueil | `ListTemplate` → `InformationTemplate` | Raccourcis RDV / itinéraire / appel |
| Messages | `ListTemplate` → détail | Conversations (données démo pour l’instant) |
| Actions | `GridTemplate` | Alerte, choix, compteur live |
| Infos | `InformationTemplate` | État connexion, taille écran, compteur |

Init : `setupCarPlay()` dans `app/_layout.tsx` (no-op hors iOS natif lié).

## Plugin natif (`withCarPlay`)

Au `expo prebuild` :

- entitlement `com.apple.developer.carplay-audio` (templates riches : tab bar + list + grid + information)
- scène `CPTemplateApplicationScene` → `CarSceneDelegate`
- bridge connect/disconnect vers `RNCarPlay`

**Toujours actif** hors Expo Go (`EXPO_GO=1` retire le plugin). Désactiver
explicitement : `CARPLAY=0`.

## ⚠️ Entitlement restreint

Apple n’accorde `com.apple.developer.carplay-*` qu’après
[demande CarPlay](https://developer.apple.com/contact/carplay/) (catégorie
Audio, Communication, Navigation…).

| Contexte | Templates |
|----------|-----------|
| Simulateur CarPlay + profil dev | OK |
| TestFlight / App Store / vrai boîtier | Bloqué sans approbation |

Sans entitlement, un build EAS **échoue à la signature**.

## Builder & tester

```bash
cd mobile
npx expo prebuild -p ios          # applique withCarPlay
npx pod-install ios
npx expo run:ios                  # ou EAS profile development
```

Simulateur CarPlay : Xcode → *I/O → External Displays → CarPlay*.

EAS (après entitlement accordé) :

```bash
npx eas-cli build -p ios --profile production --auto-submit
```

## Notes

- `CarSceneDelegate.m` : `#import "RNCarPlay.h"` (sans `use_frameworks!`).
- Les listes Messages sont encore en **données démo** — brancher l’API CRM ensuite.
