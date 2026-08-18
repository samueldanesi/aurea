// Demo fixtures for NEXT_PUBLIC_USE_MOCKS mode -- lets the frontend be browsed and
// clicked through end-to-end without Postgres/Redis/the Node+Python backends running.
// Shapes mirror exactly what apps/api and apps/engine return for real, so switching
// the env flag off later requires no component changes.
//
// Fictional client: an SME that trades in mechanical/industrial/agricultural spare
// parts through a mix of three business models that typically coexist in this
// vertical -- pure trading (buy parts/machines, resell with margin), disassembly
// (buy whole used machines or wrecks, strip them, sell the components), and
// refurbishment (buy worn parts, revise them, resell at a markup). This mix is why
// the KPI set below isn't just "revenue and margin": cost allocation per part when
// a whole machine is bought at a lump price, dead-stock by age, and per-lot
// break-even are the metrics this business actually can't compute by hand today --
// exactly where this product is meant to add value over a generic gestionale.

export const MOCK_TENANT_SLUG = 'demo';
export const MOCK_TENANT_NAME = 'Meccanica Import S.r.l.';
export const PRODUCT_NAME = 'Aurea';

export interface MockWidget {
  id: string;
  kind: 'line' | 'bar' | 'pie' | 'kpi_card' | 'table';
  title: string;
  kpi_key: string;
  span?: 'full' | 'wide';
}

export interface MockDashboard {
  id: string;
  name: string;
  description: string;
  created_at: string;
  widgets: MockWidget[];
}

const months = ['Mar 2026', 'Apr 2026', 'Mag 2026', 'Giu 2026', 'Lug 2026', 'Ago 2026'];

