import type { AxiosInstance } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  mockDashboards,
  mockConnections,
  mockSyncLogs,
  mockAlerts,
  kpiSeries,
  type MockDashboard,
  type MockConnection,
  type MockAlert,
} from './data';

let idCounter = 100;
const nextId = (prefix: string) => `${prefix}-${idCounter++}`;

function lastValueOf(kpiKey: string): number | null {
  const series = kpiSeries[kpiKey];
  if (!series || series.length === 0) return null;
  const value = series[series.length - 1].value;
  return typeof value === 'number' ? value : null;
}

function buildChatReply(message: string): { answer: string; generatedSql: string | null; resultRows: unknown } {
  const lower = message.toLowerCase();

  if (
    lower.includes('venditor') ||
    lower.includes('commission') ||
    lower.includes('compenso') ||
    lower.includes('provvig') ||
    // Named sales reps -- catches "quanto guadagna Marco Ferretti?" style questions
    // that don't use any of the generic keywords above but do name a person.
    lower.includes('ferretti') ||
    lower.includes('bianchi') ||
    lower.includes('colombo') ||
    lower.includes('moretti')
  ) {
    return {
      answer: 'Marco Ferretti è il top performer con €118.000 di fatturato e €42.500 di margine generato, per un compenso di €5.100 (12% del margine). Seguono Elena Bianchi (€2.770), Davide Colombo (€1.610) e Giulia Moretti (€850). Le provvigioni totali del mese sono €10.300, l\'8% circa del margine lordo aziendale.',
      generatedSql: "SELECT venditore, fatturato_generato, margine_generato, provvigione_pct, compenso FROM kpi('sales_reps') ORDER BY margine_generato DESC",
      resultRows: kpiSeries.sales_reps,
    };
  }
  if (lower.includes('margin') && (lower.includes('categor') || lower.includes('pezz') || lower.includes('prodott'))) {
    return {
      answer: 'La Carrozzeria e telai ha il margine più alto (52%), seguita da Trasmissioni (41%) e Motori (34%). Elettronica (26%) e Componenti idraulici (29%) rendono meno: i pezzi da disassemblaggio hanno margini più ampi dei pezzi nuovi comprati a listino.',
      generatedSql: "SELECT period AS category, value FROM kpi('margin_by_category')",
      resultRows: kpiSeries.margin_by_category,
    };
  }
  if (lower.includes('margin') && (lower.includes('canal') || lower.includes('marketplace') || lower.includes('provvig'))) {
    return {
      answer: 'Vendita diretta ha il margine più alto (38%), seguita da B2B Officine (36%) e B2B Rivenditori (31%). Il Marketplace rende meno (22%) per via delle provvigioni del 5-15%.',
      generatedSql: "SELECT period AS channel, value FROM kpi('margin_by_channel')",
      resultRows: kpiSeries.margin_by_channel,
    };
  }
  if (lower.includes('margin')) {
    const value = lastValueOf('gross_margin_pct');
    return {
      answer: `Il margine lordo più recente è ${value}%, in crescita rispetto al 30.1% di Luglio: il mix di vendita si è spostato verso pezzi da disassemblaggio a margine più alto.`,
      generatedSql: "SELECT period, value FROM kpi('gross_margin_pct') ORDER BY period DESC LIMIT 3",
      resultRows: kpiSeries.gross_margin_pct.slice(-3),
    };
  }
  if (lower.includes('fattur') || lower.includes('ricav') || lower.includes('revenue') || lower.includes('vendit')) {
    const value = lastValueOf('net_revenue');
    return {
      answer: `Il fatturato netto di Agosto 2026 è €${value?.toLocaleString('it-IT')}, in crescita del 10.9% rispetto a Luglio (€341.000).`,
      generatedSql: "SELECT period, value FROM kpi('net_revenue') ORDER BY period DESC LIMIT 2",
      resultRows: kpiSeries.net_revenue.slice(-2),
    };
  }
  if (lower.includes('canal') || lower.includes('channel') || lower.includes('rivendit') || lower.includes('marketplace')) {
    return {
      answer: 'Il canale B2B Officine genera €168.000 (44% del totale), seguito dal Marketplace con €96.000 (25%). B2B Rivenditori e Vendita diretta coprono il restante 30%.',
      generatedSql: "SELECT period AS channel, value FROM kpi('sales_by_channel')",
      resultRows: kpiSeries.sales_by_channel,
    };
  }
  if (
    lower.includes('categor') ||
    lower.includes('prodott') ||
    lower.includes('motor') ||
    lower.includes('idraulic') ||
    lower.includes('trasmission') ||
    lower.includes('carrozzer') ||
    lower.includes('elettronic')
  ) {
    return {
      answer: 'I Motori sono la categoria principale con €138.000 di fatturato, seguiti da Componenti idraulici (€92.000), Trasmissioni (€68.000), Elettronica (€52.000) e Carrozzeria e telai (€28.000).',
      generatedSql: "SELECT period AS category, value FROM kpi('revenue_by_category')",
      resultRows: kpiSeries.revenue_by_category,
    };
  }
  if (lower.includes('lott') || lower.includes('disassembl') || lower.includes('pareggio') || lower.includes('break')) {
    return {
      answer: 'Il Lotto #2026-023 (mietitrebbia rottamata) è sotto il punto di pareggio: recuperato solo il 49% del costo con 18 pezzi venduti su 44. Il Lotto #2026-021 (muletto) è invece già al 166% di recupero.',
      generatedSql: "SELECT lotto, costo_acquisto, ricavo_a_oggi, recupero_pct FROM kpi('dismantled_lots') ORDER BY recupero_pct ASC",
      resultRows: kpiSeries.dismantled_lots,
    };
  }
  if (lower.includes('rottam') || lower.includes('smaltiment') || lower.includes('rae') || lower.includes('scarto')) {
    const scrap = lastValueOf('scrap_revenue');
    const disposal = lastValueOf('disposal_cost');
    return {
      answer: `Il ricavo da rottame di Agosto è €${scrap?.toLocaleString('it-IT')}, contro un costo di smaltimento di €${disposal?.toLocaleString('it-IT')}: un margine netto di circa €${((scrap ?? 0) - (disposal ?? 0)).toLocaleString('it-IT')} spesso trascurato nei conti.`,
      generatedSql: "SELECT period, value FROM kpi('scrap_revenue') ORDER BY period DESC LIMIT 1",
      resultRows: [kpiSeries.scrap_revenue.at(-1), kpiSeries.disposal_cost.at(-1)],
    };
  }
  if (lower.includes('ferm') || lower.includes('giacenz') || lower.includes('obsolet') || lower.includes('invendut')) {
    return {
      answer: 'Il pezzo fermo da più tempo è un Motore diesel rigenerato (MOT-2291), in magazzino da 412 giorni per un valore di €3.200. In totale ci sono €19.000 di scorte ferme da oltre 12 mesi.',
      generatedSql: "SELECT codice, descrizione, giorni_giacenza, valore FROM kpi('slow_movers') ORDER BY giorni_giacenza DESC",
      resultRows: kpiSeries.slow_movers,
    };
  }
  if (lower.includes('rotazion') || lower.includes('magazzino') || lower.includes('scorte') || lower.includes('stock')) {
    const value = lastValueOf('stock_turnover');
    return {
      answer: `L'indice di rotazione di magazzino è ${value}, il valore più alto degli ultimi 6 mesi: le scorte si stanno muovendo più rapidamente rispetto ai mesi precedenti.`,
      generatedSql: "SELECT period, value FROM kpi('stock_turnover') ORDER BY period DESC LIMIT 3",
      resultRows: kpiSeries.stock_turnover.slice(-3),
    };
  }
  if (
    lower.includes('fornitor') ||
    lower.includes('paes') ||
    lower.includes('cina') ||
    lower.includes('german') ||
    lower.includes('taiwan') ||
    lower.includes('acquist')
  ) {
    return {
      answer: 'L\'Italia (usato e lotti da disassemblare) è la prima origine di acquisto con €121.000, seguita da Cina (€87.000), Germania (€64.000), Taiwan (€31.000) e Turchia (€22.000).',
      generatedSql: "SELECT period AS origine, value FROM kpi('purchases_by_country')",
      resultRows: kpiSeries.purchases_by_country,
    };
  }
  if (lower.includes('puntual') || lower.includes('consegn') || lower.includes('ritard')) {
    const value = lastValueOf('on_time_delivery_pct');
    return {
      answer: `La puntualità delle consegne fornitori è al ${value}%, il miglior risultato degli ultimi 6 mesi (era 84.7% a Luglio).`,
      generatedSql: "SELECT period, value FROM kpi('on_time_delivery_pct') ORDER BY period DESC LIMIT 3",
      resultRows: kpiSeries.on_time_delivery_pct.slice(-3),
    };
  }
  if (lower.includes('sped') || lower.includes('nav') || lower.includes('aere') || lower.includes('transit') || lower.includes('gomma')) {
    return {
      answer: 'Il 39% del valore delle merci in transito viaggia su Gomma (€148.000), seguito da Nave (€87.000), Aereo (€34.000) e Ferrovia (€12.000).',
      generatedSql: "SELECT period AS mode, value FROM kpi('shipments_value_by_mode')",
      resultRows: kpiSeries.shipments_value_by_mode,
    };
  }
  if (
    lower.includes('conto economico') ||
    lower.includes('p&l') ||
    lower.includes('pnl') ||
    lower.includes('bilanc')
  ) {
    return {
      answer: 'Ad Agosto: fatturato netto €378.000, costo del venduto €248.700, margine lordo €129.300 (34.2%), costi fissi €92.000, utile netto (EBITDA) €37.300 (9.9% del fatturato).',
      generatedSql: "SELECT voce, valore, pct_fatturato FROM kpi('pnl_summary')",
      resultRows: kpiSeries.pnl_summary,
    };
  }
  if (lower.includes('utile') || lower.includes('ebitda') || lower.includes('profitt') || lower.includes('guadagn')) {
    const value = lastValueOf('net_profit');
    return {
      answer: `L'utile netto (EBITDA) di Agosto è €${value?.toLocaleString('it-IT')}, più del triplo rispetto a Luglio (€11.500): i costi fissi restano quasi costanti, quindi ogni euro di fatturato in più si traduce quasi interamente in utile.`,
      generatedSql: "SELECT period, value FROM kpi('net_profit') ORDER BY period DESC LIMIT 3",
      resultRows: kpiSeries.net_profit.slice(-3),
    };
  }
  if (
    lower.includes('costi fiss') ||
    lower.includes('personal') ||
    lower.includes('dipendent') ||
    lower.includes('affitt') ||
    lower.includes('utenz') ||
    lower.includes('bollett') ||
    lower.includes('assicurazion') ||
    lower.includes('ammortament')
  ) {
    return {
      answer: 'I costi fissi mensili sono €92.000: il Personale pesa di più (€54.000), seguito da Affitto e piazzale (€13.000), Utenze (€7.500), Ammortamenti (€9.500), Assicurazioni (€3.200) e Consulenze (€2.800).',
      generatedSql: "SELECT period AS categoria, value FROM kpi('fixed_costs_by_category')",
      resultRows: kpiSeries.fixed_costs_by_category,
    };
  }

  return {
    answer:
      'Non ho un KPI definito che risponda direttamente a questa domanda nei dati demo. Prova a chiedere del fatturato, del margine, dei costi fissi, dell\'utile netto, dei venditori e delle provvigioni, dei lotti disassemblati, del rottame, dei pezzi fermi in magazzino, dei fornitori o della puntualità delle consegne.',
    generatedSql: null,
    resultRows: null,
  };
}

