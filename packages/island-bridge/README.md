# island-bridge

Interprète **un seul script JS/DSL** et le diffuse aux clients **web** + **iOS** (WebSocket).

## Démarrer

```bash
# à la racine du repo
npm run bridge:island

# ou
node packages/island-bridge/server.mjs
```

Port défaut : **8792** (`ISLAND_BRIDGE_PORT`).

## Script exemple

```text
mode score
start
wait 1200
phase
mode progress
update
stop
```

## API

| Route | Rôle |
|-------|------|
| `GET /bridge/health` | Santé + nb peers |
| `POST /bridge/run` | Interprète + broadcast |
| `WS /ws` | Clients web / Expo |

## Clients

- Web : panneau « Bridge » sur Aujourd’hui (plateforme iOS)
- iOS : `EXPO_PUBLIC_ISLAND_BRIDGE_URL=ws://…:8792/ws` puis playground Aujourd’hui

Tunnel (téléphone) : `cloudflared tunnel --url http://127.0.0.1:8792` puis `wss://…/ws`.
