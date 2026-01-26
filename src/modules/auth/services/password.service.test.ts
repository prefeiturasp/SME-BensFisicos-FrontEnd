import { describe, it, expect, vi, beforeEach } from 'vitest';
import { passwordService } from './password.service';
import { api } from '@/api/http';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';

vi.mock('@/api/http', () => ({
  api: {
    post: vi.fn(),
  },
}));

function createAxiosError(data: unknown) {
  const error = new AxiosError();
  error.response = {
    data,
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };
  return error;
}

describe('passwordService', () => {
  const mockApiPost = api.post as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requestReset', () => {
    const validEmail = { email: 'test@example.com' };

    it('deve chamar a API corretamente ao solicitar reset', async () => {
      mockApiPost.mockResolvedValueOnce({});
      await passwordService.requestReset(validEmail);
      expect(mockApiPost).toHaveBeenCalledWith('/auth/password-reset/', validEmail);
    });

    it('deve lançar erro genérico se a resposta não tiver detalhe (Erro de conexão)', async () => {
      const axiosError = new AxiosError();
      axiosError.response = undefined;

      mockApiPost.mockRejectedValueOnce(axiosError);

      await expect(passwordService.requestReset(validEmail)).rejects.toThrow(
        'Erro de conexão com o servidor.',
      );
    });

    it('deve lançar erro com mensagem do servidor se disponível', async () => {
      mockApiPost.mockRejectedValueOnce(createAxiosError({ detail: 'Usuário não encontrado' }));

      await expect(passwordService.requestReset(validEmail)).rejects.toThrow(
        'Usuário não encontrado',
      );
    });

    it('deve lançar erro padrão se detalhe não existir na resposta', async () => {
      mockApiPost.mockRejectedValueOnce(createAxiosError({}));

      await expect(passwordService.requestReset(validEmail)).rejects.toThrow(
        'Erro ao solicitar reset de senha',
      );
    });

    it('deve relançar erros que não são AxiosError', async () => {
      const error = new Error('Erro desconhecido');
      mockApiPost.mockRejectedValueOnce(error);
      await expect(passwordService.requestReset(validEmail)).rejects.toThrow('Erro desconhecido');
    });
  });

  describe('confirmReset', () => {
    const payload = {
      uidb64: 'uid',
      token: 'token',
      new_password: 'new',
      new_password_confirm: 'new',
    };

    it('deve chamar a API corretamente ao confirmar reset', async () => {
      mockApiPost.mockResolvedValueOnce({});
      await passwordService.confirmReset(payload);
      expect(mockApiPost).toHaveBeenCalledWith('/auth/password-reset-confirm/', payload);
    });

    it('deve lançar erro de conexão se não houver response', async () => {
      const axiosError = new AxiosError();
      mockApiPost.mockRejectedValueOnce(axiosError);
      await expect(passwordService.confirmReset(payload)).rejects.toThrow(
        'Erro de conexão com o servidor.',
      );
    });

    it('deve lançar erro com detalhe do servidor', async () => {
      mockApiPost.mockRejectedValueOnce(createAxiosError({ detail: 'Token inválido' }));
      await expect(passwordService.confirmReset(payload)).rejects.toThrow('Token inválido');
    });

    it('deve lançar erro padrão se detalhe ausente', async () => {
      mockApiPost.mockRejectedValueOnce(createAxiosError({}));
      await expect(passwordService.confirmReset(payload)).rejects.toThrow(
        'Erro ao redefinir senha. O link pode ter expirado.',
      );
    });
  });

  describe('changePassword', () => {
    const data = {
      old_password: 'old',
      new_password: 'new',
      new_password_confirm: 'new',
    };

    it('deve chamar a API corretamente ao trocar senha', async () => {
      mockApiPost.mockResolvedValueOnce({});
      await passwordService.changePassword(data);
      expect(mockApiPost).toHaveBeenCalledWith('/auth/password-change/', data);
    });

    it('deve tratar erro de conexão', async () => {
      const axiosError = new AxiosError();
      mockApiPost.mockRejectedValueOnce(axiosError);
      await expect(passwordService.changePassword(data)).rejects.toThrow(
        'Erro de conexão com o servidor.',
      );
    });

    it('deve tratar erro de old_password (array)', async () => {
      mockApiPost.mockRejectedValueOnce(
        createAxiosError({ old_password: ['Senha antiga incorreta'] }),
      );
      await expect(passwordService.changePassword(data)).rejects.toThrow('Senha antiga incorreta');
    });

    it('deve tratar erro de old_password (string)', async () => {
      mockApiPost.mockRejectedValueOnce(createAxiosError({ old_password: 'Senha incorreta' }));
      await expect(passwordService.changePassword(data)).rejects.toThrow('Senha incorreta');
    });

    it('deve tratar erro de new_password (array)', async () => {
      mockApiPost.mockRejectedValueOnce(createAxiosError({ new_password: ['Senha fraca'] }));
      await expect(passwordService.changePassword(data)).rejects.toThrow('Senha fraca');
    });

    it('deve lançar erro genérico ou detail se nenhum específico presente', async () => {
      mockApiPost.mockRejectedValueOnce(createAxiosError({ detail: 'Erro genérico' }));
      await expect(passwordService.changePassword(data)).rejects.toThrow('Erro genérico');
    });

    it('deve lançar mensagem de erro padrão se detail também ausente', async () => {
      mockApiPost.mockRejectedValueOnce(createAxiosError({}));
      await expect(passwordService.changePassword(data)).rejects.toThrow('Erro ao trocar senha');
    });
  });

  describe('firstAccessChangePassword', () => {
    const data = {
      new_password: 'new',
      new_password_confirm: 'new',
    };

    it('deve chamar a API corretamente no primeiro acesso', async () => {
      mockApiPost.mockResolvedValueOnce({});
      await passwordService.firstAccessChangePassword(data);
      expect(mockApiPost).toHaveBeenCalledWith('/auth/first-access-password-change/', data);
    });

    it('deve tratar erro de conexão', async () => {
      const axiosError = new AxiosError();
      mockApiPost.mockRejectedValueOnce(axiosError);
      await expect(passwordService.firstAccessChangePassword(data)).rejects.toThrow(
        'Erro de conexão com o servidor.',
      );
    });

    it('deve tratar erro de new_password (array)', async () => {
      mockApiPost.mockRejectedValueOnce(createAxiosError({ new_password: ['Senha fraca'] }));
      await expect(passwordService.firstAccessChangePassword(data)).rejects.toThrow('Senha fraca');
    });

    it('deve lançar erro genérico ou detail se nenhum específico presente', async () => {
      mockApiPost.mockRejectedValueOnce(createAxiosError({ detail: 'Erro genérico' }));
      await expect(passwordService.firstAccessChangePassword(data)).rejects.toThrow(
        'Erro genérico',
      );
    });

    it('deve lançar mensagem de erro padrão se detail também ausente', async () => {
      mockApiPost.mockRejectedValueOnce(createAxiosError({}));
      await expect(passwordService.firstAccessChangePassword(data)).rejects.toThrow(
        'Erro ao trocar senha',
      );
    });
  });
});
