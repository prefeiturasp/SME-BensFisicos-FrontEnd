import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Header } from './Header';
import { useAuth } from '@/auth/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/auth/useAuth');

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
    uo_ativa: {
      id: 1,
      codigo: '01.16.10',
      nome: 'SECRETARIA MUNICIPAL DE EDUCACAO',
      label: '01.16.10 - SECRETARIA MUNICIPAL DE EDUCACAO',
    },
    ua_ativa: {
      id: 10,
      codigo: '00.00.00.002',
      nome: 'Escola Municipal Teste',
      label: '00.00.00.002 - Escola Municipal Teste',
    },
    opcoes_escopo: {
      grupos: [
        {
          uo: {
            id: 1,
            codigo: '01.16.10',
            nome: 'SECRETARIA MUNICIPAL DE EDUCACAO',
            label: '01.16.10 - SECRETARIA MUNICIPAL DE EDUCACAO',
            selecionavel: true,
            unidade_administrativa_id: null,
            unidade_orcamentaria_id: 1,
          },
          uas: [
            {
              id: 10,
              codigo: '00.00.00.002',
              nome: 'Escola Municipal Teste',
              label: '00.00.00.002 - Escola Municipal Teste',
              unidade_administrativa_id: 10,
              unidade_orcamentaria_id: 1,
            },
          ],
        },
      ],
    },
  };

  const defaultAuthContext = {
    user: mockUser,
    logout: mockLogout,
    isAuthenticated: true,
    isLoading: false,
    mustChangePassword: false,
    login: vi.fn(),
    isLoggingIn: false,
    loginError: null,
    loginAsync: vi.fn(),
  };

  const renderWithProviders = (ui: React.ReactNode) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('deve renderizar o logo com link para home', () => {
    vi.mocked(useAuth).mockReturnValue(defaultAuthContext);

    renderWithProviders(<Header />);

    const logo = screen.getByAltText('Logo Bens Físicos');
    expect(logo).toBeInTheDocument();
    expect(logo.closest('a')).toHaveAttribute('href', '/home');
  });

  it('deve exibir as informações do usuário logado', () => {
    vi.mocked(useAuth).mockReturnValue(defaultAuthContext);

    renderWithProviders(<Header />);

    expect(screen.getByText('1234567')).toBeInTheDocument();
    expect(screen.getByText('JOÃO DA SILVA')).toBeInTheDocument();
  });

  it('deve exibir o cargo correto (Gestor)', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthContext,
      user: { ...mockUser, is_gestor_patrimonio: true },
    });

    renderWithProviders(<Header />);

    expect(screen.getByText('GESTOR')).toBeInTheDocument();
  });

  it('deve exibir o cargo correto (Operador)', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthContext,
      user: { ...mockUser, is_gestor_patrimonio: false },
    });

    renderWithProviders(<Header />);

    expect(screen.getByText('OPERADOR')).toBeInTheDocument();
  });

  it('deve chamar a função de logout ao clicar no botão sair', () => {
    vi.mocked(useAuth).mockReturnValue(defaultAuthContext);

    renderWithProviders(<Header />);

    const logoutButton = screen.getByText('Sair');
    fireEvent.click(logoutButton.closest('button')!);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('deve exibir a unidade administrativa do usuário no select', () => {
    vi.mocked(useAuth).mockReturnValue(defaultAuthContext);

    renderWithProviders(<Header />);

    expect(screen.getByText('00.00.00.002 - Escola Municipal Teste')).toBeInTheDocument();
  });

  it('deve exibir valores padrão quando dados do usuário estão ausentes', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthContext,
      user: {
        ...mockUser,
        rf: undefined as unknown as string,
        nome: undefined as unknown as string,
        opcoes_escopo: { grupos: [] },
        uo_ativa: null,
        ua_ativa: null,
      },
    });

    renderWithProviders(<Header />);

    expect(screen.getByText('00000000')).toBeInTheDocument();
    expect(screen.getByText('USUÁRIO DO SISTEMA')).toBeInTheDocument();
  });

  it('não deve exibir opção de unidade se usuário não tiver unidade vinculada', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthContext,
      user: {
        ...mockUser,
        opcoes_escopo: null,
        uo_ativa: null,
        ua_ativa: null,
      },
    });

    renderWithProviders(<Header />);

    expect(screen.queryByText('00.00.00.002 - Escola Municipal Teste')).not.toBeInTheDocument();
  });
});
