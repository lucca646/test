# Plugins web (miroir de l’app native)

Playground Vite + React qui reprend le shell iOS (onglets, Dynamic Island HTML/CSS).

```bash
npm run dev
# → http://127.0.0.1:5177
```

## Plugin `liquid-glass-nav`

Navbar Liquid Glass réutilisable — package local :

```
packages/liquid-glass-nav/
```

## Dans ce playground

Déjà branché via `file:./packages/liquid-glass-nav`.
Onglet **Aujourd’hui** : playground Dynamic Island en CSS pur
(`src/components/DynamicIslandWeb.jsx` + `dynamic-island.css`).

## Dans un autre projet

```bash
# Copier le dossier packages/liquid-glass-nav
# puis :
npm install ./chemin/vers/liquid-glass-nav
```

```jsx
import { LiquidGlassNav, LiquidGlassFilters } from "liquid-glass-nav";
import "liquid-glass-nav/styles.css";

<>
  <LiquidGlassFilters />
  <LiquidGlassNav items={items} activeId={path} onChange={setPath} />
</>
```

Doc complète : [`packages/liquid-glass-nav/README.md`](./packages/liquid-glass-nav/README.md)
