# Build iOS (Dev Client + Live Activities)

## Mac Mini actif — `mac-mini-de-lucca-2` (2026-08-24)

| Paramètre | Valeur |
|---|---|
| Tailscale | `mac-mini-de-lucca-2` |
| IPv4 | `100.127.42.18` |
| SSH | `luccarouxel@100.127.42.18` (mot de passe dans `/root/evolution-api/.env` sur Hetzner) |
| macOS | 14.8.9 (Sonoma) |
| Xcode | **26.6** (`/Applications/Xcode.app`) |
| Node | 20 via nvm |
| CocoaPods | Homebrew 1.17 |
| Projet | `~/Projects/liquid-glass-mobile` |

### État setup (2026-08-24)

- Xcode installé depuis `~/Downloads/Xcode.app` → `/Applications/`
- Homebrew + nvm + Node 20 + CocoaPods
- Repo cloné, `expo prebuild --platform ios` + `pod install` **OK**
- Premier `xcodebuild` simulateur lancé (peut prendre 15–30 min)

### Build simulateur (Mac mini)

```bash
cd ~/Projects/liquid-glass-mobile/mobile
./scripts/mac-mini-build-ios.sh
```

Ou via Expo :

```bash
cd ~/Projects/liquid-glass-mobile/mobile
npx expo run:ios
```

### Setup from scratch (Mac mini)

```bash
cd ~/Projects/liquid-glass-mobile/mobile
MAC_MINI_SSH_PASSWORD='…' ./scripts/mac-mini-setup-build.sh
```

### Accès depuis le serveur Hetzner

```bash
ssh luccarouxel@100.127.42.18
# ou via Tailscale : mac-mini-de-lucca-2
```

> **Veille** : le Mac mini se met parfois en veille → SSH timeout. Le réveiller (physiquement ou via Tailscale sur iPhone) avant un build.

---

## Ancien Mac — `mac-mini-de-lucca` (100.101.12.72)

Hors ligne / remplacé par `mac-mini-de-lucca-2`. Ne plus utiliser cette IP dans les configs.

---

## EAS Build (cloud, toujours disponible)

```bash
cd mobile
export EXPO_TOKEN=…   # https://expo.dev → Account → Access tokens
./scripts-eas-dev.sh
# ou simulateur :
npx eas-cli build --platform ios --profile development-simulator --non-interactive
```

Puis installer le build sur iPhone et : `npx expo start --dev-client`

## Statut EAS (2026-07-30)

- EAS simulator (`development-simulator`) : **OK**
- EAS device (`development`) : credentials Apple requises (`eas credentials`)
