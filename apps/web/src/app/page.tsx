'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { USE_MOCKS } from '@/lib/api-client';

export default function Home() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    router.replace(accessToken || USE_MOCKS ? '/dashboards' : '/login');
  }, [accessToken, router]);

  return null;
}
