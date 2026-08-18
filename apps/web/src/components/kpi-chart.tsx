'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { KpiChartView, type KpiRow } from '@/components/kpi-chart-view';

export function KpiChart({ kpiKey, kind, title }: { kpiKey: string; kind: string; title?: string }) {
  const [rows, setRows] = useState<KpiRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get(`/kpi-definitions/${kpiKey}/values`)
      .then(({ data }) => {
        if (!cancelled) setRows(data.rows ?? []);
      })
      .catch(() => {
        if (!cancelled) setError('Impossibile caricare questo KPI');
      });
    return () => {
      cancelled = true;
    };
  }, [kpiKey]);

  if (error)
    return (
      <div className="rounded-lg border p-4 text-sm" style={{ borderColor: 'var(--border)', color: 'var(--status-critical)' }}>
        {error}
      </div>
    );
  if (!rows)
    return (
      <div
        className="h-[100px] animate-pulse rounded-lg border"
        style={{ borderColor: 'var(--border)', background: 'var(--gridline)' }}
      />
    );

  return <KpiChartView rows={rows} kind={kind} title={title ?? kpiKey} kpiKey={kpiKey} />;
}
