'use client';

import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  XCircle,
  Sparkles,
  BellRing,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { USE_MOCKS } from '@/lib/api-client';
import { useChatStore } from '@/store/chat-store';
import { FiscalYearRevenueChart } from '@/components/fiscal-year-revenue-chart';
import {
  MOCK_TENANT_NAME,
  overviewStats,
  mockActivity,
  mockConnections,
  suggestedQuestions,
  fiscalYearRevenue,
  fiscalYearRevenueYtd,
  type ActivityItem,
} from '@/mocks/data';

const ACTIVITY_ICON: Record<ActivityItem['type'], { icon: React.ElementType; color: string; bg: string }> = {
  sync_success: { icon: RefreshCw, color: 'var(--success-text)', bg: 'rgba(12,163,12,0.08)' },
  sync_error: { icon: XCircle, color: 'var(--status-critical)', bg: 'rgba(208,59,59,0.08)' },
  insight: { icon: Sparkles, color: 'var(--brand)', bg: 'rgba(42,58,167,0.08)' },
  alert: { icon: BellRing, color: 'var(--status-warning)', bg: 'rgba(250,178,25,0.12)' },
};

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diffMs / 3_600_000);
  if (hours < 1) return 'meno di un’ora fa';
  if (hours < 24) return `${hours} ${hours === 1 ? 'ora' : 'ore'} fa`;
  return `${Math.round(hours / 24)} giorni fa`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buongiorno';
  if (hour < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

export default function HomePage() {
  const askChat = useChatStore((s) => s.ask);

  const activeConnections = mockConnections.filter((c) => c.last_sync_status === 'success').length;
  const errorConnections = mockConnections.filter((c) => c.last_sync_status === 'error').length;

  const today = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        {greeting()}, {MOCK_TENANT_NAME}
      </h1>
      <p className="mt-0.5 mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <span className="capitalize">{today}</span> — ecco la situazione di oggi.
      </p>

      {USE_MOCKS && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {overviewStats.map((s) => (
            <div
              key={s.label}
              className="flex h-[100px] flex-col justify-between rounded-lg border p-4"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
              <p className="mt-1 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <div
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium"
                style={{ color: s.positive ? 'var(--success-text)' : 'var(--status-critical)' }}
              >
                {s.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {s.delta}
              </div>
            </div>
          ))}
        </div>
      )}

      {USE_MOCKS && (
        <div className="mb-6">
          <FiscalYearRevenueChart
            data={fiscalYearRevenue}
            ytdTotal={fiscalYearRevenueYtd}
            ytdDeltaLabel="+8,4% vs 2025 (stesso periodo)"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div
          className="rounded-lg border p-4 lg:col-span-2"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="mb-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Attività recente</p>
          <ul className="space-y-3">
            {mockActivity.map((a) => {
              const { icon: Icon, color, bg } = ACTIVITY_ICON[a.type];
              return (
                <li key={a.id} className="flex items-start gap-3">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ background: bg, color }}
                  >
                    <Icon size={13} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{a.text}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{relativeTime(a.time)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <div
            className="rounded-lg border p-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <p className="mb-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Stato connessioni</p>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
              <CheckCircle2 size={14} style={{ color: 'var(--success-text)' }} />
              {activeConnections} attive
            </div>
            {errorConnections > 0 && (
              <div className="mt-1.5 flex items-center gap-2 text-sm" style={{ color: 'var(--status-critical)' }}>
                <AlertCircle size={14} />
                {errorConnections} con errori da verificare
              </div>
            )}
          </div>

          <div
            className="rounded-lg border p-4"
            style={{ background: 'rgba(42,58,167,0.04)', borderColor: 'var(--border)' }}
          >
            <div className="mb-3 flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--brand)' }}>
              <Sparkles size={14} />
              Chiedi all&rsquo;assistente
            </div>
            <div className="flex flex-col gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => askChat(q)}
                  className="rounded-md border px-3 py-2 text-left text-xs transition-colors hover:bg-white"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