export const kpiSeries: Record<string, Record<string, unknown>[]> = {
  // --- Vendite & margini ---
  net_revenue: months.map((period, i) => ({
    period,
    value: [312000, 298000, 335000, 356000, 341000, 378000][i],
  })),
  gross_margin_pct: months.map((period, i) => ({
    period,
    value: [29.8, 31.2, 28.5, 33.6, 30.1, 34.2][i],
  })),
  revenue_by_category: [
    { period: 'Motori', value: 138000 },
    { period: 'Componenti idraulici', value: 92000 },
    { period: 'Trasmissioni', value: 68000 },
    { period: 'Elettronica', value: 52000 },
    { period: 'Carrozzeria e telai', value: 28000 },
  ],
  margin_by_category: [
    { period: 'Motori', value: 34 },
    { period: 'Componenti idraulici', value: 29 },
    { period: 'Trasmissioni', value: 41 },
    { period: 'Elettronica', value: 26 },
    { period: 'Carrozzeria e telai', value: 52 },
  ],
  sales_by_channel: [
    { period: 'B2B Officine', value: 168000 },
    { period: 'Marketplace', value: 96000 },
    { period: 'B2B Rivenditori', value: 74000 },
    { period: 'Vendita diretta', value: 40000 },
  ],
  margin_by_channel: [
    { period: 'Vendita diretta', value: 38 },
    { period: 'B2B Officine', value: 36 },
    { period: 'B2B Rivenditori', value: 31 },
    { period: 'Marketplace', value: 22 },
  ],

  // --- Magazzino & rotazione ---
  stock_turnover: months.map((period, i) => ({
    period,
    value: [4.8, 4.6, 5.1, 5.4, 4.9, 5.2][i],
  })),
  dead_stock_by_age: [
    { period: '0–3 mesi', value: 48000 },
    { period: '3–6 mesi', value: 32000 },
    { period: '6–12 mesi', value: 26000 },
    { period: '> 12 mesi', value: 19000 },
  ],
  purchases_by_country: [
    { period: 'Italia (usato/lotti)', value: 121000 },
    { period: 'Cina', value: 87000 },
    { period: 'Germania', value: 64000 },
    { period: 'Taiwan', value: 31000 },
    { period: 'Turchia', value: 22000 },
  ],

  // --- Disassemblaggio & recupero ---
  scrap_revenue: months.map((period, i) => ({
    period,
    value: [6200, 7100, 6800, 8900, 7600, 8400][i],
  })),
  disposal_cost: months.map((period, i) => ({
    period,
    value: [1800, 2100, 1950, 2400, 2200, 2600][i],
  })),
  dismantled_lots: [
    { lotto: 'Lotto #2026-014 — Trattore usato', costo_acquisto: 4200, pezzi_ricavati: 38, pezzi_venduti: 29, ricavo_a_oggi: 5680, recupero_pct: 135 },
    { lotto: 'Lotto #2026-018 — Escavatore incidentato', costo_acquisto: 7800, pezzi_ricavati: 52, pezzi_venduti: 31, ricavo_a_oggi: 6100, recupero_pct: 78 },
    { lotto: 'Lotto #2026-021 — Muletto fermo motore', costo_acquisto: 1900, pezzi_ricavati: 21, pezzi_venduti: 21, ricavo_a_oggi: 3150, recupero_pct: 166 },
    { lotto: 'Lotto #2026-023 — Mietitrebbia rottamata', costo_acquisto: 5600, pezzi_ricavati: 44, pezzi_venduti: 18, ricavo_a_oggi: 2740, recupero_pct: 49 },
  ],

  // --- Logistica & fornitori ---
  on_time_delivery_pct: months.map((period, i) => ({
    period,
    value: [82.4, 79.6, 85.1, 88.3, 84.7, 90.2][i],
  })),
  shipments_value_by_mode: [
    { period: 'Gomma', value: 148000 },
    { period: 'Nave', value: 87000 },
    { period: 'Aereo', value: 34000 },
    { period: 'Ferrovia', value: 12000 },
  ],

  // --- Magazzino: pezzi fermi da più tempo (tabella) ---
  slow_movers: [
    { codice: 'MOT-2291', descrizione: 'Motore diesel 4 cilindri rigenerato', categoria: 'Motori', giorni_giacenza: 412, valore: 3200 },
    { codice: 'CAB-0087', descrizione: 'Cabina trattore usata', categoria: 'Carrozzeria e telai', giorni_giacenza: 365, valore: 1800 },
    { codice: 'IDR-1450', descrizione: 'Pompa idraulica revisionata', categoria: 'Componenti idraulici', giorni_giacenza: 298, valore: 950 },
    { codice: 'TRM-0654', descrizione: 'Cambio 6 marce usato', categoria: 'Trasmissioni', giorni_giacenza: 276, valore: 1400 },
  ],

  // --- Costi fissi & utile: quello che il fatturato da solo non racconta.
  // Personale, affitto, utenze etc. non dipendono dal volume di vendita e
  // vanno sottratti dal margine lordo per arrivare all'utile reale.
  fixed_costs_total: months.map((period, i) => ({
    period,
    value: [88000, 89000, 90000, 91000, 91500, 92000][i],
  })),
  net_profit: months.map((period, i) => ({
    period,
    value: [5000, 4000, 5000, 29000, 11500, 37300][i],
  })),
  fixed_costs_pct_of_revenue: months.map((period, i) => ({
    period,
    value: [28.2, 29.9, 26.9, 25.6, 26.8, 24.3][i],
  })),
  fixed_costs_by_category: [
    { period: 'Personale', value: 54000 },
    { period: 'Affitto e piazzale', value: 13000 },
    { period: 'Utenze', value: 7500 },
    { period: 'Ammortamenti', value: 9500 },
    { period: 'Assicurazioni', value: 3200 },
    { period: 'Consulenze', value: 2800 },
    { period: 'Software gestionale', value: 2000 },
  ],
  pnl_summary: [
    { voce: 'Fatturato netto', valore: 378000, pct_fatturato: 100 },
    { voce: 'Costo del venduto', valore: -248700, pct_fatturato: -65.8 },
    { voce: 'Margine lordo', valore: 129300, pct_fatturato: 34.2 },
    { voce: 'Costi fissi', valore: -92000, pct_fatturato: -24.3 },
    { voce: 'Utile netto (EBITDA)', valore: 37300, pct_fatturato: 9.9 },
  ],
};

