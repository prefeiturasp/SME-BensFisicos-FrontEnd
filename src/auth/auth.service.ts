import { api } from '../api/http';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface UnidadeAdministrativa {
  id: number;
  nome: string;
}

export interface User {
  id: number;
  username: string;
  nome: string;
  email: string;
  rf: string;
  is_gestor_patrimonio: boolean;
  is_operador_inventario: boolean;
  must_change_password: boolean;
  unidade_administrativa: UnidadeAdministrativa;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login/', credentials);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    return data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getCurrentUser: async () => {
    return api.get<User>('/auth/me/');
  },

  refreshToken: async (refreshToken: string): Promise<AuthTokens> => {
    const { data } = await api.post<AuthTokens>('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    return data;
  },

  verifyToken: async (token: string): Promise<void> => {
    await api.post('/auth/token/verify/', { token });
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
};
