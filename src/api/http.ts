import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Não tentar refresh ou redirecionar para requisições de login/refresh
      const url = originalRequest.url || '';
      if (
        url.includes('/auth/login') ||
        url.includes('/auth/token') ||
        url.includes('/auth/token/refresh')
      ) {
        return Promise.reject(error);
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
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await api.post('/auth/token/refresh/', {
          refresh: refreshToken,
        });

        if (data.access) {
          localStorage.setItem('access_token', data.access);
          api.defaults.headers.Authorization = `Bearer ${data.access}`;
        }
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }
        onTokenRefreshed(data.access);
        isRefreshing = false;

        return api(originalRequest);
      } catch {
        isRefreshing = false;
        // Melhorar segurança através de cookies HttpOnly
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
