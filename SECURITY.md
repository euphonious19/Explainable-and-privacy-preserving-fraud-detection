# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Yes    |

## Reporting a Vulnerability

If you discover a security vulnerability, **please do NOT open a public GitHub issue**.

Instead, report it privately by:
1. Emailing the maintainers directly (via your GitHub profile contact)
2. Using GitHub's [Private Vulnerability Reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) feature

We will respond within **72 hours** and work with you to address the issue before any public disclosure.

---

## Security Design Principles

FraudShield is designed with the following security guarantees:

### API Security
- **CORS is locked** — only explicitly listed origins in `ALLOWED_ORIGINS` env var can call the API
- **No wildcard CORS** — `*` is never used in production
- **No credentials over CORS** — `allow_credentials=False` prevents cookie-based cross-origin attacks
- **Restricted HTTP methods** — only `GET` and `POST` are accepted
- **API docs disabled in production** — Swagger UI and ReDoc are only available when `APP_ENV=development`

### Data Privacy
- No raw customer data is stored or logged
- Transaction IDs are randomly generated UUIDs — not derived from real account data
- All sample data uses synthetic, clearly fictional account IDs (e.g., `ACC_8821`, `MUL_3301`)
- The model never receives PII; only anonymized feature vectors are processed

### Environment Variables
- All secrets and configuration are managed via environment variables
- The `.env` file is excluded from Git via `.gitignore`
- A `.env.example` template is provided with no real values
- Never commit real credentials, API keys, or production URLs to this repository

### Docker
- Docker image defaults to `APP_ENV=production` (docs disabled, reload disabled)
- `ALLOWED_ORIGINS` is empty by default — must be explicitly set at runtime for production deployments

---

## Known Non-Issues (By Design)

The following are **intentional design decisions**, not vulnerabilities:

| Observation | Explanation |
|-------------|-------------|
| `/api/predict` requires no authentication | This is a **research demo** platform. Real banking deployments would add OAuth2/API keys at the infrastructure layer. |
| No rate limiting in code | Rate limiting should be applied at the infrastructure/CDN layer (e.g., Cloudflare, nginx, HF Spaces limits). |
| Models use synthetic/mock data | The project explicitly simulates a federated learning environment for research demonstration. |
