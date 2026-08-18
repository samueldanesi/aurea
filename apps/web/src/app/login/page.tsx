'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, USE_MOCKS } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [tenantSlug, setTenantSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preAuthToken, setPreAuthToken] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', { tenantSlug, email, password });
      if (data.error) {
        setError('Credenziali non valide.');
        return;
      }
      if (data.requiresTwoFactor) {
        setPreAuthToken(data.preAuthToken);
        return;
      }
      setSession(data.accessToken, tenantSlug, email);
      router.push('/dashboards');
    } catch {
      setError('Errore di accesso. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyTwoFactor(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/2fa/verify', { preAuthToken, code });
      setSession(data.accessToken, tenantSlug, email);
      router.push('/dashboards');
    } catch {
      setError('Codice 2FA non valido.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Accedi</h1>

      {USE_MOCKS && (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
          <p className="font-medium">Modalità demo (dati finti, nessun backend richiesto)</p>
          <p className="mt-1">
            Azienda/email/password: qualsiasi valore. Per provare il flusso 2FA usa una password
            che contiene &ldquo;2fa&rdquo; (es. <code>demo2fa</code>) — poi codice <code>123456</code>.
          </p>
        </div>
      )}

      {!preAuthToken ? (
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            className="rounded border px-3 py-2"
            placeholder="Azienda (slug)"
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
            required
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyTwoFactor} className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">Inserisci il codice a 6 cifre dalla tua app di autenticazione.</p>
          <input
            className="rounded border px-3 py-2"
            placeholder="Codice 2FA"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
          >
            {loading ? 'Verifica...' : 'Verifica codice'}
          </button>
        </form>
      )}
    </main>
  );
}
