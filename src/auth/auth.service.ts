import { api } from '../api/http';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
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
  user: User;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login/', credentials);
    return data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.warn('Erro ao notificar logout', error);
    }
  },

  getCurrentUser: async () => {
    return api.get<User>('/auth/me/');
  },

  refreshToken: async (): Promise<AuthTokens> => {
    const { data } = await api.post<AuthTokens>('/auth/token/refresh/');
    return data;
  },
};
