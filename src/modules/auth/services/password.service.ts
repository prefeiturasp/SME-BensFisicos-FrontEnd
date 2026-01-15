import { api } from '@/api/http';
import { AxiosError } from 'axios';

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  uidb64: string;
  token: string;
  new_password: string;
  new_password_confirm: string;
}

export interface PasswordChange {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export const passwordService = {
  requestReset: async (data: PasswordResetRequest): Promise<void> => {
    try {
      await api.post('/auth/password-reset/', data);
    } catch (error) {
      if (error instanceof AxiosError) {
        if (!error.response) {
          throw new Error('Erro de conexão com o servidor.');
        }
        throw new Error(error.response.data?.detail ?? 'Erro ao solicitar reset de senha');
      }
      throw error;
    }
  },

  confirmReset: async (data: PasswordResetConfirm): Promise<void> => {
    try {
      const payload = {
        uidb64: data.uidb64,
        token: data.token,
        new_password: data.new_password,
        new_password_confirm: data.new_password_confirm,
      };

      await api.post('/auth/password-reset-confirm/', payload);
    } catch (error) {
      if (error instanceof AxiosError) {
        if (!error.response) {
          throw new Error('Erro de conexão com o servidor.');
        }
        throw new Error(
          error.response.data?.detail ?? 'Erro ao redefinir senha. O link pode ter expirado.',
        );
      }
      throw error;
    }
  },

  changePassword: async (data: PasswordChange): Promise<void> => {
    try {
      await api.post('/auth/password-change/', data);
    } catch (error) {
      if (error instanceof AxiosError) {
        if (!error.response) {
          throw new Error('Erro de conexão com o servidor.');
        }
        const responseData = error.response.data;

        handlePasswordChangeError(responseData);
      }
      throw error;
    }
  },
};

interface ErrorResponseData {
  old_password?: string | string[];
  new_password?: string | string[];
  detail?: string;
}

function handlePasswordChangeError(responseData: ErrorResponseData) {
  if (responseData?.old_password) {
    throw new Error(
      Array.isArray(responseData.old_password)
        ? responseData.old_password[0]
        : responseData.old_password,
    );
  }

  if (responseData?.new_password) {
    throw new Error(
      Array.isArray(responseData.new_password)
        ? responseData.new_password[0]
        : responseData.new_password,
    );
  }

  throw new Error(responseData?.detail ?? 'Erro ao trocar senha');
}
