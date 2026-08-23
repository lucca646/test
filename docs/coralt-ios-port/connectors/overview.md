# Connecteurs & infrastructure

Vue d’ensemble pour le port iOS : factory Flask, workers, nginx, variables d’environnement (noms uniquement — **jamais** les secrets `.env`).

## Factory & routes

```
create_app()  →  coralt_web/factory.py
  init_auth / logging
  register_routes()  →  public, auth, search, admin, setup, plan3, stripe
  on_app_ready()     →  bootstrap (DB + workers + blueprints extra)
```

Fichiers clés : `factory.py`, `bootstrap.py`, `routes/__init__.py`, entrée `webapp.py`.

## Runtime & chemins

| Module | Rôle |
|--------|------|
| `coralt_env.py` | Charge `CORALT_ENV_FILE` ou `.env` (setdefault, n’écrase pas l’env process) |
| `coralt_runtime.py` | `is_dev_runtime` / `is_production_runtime`, garde-fous secrets démo |
| `coralt_paths.py` | `DATA_DIR`, `USERS_DB`, `ENTREPRISES_DB`, `GLOBAL_ENTREPRISES_DB`, `FLASK_PORT`, `INSTANCE` |

Ports typiques : **8667** prod, **8668** dev (`CORALT_PORT`).

## Workers

| Worker | Démarrage | Unit systemd (deploy/) |
|--------|-----------|-------------------------|
| Enrichissement entreprises | Thread Flask si `ENRICH_WORKER_ENABLED` **ou** daemon | `company-enrichment.service` → `scripts/run_company_enrichment.py --daemon` |
| File de recherche APE/zones | Thread si `SEARCH_QUEUE_WORKER_ENABLED` **ou** daemon | `search-queue.service` → `scripts/run_search_queue.py --daemon` |
| Mailing / envois Gmail | Thread si `MAIL_WORKER_ENABLED` | (intégré) |
| Email sender (Uvicorn) | Process séparé | `email-sender.service` port **8020** (dev : `coralt-email-sender-dev` **8021**) |
| Webapp | Process | `coralt-webapp.service` / `coralt-webapp-dev.service` |

Admin peut piloter systemd + threads via `/api/admin/services` (hors MVP iOS).

## Nginx

| Fichier | Host | Upstream |
|---------|------|----------|
| `deploy/nginx-cal-prod.conf` | cal.coraia.eu, cal.corala.eu | `127.0.0.1:8667` |
| `deploy/nginx-cal-dev.conf` | dev.cal.coraia.eu | `127.0.0.1:8668` |

`proxy_read_timeout 300s`. Ne pas ajouter une CSP nginx qui casse PostHog replay (commentaire dans conf prod).

## Connecteurs externes (noms de variables — `.env.example`)

### n8n webhooks

| Variable | Usage |
|----------|--------|
| `WEBHOOK_URL` | Recherche entreprises (Console) |
| `MAIL_WEBHOOK_URL` | Rédaction mails IA |
| `ENRICH_WEBHOOK_URL` | Enrichissement fiches |
| `WEBHOOK_TIMEOUT_SECONDS`, `SEARCH_*`, `ENRICH_*` | Timeouts, lots, intervalles, retries |

Chargement runtime : `coralt_webhooks.py` (obligatoire en prod).

### Gmail / email sender

| Variable | Usage |
|----------|--------|
| `EMAIL_SENDER_URL` | Base HTTP service Uvicorn (ex. `http://127.0.0.1:8020`) |
| `EMAIL_SENDER_API_KEY` | Auth service envoi |
| `GMAIL_SEND_LABEL` | Label Gmail (ex. `alternance`) |
| `GOOGLE_OAUTH_*`, `FRONTEND_URL`, `GOOGLE_SHEETS_REDIRECT_URI` | OAuth Sheets/Gmail |

### API entreprises (machine)

| Variable | Usage |
|----------|--------|
| `ENTREPRISES_DB_API_KEY` | Header `X-API-Key` ou Bearer sur `/api/entreprises-db/*` |

### Paiements

| Variable | Usage |
|----------|--------|
| `STRIPE_MODE` | `test` \| `live` |
| `STRIPE_*_TEST` / `STRIPE_*_LIVE` | Clés, webhook, price IDs plans 1–3 (once + monthly) |

### IA / scraping

| Variable | Usage |
|----------|--------|
| `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `MISTRAL_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY` | LLM |
| `RAPIDAPI_FB_KEY`, `RAPIDAPI_FB_HOST` | Facebook Scraper |

### Analytics

| Variable | Usage |
|----------|--------|
| `VITE_POSTHOG_*` | Front |
| `POSTHOG_PROJECT_TOKEN`, `POSTHOG_HOST`, `POSTHOG_*_ENABLED` | Backend / logs OTLP |

### Divers

| Variable | Usage |
|----------|--------|
| `ADMIN_EMAIL` | Compte admin unique |
| `FLASK_SECRET_KEY`, `FLASK_ENV`, `FLASK_DEBUG` | Session / runtime |
| `CORALT_BASE_URL` | URL publique app |
| `REGISTRATION_*` | Ouverture inscriptions / codes |
| `CORALT_INSTANCE`, `CORALT_DATA_DIR`, `CORALT_PORT` | Instance |

## Client HTTP app

Voir [api/http-client.md](../api/http-client.md) — cookies web aujourd’hui ; **Bearer** pour iOS.

## Port iOS

- Consommer uniquement l’API HTTPS publique (nginx → Flask).
- Ne pas joindre n8n / email-sender / SQLite depuis le device.
- Secrets connecteurs restent côté serveur.
