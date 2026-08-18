'use client';

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Categorical slots from the validated palette (dataviz skill, references/palette.md).
// Fixed order -- never cycled/reassigned per render.
const SERIES_COLORS = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)'];
const SERIES_HEX = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];

export interface KpiRow {
  period?: string;
  value?: number;
  [key: string]: unknown;
}

function formatValue(v: number, unit?: string) {
  if (unit === 'percent') return `${v.toFixed(1)}%`;
  if (Math.abs(v) >= 1000) return v.toLocaleString('it-IT', { maximumFractionDigits: 0 });
  return v.toLocaleString('it-IT');
}

interface ColumnDef {
  key: string;
  label: string;
  align?: 'left' | 'right';
  format?: (v: unknown) => string;
}

const euro = (v: unknown) => `€${Number(v).toLocaleString('it-IT')}`;
const signedEuro = (v: unknown) => {
  const n = Number(v);
  return `${n < 0 ? '-' : ''}€${Math.abs(n).toLocaleString('it-IT')}`;
};
const signedPct = (v: unknown) => `${Number(v).toFixed(1)}%`;
const days = (v: unknown) => `${v} giorni`;

// Table widgets are hand-configured per kpi_key rather than generically inferred
// from row shape -- keeps column order/labels/formatting under our control instead
// of leaking raw field names into the UI.
const TABLE_COLUMNS: Record<string, ColumnDef[]> = {
  dismantled_lots: [
    { key: 'lotto', label: 'Lotto' },
    { key: 'costo_acquisto', label: 'Costo acquisto', align: 'right', format: euro },
    { key: 'pezzi_ricavati', label: 'Pezzi ricavati', align: 'right' },
    { key: 'pezzi_venduti', label: 'Pezzi venduti', align: 'right' },
    { key: 'ricavo_a_oggi', label: 'Ricavo a oggi', align: 'right', format: euro },
    { key: 'recupero_pct', label: 'Recupero costo', align: 'right', format: (v) => `${v}%` },
  ],
  slow_movers: [
    { key: 'codice', label: 'Codice' },
    { key: 'descrizione', label: 'Descrizione' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'giorni_giacenza', label: 'Giacenza', align: 'right', format: days },
    { key: 'valore', label: 'Valore', align: 'right', format: euro },
  ],
  pnl_summary: [
    { key: 'voce', label: 'Voce' },
    { key: 'valore', label: 'Valore', align: 'right', format: signedEuro },
    { key: 'pct_fatturato', label: '% Fatturato', align: 'right', format: signedPct },
  ],
};

// Rows that anchor the P&L waterfall (start and end) render bold to stand out
// from the cost lines subtracted in between.
const PNL_EMPHASIS_ROWS = new Set(['Fatturato netto', 'Utile netto (EBITDA)']);

