import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  tenantSlug: string | null;
  email: string | null;
  setSession: (accessToken: string, tenantSlug: string, email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      tenantSlug: null,
      email: null,
      setSession: (accessToken, tenantSlug, email) => set({ accessToken, tenantSlug, email }),
      logout: () => set({ accessToken: null, tenantSlug: null, email: null }),
    }),
    { name: 'bi-platform-auth' },
  ),
);
