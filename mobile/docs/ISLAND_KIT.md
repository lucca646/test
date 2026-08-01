# Island Kit — widget ultra-modulable

## Pourquoi l’aperçu ≠ l’île

| Couche | Qui dessine | MAJ |
|---|---|---|
| Aperçu in-app | React Native | OTA (gratuit) |
| Dynamic Island | Widget Swift ActivityKit | **Build** obligatoire |

Les chiffres à gauche/droite du pill = `compactLeading` / `compactTrailing` → natif.

## Layouts prêts dans le build

| `layout` | Compact L | Compact R | Expanded |
|---|---|---|---|
| `score` / `dual` / `sides` | `leadingText` | `trailingText` | labels + gros scores |
| `timer` / `focus` | badge | timer digital | titre + barre |
| `progress` / `transport` | badge | timer circulaire | titre + ETA |
| `music` | — / image | timer | titre + artiste |
| `breathe` | 3 lettres | timer | phase |
| `minimal` | badge | — | titre |
| `default` | image | timer | titre / sous-titre |

## Champs JS → natif

```ts
{
  title, subtitle,
  layout: "score",
  leadingText: "12", trailingText: "16",
  leadingLabel: "COR", trailingLabel: "ALT",
  centerText, bottomText, badgeText,
  progressBar: { date } | { progress },
  imageName, dynamicIslandImageName
}
```

Compat : `title: "12|16"` active encore le mode score.

## Fichiers

- Patch natif : `patches/expo-live-activity+0.4.2.patch`
- Builders JS : `lib/islandKit.ts`
- Pont : `lib/liveActivity.ts`

Après `npm install`, `patch-package` applique le widget. Puis `eas build`.
