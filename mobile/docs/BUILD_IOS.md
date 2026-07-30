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
