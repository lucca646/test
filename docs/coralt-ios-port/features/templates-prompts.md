# Feature — Templates & prompts (rédaction)

Sources front : `MailingPage`, `MailingControlPanel`, `mailTemplate.js`, `defaultEmailTemplate.js`, `mailingProspects.js`  
Sources back : `plan3.py` (templates/prompts/mailing-compose), `prospect_mail_compose.py`, `default_email_template.py`, `search_profile_compose.py`

## Deux modes de rédaction

| Mode | Flag | Sélection | Usage |
|------|------|-----------|--------|
| Modèle fixe | `mail_use_ai = 0` | `selected_template_id` → `email_templates` | Substitution variables `{…}` |
| Trame IA | `mail_use_ai = 1` | `selected_prompt_id` → `email_prompts` | LLM (DeepSeek via `deepseek_text_completion`) |

Persistance : `POST /api/plan3/mailing-compose`.

## Tables (`users.db`)

### `email_templates`

`id`, `user_email`, `name`, `subject`, `body`

### `email_prompts`

`id`, `user_email`, `name`, `body` (instructions / trame, pas le mail final)

Modèle auto : nom exact `"Modèle générique"` — régénéré après questionnaire / changement `search_domain`.

## Variables template (`applyMailTemplate` / `apply_mail_vars`)

| Placeholder | Source |
|-------------|--------|
| `{nom_contact}` | prospect.contact ou « Madame, Monsieur » |
| `{entreprise}` | prospect.entreprise |
| `{secteur}` | user.search_domain |
| `{competence_cv}` | competence_highlight ou cv_json.competences |
| `{nom_cv}` | user.name |
| `{ville}` | prospect.ville |
| `{email}` | prospect.email |

## Génération / régénération IA

Endpoint unique : `POST /api/plan3/sheet-prospects/mail` avec `regenerate: true`  
(alias : `POST …/mail/regenerate`)

Pipeline `regenerate_prospect_mail` :

1. Si `instructions` non vide → `refine_prospect_mail` (réécrit le mail actuel)
2. Sinon si `mail_use_ai` + trame → `compose_prospect_mail_from_prompt` (JSON `{subject,body}`)
3. Sinon si template sélectionné → apply vars sur template
4. Sinon erreur 400 « Configurez une trame IA ou un modèle… »

Si `mail_use_ai` et pas de prompt body : 400 « Sélectionnez une trame mail IA… ».  
Échec LLM : 502 RuntimeError.

## CRUD API

| Méthode | Path |
|---------|------|
| GET/POST | `/api/plan3/templates` |
| DELETE | `/api/plan3/templates/<id>?email=` |
| GET/POST | `/api/plan3/prompts` |
| DELETE | `/api/plan3/prompts/<id>?email=` |

POST create : omettre `id` ; update : fournir `id`. Toujours scopé `user_email` session.

## Détection UI « mail IA »

`prospectMailIsAiGenerated` : si `mail_use_ai` OU contenu ne matche aucun template rendu.

## Port iOS

- Liste + éditeur templates / prompts (hors MVP v1 possible)
- Sur Envois : picker modèle ↔ IA + champ consignes pour refine
- Timeout régénération ≥ 120 s ; spinner non bloquant le deck
- Ne pas recalculer le prompt côté device — toujours passer par l’API
