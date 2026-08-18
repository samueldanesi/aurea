'use client';

import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import type { FiscalRevenuePoint } from '@/mocks/data';

function formatCompact(v: number) {
  if (Math.abs(v) >= 1000) return `${Math.round(v / 1000)}k`;
  return String(v);
}

function formatEuro(v: number) {
  return `€${v.toLocaleString('it-IT')}`;
}

interface TooltipPayloadItem {
  dataKey: string;
  value: number;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0];
  const isProjected = point.dataKey === 'projected';
  return (
    <div
      className="rounded-md border px-3 py-2 text-xs shadow-sm"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
      <p style={{ color: 'var(--text-secondary)' }}>
        {formatEuro(point.value)} {isProjected ? '· proiezione' : '· effettivo'}
      </p>
    </div>
  );
}

/** Home page hero chart: full fiscal year revenue, styled like a stock/market
 * ticker chart -- gradient-filled area for actuals, dashed line for the
 * trend-based projection of the months still ahead. */
export function FiscalYearRevenueChart({
  data,
  ytdTotal,
  ytdDeltaLabel,
}: {
  data: FiscalRevenuePoint[];
  ytdTotal: number;
  ytdDeltaLabel: string;
}) {
  return (
    <div className="rounded-lg border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Fatturato — Anno fiscale 2026
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {formatEuro(ytdTotal)}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>totale da inizio anno</span>
          </div>
        </div>
        <div
          className="mb-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ color: 'var(--success-text)', background: 'rgba(12,163,12,0.08)' }}
        >
          <ArrowUpRight size={12} />
          {ytdDeltaLabel}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ left: -12, right: 12 }}>
          <defs>
            <linearGradient id="fiscalYearActualFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a78d6" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#2a78d6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--gridline)" />
          <XAxis dataKey="period" fontSize={12} stroke="var(--axis)" tickLine={false} axisLine={{ stroke: 'var(--axis)' }} />
          <YAxis
            fontSize={12}
            stroke="var(--axis)"
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCompact}
            domain={['dataMin - 20000', 'dataMax + 20000']}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#2a78d6"
            strokeWidth={2}
            fill="url(#fiscalYearActualFill)"
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="projected"
            stroke="#2a78d6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-1 flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4" style={{ background: '#2a78d6' }} />
          Effettivo (Gen–Ago)
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-4"
            style={{ borderTop: '2px dashed #2a78d6' }}
          />
          Proiezione (Set–Dic)
        </span>
      </div>
    </div>
  );
}
