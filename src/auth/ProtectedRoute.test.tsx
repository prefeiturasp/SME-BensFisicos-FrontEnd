import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from './useAuth';

vi.mock('./useAuth');

describe('ProtectedRoute', () => {
  it('deve mostrar loading enquanto carrega', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      mustChangePassword: false,
    } as unknown as ReturnType<typeof useAuth>);

    const { container } = render(
      <MemoryRouter>
        <ProtectedRoute />
      </MemoryRouter>,
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('deve redirecionar para login se não autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      mustChangePassword: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path='/home' element={<div>Home</div>} />
          </Route>
          <Route path='/' element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('deve permitir acessar rota protegida quando autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      mustChangePassword: false,
    } as unknown as ReturnType<typeof useAuth>);

    render(
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path='/home' element={<div>Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('deve redirecionar para primeiro acesso quando precisa trocar senha', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      mustChangePassword: true,
    } as unknown as ReturnType<typeof useAuth>);

    render(
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path='/home' element={<div>Home</div>} />
            <Route path='/primeiro-acesso' element={<div>Primeiro acesso</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Primeiro acesso')).toBeInTheDocument();
  });

  it('deve permitir acessar primeiro acesso quando mustChangePassword for true', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      mustChangePassword: true,
    } as unknown as ReturnType<typeof useAuth>);

    render(
      <MemoryRouter initialEntries={['/primeiro-acesso']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path='/primeiro-acesso' element={<div>Primeiro acesso</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Primeiro acesso')).toBeInTheDocument();
  });
});
