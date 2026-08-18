import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';
import { setupMocks } from '@/mocks/setup';

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000',
});

if (USE_MOCKS) {
  // Demo mode: intercepts every request below and answers with fixtures from
  // src/mocks/data.ts instead of hitting apps/api. Lets the UI be exercised
  // end-to-end without Postgres/Redis/the backend services running. Toggle off
  // via NEXT_PUBLIC_USE_MOCKS=false once a real backend is available.
  setupMocks(apiClient);
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
