# liquid-glass-nav

Navbar **Liquid Glass** style App Store Apple — pastille drag, loupe, morph doigt.

## Install

```bash
# depuis un monorepo / copie locale
npm install ./packages/liquid-glass-nav

# ou chemin relatif
npm install file:../path/to/liquid-glass-nav
```

Peer deps : `react` ≥ 18, `react-dom` ≥ 18.

## Usage

```jsx
import { LiquidGlassNav, LiquidGlassFilters } from "liquid-glass-nav";
import "liquid-glass-nav/styles.css";

const items = [
  { id: "/", label: "Aujourd'hui", icon: <TodayIcon />, iconActive: <TodayFill /> },
  { id: "/games", label: "Jeux", icon: <GamesIcon />, iconActive: <GamesFill /> },
  { id: "/apps", label: "Apps", icon: <AppsIcon />, iconActive: <AppsFill /> },
  { id: "/arcade", label: "Arcade", icon: <ArcadeIcon />, iconActive: <ArcadeFill /> },
  { id: "/search", label: "Recherche", icon: <SearchIcon /> },
];

export default function AppShell() {
  const [path, setPath] = useState("/");

  return (
    <>
      {/* Une seule fois, près de la racine */}
      <LiquidGlassFilters />

      <main>{/* tes pages */}</main>

      <LiquidGlassNav
        items={items}
        activeId={path}
        onChange={setPath}
        activeColor="#0a84ff"
      />
    </>
  );
}
```

## API

### `<LiquidGlassFilters />`

Monte les filtres SVG SDF (loupe). **Obligatoire** une fois dans l’arbre React.

### `<LiquidGlassNav />`

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `items` | `{ id, label, icon, iconActive? }[]` | `[]` | Onglets |
| `activeId` | `string` | — | Id de l’onglet actif (route) |
| `onChange` | `(id) => void` | — | Callback sélection / fin de drag |
| `activeColor` | `string` | `#0a84ff` | Couleur icône sous la lentille |
| `className` | `string` | `""` | Classe sur le `<nav>` |
| `ariaLabel` | `string` | `"Navigation"` | Accessibilité |

`icon` / `iconActive` : nœuds React (SVG, lucide, framework7-icons, etc.).

## Comportement (look validé)

- **Repos** : lentille plus petite que la barre, verre mat
- **Drag** : plus grande, plus transparente, loupe + bords légèrement déformés + morph doigt
- Icônes **fixes** ; bleu = onglet sous la lentille
- Mouvement **X only** (hauteur bloquée)

## Vite

Les PNG de displacement sont importés dans le package. Avec Vite, rien à copier dans `/public`.

```js
// vite.config.js — si besoin d’autoriser le package lié
server: { fs: { allow: [".."] } }
```

## Structure

```
liquid-glass-nav/
  assets/          # maps SDF loupe
  src/
    LiquidGlassNav.jsx
    LiquidGlassFilters.jsx
    styles.css
    index.js
  package.json
  README.md
```
