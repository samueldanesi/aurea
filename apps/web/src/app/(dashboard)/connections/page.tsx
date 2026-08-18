'use client';

import { useEffect, useState } from 'react';
import { Database, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { MOCK_TENANT_NAME } from '@/mocks/data';

interface Connection {
  id: string;
  name: string;
  connector_type: string;
  is_active: boolean;
  last_sync_status?: 'success' | 'error';
  last_sync_at?: string;
  rows_synced?: number;
}

const CONNECTOR_LABELS: Record<string, string> = {
  sqlserver: 'SQL Server',
  mysql: 'MySQL',
  postgres: 'PostgreSQL',
  oracle: 'Oracle',
  csv: 'CSV',
  rest_api: 'REST API',
};

function relativeTime(iso?: string) {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diffMs / 3_600_000);
  if (hours < 1) return 'meno di un’ora fa';
  if (hours < 24) return `${hours} ${hours === 1 ? 'ora' : 'ore'} fa`;
  return `${Math.round(hours / 24)} giorni fa`;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);

  function load() {
    apiClient.get('/connections').then(({ data }) => setConnections(data));
  }

  useEffect(load, []);

  async function triggerSync(id: string) {
    setSyncing(id);
    try {
      await apiClient.post(`/connections/${id}/sync`);
      load();
    } finally {
      setSyncing(null);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        Connessioni dati
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        Fonti dati collegate al gestionale di {connections.length > 0 ? MOCK_TENANT_NAME : 'questo tenant'}.
      </p>

      <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
              <th className="px-4 py-2.5 font-medium">Nome</th>
              <th className="px-4 py-2.5 font-medium">Tipo</th>
              <th className="px-4 py-2.5 font-medium">Ultima sincronizzazione</th>
              <th className="px-4 py-2.5 font-medium">Stato</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {connections.map((c) => (
              <tr key={c.id} className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <td className="flex items-center gap-2 px-4 py-3">
                  <Database size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                  {CONNECTOR_LABELS[c.connector_type] ?? c.connector_type}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                  {relativeTime(c.last_sync_at)}
                  {typeof c.rows_synced === 'number' && c.last_sync_status === 'success' && (
                    <span style={{ color: 'var(--text-muted)' }}> · {c.rows_synced.toLocaleString('it-IT')} righe</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {c.last_sync_status === 'error' ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ color: 'var(--status-critical)', background: 'rgba(208,59,59,0.08)' }}
                    >
                      <XCircle size={12} />
                      Errore ultimo sync
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ color: 'var(--success-text)', background: 'rgba(12,163,12,0.08)' }}
                    >
                      <CheckCircle2 size={12} />
                      Attiva
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => triggerSync(c.id)}
                    disabled={syncing === c.id}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
                    style={{ color: 'var(--brand)', background: 'rgba(42,58,167,0.08)' }}
                  >
                    <RefreshCw size={12} className={syncing === c.id ? 'animate-spin' : ''} />
                    {syncing === c.id ? 'Sync in corso…' : 'Sincronizza ora'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {connections.length === 0 && (
        <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          Nessuna connessione ancora.
        </p>
      )}
    </div>
  );
}
