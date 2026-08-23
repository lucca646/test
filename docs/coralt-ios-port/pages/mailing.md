# Page Mailing (MailingPage)

Source web : `frontend/src/pages/MailingPage.jsx`  
Composants : `MailingControlPanel`, `SkillsTagList`, blacklist / éditeurs inline  
API client : `frontend/src/api/mailing.js`  
Gate : `Plan3Gate` → `hasMailingAccess` (`plan >= 3`) · route `/mailing`

## Rôle

Configurer la **rédaction** des candidatures (modèle fixe vs trame IA), les **compétences** mises en avant, et la **blacklist**. L’envoi unitaire se fait depuis Entreprises / Envois ; l’envoi auto via worker + `mailing-control`.

## Structure UI

```
mailing-layout
├── aside (sidebar)
│   ├── MailingControlPanel — toggle IA + sélecteur trame/modèle
│   └── Card Blacklist — chips + ajout
└── main
    ├── Card Compétences (SkillsTagList)
    ├── Card Modèles de messages (chips + éditeur inline)
    └── Card Trames mail IA (chips + éditeur inline)
```

## Données chargées

| État | Source |
|------|--------|
| `templates` | `GET /api/plan3/templates?email=` |
| `prompts` | `GET /api/plan3/prompts?email=` |
| `blacklist` | `GET /api/plan3/blacklist?email=` |
| `mail_use_ai`, `selected_template_id`, `selected_prompt_id` | `user` (session) |
| `skillsList` | `resolveSkillsList(user)` puis `POST /api/auth/update` `{ skills_list }` |

Au mount : `refreshUser()` + `reloadMailingData()`. Recharge templates si profil (`search_profile_json` / `competence_highlight` / `search_domain`) change. Query `?gmail=connected` → `refreshGmailStatus` puis clean URL.

## Actions principales

| UI | API |
|----|-----|
| Toggle « Rédaction IA » / sélection modèle ou prompt | `POST /api/plan3/mailing-compose` |
| CRUD modèle | `POST/DELETE /api/plan3/templates` |
| CRUD trame | `POST/DELETE /api/plan3/prompts` |
| Blacklist +/− | `POST/DELETE /api/plan3/blacklist` |
| Persistance skills | `POST /api/auth/update` `{ skills_list }` (+ extract tags `apiExtractSkillTags`) |

`persistMailingCompose` envoie toujours les trois champs (`mail_use_ai`, `selected_template_id`, `selected_prompt_id`) et patch le `user` local.

## MailingControlPanel

- Si `mail_use_ai` : Select des **prompts** (`selected_prompt_id`) + aperçu `body`
- Sinon : Select des **templates** (`selected_template_id`)
- Hints : Gmail non connecté → Paramètres ; pas de Sheet → lancer Recherche

Le modèle générique (`GENERIC_EMAIL_TEMPLATE_NAME = "Modèle générique"`) se régénère côté serveur après questionnaire / `search_domain`.

## Gates / prérequis

| Condition | Effet |
|-----------|--------|
| `plan < 3` | Redirect `/recherche` |
| `gmail_connected` | Hint seulement (pas de blocage page) |
| `gsheet_url` valide | Hint liste entreprises |

## Port iOS

- Écran **Mailing** (hors MVP v1 EXPO d’après `EXPO_NATIVE_PORT.md` — templates/prompts « avancé »)
- Sections : Compose (IA/modèle) · Compétences · Templates · Prompts · Blacklist
- Après OAuth Gmail : deep link `?gmail=connected` → refresh user (voir `features/gmail-oauth.md`)
- Voir aussi : `features/mailing-control.md`, `features/templates-prompts.md`, `api/plan3-mailing.md`
