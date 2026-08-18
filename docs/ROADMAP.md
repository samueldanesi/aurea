# Roadmap

Stato del progetto rispetto alla spec originale (10 sezioni). "Costruito" significa
codice funzionante e verificato che compila/importa; non significa testato end-to-end
con un tenant reale, né pronto per produzione senza hardening (vedi sezione Sicurezza).

## 1. Data Connectivity & Integration Layer

**Costruito**
- Connettore SQL generico (Postgres/MySQL/SQL Server/Oracle) via query configurabile — [sql_connector.py](../apps/engine/app/connectors/sql_connector.py)
- Connettore CSV/URL come fallback — [csv_connector.py](../apps/engine/app/connectors/csv_connector.py)
- Connettore REST API generico con paginazione e mapping via dot-path — [rest_connector.py](../apps/engine/app/connectors/rest_connector.py)
- Vault credenziali cifrate (Fernet), mai in chiaro — [vault.py](../apps/engine/app/security/vault.py)
- Log di sincronizzazione per connessione, stato/righe/errore — `app.sync_logs`
- Retry automatico via Celery (`max_retries=3`, backoff) — [tasks.py](../apps/engine/app/etl/tasks.py)
- Scheduling per-connessione via espressione cron — [tasks.py](../apps/engine/app/etl/tasks.py)

