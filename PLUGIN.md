# Plugin `liquid-glass-nav`

Navbar Liquid Glass réutilisable — package local :

```
packages/liquid-glass-nav/
```

## Dans ce playground

Déjà branché via `file:./packages/liquid-glass-nav`.

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
