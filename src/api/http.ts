import axios from 'axios';
import { getEscopoStorage } from '@/lib/escopo-storage';

interface AppConfig {
  VITE_API_URL?: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: AppConfig;
  }
}

let memoryToken: string | null = null;

export const getAuthToken = () => memoryToken;

export const setAuthToken = (token: string | null) => {
  memoryToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

function getBaseUrl() {
  const runtimeUrl = globalThis.__APP_CONFIG__?.VITE_API_URL;
  const buildUrl = import.meta.env.VITE_API_URL;
  if (runtimeUrl && runtimeUrl !== '__VITE_API_URL__') return runtimeUrl;
  return buildUrl;
}

export const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.request.use((config) => {
  const url = config.url ?? '';
  if (memoryToken) {
    config.headers.Authorization = `Bearer ${memoryToken}`;
  }
  const shouldSkipEscopoHeaders = url.startsWith('/auth/');

  if (!shouldSkipEscopoHeaders) {
    const escopo = getEscopoStorage();
    config.headers = config.headers ?? {};
    const headers = config.headers as Record<string, string>;
    if (escopo?.uoId) {
      headers['X-UO-Id'] = String(escopo.uoId);
    } else {
      delete headers['X-UO-Id'];
    }
    if (escopo?.uaId) {
      headers['X-UA-Id'] = String(escopo.uaId);
    } else {
      delete headers['X-UA-Id'];
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url ?? '';
      if (url.includes('auth/login') || url.includes('token/refresh')) {
        throw error instanceof Error ? error : new Error(String(error));
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/token/refresh/');

        const newToken = data.access;

        setAuthToken(newToken);
        onTokenRefreshed(newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        setAuthToken(null);
        throw refreshError instanceof Error ? refreshError : new Error(String(refreshError));
      }
    }

    throw error instanceof Error ? error : new Error(String(error));
  },
);