function TableWidget({ rows, kpiKey, title }: { rows: KpiRow[]; kpiKey?: string; title?: string }) {
  const columns: ColumnDef[] =
    (kpiKey && TABLE_COLUMNS[kpiKey]) || (rows[0] ? Object.keys(rows[0]).map((key) => ({ key, label: key })) : []);
  return (
    <div className="rounded-lg border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {title && <p className="mb-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ color: 'var(--text-muted)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="border-b pb-2 pr-4 text-xs font-medium"
                  style={{ borderColor: 'var(--border)', textAlign: col.align ?? 'left' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const recuperoPct = kpiKey === 'dismantled_lots' ? Number(row.recupero_pct) : null;
              const isPnl = kpiKey === 'pnl_summary';
              const isEmphasisRow = isPnl && PNL_EMPHASIS_ROWS.has(String(row.voce));
              const pnlValue = isPnl ? Number(row.valore) : null;
              return (
                <tr
                  key={i}
                  className="border-b last:border-0"
                  style={{ borderColor: 'var(--border)', fontWeight: isEmphasisRow ? 600 : 400 }}
                >
                  {columns.map((col) => {
                    let color = 'var(--text-primary)';
                    if (col.key === 'recupero_pct') {
                      color = (recuperoPct ?? 0) >= 100 ? 'var(--success-text)' : 'var(--status-critical)';
                    } else if (isPnl && (col.key === 'valore' || col.key === 'pct_fatturato')) {
                      color =
                        row.voce === 'Utile netto (EBITDA)'
                          ? 'var(--success-text)'
                          : (pnlValue ?? 0) < 0
                            ? 'var(--status-critical)'
                            : 'var(--text-primary)';
                    }
                    return (
                      <td key={col.key} className="py-2 pr-4" style={{ textAlign: col.align ?? 'left', color }}>
                        {col.format ? col.format(row[col.key]) : String(row[col.key] ?? '')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Pure rendering component -- no data fetching, so it works both for the
 * authenticated dashboard view (KpiChart fetches, then renders this) and the
 * public embed view (data comes pre-resolved from /public/dashboards/:id). */
export function KpiChartView({
  rows,
  kind,
  title,
  kpiKey,
}: {
  rows: KpiRow[];
  kind: string;
  title?: string;
  kpiKey?: string;
}) {
  const lowerTitle = title?.toLowerCase() ?? '';
  const isPercentKpi = lowerTitle.includes('margine') || lowerTitle.includes('puntualità') || lowerTitle.includes('%');
  // For "lower is better" KPIs (costs, error rates) a negative delta is the good outcome --
  // invert which direction reads as positive instead of always mapping "up" to green.
  const lowerIsBetter =
    lowerTitle.includes('cost') || lowerTitle.includes('smaltimento') || lowerTitle.includes('incidenza');

  if (kind === 'table') {
    return <TableWidget rows={rows} kpiKey={kpiKey} title={title} />;
  }

  if (kind === 'kpi_card') {
    const latest = rows[rows.length - 1];
    const previous = rows[rows.length - 2];
    const latestVal = Number(latest?.value ?? 0);
    const previousVal = previous ? Number(previous.value) : null;
    const delta = previousVal ? ((latestVal - previousVal) / previousVal) * 100 : null;
    const deltaIsUp = (delta ?? 0) >= 0;
    const positive = lowerIsBetter ? !deltaIsUp : deltaIsUp;
    return (
      // Fixed height + flex so every KPI card in a row lines up identically
      // regardless of whether it has a delta badge or a two-line title.
      <div
        className="flex h-[132px] flex-col justify-between rounded-lg border p-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</p>
        <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'proportional-nums' }}>
          {formatValue(latestVal, isPercentKpi ? 'percent' : undefined)}
        </p>
        <div>
          {delta !== null && (
            <div
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                color: positive ? 'var(--success-text)' : 'var(--status-critical)',
                background: positive ? 'rgba(12,163,12,0.08)' : 'rgba(208,59,59,0.08)',
              }}
            >
              {deltaIsUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {deltaIsUp ? '+' : ''}
              {delta.toFixed(1)}% vs periodo precedente
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    // Fixed height + flex-1 chart area so line/bar/pie cards all match, whether
    // or not this particular one renders a legend row underneath.
    <div
      className="flex h-[320px] flex-col rounded-lg border p-4"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {title && <p className="mb-3 shrink-0 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{title}</p>}
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
        {kind === 'bar' ? (
          <BarChart data={rows} margin={{ left: -20 }}>
            <CartesianGrid vertical={false} stroke="var(--gridline)" />
            <XAxis dataKey="period" fontSize={12} stroke="var(--axis)" tickLine={false} axisLine={{ stroke: 'var(--axis)' }} />
            <YAxis fontSize={12} stroke="var(--axis)" tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => formatValue(v, isPercentKpi ? 'percent' : undefined)}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {rows.map((_, i) => (
                <Cell key={i} fill={SERIES_HEX[i % SERIES_HEX.length]} />
              ))}
            </Bar>
          </BarChart>
        ) : kind === 'pie' ? (
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="period" outerRadius={80} isAnimationActive={false}>
              {rows.map((_, i) => (
                <Cell key={i} fill={SERIES_HEX[i % SERIES_HEX.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => formatValue(v)}
            />
          </PieChart>
        ) : (
          <LineChart data={rows} margin={{ left: -20 }}>
            <CartesianGrid vertical={false} stroke="var(--gridline)" />
            <XAxis dataKey="period" fontSize={12} stroke="var(--axis)" tickLine={false} axisLine={{ stroke: 'var(--axis)' }} />
            <YAxis fontSize={12} stroke="var(--axis)" tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              formatter={(v: number) => formatValue(v, isPercentKpi ? 'percent' : undefined)}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--series-1)"
              strokeWidth={2}
              dot={{ r: 3, fill: '#2a78d6' }}
              isAnimationActive={false}
            />
          </LineChart>
        )}
        </ResponsiveContainer>
      </div>

      {/* Fixed-height footer row, always present, so the chart plot area itself is
          the same height on every card whether or not this one has a legend to show. */}
      <div className="mt-3 h-[22px] shrink-0 overflow-hidden">
        {kind === 'pie' && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }}
                />
                {r.period}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
