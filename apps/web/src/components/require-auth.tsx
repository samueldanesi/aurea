'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { USE_MOCKS } from '@/lib/api-client';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    if (accessToken) return;
    if (USE_MOCKS) {
      // Demo mode: skip the login screen entirely so the app can be clicked
      // through immediately. Remove this branch once real auth is wired up.
      setSession('mock-access-token', 'demo', 'demo@cliente.it');
      return;
    }
    router.replace('/login');
  }, [accessToken, router, setSession]);

  if (!accessToken && !USE_MOCKS) return null;
  return <>{children}</>;
}
