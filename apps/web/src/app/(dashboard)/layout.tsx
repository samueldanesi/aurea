'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  TrendingUp,
  Warehouse,
  Wrench,
  Truck,
  Wallet,
  Users,
  Compass,
  Scale,
  LayoutGrid,
  Plug,
  BellRing,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { RequireAuth } from '@/components/require-auth';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { ChatWidget } from '@/components/chat-widget';
import { MOCK_TENANT_NAME, PRODUCT_NAME } from '@/mocks/data';

// One icon per dashboard, matched by name -- falls back to a generic grid icon
// for any dashboard created later via "Nuova dashboard" that isn't in this map.
const DASHBOARD_ICONS: Record<string, React.ElementType> = {
  'Vendite & Margini': TrendingUp,
  'Magazzino & Rotazione': Warehouse,
  'Disassemblaggio & Recupero': Wrench,
  'Logistica & Fornitori': Truck,
  'Costi Fissi': Wallet,
  'Venditori & Provvigioni': Users,
};

interface DashboardNavItem {
  id: string;
  name: string;
}

function initials(email: string | null) {
  if (!email) return '?';
  return email.slice(0, 2).toUpperCase();
}

export default function DashboardShellLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const email = useAuthStore((s) => s.email);
  const [dashboards, setDashboards] = useState<DashboardNavItem[]>([]);

  useEffect(() => {
    apiClient.get('/dashboards').then(({ data }) => setDashboards(data));
  }, []);

  const isHome = pathname === '/dashboards';

  return (
    <RequireAuth>
      <div className="flex min-h-screen flex-col" style={{ background: 'var(--page)' }}>
        <header
          className="flex h-14 shrink-0 items-center justify-between border-b px-5"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold"
                style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}
              >
                <Sparkles size={15} />
              </div>
              <span className="text-sm font-semibold tracking-tight">{PRODUCT_NAME}</span>
            </div>
            <div className="h-5 w-px" style={{ background: 'var(--border)' }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {MOCK_TENANT_NAME}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {email}
            </span>
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium"
              style={{ background: 'var(--gridline)', color: 'var(--text-secondary)' }}
            >
              {initials(email)}
            </div>
            <button
              onClick={() => {
                logout();
                router.replace('/login');
              }}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-black/5"
              style={{ color: 'var(--status-critical)' }}
              title="Esci"
            >
              <LogOut size={14} />
            </button>
          </div>
        </header>

        <div className="flex flex-1">
          <aside
            className="w-60 shrink-0 border-r p-3"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <nav className="flex flex-col gap-1">
              <Link
                href="/dashboards"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
                style={
                  isHome
                    ? { background: 'rgba(42,58,167,0.08)', color: 'var(--brand)', fontWeight: 500 }
                    : { color: 'var(--text-secondary)' }
                }
              >
                <Home size={16} />
                Home
              </Link>

              <p
                className="mb-1 mt-4 px-3 text-[11px] font-medium uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
                Dashboard
              </p>
              {dashboards.map((d) => {
                const href = `/dashboards/${d.id}`;
                const active = pathname === href;
                const Icon = DASHBOARD_ICONS[d.name] ?? LayoutGrid;
                return (
                  <Link
                    key={d.id}
                    href={href}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
                    style={
                      active
                        ? { background: 'rgba(42,58,167,0.08)', color: 'var(--brand)', fontWeight: 500 }
                        : { color: 'var(--text-secondary)' }
                    }
                  >
                    <Icon size={16} />
                    {d.name}
                  </Link>
                );
              })}

              <div className="my-3 h-px" style={{ background: 'var(--border)' }} />

              <Link
                href="/strategy"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
                style={
                  pathname?.startsWith('/strategy')
                    ? { background: 'rgba(42,58,167,0.08)', color: 'var(--brand)', fontWeight: 500 }
                    : { color: 'var(--text-secondary)' }
                }
              >
                <Compass size={16} />
                Strategia
              </Link>
              <Link
                href="/regulations"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
                style={
                  pathname?.startsWith('/regulations')
                    ? { background: 'rgba(42,58,167,0.08)', color: 'var(--brand)', fontWeight: 500 }
                    : { color: 'var(--text-secondary)' }
                }
              >
                <Scale size={16} />
                Normative
              </Link>

              <div className="my-3 h-px" style={{ background: 'var(--border)' }} />

              <Link
                href="/connections"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
                style={
                  pathname?.startsWith('/connections')
                    ? { background: 'rgba(42,58,167,0.08)', color: 'var(--brand)', fontWeight: 500 }
                    : { color: 'var(--text-secondary)' }
                }
              >
                <Plug size={16} />
                Connessioni dati
              </Link>
              <Link
                href="/alerts"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
                style={
                  pathname?.startsWith('/alerts')
                    ? { background: 'rgba(42,58,167,0.08)', color: 'var(--brand)', fontWeight: 500 }
                    : { color: 'var(--text-secondary)' }
                }
              >
                <BellRing size={16} />
                Alert
              </Link>
            </nav>
          </aside>
          <main className="flex-1 p-6">{children}</main>
        </div>
        <ChatWidget />
      </div>
    </RequireAuth>
  );
}
