'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Sparkles, Share2 } from 'lucide-react';
import { apiClient, USE_MOCKS } from '@/lib/api-client';
import { KpiChart } from '@/components/kpi-chart';
import { mockInsights } from '@/mocks/data';

interface Widget {
  id: string;
  kind: string;
  title: string | null;
  kpi_key: string | null;
  span?: 'full' | 'wide';
}

interface DashboardDetail {
  id: string;
  name: string;
  widgets: Widget[];
}

export function DashboardDetailClient({ id }: { id: string }) {
  const [dashboard, setDashboard] = useState<DashboardDetail | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    apiClient.get(`/dashboards/${id}`).then(({ data }) => setDashboard(data));
  }, [id]);

  async function share() {
    setSharing(true);
    try {
      const { data } = await apiClient.post(`/dashboards/${id}/embed-token`);
      window.open(`/embed/${id}?token=${data.token}`, '_blank');
    } finally {
      setSharing(false);
    }
  }

  const insights = USE_MOCKS ? mockInsights[id] : undefined;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Link
          href="/dashboards"
          className="inline-flex items-center gap-1 text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronLeft size={14} />
          Tutte le dashboard
        </Link>
        {dashboard && (
          <button
            onClick={share}
            disabled={sharing}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
            style={{ color: 'var(--brand)', background: 'rgba(42,58,167,0.08)' }}
          >
            <Share2 size={12} />
            {sharing ? 'Generazione link…' : 'Condividi (embed)'}
          </button>
        )}
      </div>

      {!dashboard ? (
        <div className="h-6 w-48 animate-pulse rounded" style={{ background: 'var(--gridline)' }} />
      ) : (
        <h1 className="mb-4 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          {dashboard.name}
        </h1>
      )}

      {insights && insights.length > 0 && (
        <div
          className="mb-5 rounded-lg border p-4"
          style={{ background: 'rgba(42,58,167,0.04)', borderColor: 'var(--border)' }}
        >
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--brand)' }}>
            <Sparkles size={13} />
            Insight generati automaticamente
          </div>
          <ul className="space-y-1.5">
            {insights.map((text, i) => (
              <li key={i} className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {dashboard && dashboard.widgets.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Nessun widget ancora. Aggiungine uno via API (POST /dashboards/{id}/widgets) collegandolo
          a un KPI del semantic layer.
        </p>
      )}
      {dashboard && dashboard.widgets.length > 0 && <WidgetGroups widgets={dashboard.widgets} />}
    </div>
  );
}

/**
 * Widgets are grouped by kind rather than rendered in one mixed grid: KPI cards
 * (short) and charts (tall) sharing a row otherwise stretch to mismatched
 * heights and look uneven. Each group uses a uniform card height (enforced in
 * KpiChartView) so every row lines up.
 */
function WidgetGroups({ widgets }: { widgets: Widget[] }) {
  const kpiCards = widgets.filter((w) => w.kind === 'kpi_card' && w.kpi_key);
  const charts = widgets.filter((w) => (w.kind === 'line' || w.kind === 'bar' || w.kind === 'pie') && w.kpi_key);
  const tables = widgets.filter((w) => w.kind === 'table' && w.kpi_key);

  return (
    <div className="flex flex-col gap-6">
      {kpiCards.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {kpiCards.map((w) => (
            <KpiChart key={w.id} kpiKey={w.kpi_key!} kind={w.kind} title={w.title ?? undefined} />
          ))}
        </div>
      )}
      {charts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {charts.map((w) => (
            <KpiChart key={w.id} kpiKey={w.kpi_key!} kind={w.kind} title={w.title ?? undefined} />
          ))}
        </div>
      )}
      {tables.map((w) => (
        <KpiChart key={w.id} kpiKey={w.kpi_key!} kind={w.kind} title={w.title ?? undefined} />
      ))}
    </div>
  );
}
