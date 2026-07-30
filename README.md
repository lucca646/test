# test — Liquid Glass playground

Repo de test isolé pour expérimenter l’effet **Liquid Glass** (iOS 26) hors de COR·ALT.

## Stack

- Vite + React
- Maps SDF (`public/liquid-lens-*.png`)
- Filtres SVG `feDisplacementMap` + aberration chromatique
- Dock flottant + lentille animée

## Lancer

```bash
npm install
npm run dev
```

Ouvre dans **Chrome / Edge** pour la réfraction live (`backdrop-filter: url(#…)`).  
Safari / Firefox : frost + specular + franges CSS (fallback).

## Régénérer les maps

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