const fiscalMonths = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
// Jan-Aug are actuals (also match kpiSeries.net_revenue for Mar-Aug); Sep-Dec are
// a simple trend projection, not real data -- kept visually distinct (dashed) in
// the chart rather than presented as fact, consistent with the AI chat's own
// anti-hallucination rule of never blending an estimate into an actual figure.
const fiscalRevenueValues = [268000, 285000, 312000, 298000, 335000, 356000, 341000, 378000, 392000, 405000, 388000, 420000];
const LAST_ACTUAL_MONTH_INDEX = 7; // Ago

export interface FiscalRevenuePoint {
  period: string;
  actual: number | null;
  projected: number | null;
}

export const fiscalYearRevenue: FiscalRevenuePoint[] = fiscalMonths.map((period, i) => ({
  period,
  actual: i <= LAST_ACTUAL_MONTH_INDEX ? fiscalRevenueValues[i] : null,
  projected: i >= LAST_ACTUAL_MONTH_INDEX ? fiscalRevenueValues[i] : null,
}));

export const fiscalYearRevenueYtd = fiscalRevenueValues
  .slice(0, LAST_ACTUAL_MONTH_INDEX + 1)
  .reduce((sum, v) => sum + v, 0);

/** Executive summary strip on the dashboards list page -- pulls straight from
 * kpiSeries so the landing page reads as a real overview, not an empty shell. */
export const overviewStats = [
  { label: 'Fatturato Agosto', value: '€378.000', delta: '+10,9%', positive: true },
  { label: 'Margine lordo', value: '34,2%', delta: '+4,1 pt', positive: true },
  { label: 'Utile netto (EBITDA)', value: '€37.300', delta: '+224% vs Luglio', positive: true },
  { label: 'Valore magazzino fermo', value: '€125.000', delta: '19% > 12 mesi', positive: false },
  { label: 'Lotti in disassemblaggio', value: '4', delta: '1 sotto break-even', positive: false },
];

export interface ActivityItem {
  id: string;
  type: 'sync_success' | 'sync_error' | 'insight' | 'alert';
  text: string;
  time: string;
}

/** Home page activity feed -- a mix of sync runs, AI insights and alert firings,
 * the kind of thing an owner would actually want to see first thing in the morning. */
export const mockActivity: ActivityItem[] = [
  { id: 'act-1', type: 'sync_success', text: 'Sincronizzazione completata: Gestionale ERP (TeamSystem) — 4.218 righe aggiornate', time: '2026-08-18T06:01:12Z' },
  { id: 'act-2', type: 'insight', text: 'Nuovo insight: il Lotto #2026-023 è sotto il punto di pareggio (49% di recupero costo)', time: '2026-08-18T06:05:00Z' },
  { id: 'act-3', type: 'sync_error', text: 'Sincronizzazione fallita: Marketplace Ricambi (REST API) — token scaduto', time: '2026-08-18T05:00:03Z' },
  { id: 'act-4', type: 'alert', text: 'Alert attivato: "Pezzo fermo da troppo tempo" — MOT-2291, 412 giorni di giacenza', time: '2026-08-17T19:30:00Z' },
  { id: 'act-5', type: 'sync_success', text: 'Sincronizzazione completata: Magazzino WMS (MySQL) — 2.840 righe aggiornate', time: '2026-08-17T09:00:00Z' },
  { id: 'act-6', type: 'insight', text: 'Nuovo insight: il margine lordo è tornato sopra il 30% dopo il calo di Luglio', time: '2026-08-16T08:15:00Z' },
];

