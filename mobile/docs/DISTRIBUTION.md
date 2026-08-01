# Distribution — lien de téléchargement

## Lien preview (prêt)

Build autonome (sans Metro / Dev Client) :

https://expo.dev/accounts/luccar2956s-team/projects/liquid-glass-mobile/builds/11e39e43-c3c5-4c0f-b048-d22fcc4cf60f

Sur iPhone → ouvrir le lien → **Install**.

**Limite iOS Ad Hoc** : seuls les iPhones enregistrés peuvent installer.
Appareil actuel : l’iPhone déjà dans le profil (UDID `…601E`).

### Ajouter l’iPhone d’un pote
```bash
cd mobile
npx eas device:create
```
→ URL d’enregistrement à lui envoyer → puis **rebuild** `preview` :
```bash
npx eas build --platform ios --profile preview --non-interactive
```

## TestFlight (lien public pour n’importe qui)

Nécessite une **connexion Apple interactive** une fois (le mot de passe
d’app en CI est refusé pour générer le certificat App Store).

Sur une machine avec navigateur / 2FA (Mac Mini ou ton ordi) :
```bash
cd mobile
export EXPO_TOKEN=…   # ou npx eas login
npx eas build --platform ios --profile production --auto-submit
```
Quand EAS demande le compte Apple : Apple ID + mot de passe (ou 2FA).

Ensuite App Store Connect → TestFlight → External Testing → **Public Link**
→ `https://testflight.apple.com/join/XXXX`.

## Rebuilds
```bash
# Secrets dans mobile/.env.eas (gitignoré) — voir .env.eas.example
./scripts-eas-check-secrets.sh
./scripts-eas-testflight.sh          # store + submit non-interactif
npx eas build -p ios --profile preview --non-interactive
```

## MAJ sans build = EAS Update (OTA)

L’app installée contient un **binaire natif** (Swift / UITabBar / ActivityKit)
+ un **bundle JS** (React Native).

- Un *build* EAS recompile le binaire → **1 crédit** Free (15 iOS/mois).
- Un *update* EAS renvoie **uniquement le JS** → **0 crédit**.

Flux :

1. IPA déjà installée (TestFlight / preview), même `runtimeVersion` (ex. `1.1.0`)
2. Publish : `./scripts-eas-update.sh production "message"`
3. Au lancement, `applyOtaUpdateIfAny()` → check → fetch → `reloadAsync()`
4. Nouvelle UI / logique île **sans** Xcode ni build

**OTA OK :** écrans, styles, modes Dynamic Island, autopilot, textes.  
**Build requis :** icône home, plugins natifs, PNG du widget Live Activity, bump `runtimeVersion`.

```bash
cd mobile
./scripts-eas-check-secrets.sh
./scripts-eas-update.sh production "nouvelle feature île"
# channel = preview | production  (doit matcher le profil du build installé)
```

### Build local (aussi gratuit, illimité)
```bash
npx expo run:ios --device
```
