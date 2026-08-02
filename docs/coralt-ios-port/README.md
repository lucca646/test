# COR·ALT → port iOS (Coraia Glass)

Référence technique pour porter COR·ALT vers l’app iOS JS **Coraia Glass**.

## Règles

- **Lecture seule** sur le dépôt / serveur COR·ALT (`/root/alternance`) : ne jamais y écrire, modifier ni redémarrer de services depuis ce travail de doc.
- Toute documentation du port vit **uniquement** sous `docs/coralt-ios-port/` (ce dossier).
- Auth web actuelle : cookie session `coralt_session`. **Cible iOS : API Bearer** (`Authorization: Bearer …`).
- **Admin hors scope MVP iOS** (pages + API documentées pour référence seulement).

## Index

### Pages

| Doc | Sujet |
|-----|--------|
| [pages/landing.md](pages/landing.md) | Landing (`LandingPage`) |
| [pages/auth.md](pages/auth.md) | Auth (`AuthPage`) |
| [pages/activation.md](pages/activation.md) | Activation / Plans |
| [pages/recherche.md](pages/recherche.md) | Recherche / Console |
| [pages/entreprises.md](pages/entreprises.md) | Entreprises |
| [pages/parametres.md](pages/parametres.md) | Paramètres |
| [pages/mailing.md](pages/mailing.md) | Mailing |
| [pages/envois.md](pages/envois.md) | Envois (swipe) |
| [pages/admin.md](pages/admin.md) | Administration (**hors MVP**) |

### Features

| Doc | Sujet |
|-----|--------|
| [features/auth-session.md](features/auth-session.md) | Auth & session |
| [features/plans-gates-nav.md](features/plans-gates-nav.md) | Plans, gates React, navigation |
| [features/stripe-checkout.md](features/stripe-checkout.md) | Stripe Checkout |
| [features/search-onboarding.md](features/search-onboarding.md) | Onboarding recherche |
| [features/search-queue.md](features/search-queue.md) | File APE × zone |
| [features/naf-geo.md](features/naf-geo.md) | NAF / APE & géographie |
| [features/entreprises-crud.md](features/entreprises-crud.md) | CRUD entreprises / prospects |
| [features/enrichment.md](features/enrichment.md) | Enrichissement contacts |
| [features/cv.md](features/cv.md) | Upload & analyse CV |
| [features/gmail-oauth.md](features/gmail-oauth.md) | Gmail OAuth |
| [features/google-sheets-oauth.md](features/google-sheets-oauth.md) | Google Sheets OAuth |
| [features/mailing-control.md](features/mailing-control.md) | Contrôle campagne / worker mailing |
| [features/templates-prompts.md](features/templates-prompts.md) | Templates & prompts |
| [features/envois-swipe.md](features/envois-swipe.md) | Swipe Envois |

### API

| Doc | Sujet |
|-----|--------|
| [api/http-client.md](api/http-client.md) | Client `apiFetch` → cible Bearer iOS |
| [api/auth-stripe.md](api/auth-stripe.md) | Auth & Stripe |
| [api/search.md](api/search.md) | Recherche |
| [api/settings-oauth-cv.md](api/settings-oauth-cv.md) | Paramètres, OAuth, CV |
| [api/plan3-mailing.md](api/plan3-mailing.md) | Plan 3 — mailing & prospects |
| [api/entreprises-db.md](api/entreprises-db.md) | API `entreprises-db` |
| [api/admin.md](api/admin.md) | Admin (**hors MVP**) |

### Bases de données

| Doc | Sujet |
|-----|--------|
| [db/schema-overview.md](db/schema-overview.md) | Vue d’ensemble SQLite (users / entreprises / globales) |
| [db/users-sessions.md](db/users-sessions.md) | Users & sessions |
| [db/entreprises.md](db/entreprises.md) | Entreprises & tables liées |
| [db/search-queue.md](db/search-queue.md) | File de recherche |
| [db/oauth-cv.md](db/oauth-cv.md) | OAuth Gmail & CV |
| [db/mailing-prospects.md](db/mailing-prospects.md) | Prospects mailing |

### Connecteurs

| Doc | Sujet |
|-----|--------|
| [connectors/overview.md](connectors/overview.md) | Factory, workers, nginx, variables `.env.example` |
| [connectors/n8n-search-webhook.md](connectors/n8n-search-webhook.md) | Webhook n8n recherche |
| [connectors/google-oauth.md](connectors/google-oauth.md) | Google OAuth (Gmail + Sheets) |
| [connectors/email-sender.md](connectors/email-sender.md) | Service `email_sender` Gmail |

## Périmètres documentés ici (agent Admin + infra)

- **A** — AdminPage + API admin (hors MVP, référence).
- **B** — Infra : factory Flask, bootstrap workers, schémas DB, connecteurs, client HTTP, plans/nav.
