# Distribution — lien de téléchargement

## TestFlight (recommandé pour partager un lien)

1. Build store + upload App Store Connect :
   ```bash
   cd mobile
   npx eas-cli build --platform ios --profile production --auto-submit --non-interactive
   ```
2. Attendre le processing Apple (~5–30 min) sur
   [App Store Connect](https://appstoreconnect.apple.com).
3. TestFlight → groupe **External Testing** → activer le **Public Link**.
4. Partager `https://testflight.apple.com/join/XXXX`.

L’autre personne installe l’app **TestFlight**, ouvre le lien, télécharge.
Pas besoin d’enregistrer son UDID.

## Preview interne (amis déjà enregistrés)

```bash
npx eas-cli build --platform ios --profile preview --non-interactive
```

Lien d’install sur la page du build Expo. Chaque iPhone doit être
dans le profil Ad Hoc (device enregistré).

## Mises à jour JS sans rebuild

Après un build `preview` / `production` avec `channel` :
```bash
npx eas-cli update --branch production --message "fix UI"
```
