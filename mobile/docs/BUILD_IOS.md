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

### État setup (vérifié sur machine 2026-08-27)

| Élément | Statut |
|---|---|
| Outillage (Xcode, Homebrew, Node 20, CocoaPods, fastlane, eas-cli) | ✅ installé |
| Branche `cursor/mac-mini-ios-build-setup-28fb` sur le Mac | ✅ à déployer (`git pull`) |
| Scripts `mac-mini-*.sh` | ✅ dans le repo ; étaient absents/vides sur le Mac avant pull |
| `eas.json` → `credentialsSource: local` | ✅ dans le repo ; manquait sur le Mac (restait sur `master`) |
| `credentials.json` + `ios/certs/` | ✅ présents localement sur le Mac |
| `security find-identity` (1 identité valide) | ✅ |
| **codesign smoke** (`/bin/echo`) | ✅ OK (2026-08-27 — TrustAsRoot WWDR retiré) |
| **Build device EAS Local end-to-end** | ⏳ à lancer (`./scripts/mac-mini-eas-local.sh development`) |

- Xcode installé depuis `~/Downloads/Xcode.app` → `/Applications/`
- Homebrew + nvm + Node 20 + CocoaPods + fastlane
- Repo cloné, `expo prebuild --platform ios` + `pod install` **OK**
- `xcodebuild` simulateur : **OK**

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

### EAS Local (Mac mini = machine de build)

Prérequis : `eas-cli`, `fastlane` (Homebrew), `mobile/.env.eas` avec `EXPO_TOKEN`.

```bash
cd ~/Projects/liquid-glass-mobile/mobile
./scripts/mac-mini-eas-local.sh
# ou profil explicite :
./scripts/mac-mini-eas-local.sh development-simulator
# device (Ad Hoc, signing local) :
./scripts/mac-mini-sync-signing.sh   # une fois / si credentials changent
./scripts/mac-mini-eas-local.sh development
```

### Signing Apple (device / Ad Hoc)

> **Cause racine codesign cassé (corrigée 2026-08-27)** : WWDR marqué `TrustAsRoot` dans les trust settings **admin** (`security dump-trust-settings -d`).  
> Symptôme : `unable to build chain to self-signed root` + `errSecInternalComponent` (même sur `/bin/echo`).  
> Fix : `sudo security remove-trusted-cert -d AppleWWDRCAG3.cer` — **jamais** `add-trusted-cert -r trustAsRoot` sur WWDR.  
> Le script `mac-mini-sync-signing.sh` retire ce TrustAsRoot et vérifie codesign (smoke test).

Sur le Mac mini, après sync depuis EAS :

```bash
MAC_MINI_SSH_PASSWORD='…' ./scripts/mac-mini-sync-signing.sh
security find-identity -v -p codesigning
# → 1 valid identity : iPhone Distribution: LUCCA … (5JUVV8Y56D)
# Puis preuve réelle :
./scripts/mac-mini-eas-local.sh development
```

Fichiers locaux (gitignorés) :
- `ios/certs/dist.p12` + `dist.password`
- `ios/certs/ad_hoc-*.mobileprovision` / `app_store-*.mobileprovision`
- `credentials.json` (multi-target `CoraiaGlass` + `LiveActivity`)

Le profil `development` dans `eas.json` utilise `"credentialsSource": "local"`.

Équivalent manuel :

```bash
export EXPO_TOKEN=…   # depuis .env.eas
eas build --local --platform ios --profile development-simulator --non-interactive
```

> EAS Local compile dans un dossier temporaire → 1er build long (pods). Les builds `xcodebuild` directs (`mac-mini-build-ios.sh`) réutilisent le cache DerivedData et restent plus rapides pour itérer.

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

> **Veille** : désactivée via `./scripts/mac-mini-disable-sleep.sh` (`pmset sleep 0`, WoL activé). Réveil à distance : WoL depuis l’app Freebox si besoin.

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
