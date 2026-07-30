# liquid-glass-nav

Navbar **Liquid Glass** style App Store Apple.

Distorsion Apple via [`@samasante/liquid-glass`](https://www.npmjs.com/package/@samasante/liquid-glass).

## Install

```bash
npm install ./packages/liquid-glass-nav
```

Peer : `react` ≥ 18, `react-dom` ≥ 18.

## Usage

```jsx
import { LiquidGlassNav } from "liquid-glass-nav";
import "liquid-glass-nav/styles.css";

<LiquidGlassNav
  items={[
    { id: "/", label: "Aujourd'hui", icon: <Icon />, iconActive: <IconFill /> },
  ]}
  activeId={path}
  onChange={setPath}
/>
```

## Comportement

- Pastille : **mêmes proportions** repos / drag
- Drag : optique Apple plus forte (bend, curvature, loupe)
- Barre **collée en bas** (portal `document.body` + `bottom: 0`)

## Navigateurs

Réfraction max sur Chrome/Edge. Safari : frost + rim.
