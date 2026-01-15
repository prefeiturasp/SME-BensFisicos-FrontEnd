import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { authService, type User } from './auth.service';
import { getAuthToken, setAuthToken } from '@/api/http';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('./auth.service');
vi.mock('@/api/http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/http')>();
  return {
    ...actual,
    getAuthToken: vi.fn(),
    setAuthToken: vi.fn(),
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar não autenticado se não houver token (e refresh falhar)', async () => {
    vi.mocked(getAuthToken).mockReturnValue(null);
    vi.mocked(authService.refreshToken).mockRejectedValue(new Error('No refresh'));

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('deve tentar restaurar sessão via refreshToken se token de memória estiver nulo', async () => {
    vi.mocked(getAuthToken).mockReturnValue(null);
    vi.mocked(authService.refreshToken).mockResolvedValue({ access: 'restored-token' });
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      data: { id: 1, nome: 'User' } as unknown as User,
    } as Awaited<ReturnType<typeof authService.getCurrentUser>>);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.user).toEqual({ id: 1, nome: 'User' }));

    expect(setAuthToken).toHaveBeenCalledWith('restored-token');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('deve carregar usuário se token já existir', async () => {
    vi.mocked(getAuthToken).mockReturnValue('existing-token');
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      data: { id: 2, nome: 'Logged' } as unknown as User,
    } as Awaited<ReturnType<typeof authService.getCurrentUser>>);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.user).toBeDefined());
    expect(result.current.user?.nome).toBe('Logged');
    expect(authService.refreshToken).not.toHaveBeenCalled();
  });

  it('deve realizar login com sucesso', async () => {
    const mockWrapper = createWrapper();
    const { result } = renderHook(() => useAuth(), { wrapper: mockWrapper });

    const mockLoginResponse = {
      access: 'new-login-token',
      user: { id: 10, nome: 'New User' } as unknown as User,
    };
    vi.mocked(authService.login).mockResolvedValue(mockLoginResponse);

    await act(async () => {
      result.current.login({ username: 'u', password: 'p' });
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(setAuthToken).toHaveBeenCalledWith('new-login-token');
  });

  it('deve realizar logout', async () => {
    vi.mocked(getAuthToken).mockReturnValue('token');
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      data: { id: 1 } as unknown as User,
    } as Awaited<ReturnType<typeof authService.getCurrentUser>>);

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    expect(authService.logout).toHaveBeenCalled();
    expect(setAuthToken).toHaveBeenCalledWith(null);
  });
});
