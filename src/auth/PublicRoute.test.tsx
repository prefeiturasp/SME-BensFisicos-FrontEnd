import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAuth } from './useAuth';
import { PublicRoute } from './PublicRoute';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('./useAuth');

describe('PublicRoute', () => {
  it('deve renderizar o conteúdo (outlet) se não estiver autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path='/login' element={<div>Página de Login</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Página de Login')).toBeInTheDocument();
  });

  it('deve mostrar loading se estiver verificando autenticação', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    } as unknown as ReturnType<typeof useAuth>);

    const { container } = render(
      <MemoryRouter>
        <PublicRoute />
      </MemoryRouter>,
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('deve redirecionar para /home se estiver autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path='/login' element={<div>Login Page</div>} />
          </Route>
          <Route path='/home' element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
