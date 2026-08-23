# Feature — CV (upload & analyse)

Sources : `frontend/src/api/cv.js`, `AccountSetupOptional.jsx`, `CvUploader.jsx`, `coralt_web/routes/plan3.py`, `coralt_web/cv_upload.py`, `cv_analysis.py`

## Objectif

Un PDF CV par utilisateur → stockage disque → analyse async (PyPDF2 + DeepSeek) → `cv_json` + trame mail personnelle.

Visible si `hasCvGmailSetup` (plan ≥ 3), dans Paramètres et onboarding.

## Contraintes fichier

| Règle | Valeur |
|-------|--------|
| Format | PDF uniquement (extension + magic `%PDF`) |
| Taille max | `MAX_CV_UPLOAD_BYTES` (défaut 5 Mo) |
| Nom stockage | `{email}_{uuid}.pdf` via `secure_filename` |
| Dossier | `uploads_cvs_dir()` → `DATA_DIR/uploads/cvs` |
| Unicité | 1 CV / user — ancien fichier supprimé à l’upload |

## API

| Méthode | Route | Body | Notes |
|---------|-------|------|-------|
| `POST` | `/api/plan3/upload_cv` | `multipart` champ `cv` | 202 + `analysis_status` ; enqueue analyse |
| `GET` | `/api/plan3/cv-analysis/status` | — | polling statut |
| `POST` | `/api/plan3/analyze_cv` | `{ email }` | relance analyse (session = identité) |
| `GET` | `/api/plan3/cv` | — | sert le PDF (inline) |
| `DELETE` via POST | `/api/plan3/delete_cv` | `{ email }` | fichier + reset colonnes |

Auth : `require_user_email()` sur toutes ces routes.

### Réponse upload (202)

```json
{
  "status": "success",
  "cv_path": "user@x.com_….pdf",
  "cv_json": "",
  "analysis_status": "pending",
  "user": { … }
}
```

### Statuts analyse

`idle` | `pending` | `running` | `done` | `error`  
Stockés : `users.cv_analysis_status`, `users.cv_analysis_error`.

Front poll : toutes les **3 s**, timeout **120 s** (`watchCvAnalysis`).

### `cv_json` (structure LLM)

```json
{
  "nom": "",
  "prenom": "",
  "email": "",
  "telephone": "",
  "competences": ["…"],
  "experiences": [{ "titre", "entreprise", "dates", "description" }],
  "formations": [{ "diplome", "ecole", "dates" }]
}
```

Après succès : `sync_email_prompt_from_cv` → `selected_prompt_id`, `competence_highlight`, `mail_use_ai`.

## UI web

1. `CvUploader` : pick / drag PDF, Remplacer, Supprimer
2. Pendant analyse : hint « Analyse IA du CV en cours… »
3. Bouton « Relancer l'analyse IA »
4. Toggle `CvProfileView` si `user.cv_json`

## Port iOS

### Document picker

- `expo-document-picker` : `type: "application/pdf"`, `copyToCacheDirectory: true`
- Valider taille côté client (~5 Mo) avant upload
- Upload : `FormData` + `fetch` / `apiFetch` **sans** forcer `Content-Type: application/json` (laisser la boundary multipart)

### Aperçu PDF

- Web : `GET /api/plan3/cv` nouvel onglet
- iOS : télécharger bytes authentifiés → `expo-sharing` / WebView PDF / `react-native-pdf`

### Polling

Réutiliser la logique `watchCvAnalysis` (3 s / 120 s) ; cancel au unmount.

### SecureStore

Tokens session uniquement ; le PDF reste sur le serveur (`cv_path` relatif). Cache local optionnel du fichier choisi avant upload, pas des secrets.

## Colonnes users liées

Voir `db/oauth-cv.md` : `cv_path`, `cv_json`, `cv_analysis_status`, `cv_analysis_error`, `competence_highlight`, `selected_prompt_id`, `mail_use_ai`.
