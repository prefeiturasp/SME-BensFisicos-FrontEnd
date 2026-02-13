import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService, type LoginCredentials } from './auth.service';
import { api } from '@/api/http';

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('authService', () => {
  const mockApiPost = api.post as unknown as ReturnType<typeof vi.fn>;
  const mockApiGet = api.get as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('deve fazer post para /auth/login/ e retornar dados', async () => {
      const credentials: LoginCredentials = { username: 'user', password: '123' };
      const mockResponse = { access: 'token', user: { id: 1 } };
      mockApiPost.mockResolvedValueOnce({ data: mockResponse });

      const result = await authService.login(credentials);

      expect(mockApiPost).toHaveBeenCalledWith('/auth/login/', credentials);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('deve fazer post para /auth/logout/', async () => {
      mockApiPost.mockResolvedValueOnce({});
      await authService.logout();
      expect(mockApiPost).toHaveBeenCalledWith('/auth/logout/');
    });

    it('deve capturar e logar erro silenciosamente', async () => {
      const spyConsole = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockApiPost.mockRejectedValueOnce(new Error('Falha logout'));

      await authService.logout();

      expect(spyConsole).toHaveBeenCalledWith('Erro ao notificar logout', expect.any(Error));
      spyConsole.mockRestore();
    });
  });

  describe('getCurrentUser', () => {
    it('deve fazer get para /auth/me/ e retornar response', async () => {
      const mockUser = { id: 1, username: 'test' };
      mockApiGet.mockResolvedValueOnce({ data: mockUser });

      const response = await authService.getCurrentUser();
      expect(mockApiGet).toHaveBeenCalledWith('/auth/me/');
      expect(response).toEqual({ data: mockUser });
    });
  });

  describe('refreshToken', () => {
    it('deve fazer post para /auth/token/refresh/ e retornar tokens', async () => {
      const mockTokens = { access: 'new_token' };
      mockApiPost.mockResolvedValueOnce({ data: mockTokens });

      const result = await authService.refreshToken();

      expect(mockApiPost).toHaveBeenCalledWith('/auth/token/refresh/');
      expect(result).toEqual(mockTokens);
    });
  });

  describe('selecionarEscopo', () => {
    it('deve fazer post para /auth/me/selecionar-ua/ com payload', async () => {
      const payload = { unidade_administrativa_id: 129 };
      const mockResponse = { ok: true };
      mockApiPost.mockResolvedValueOnce({ data: mockResponse });

      const result = await authService.selecionarEscopo(payload);

      expect(mockApiPost).toHaveBeenCalledWith('/auth/me/selecionar-ua/', payload);
      expect(result).toEqual({ data: mockResponse });
    });
  });
});
