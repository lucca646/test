# Environnements développement et production

Deux instances de la même codebase coexistent sur le serveur :

| | **Production** | **Développement** |
|---|----------------|-------------------|
| URL | `https://cal.coraia.eu` | `https://dev.cal.coraia.eu` (ou `http://127.0.0.1:8668`) |
| Config | `.env` | `.env.dev` |
| Port Flask | `8667` | `8668` |
| Bases SQLite | `users.db`, `entreprises.db` (racine) | `data/dev/users.db`, `data/dev/entreprises.db` |
| Workers systemd | `search-queue`, `company-enrichment`, `email-sender` (8020) | désactivés par défaut dans `.env.dev` |

La production **n’est pas modifiée** tant que vous ne redéployez pas via `scripts/prod-deploy.sh` ou ne redémarrez pas `coralt-webapp`.

## Première mise en place du dev

```bash
cd /root/alternance
chmod +x scripts/bootstrap-dev.sh scripts/dev.sh scripts/prod-deploy.sh
./scripts/bootstrap-dev.sh
```

Éditez `.env.dev` (clés API, URLs OAuth Google pour `dev.cal.coraia.eu`).

Démarrer le dev :

```bash
./scripts/dev.sh
# ou en service :
sudo systemctl enable --now coralt-webapp-dev
```

Frontend avec rechargement à chaud (API sur le port dev) :

```bash
cd frontend
CORALT_PORT=8668 npm run dev
```

## Synchroniser les données prod → dev

Pour tester en dev avec les mêmes comptes, prospects et CV qu’en production :

```bash
./scripts/sync-prod-to-dev.sh
```

Copie :

- `users.db` (utilisateurs, miroir Google Sheet, tokens Gmail, modèles mail…)
- `entreprises.db` (prospects)
- `uploads/cvs/` (fichiers CV)

La prod n’est pas modifiée. Arrêtez l’instance dev (`coralt-webapp-dev`) le temps de la copie si elle tourne.

## Déployer une modification en production

1. Tester sur l’instance dev (`8668`).
2. Builder et redémarrer la prod uniquement :

```bash
./scripts/prod-deploy.sh
```

## Variables utiles

- `CORALT_DATA_DIR` — répertoire des `.db` et verrous workers
- `CORALT_PORT` — port Flask
- `CORALT_ENV_FILE` — fichier env (`.env` ou `.env.dev`)
- `CORALT_INSTANCE` — `prod` | `dev` (logs)

## Production : recommandations

Dans `.env` (prod), utilisez :

```env
FLASK_ENV=production
FLASK_DEBUG=0
```

Sans `CORALT_DEV_SEED` ni `FLASK_DEBUG=1`.

Pour figer la prod sous systemd :

```bash
sudo cp deploy/coralt-webapp.service /etc/systemd/system/
# Arrêter l’ancien processus manuel sur 8667 avant :
sudo systemctl enable --now coralt-webapp
```

## DNS / nginx dev

1. Enregistrement `dev.cal.coraia.eu` → ce serveur.
2. `sudo cp deploy/nginx-cal-dev.conf /etc/nginx/sites-available/cal-dev`
3. `sudo ln -sf /etc/nginx/sites-available/cal-dev /etc/nginx/sites-enabled/`
4. `sudo certbot --nginx -d dev.cal.coraia.eu`

Prod : voir `deploy/nginx-cal-prod.conf`. **Ne pas** ajouter de `Content-Security-Policy` dans nginx — Flask autorise PostHog (`eu-assets.i.posthog.com` pour le recorder) et Google Fonts. Une CSP nginx en `script-src 'self'` seule bloque le session replay.

Ajoutez l’URI OAuth Google Sheets pour `https://dev.cal.coraia.eu/api/setup/google-sheets/callback`.