/** Suggested prompts shown on the home page -- clicking one opens the chat and asks it directly. */
export const suggestedQuestions = [
  'Qual è il margine per categoria di pezzo questo mese?',
  'Quali lotti sono sotto il punto di pareggio?',
  'Quali pezzi sono fermi da troppo tempo in magazzino?',
  'Da quali fornitori acquistiamo di più?',
];

export const mockDashboards: MockDashboard[] = [
  {
    id: 'dash-1',
    name: 'Vendite & Margini',
    description: 'Fatturato, margine per categoria pezzo e per canale di vendita',
    created_at: '2026-06-01T09:00:00Z',
    widgets: [
      { id: 'w-1', kind: 'kpi_card', title: 'Fatturato netto', kpi_key: 'net_revenue' },
      { id: 'w-2', kind: 'kpi_card', title: 'Margine lordo %', kpi_key: 'gross_margin_pct' },
      { id: 'w-2b', kind: 'kpi_card', title: 'Utile netto (EBITDA)', kpi_key: 'net_profit' },
      { id: 'w-3', kind: 'line', title: 'Fatturato netto — ultimi 6 mesi', kpi_key: 'net_revenue' },
      { id: 'w-3b', kind: 'line', title: 'Utile netto — ultimi 6 mesi', kpi_key: 'net_profit' },
      { id: 'w-4', kind: 'bar', title: 'Fatturato per categoria pezzo', kpi_key: 'revenue_by_category' },
      { id: 'w-5', kind: 'bar', title: 'Margine % per categoria pezzo', kpi_key: 'margin_by_category' },
      { id: 'w-6', kind: 'pie', title: 'Vendite per canale', kpi_key: 'sales_by_channel' },
      { id: 'w-7', kind: 'bar', title: 'Margine % per canale (al netto provvigioni)', kpi_key: 'margin_by_channel' },
    ],
  },
  {
    id: 'dash-2',
    name: 'Magazzino & Rotazione',
    description: 'Rotazione, capitale immobilizzato in scorte ferme e giacenze critiche',
    created_at: '2026-07-22T09:00:00Z',
    widgets: [
      { id: 'w-8', kind: 'kpi_card', title: 'Indice di rotazione magazzino', kpi_key: 'stock_turnover' },
      { id: 'w-9', kind: 'line', title: 'Rotazione magazzino — ultimi 6 mesi', kpi_key: 'stock_turnover' },
      { id: 'w-10', kind: 'bar', title: 'Valore immobilizzato per anzianità di giacenza', kpi_key: 'dead_stock_by_age' },
      { id: 'w-11', kind: 'bar', title: 'Acquisti per origine/paese', kpi_key: 'purchases_by_country' },
      { id: 'w-12', kind: 'table', title: 'Pezzi fermi da più tempo', kpi_key: 'slow_movers', span: 'wide' },
    ],
  },
  {
    id: 'dash-3',
    name: 'Disassemblaggio & Recupero',
    description: 'Recupero costo per lotto, ricavo da rottame e costi di smaltimento',
    created_at: '2026-08-01T09:00:00Z',
    widgets: [
      { id: 'w-13', kind: 'kpi_card', title: 'Ricavo da rottame', kpi_key: 'scrap_revenue' },
      { id: 'w-14', kind: 'kpi_card', title: 'Costo di smaltimento', kpi_key: 'disposal_cost' },
      { id: 'w-15', kind: 'line', title: 'Ricavo da rottame — ultimi 6 mesi', kpi_key: 'scrap_revenue' },
      { id: 'w-16', kind: 'table', title: 'Lotti disassemblati — recupero del costo', kpi_key: 'dismantled_lots', span: 'wide' },
    ],
  },
  {
    id: 'dash-4',
    name: 'Logistica & Fornitori',
    description: 'Puntualità consegne e spedizioni in transito per modalità di trasporto',
    created_at: '2026-08-05T09:00:00Z',
    widgets: [
      { id: 'w-17', kind: 'kpi_card', title: 'Puntualità consegne %', kpi_key: 'on_time_delivery_pct' },
      { id: 'w-18', kind: 'line', title: 'Puntualità consegne % — ultimi 6 mesi', kpi_key: 'on_time_delivery_pct' },
      { id: 'w-19', kind: 'pie', title: 'Valore spedizioni in transito per modalità', kpi_key: 'shipments_value_by_mode' },
      { id: 'w-20', kind: 'bar', title: 'Acquisti per origine/paese', kpi_key: 'purchases_by_country' },
    ],
  },
  {
    id: 'dash-5',
    name: 'Costi Fissi',
    description: 'Personale, affitto e utenze: dove va a finire il margine lordo',
    created_at: '2026-08-18T09:00:00Z',
    widgets: [
      { id: 'w-21', kind: 'kpi_card', title: 'Costi fissi mensili', kpi_key: 'fixed_costs_total' },
      { id: 'w-22', kind: 'kpi_card', title: 'Incidenza sui ricavi %', kpi_key: 'fixed_costs_pct_of_revenue' },
      { id: 'w-23', kind: 'line', title: 'Incidenza sui ricavi % — ultimi 6 mesi', kpi_key: 'fixed_costs_pct_of_revenue' },
      { id: 'w-24', kind: 'bar', title: 'Costi fissi per categoria', kpi_key: 'fixed_costs_by_category' },
      { id: 'w-25', kind: 'table', title: 'Conto economico sintetico — Agosto', kpi_key: 'pnl_summary', span: 'wide' },
    ],
  },
];

