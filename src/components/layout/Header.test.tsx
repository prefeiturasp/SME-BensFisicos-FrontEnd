import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Header } from './Header';
import { useAuth } from '@/auth/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEscopoSelector } from './useEscopoSelector';

vi.mock('@/auth/useAuth');
vi.mock('./useEscopoSelector');

vi.mock('@/components/ui/sidebar', () => ({
  SidebarTrigger: ({ className }: { className: string }) => (
    <button data-testid='sidebar-trigger' className={className}>
      Menu
    </button>
  ),
}));

describe('Header', () => {
  const asEscopoState = (state: unknown) =>
    state as unknown as ReturnType<typeof useEscopoSelector>;

  const mockLogout = vi.fn();
  const mockSetFilter = vi.fn();
  const mockSelectEscopoByValue = vi.fn();
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

  const mockEscopoState = {
    grupos: mockUser.opcoes_escopo.grupos,
    filter: '',
    setFilter: mockSetFilter,
    selectedValue: 'ua:10',
    selectedLabel: '00.00.00.002 - Escola Municipal Teste',
    filteredGroups: mockUser.opcoes_escopo.grupos,
    isGroupExpanded: () => true,
    updateGroupExpanded: vi.fn(),
    selectEscopoByValue: mockSelectEscopoByValue,
    selecionarEscopoMutation: { isPending: false } as unknown,
  };

  const setupMocks = () => {
    vi.mocked(useAuth).mockReturnValue(defaultAuthContext);
    vi.mocked(useEscopoSelector).mockReturnValue(asEscopoState(mockEscopoState));
  };

  it('deve renderizar o logo com link para home', () => {
    setupMocks();

    renderWithProviders(<Header />);

    const logo = screen.getByAltText('Logo Bens Físicos');
    expect(logo).toBeInTheDocument();
    expect(logo.closest('a')).toHaveAttribute('href', '/home');
  });

  it('deve exibir as informações do usuário logado', () => {
    setupMocks();

    renderWithProviders(<Header />);

    expect(screen.getByText('1234567')).toBeInTheDocument();
    expect(screen.getByText('JOÃO DA SILVA')).toBeInTheDocument();
  });

  it('deve exibir o cargo correto (Gestor)', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthContext,
      user: { ...mockUser, is_gestor_patrimonio: true },
    });
    vi.mocked(useEscopoSelector).mockReturnValue(asEscopoState(mockEscopoState));

    renderWithProviders(<Header />);

    expect(screen.getByText('GESTOR')).toBeInTheDocument();
  });

  it('deve exibir o cargo correto (Superuser)', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthContext,
      user: { ...mockUser, is_superuser: true, is_gestor_patrimonio: false },
    });
    vi.mocked(useEscopoSelector).mockReturnValue(asEscopoState(mockEscopoState));

    renderWithProviders(<Header />);

    expect(screen.getByText('SUPER-ADMIN')).toBeInTheDocument();
  });

  it('deve exibir o cargo correto (Operador)', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...defaultAuthContext,
      user: { ...mockUser, is_gestor_patrimonio: false },
    });
    vi.mocked(useEscopoSelector).mockReturnValue(asEscopoState(mockEscopoState));

    renderWithProviders(<Header />);

    expect(screen.getByText('OPERADOR')).toBeInTheDocument();
  });

  it('deve chamar a função de logout ao clicar no botão sair', () => {
    setupMocks();

    renderWithProviders(<Header />);

    const logoutButton = screen.getByText('Sair');
    fireEvent.click(logoutButton.closest('button')!);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('deve exibir a unidade administrativa do usuário no select', () => {
    setupMocks();

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
    vi.mocked(useEscopoSelector).mockReturnValue(
      asEscopoState({
        ...mockEscopoState,
        grupos: [],
        filteredGroups: [],
        selectedLabel: 'Selecione a unidade',
      }),
    );

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
    vi.mocked(useEscopoSelector).mockReturnValue(
      asEscopoState({
        ...mockEscopoState,
        grupos: [],
        filteredGroups: [],
        selectedLabel: 'Selecione a unidade',
      }),
    );

    renderWithProviders(<Header />);

    expect(screen.queryByText('00.00.00.002 - Escola Municipal Teste')).not.toBeInTheDocument();
  });

  it('deve abrir e fechar dropdown ao clicar no toggle e pressionar Escape', () => {
    setupMocks();
    mockSelectEscopoByValue.mockReturnValue(false);

    renderWithProviders(<Header />);

    const toggle = screen.getByTestId('escopo-toggle');
    fireEvent.click(toggle);
    expect(screen.getByTestId('escopo-dropdown')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('escopo-dropdown')).not.toBeInTheDocument();
  });

  it('deve fechar dropdown ao clicar fora', () => {
    setupMocks();

    renderWithProviders(<Header />);

    const toggle = screen.getByTestId('escopo-toggle');
    fireEvent.click(toggle);
    expect(screen.getByTestId('escopo-dropdown')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('escopo-dropdown')).not.toBeInTheDocument();
  });

  it('deve chamar seleção e limpar filtro ao selecionar item', () => {
    setupMocks();
    mockSelectEscopoByValue.mockReturnValue(true);

    renderWithProviders(<Header />);

    fireEvent.click(screen.getByTestId('escopo-toggle'));
    fireEvent.click(screen.getByText('01.16.10 - SECRETARIA MUNICIPAL DE EDUCACAO'));

    expect(mockSelectEscopoByValue).toHaveBeenCalledWith('uo:1');
    expect(mockSetFilter).toHaveBeenCalledWith('');
  });
});
