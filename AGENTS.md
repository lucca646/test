# AGENTS.md

## Cursor Cloud specific instructions

Monorepo avec trois projets Node/JS indépendants. Le gestionnaire de paquets est **npm** partout (chaque projet a son propre `package-lock.json`), même si le `package.json` racine déclare `packageManager: yarn` — ignorer ce champ et utiliser `npm`.

### `/` (racine) — App web PWA « Liquid Glass » (React + Konsta + Vite)
Seul produit **exécutable de bout en bout dans la VM cloud Linux**. Commandes standard dans `package.json` :
- Dev : `npm run dev` → sert sur `http://127.0.0.1:5177/` (host/port figés dans `vite.config.js`).
- Lint : `npm run lint` (oxlint) — ne renvoie que des *warnings*, exit 0 = OK.
- Build : `npm run build` (Vite + PWA), `npm run preview` pour servir `dist/`.
- Sélecteur de plateforme via query string : `?platform=ios|android|web`.
- Dépend du package local `packages/liquid-glass-nav` (lié par `file:` dans le `package.json` racine, aucune install séparée requise).

### `mobile/` et `coralt-mobile/` — Apps Expo (iOS natif)
Nécessitent **Expo Go sur un iPhone physique ou un simulateur iOS (macOS)** ; elles **ne tournent pas de bout en bout dans la VM Linux** (modules natifs : UITabBar, `expo-live-activity`, etc.). Pour vérifier la readiness sans appareil :
- Valider la config : `npx expo config --type public`.
- Compiler le bundle via Metro : `npx expo start` (Metro écoute sur `:8081`), puis `curl "http://localhost:8081/node_modules/expo-router/entry.bundle?platform=ios&dev=false"` — un HTTP 200 avec ~1500 définitions de modules confirme que l'app compile. L'entrée est `expo-router/entry`, **pas** `index` (ne pas requêter `/index.bundle`).
- `mobile/` a un `postinstall: patch-package` (appliqué automatiquement par `npm install`).
- `coralt-mobile/` parle à un backend distant (`cal.coraia.eu`) et, sur Expo Go, requiert un **bridge** (`node bridge/server.mjs`) + tunnel + un `.env` (copier `coralt-mobile/.env.example`) pour le flux d'auth complet.
- Secrets EAS/TestFlight dans `mobile/.env.eas` (gitignoré, modèle `mobile/.env.eas.example`).