/** Proactive AI insights (spec 4: "generazione automatica di insight testuali
 * proattivi") shown at the top of each dashboard, not just on-demand in chat. */
export const mockInsights: Record<string, string[]> = {
  'dash-1': [
    'Il fatturato netto di Agosto (€378.000) è cresciuto del 10,9% rispetto a Luglio, il valore più alto degli ultimi 6 mesi.',
    'La Carrozzeria e telai è la categoria con il margine più alto (52%) grazie al costo allocato dai lotti disassemblati, ma pesa solo il 7% del fatturato: c’è margine per spingerla di più.',
    'Il canale Marketplace ha il margine più basso (22%) per via delle provvigioni: valuta di spostare volumi verso Vendita diretta dove possibile.',
  ],
  'dash-2': [
    'Il valore di magazzino fermo da oltre 12 mesi è €19.000: capitale immobilizzato che vale la pena liquidare con uno sconto mirato.',
    'L’indice di rotazione è salito a 5,2, il valore più alto degli ultimi 6 mesi.',
  ],
  'dash-3': [
    'Il Lotto #2026-023 (mietitrebbia rottamata) ha recuperato solo il 49% del costo di acquisto con 18 pezzi venduti su 44: è sotto il punto di pareggio.',
    'Il ricavo da rottame di Agosto (€8.400) supera di oltre 3 volte il costo di smaltimento (€2.600), un margine spesso trascurato ma rilevante.',
  ],
  'dash-4': [
    'La puntualità delle consegne fornitori è salita al 90,2%, il miglior risultato del semestre.',
    'Il 39% del valore delle merci in transito viaggia su gomma dall’Italia e dalla Germania, riducendo il rischio rispetto ai mesi con più import via nave.',
  ],
  'dash-5': [
    'L’utile netto di Agosto è €37.300 (9,9% del fatturato): i costi fissi (€92.000, soprattutto personale) assorbono il 71% del margine lordo.',
    'A Marzo e Aprile l’utile netto era vicino al pareggio (circa €4-5.000): con un fatturato più basso i costi fissi lasciano pochissimo margine reale.',
  ],
};

export interface MockConnection {
  id: string;
  name: string;
  connector_type: string;
  is_active: boolean;
  created_at: string;
  last_sync_status: 'success' | 'error';
  last_sync_at: string;
  rows_synced: number;
}

