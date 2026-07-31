# COR·ALT mobile (Expo Go)

App native MVP branchée sur **https://cal.coraia.eu**.

Doc architecture : [`../docs/EXPO_NATIVE_PORT.md`](../docs/EXPO_NATIVE_PORT.md)  
Étape 2 : [`../docs/EXPO_STEP2.md`](../docs/EXPO_STEP2.md)

## Session (important)

Expo Go ne peut pas gérer le cookie Flask `HttpOnly` (`Set-Cookie` invisible, header `Cookie` souvent strippé).  
Sans bridge, le login « marche » puis **déconnecte instantanément**.

1. Bridge local :
   ```bash
   node bridge/server.mjs
   ```
2. Tunnel public HTTPS (depuis le téléphone) :
   ```bash
   cloudflared tunnel --url http://127.0.0.1:8791
   ```
3. `.env` :
   ```
   EXPO_PUBLIC_API_URL=https://cal.coraia.eu
   EXPO_PUBLIC_BRIDGE_URL=https://xxxx.trycloudflare.com
   ```
4. Relancer Metro avec `--clear` pour injecter l’env.

L’écran login doit afficher `cal.coraia.eu · bridge`.

## Démarrage

```bash
cd coralt-mobile
npm install
cp .env.example .env   # puis renseigner BRIDGE_URL
npx expo start --go --tunnel --clear
```

## MVP écrans

- Auth (login / register)
- Recherche (compose + launch)
- Entreprises (liste sheet)
- Envois (deck plan 3)
- Paramètres (profil / logout)

Auth v1 : cookie session Flask via bridge → SecureStore → `X-Coralt-Session`.  
Bearer prêt côté client dès que COR-ALT renverra `access_token`.
