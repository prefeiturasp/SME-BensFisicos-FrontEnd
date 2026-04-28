import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '@/auth/useAuth';
import { UnidadesOrcamentariasGuard } from '../UnidadesOrcamentariasGuard';

vi.mock('@/auth/useAuth');

describe('UnidadesOrcamentariasGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza loading enquanto carrega permissões', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: true,
      user: null,
      isAuthenticated: false,
      mustChangePassword: false,
      login: vi.fn(),
      loginAsync: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      loginError: null,
    });

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasGuard>
          <div>Conteúdo</div>
        </UnidadesOrcamentariasGuard>
      </MemoryRouter>,
    );

    expect(screen.getByText('Carregando permissões do módulo...')).toBeInTheDocument();
  });

  it('redireciona para home quando usuário não é superuser', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      user: { is_superuser: false },
      isAuthenticated: true,
      mustChangePassword: false,
      login: vi.fn(),
      loginAsync: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      loginError: null,
    } as never);

    render(
      <MemoryRouter initialEntries={['/uo']}>
        <Routes>
          <Route
            path='/uo'
            element={
              <UnidadesOrcamentariasGuard>
                <div>Conteúdo</div>
              </UnidadesOrcamentariasGuard>
            }
          />
          <Route path='/home' element={<div>Página inicial</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Página inicial')).toBeInTheDocument();
  });

  it('renderiza conteúdo quando usuário é superuser', () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      user: { is_superuser: true },
      isAuthenticated: true,
      mustChangePassword: false,
      login: vi.fn(),
      loginAsync: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      loginError: null,
    } as never);

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasGuard>
          <div>Conteúdo liberado</div>
        </UnidadesOrcamentariasGuard>
      </MemoryRouter>,
    );

    expect(screen.getByText('Conteúdo liberado')).toBeInTheDocument();
  });
});