export const mockConnections: MockConnection[] = [
  { id: 'conn-1', name: 'Gestionale ERP (TeamSystem)', connector_type: 'sqlserver', is_active: true, created_at: '2026-05-12T08:00:00Z', last_sync_status: 'success', last_sync_at: '2026-08-18T06:01:12Z', rows_synced: 4218 },
  { id: 'conn-2', name: 'Fatture Elettroniche (CSV)', connector_type: 'csv', is_active: true, created_at: '2026-05-20T08:00:00Z', last_sync_status: 'success', last_sync_at: '2026-08-17T22:00:20Z', rows_synced: 312 },
  { id: 'conn-3', name: 'Marketplace Ricambi (REST API)', connector_type: 'rest_api', is_active: true, created_at: '2026-06-02T08:00:00Z', last_sync_status: 'error', last_sync_at: '2026-08-18T05:00:03Z', rows_synced: 0 },
  { id: 'conn-4', name: 'Fornitori & Spedizionieri (REST API)', connector_type: 'rest_api', is_active: true, created_at: '2026-06-15T08:00:00Z', last_sync_status: 'success', last_sync_at: '2026-08-18T04:30:00Z', rows_synced: 1560 },
  { id: 'conn-5', name: 'Magazzino WMS (MySQL)', connector_type: 'mysql', is_active: true, created_at: '2026-07-01T08:00:00Z', last_sync_status: 'success', last_sync_at: '2026-08-17T09:00:00Z', rows_synced: 2840 },
  { id: 'conn-6', name: 'Bilance Rottamazione (CSV)', connector_type: 'csv', is_active: true, created_at: '2026-07-15T08:00:00Z', last_sync_status: 'success', last_sync_at: '2026-08-16T15:00:00Z', rows_synced: 96 },
];

export const mockSyncLogs: Record<string, Array<{ id: string; status: string; rows_processed: number | null; error_message: string | null; started_at: string; finished_at: string | null }>> = {
  'conn-1': [
    { id: 'log-1', status: 'success', rows_processed: 4218, error_message: null, started_at: '2026-08-18T06:00:00Z', finished_at: '2026-08-18T06:01:12Z' },
  ],
  'conn-2': [
    { id: 'log-2', status: 'success', rows_processed: 312, error_message: null, started_at: '2026-08-17T22:00:00Z', finished_at: '2026-08-17T22:00:20Z' },
  ],
  'conn-3': [
    { id: 'log-3', status: 'error', rows_processed: 0, error_message: 'HTTP 401: token scaduto', started_at: '2026-08-18T05:00:00Z', finished_at: '2026-08-18T05:00:03Z' },
  ],
};

export interface MockAlert {
  id: string;
  name: string;
  kpi_key: string;
  is_active: boolean;
  condition_label: string;
  channels: string[];
}

export const mockAlerts: MockAlert[] = [
  {
    id: 'alert-1',
    name: 'Margine sotto soglia',
    kpi_key: 'gross_margin_pct',
    is_active: true,
    condition_label: 'Margine lordo < 25%',
    channels: ['email', 'in-app'],
  },
  {
    id: 'alert-2',
    name: 'Anomalia fatturato',
    kpi_key: 'net_revenue',
    is_active: true,
    condition_label: 'Rilevamento automatico anomalie',
    channels: ['email'],
  },
  {
    id: 'alert-3',
    name: 'Pezzo fermo da troppo tempo',
    kpi_key: 'slow_movers',
    is_active: true,
    condition_label: 'Giacenza singolo pezzo > 300 giorni',
    channels: ['email', 'in-app'],
  },
  {
    id: 'alert-4',
    name: 'Lotto sotto il punto di pareggio',
    kpi_key: 'dismantled_lots',
    is_active: true,
    condition_label: 'Recupero costo < 60% dopo 90 giorni',
    channels: ['email', 'in-app'],
  },
  {
    id: 'alert-5',
    name: 'Ritardo consegne fornitori',
    kpi_key: 'on_time_delivery_pct',
    is_active: false,
    condition_label: 'Puntualità < 75%',
    channels: ['email'],
  },
];
