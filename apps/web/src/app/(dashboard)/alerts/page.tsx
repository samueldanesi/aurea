'use client';

import { useEffect, useState } from 'react';
import { BellRing, Mail, MonitorSmartphone } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface Alert {
  id: string;
  name: string;
  kpi_key: string;
  is_active: boolean;
  condition_label?: string;
  channels?: string[];
}

const CHANNEL_ICON: Record<string, React.ElementType> = {
  email: Mail,
  'in-app': MonitorSmartphone,
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    apiClient.get('/alerts').then(({ data }) => setAlerts(data));
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        Alert
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Soglie e anomalie monitorate automaticamente sui tuoi KPI.
      </p>

      <div className="flex flex-col gap-3">
        {alerts.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-lg border p-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-md"
                style={{ background: 'rgba(250,178,25,0.12)', color: 'var(--status-warning)' }}
              >
                <BellRing size={16} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {a.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  KPI: {a.kpi_key}
                  {a.condition_label ? ` · ${a.condition_label}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {(a.channels ?? []).map((ch) => {
                  const Icon = CHANNEL_ICON[ch] ?? Mail;
                  return (
                    <span
                      key={ch}
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ background: 'var(--gridline)', color: 'var(--text-secondary)' }}
                      title={ch}
                    >
                      <Icon size={12} />
                    </span>
                  );
                })}
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={
                  a.is_active
                    ? { color: 'var(--success-text)', background: 'rgba(12,163,12,0.08)' }
                    : { color: 'var(--text-muted)', background: 'var(--gridline)' }
                }
              >
                {a.is_active ? 'Attivo' : 'Disattivo'}
              </span>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Nessun alert configurato.
          </p>
        )}
      </div>
    </div>
  );
}