**Non ancora costruito (fase 2)**
- CDC vero (oggi: full incremental read + upsert idempotente, non uno stream di change events dalla fonte)
- Connettori nativi per TeamSystem/Zucchetti/SAP/Salesforce (oggi: si appoggiano al connettore SQL o REST generico)
- Mapping campi via UI no-code (oggi: si configura via JSON in `data_connections.config`)
- Import Excel/Google Sheets dedicato (oggi: CSV via URL copre il caso base)
- Alert automatico su fallimento sync (il dato c'è in `sync_logs`, manca il trigger su `alerts`)

## 2. Data Pipeline / ETL / Data Modeling

**Costruito**
- Landing zone universale (`warehouse.raw_records`, JSONB) con upsert deduplicato per `external_id`
- Semantic layer: KPI centralizzati con versionamento — [layer.py](../apps/engine/app/semantic/layer.py), tabella `app.kpi_definitions`
- Storico KPI per versione, consultabile via API

**Non ancora costruito (fase 2)**
- Vera modellazione a fact/dim tables tipizzate (oggi: schema-on-read su JSONB, funziona ma non è ottimizzato per query aggregate su grandi volumi)
- Editor visuale di relazioni/join/gerarchie (oggi: le query dei KPI si scrivono a mano)
- DB colonnare per volumi alti (ClickHouse/DuckDB) — valutare solo quando un cliente reale lo giustifica

## 3. Dashboard & Visualizzazione

**Costruito**
- CRUD dashboard + widget, layout salvato — [dashboards.service.ts](../apps/api/src/dashboards/dashboards.service.ts)
- Grafici: linea, barre, torta, KPI card — [kpi-chart-view.tsx](../apps/web/src/components/kpi-chart-view.tsx)
- Clonazione da dashboard template
- Embedding via token firmato (`/embed/:id?token=`) — [embed.service.ts](../apps/api/src/embed/embed.service.ts)
- Export PDF con branding base — [pdf.py](../apps/engine/app/reporting/pdf.py)

**Non ancora costruito (fase 2)**
- Editor drag-and-drop (oggi: i widget si aggiungono via API)
- Pivot table, heatmap, funnel, gauge, mappe geografiche
- Drill-down interattivo, confronto periodo-su-periodo automatico in UI
- Modalità presentazione, dashboard mobile-ottimizzate, white-label branding UI
- Export in immagine/Excel (oggi: solo PDF)

## 4. Assistente AI conversazionale

**Costruito**
- Chat NL-to-SQL a due passaggi: il modello propone un piano (KPI esistente o nuova SELECT), il piano viene eseguito per davvero, poi un secondo prompt trasforma il risultato reale in prosa — [chat_service.py](../apps/engine/app/ai/chat_service.py)
- Guardrail anti-allucinazione esplicito nel system prompt — [guardrails.py](../apps/engine/app/ai/guardrails.py)
- Model routing economico/capace basato su euristiche — [model_router.py](../apps/engine/app/ai/model_router.py)
- Insight testuali proattivi (confronto periodo su periodo) — [insights.py](../apps/engine/app/ai/insights.py)
- Rilevamento anomalie baseline (z-score) — [anomaly.py](../apps/engine/app/ai/anomaly.py)
- Forecast baseline (regressione lineare) — [forecast.py](../apps/engine/app/ai/forecast.py)
- Log uso/costo per chiamata AI, per tenant — `app.ai_usage_log`

**Non ancora costruito (fase 2/3)**
- RAG vero con vector store (oggi: il "contesto" è lo schema scoperto a runtime + le definizioni KPI, non retrieval su documenti/embedding)
- Text-to-visualization (oggi: il chat risponde in testo, non genera un widget grafico)
- "Spiega questo grafico" come azione dedicata nella UI
- Anomaly detection con stagionalità (STL/Prophet) e forecasting con intervalli di confidenza

## 5. Alerting & Automazioni

**Costruito**
- Alert su soglia e su anomalia, valutati ogni 5 minuti — [alerts_task.py](../apps/engine/app/ai/alerts_task.py)
- Invio email via SMTP — [notifications.py](../apps/engine/app/ai/notifications.py)
- Log eventi alert (`app.alert_events`)

**Non ancora costruito (fase 2)**
- Canali Slack/Telegram/WhatsApp Business (oggi: stub che logga soltanto)
- Report schedulati (giornaliero/settimanale/mensile) via email — manca lo scheduler dedicato, ma PDF export + Celery beat ci sono già come mattoni
- Digest personalizzato per ruolo
- Workflow builder ("se X allora Y")

## 6. Sicurezza, Accessi, Multi-tenancy

**Costruito**
- Auth JWT + bcrypt (cost 12), 2FA TOTP — [auth.service.ts](../apps/api/src/auth/auth.service.ts)
- RBAC per-tenant con permessi custom — [permissions.guard.ts](../apps/api/src/auth/permissions.guard.ts)
- Multi-tenancy via Postgres Row-Level Security su ogni tabella tenant-scoped — [001_schema.sql](../infra/init/001_schema.sql)
- Audit log automatico su ogni request mutante — [audit.interceptor.ts](../apps/api/src/common/audit/audit.interceptor.ts)
- Vault credenziali cifrato at-rest

**Non ancora costruito (fase 2/3)**
- SSO/OAuth
- Row-level security *sui dati del cliente* (es. "l'agente vede solo i propri clienti" — oggi RLS isola per tenant, non ancora per ruolo dentro un tenant; il campo `roles.row_filter` è previsto nello schema ma non ancora applicato nelle query)
- Conformità GDPR operativa (diritto all'oblio, minimizzazione, data residency — richiede scelte di hosting, non solo codice)
- Conformità AI Act (trasparenza/disattivazione raccomandazioni — richiede UX dedicata)
- Backup automatici e disaster recovery (richiede infra di produzione, non applicabile in locale)

## 7. Reportistica & Export

**Costruito**
- Export PDF dashboard con tabelle KPI — [pdf.py](../apps/engine/app/reporting/pdf.py)
- Embedding dashboard singola via token — [embed](../apps/api/src/embed/)

**Non ancora costruito (fase 2)**
- Export CSV/Excel dei dati grezzi
- API pubblica documentata per sistemi terzi (oggi: l'unica superficie "pubblica" è l'endpoint embed, scoped a una dashboard)

## 8. Amministrazione & Configurazione (lato operatore)

**Costruito**
- Provisioning tenant + ruoli di default in una chiamata — [tenants.service.ts](../apps/api/src/platform-admin/tenants.service.ts)
- Vista di utilizzo base per tenant (dashboard/connessioni/risposte AI contate)

**Non ancora costruito (fase 2/3)**
- UI di amministrazione (oggi: solo API, protetta da una chiave statica — va sostituita con SSO staff prima di essere esposta)
- Template dashboard per verticale (iGaming, e-commerce, ...)
- Fatturazione/abbonamento (Stripe, fatturazione elettronica)
- Deploy centralizzato automatico verso tutti i tenant (oggi: è un'unica piattaforma condivisa, quindi il deploy È già centralizzato per costruzione — manca solo la pipeline CI/CD)

## 9. Onboarding Utente Finale

**Non ancora costruito (fase 2)** — nessuna parte di questa sezione è stata implementata:
wizard di setup, tour guidato, help center, richiesta supporto in-app.

## 10. Architettura tecnica

**Costruito**
- Separazione netta: `apps/web` (Next.js) → `apps/api` (NestJS: auth, tenancy, CRUD) → `apps/engine` (Python: connettori, ETL, AI) → Postgres/Redis
- Multi-tenancy by design fin dal primo tenant (RLS), non un ripensamento
- Job queue (Celery + Redis) per sync e valutazione alert
- Vault, audit log, RBAC pensati come primitive condivise fin dall'inizio

**Non ancora costruito**
- Logging/monitoring centralizzato (oggi: `print`/logger locale, niente aggregazione)
- Caching sulle risposte AI/query ripetute
- CI/CD, containerizzazione delle app Node/Python (solo Postgres/Redis hanno un `docker-compose.yml`)

---

## Su cosa lavorare per il primo cliente reale

Nell'ordine in cui probabilmente contano di più:

1. Collegare **una fonte dati vera** di un cliente esistente (probabilmente il connettore SQL generico, dato che i gestionali italiani spesso girano su SQL Server/MySQL) e verificare che l'estrazione + upsert funzioni sul suo schema reale.
2. Scrivere 3-4 `kpi_definitions` che rispecchiano le metriche che quel cliente guarda oggi a mano.
3. Costruire manualmente (via API, non serve l'editor drag-and-drop) una dashboard con quei KPI e provarla con lui.
4. Verificare che la chat AI risponda in modo corretto e MAI inventato sui suoi dati reali — è il differenziale del prodotto, va validato per primo.
5. Solo dopo, decidere quali delle voci "fase 2" servono davvero, in base a cosa chiede lui — non in base a questa lista.
