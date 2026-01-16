import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Header } from './Header';
import { useAuth } from '@/auth/useAuth';
import type { UnidadeAdministrativa } from '@/auth/auth.service';

vi.mock('@/auth/useAuth');

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='select'>{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <button data-testid='select-trigger'>{children}</button>
  ),
  SelectValue: ({ placeholder }: { placeholder: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='select-content'>{children}</div>
  ),
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`select-item-${value}`}>{children}</div>
  ),
}));

vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: ({ className }: { className: string }) => (
    <button data-testid='sidebar-trigger' className={className}>
      Menu
    </button>
  ),
}));

describe('Header', () => {
  const mockLogout = vi.fn();
  const mockUser = {
    id: 1,
    username: 'test',
    nome: 'João da Silva',
    email: 'joao@example.com',
    rf: '1234567',
    is_gestor_patrimonio: true,
    is_operador_inventario: false,
    must_change_password: false,
    unidade_administrativa: { id: 10, nome: 'Escola Municipal Teste' },
  };

  const defaultAuthContext = {
    user: mockUser,
    logout: mockLogout,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    isLoggingIn: false,
    loginError: null,
    loginAsync: vi.fn(),
  };

  it('deve renderizar o logo com link para home', () => {
    vi.mocked(useAuth).mockReturnValue(defaultAuthContext);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const logo = screen.getByAltText('Logo Bens Físicos');
    expect(logo).toBeInTheDocument();
    expect(logo.closest('a')).toHaveAttribute('href', '/home');
  });

  it('deve exibir as informações do usuário logado', () => {
    vi.mocked(useAuth).mockReturnValue(defaultAuthContext);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText('1234567')).toBeInTheDocument();
    expect(screen.getByText('JOÃO DA SILVA')).toBeInTheDocument();
  });

  it('deve exibir o cargo correto (Gestor)', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthContext,
      user: { ...mockUser, is_gestor_patrimonio: true },
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText('GESTOR')).toBeInTheDocument();
  });

  it('deve exibir o cargo correto (Operador)', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthContext,
      user: { ...mockUser, is_gestor_patrimonio: false },
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText('OPERADOR')).toBeInTheDocument();
  });

  it('deve chamar a função de logout ao clicar no botão sair', () => {
    vi.mocked(useAuth).mockReturnValue(defaultAuthContext);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const logoutButton = screen.getByText('Sair');
    fireEvent.click(logoutButton.closest('button')!);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('deve exibir a unidade administrativa do usuário no select', () => {
    vi.mocked(useAuth).mockReturnValue(defaultAuthContext);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText('Escola Municipal Teste')).toBeInTheDocument();
  });

  it('deve exibir valores padrão quando dados do usuário estão ausentes', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthContext,
      user: {
        ...mockUser,
        rf: undefined as unknown as string,
        nome: undefined as unknown as string,
        unidade_administrativa: undefined as unknown as UnidadeAdministrativa,
      },
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByText('00000000')).toBeInTheDocument();
    expect(screen.getByText('USUÁRIO DO SISTEMA')).toBeInTheDocument();
  });

  it('não deve exibir opção de unidade se usuário não tiver unidade vinculada', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthContext,
      user: {
        ...mockUser,
        unidade_administrativa: null as unknown as UnidadeAdministrativa,
      },
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Escola Municipal Teste')).not.toBeInTheDocument();
  });
});
