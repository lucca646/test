# test — Liquid Glass playground

Playground UI complet pour tester l’effet **Liquid Glass** avec plusieurs libs Git/npm.

## Lancer

```bash
npm install
npm run dev
```

Ouvre dans **Chrome / Edge** pour la réfraction live.

## Libs branchées

| Package | Repo | Rôle dans le playground |
|---------|------|-------------------------|
| [`liquid-glass-react`](https://github.com/rdev/liquid-glass-react) | rdev | Boutons, segmented, liste, chips, cards (élasticité) |
| [`@samasante/liquid-glass`](https://github.com/samasante/liquid-glass) | samasante | Bouton, toggle, slider lentille (headless / optics) |
| [`@dpawlikowski/liquid-glass`](https://github.com/dpawlikowski/liquid-glass) | dpawlikowski | Bouton CSS, cards, log (presets subtle/vivid/vision) |
| SDF maison | local | Dock flottant + goutte (`public/liquid-lens-*.png`) |

## Sections UI

- Boutons (primary / polar / prominent / icon)
- Segmented control + toggle
- Liste / menu
- Chips / filtres
- Inputs / search
- Cards (3 libs)
- Slider lentille
- Dock mobile Liquid Glass
- Event log + liens repos

## Régénérer les maps SDF

```bash
python3 -m venv .venv
.venv/bin/pip install numpy pillow
.venv/bin/python scripts/generate-displacement-map.py \
  --width 720 --height 72 --radius 36 --rim 28 \
  --output public/liquid-lens-pill.png
.venv/bin/python scripts/generate-displacement-map.py \
  --width 128 --height 128 --radius 64 --rim 48 \
  --output public/liquid-lens-blob.png
```
