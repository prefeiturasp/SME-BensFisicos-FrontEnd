import { api } from '../api/http';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
}

export interface EscopoBase {
  id: number;
  codigo: string;
  nome: string;
  label: string;
}

export interface EscopoUo extends EscopoBase {
  selecionavel: boolean;
  unidade_administrativa_id: null;
  unidade_orcamentaria_id: number;
}

export interface EscopoUa extends EscopoBase {
  unidade_administrativa_id: number;
  unidade_orcamentaria_id: number;
}

export interface EscopoGrupo {
  uo: EscopoUo;
  uas: EscopoUa[];
}

export interface OpcoesEscopo {
  grupos: EscopoGrupo[];
}

export interface User {
  id: number;
  username: string;
  nome: string;
  email: string;
  rf: string;
  is_superuser?: boolean;
  is_gestor_patrimonio: boolean;
  is_operador_inventario: boolean;
  must_change_password: boolean;
  uo_ativa: EscopoBase | null;
  ua_ativa: EscopoBase | null;
  opcoes_escopo: OpcoesEscopo | null;
}

export interface LoginResponse {
  access: string;
  user: User;
}

export interface SelecionarEscopoPayload {
  unidade_administrativa_id?: number | null;
  unidade_orcamentaria_id?: number;
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

  selecionarEscopo: async (payload: SelecionarEscopoPayload) => {
    return api.post('/auth/me/selecionar-ua/', payload);
  },

  refreshToken: async (): Promise<AuthTokens> => {
    const { data } = await api.post<AuthTokens>('/auth/token/refresh/');
    return data;
  },
};
