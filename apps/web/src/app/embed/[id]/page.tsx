'use client';

import { useEffect, useState, use as usePromise } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { KpiChartView, type KpiRow } from '@/components/kpi-chart-view';
import { USE_MOCKS } from '@/lib/api-client';
import { mockDashboards, kpiSeries } from '@/mocks/data';

interface EmbedWidget {
  id: string;
  kind: string;
  title: string | null;
  kpi_key: string | null;
  data: { rows: KpiRow[] } | null;
}

interface EmbedDashboard {
  id: string;
  name: string;
  widgets: EmbedWidget[];
}

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

// Public, tokenless-session view meant to be dropped in an <iframe> on a
// third-party site (spec 7: "embedding"). No app shell, no auth store --
// authorization is the ?token= query param alone (see EmbedController).
export default function EmbedDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [dashboard, setDashboard] = useState<EmbedDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (USE_MOCKS) {
      const found = mockDashboards.find((d) => d.id === id);
      if (!found) {
        setError('Dashboard demo non trovata.');
        return;
      }
      setDashboard({
        id: found.id,
        name: found.name,
        widgets: found.widgets.map((w) => ({
          ...w,
          data: { rows: kpiSeries[w.kpi_key] ?? [] },
        })),
      });
      return;
    }
    if (!token) {
      setError('Token di embedding mancante.');
      return;
    }
    axios
      .get(`${apiBase}/public/dashboards/${id}`, { params: { token } })
      .then(({ data }) => setDashboard(data))
      .catch(() => setError('Token non valido o scaduto.'));
  }, [id, token]);

  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!dashboard) return <p className="p-6 text-sm text-gray-400">Caricamento…</p>;

  const widgets = dashboard.widgets.filter((w) => w.data);
  const kpiCards = widgets.filter((w) => w.kind === 'kpi_card');
  const charts = widgets.filter((w) => w.kind === 'line' || w.kind === 'bar' || w.kind === 'pie');
  const tables = widgets.filter((w) => w.kind === 'table');

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-semibold">{dashboard.name}</h1>
      <div className="flex flex-col gap-4">
        {kpiCards.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {kpiCards.map((w) => (
              <KpiChartView
                key={w.id}
                rows={w.data!.rows}
                kind={w.kind}
                title={w.title ?? w.kpi_key ?? undefined}
                kpiKey={w.kpi_key ?? undefined}
              />
            ))}
          </div>
        )}
        {charts.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {charts.map((w) => (
              <KpiChartView
                key={w.id}
                rows={w.data!.rows}
                kind={w.kind}
                title={w.title ?? w.kpi_key ?? undefined}
                kpiKey={w.kpi_key ?? undefined}
              />
            ))}
          </div>
        )}
        {tables.map((w) => (
          <KpiChartView
            key={w.id}
            rows={w.data!.rows}
            kind={w.kind}
            title={w.title ?? w.kpi_key ?? undefined}
            kpiKey={w.kpi_key ?? undefined}
          />
        ))}
      </div>
    </div>
  );
}
