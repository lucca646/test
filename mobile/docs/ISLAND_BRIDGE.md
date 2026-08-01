# Island Bridge — un script → web + iOS

## Idée
Un petit **interprète** (`packages/island-bridge`) lit un script unique et le diffuse en WebSocket aux peers :

- PWA Vite (preview île CSS)
- App Expo (Live Activity réelle)

## Démarrer le serveur

```bash
# racine du repo
npm run bridge:island
# → http://0.0.0.0:8792  ·  ws://0.0.0.0:8792/ws
```

## Web
1. `npm run bridge:island`
2. `npm run dev` (Vite :5177)
3. Aujourd’hui → plateforme iOS/Web → panneau **Bridge interprète** → Run

## iPhone (TestFlight / Dev Client)
1. Expose le bridge (même Wi‑Fi ou tunnel) :
   `cloudflared tunnel --url http://127.0.0.1:8792`
2. Relance Metro avec :
   `EXPO_PUBLIC_ISLAND_BRIDGE_URL=wss://XXXX.trycloudflare.com/ws`
3. Ouvre Aujourd’hui — le playground écoute les commandes.

## DSL

```text
mode score
start
wait 1000
phase
mode progress
update
stop
```

Commandes : `mode`, `start`, `update`, `phase`, `stop`, `wait`, `echo`.
