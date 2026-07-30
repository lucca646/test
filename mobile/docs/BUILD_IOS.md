# Build iOS (Dev Client + Live Activities)

## Mac Mini (Tentative 2026-07-30)

- Host Tailscale : `mac-mini-de-lucca` (100.101.12.72)
- macOS 12.7.6, **pas de Xcode.app** (CLT 14.2 seulement)
- Node 20 installé via nvm sous `~/Projects/liquid-glass-mobile`
- `npx expo run:ios` → **bloqué** : demande Xcode complet + CocoaPods/Homebrew

→ Compile locale **impossible** tant que Xcode n’est pas installé (App Store)
  et idéalement macOS 13+/14+ pour un Xcode récent.

## EAS Build (recommandé)

```bash
cd mobile
export EXPO_TOKEN=…   # https://expo.dev → Account → Access tokens
./scripts-eas-dev.sh
# ou simulateur :
npx eas-cli build --platform ios --profile development-simulator --non-interactive
```

Puis installer le build sur iPhone et : `npx expo start --dev-client`

## Statut 2026-07-30

- Mac local : impossible (pas de Xcode)
- EAS simulator (`development-simulator`) : **OK**
  - https://expo.dev/accounts/luccar2956s-team/projects/liquid-glass-mobile/builds/202d99e2-9bab-4e23-a114-cfe78bb6ceb6
- EAS device (`development`) : **bloqué** — credentials Apple manquantes
  (compte Apple Developer + `eas credentials` en interactif, ou Apple ID pour EAS)
