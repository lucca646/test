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
./scripts-eas-testflight.sh          # store + submit
npx eas build -p ios --profile preview --non-interactive
```
