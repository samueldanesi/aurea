# BI/AI Platform

Piattaforma di Business Intelligence + AI conversazionale da integrare nei gestionali
dei clienti. Vedi [docs/ROADMAP.md](docs/ROADMAP.md) per lo stato dettagliato feature-per-feature
rispetto alla spec originale, e cosa manca per un primo cliente reale.

## Architettura

```
apps/web      Next.js (TypeScript) — dashboard, chat AI, login/2FA, embedding pubblico
apps/api      NestJS (TypeScript) — auth, multi-tenancy (Postgres RLS), RBAC, CRUD, audit log
apps/engine   FastAPI (Python) — connettori dati, ETL, semantic layer, AI/RAG, alert, PDF
infra/        docker-compose (Postgres + Redis) + script di init schema
```

`apps/web` parla solo con `apps/api`. `apps/api` parla con Postgres (control plane) e
con `apps/engine` via HTTP per tutto ciò che è dati/AI. `apps/engine` è l'unico
componente che parla con Postgres per il warehouse e con il provider AI (Anthropic).

## Prerequisiti

- Node.js **20.9+** (usa `.nvmrc`: `nvm use`)
- Python 3.12+
- pnpm (`corepack enable pnpm && corepack prepare pnpm@9.15.9 --activate`)
- Docker Desktop (per Postgres + Redis) — **non era installato sulla macchina su cui
  è stato scaffoldato questo progetto**; installalo da https://www.docker.com/products/docker-desktop/
  prima del primo avvio, oppure sostituisci con Postgres/Redis installati via Homebrew
  e aggiorna `DATABASE_URL`/`REDIS_URL` in `.env` di conseguenza.

## Setup

```bash
nvm use
corepack enable pnpm && corepack prepare pnpm@9.15.9 --activate
pnpm install

cp .env.example .env
# imposta ANTHROPIC_API_KEY in .env prima di usare la chat AI

docker compose -f infra/docker-compose.yml --env-file .env up -d
```

Lo script `infra/init/*.sql` viene eseguito automaticamente al primo avvio del
container Postgres (monta su `/docker-entrypoint-initdb.d`).

### Backend Python (apps/engine)

```bash
cd apps/engine
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../../.env .env   # pydantic-settings legge .env dalla working dir

uvicorn app.main:app --reload --port 8000        # API HTTP
celery -A app.etl.celery_app worker --loglevel=info    # worker sync/alert
celery -A app.etl.celery_app beat --loglevel=info      # scheduler (cron sync + valutazione alert)
```

### Backend Node (apps/api)

```bash
cd apps/api
pnpm dev   # http://localhost:4000
```

### Frontend (apps/web)

```bash
cd apps/web
pnpm dev   # http://localhost:3000
```

## Primo tenant

Non c'è ancora una UI di provisioning (vedi ROADMAP sezione 8). Per creare il primo
tenant/utente:

```bash
curl -X POST http://localhost:4000/platform-admin/tenants \
  -H "x-platform-admin-key: $PLATFORM_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Cliente Demo", "slug": "cliente-demo"}'

curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"tenantSlug": "cliente-demo", "email": "you@example.com", "password": "min-10-chars", "fullName": "Nome Cognome"}'
```

Il primo utente registrato non ha ancora un ruolo assegnato (l'assegnazione ruoli via
API non è ancora esposta — va fatta con un `INSERT INTO app.user_roles` diretto finché
non c'è l'endpoint dedicato). I ruoli di default (`owner`, `analyst`, `viewer`) vengono
creati automaticamente alla creazione del tenant.

## Note di sicurezza per lo sviluppo locale

- Tutti i segreti in `.env.example` sono placeholder (`change_me_...`): vanno
  rigenerati prima di qualsiasi deploy reale, non solo in produzione.
- `PLATFORM_ADMIN_KEY` protegge gli endpoint di provisioning tenant: è pensato solo
  per te/il tuo team, va sostituito con vera auth staff prima di essere esposto oltre
  localhost.