export function setupMocks(client: AxiosInstance) {
  const mock = new MockAdapter(client, { delayResponse: 400 });

  const dashboards: MockDashboard[] = mockDashboards.map((d) => ({ ...d, widgets: [...d.widgets] }));
  const connections: MockConnection[] = [...mockConnections];
  const alerts: MockAlert[] = [...mockAlerts];

  // --- auth ---
  mock.onPost('/auth/login').reply((config) => {
    const body = JSON.parse(config.data);
    if (String(body.password).includes('2fa')) {
      return [200, { requiresTwoFactor: true, preAuthToken: 'mock-preauth-token' }];
    }
    return [200, { accessToken: 'mock-access-token', tokenType: 'Bearer' }];
  });

  mock.onPost('/auth/2fa/verify').reply((config) => {
    const body = JSON.parse(config.data);
    if (body.code === '123456') {
      return [200, { accessToken: 'mock-access-token', tokenType: 'Bearer' }];
    }
    return [401, { message: 'Invalid 2FA code' }];
  });

  // --- dashboards ---
  mock.onGet('/dashboards').reply(200, dashboards.map(({ id, name, description, created_at }) => ({ id, name, description, created_at })));

  mock.onGet(/\/dashboards\/[^/]+$/).reply((config) => {
    const id = config.url!.split('/').pop();
    const dashboard = dashboards.find((d) => d.id === id);
    return dashboard ? [200, dashboard] : [404, { message: 'Not found' }];
  });

  mock.onPost('/dashboards').reply((config) => {
    const body = JSON.parse(config.data);
    const created: MockDashboard = {
      id: nextId('dash'),
      name: body.name,
      description: 'Nuova dashboard, ancora senza widget',
      created_at: new Date().toISOString(),
      widgets: [],
    };
    dashboards.unshift(created);
    return [201, created];
  });

  mock.onPost(/\/dashboards\/[^/]+\/widgets$/).reply((config) => {
    const id = config.url!.split('/')[2];
    const dashboard = dashboards.find((d) => d.id === id);
    if (!dashboard) return [404, { message: 'Not found' }];
    const body = JSON.parse(config.data);
    const widget = {
      id: nextId('w'),
      kind: body.kind,
      title: body.title ?? body.kpiKey,
      kpi_key: body.kpiKey,
    };
    dashboard.widgets.push(widget);
    return [201, widget];
  });

  mock.onPost(/\/dashboards\/[^/]+\/embed-token$/).reply(200, { token: 'mock-embed-token' });

  // --- kpi values ---
  mock.onGet(/\/kpi-definitions\/[^/]+\/values$/).reply((config) => {
    const key = config.url!.split('/')[2];
    return [200, { kpiKey: key, rows: kpiSeries[key] ?? [] }];
  });

  // --- connections ---
  mock.onGet('/connections').reply(200, connections);

  mock.onPost('/connections').reply((config) => {
    const body = JSON.parse(config.data);
    const created: MockConnection = {
      id: nextId('conn'),
      name: body.name,
      connector_type: body.connectorType,
      is_active: true,
      created_at: new Date().toISOString(),
      last_sync_status: 'success',
      last_sync_at: new Date().toISOString(),
      rows_synced: 0,
    };
    connections.unshift(created);
    return [201, created];
  });

  mock.onPost(/\/connections\/[^/]+\/sync$/).reply((config) => {
    const id = config.url!.split('/')[2];
    const connection = connections.find((c) => c.id === id);
    if (connection) {
      connection.last_sync_status = 'success';
      connection.last_sync_at = new Date().toISOString();
      connection.rows_synced = Math.floor(Math.random() * 3000) + 200;
    }
    return [200, { status: 'success' }];
  });

  mock.onGet(/\/connections\/[^/]+\/sync-logs$/).reply((config) => {
    const id = config.url!.split('/')[2];
    return [200, mockSyncLogs[id] ?? []];
  });

  // --- alerts ---
  mock.onGet('/alerts').reply(200, alerts);

  mock.onPost('/alerts').reply((config) => {
    const body = JSON.parse(config.data);
    const created: MockAlert = {
      id: nextId('alert'),
      name: body.name,
      kpi_key: body.kpiKey,
      is_active: true,
      condition_label: body.conditionLabel ?? 'Condizione personalizzata',
      channels: body.channels ?? ['email'],
    };
    alerts.unshift(created);
    return [201, created];
  });

  mock.onGet(/\/alerts\/[^/]+\/events$/).reply(200, []);

  // --- ai chat ---
  mock.onPost('/ai/chat').reply((config) => {
    const body = JSON.parse(config.data);
    const reply = buildChatReply(body.message ?? '');
    return [200, { conversationId: body.conversationId ?? nextId('convo'), ...reply, modelUsed: 'claude-haiku-4-5-20251001' }];
  });

  mock.onGet(/\/ai\/conversations\/[^/]+\/messages$/).reply(200, []);

  mock.onAny().passThrough();
}
