# Endpoints essentiels

**Base URL dev :** `http://localhost:3003`  
**Base URL prod :** configurable (proxy Nginx `/api/`)

## Conversions

| Méthode | Route | Description | Confirmation |
|---------|-------|-------------|--------------|
| POST | `/to-markdown` | AsciiDoc → Markdown | Non |
| POST | `/to-asciidoc` | Markdown → AsciiDoc | Non |
| POST | `/from-html` | HTML → Markdown / TXT / … | Non |
| POST | `/from-markdown` | Markdown → HTML / TXT / AsciiDoc | Non |
| POST | `/from-text` | TXT → HTML / Markdown | Non |
| POST | `/convert` | Conversion générique déclarée | Selon format |
| POST | `/api/proxy/convert` | Proxy conversion (UI) | Selon format |

### Exemple — `/to-markdown`

**Requête :**
```json
{
  "text": "= Titre AsciiDoc\n\nContenu…",
  "options": {}
}
```

**Réponse succès :**
```json
{
  "markdown": "# Titre AsciiDoc\n\nContenu…"
}
```

## Configuration et métriques

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/api/config/limits` | Limites runtime (taille, timeout) | Non |
| GET | `/api/metrics` | Compteurs de conversion | `X-API-Key` si `API_KEY` |

## Confirmation

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/confirmation/request` | Initier une demande de confirmation |

## Assets statiques

| Route | Description |
|-------|-------------|
| `/public/rafale.jpg` | Fond personnalisé |
| `/public/ascend-logo.png` | Logo custom |

## Codes HTTP courants

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 400 | Requête invalide (format, validation) |
| 413 | `PAYLOAD_TOO_LARGE` |
| 401/403 | Clé API manquante ou invalide |
| 500 | Erreur interne (voir `error.code`) |

## Headers utiles

| Header | Usage |
|--------|-------|
| `X-API-Key` | Authentification API (prod) |
| `Content-Type: application/json` | Corps JSON |

Doc complète : `documentation/IV-api/api.md`
