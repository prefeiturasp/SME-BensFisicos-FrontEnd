import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AppRoutes from './AppRoutes';
import { useAuth } from '../auth/useAuth';

vi.mock('../auth/useAuth');

vi.mock('@/modules/auth/pages/LoginPage', () => ({
  default: () => <div data-testid='login-page'>Login Page</div>,
}));
vi.mock('@/modules/auth/pages/ForgotPasswordPage', () => ({
  default: () => <div data-testid='forgot-password'>Forgot Password</div>,
}));
vi.mock('@/modules/auth/pages/VerifyEmailPage', () => ({ default: () => <div>Verify Email</div> }));
vi.mock('@/modules/auth/pages/ResetPasswordPage', () => ({
  default: () => <div>Reset Password</div>,
}));
vi.mock('@/modules/auth/pages/ChangePasswordPage', () => ({
  default: () => <div>Change Password</div>,
}));
vi.mock('@/modules/auth/pages/FirstAccessChangePasswordPage', () => ({
  default: () => <div data-testid='first-access'>First Access</div>,
}));
vi.mock('../pages/HomePage', () => ({
  default: () => <div data-testid='home-page'>Home Page</div>,
}));

vi.mock('@/components/layout/MainLayout', () => ({
  default: () => (
    <div data-testid='main-layout'>
      Main Layout Wrapper <Outlet />
    </div>
  ),
}));

vi.mock('@/modules/bem-patrimonial/bem/pages/BensListPage', () => ({
  default: () => <div data-testid='bens-list'>Bens List</div>,
}));
vi.mock('@/modules/bem-patrimonial/bem/pages/BemCreatePage', () => ({
  default: () => <div data-testid='bem-create'>Bem Create</div>,
}));
vi.mock('@/modules/bem-patrimonial/movimentacao/pages/MovimentacoesListPage', () => ({
  default: () => <div data-testid='movimentacoes-list'>Movimentacoes List</div>,
}));
vi.mock('@/modules/bem-patrimonial/movimentacao/pages/AdicionarMovimentacaoPage', () => ({
  default: () => <div data-testid='movimentacao-create'>Movimentacao Create</div>,
}));
vi.mock('@/modules/bem-patrimonial/baixa-fisica/pages/BaixasListPage', () => ({
  default: () => <div data-testid='baixas-list'>Baixas List</div>,
}));
vi.mock('@/modules/inventario/pages/InventarioListPage', () => ({
  default: () => <div data-testid='inventario-list'>Inventario List</div>,
}));
vi.mock(
  '@/modules/configuracoes/unidades-administrativas/pages/UnidadesAdministrativasListPage',
  () => ({
    default: () => (
      <div data-testid='unidades-administrativas-list'>Unidades Administrativas List</div>
    ),
  }),
);
vi.mock(
  '@/modules/configuracoes/unidades-administrativas/pages/UnidadesAdministrativasCreatePage',
  () => ({
    default: () => (
      <div data-testid='unidades-administrativas-create'>Unidades Administrativas Create</div>
    ),
  }),
);
vi.mock(
  '@/modules/configuracoes/unidades-administrativas/pages/UnidadesAdministrativasViewPage',
  () => ({
    default: () => <div data-testid='unidades-administrativas-view'>Unidades Administrativas View</div>,
  }),
);
vi.mock('@/modules/configuracoes/unidades-orcamentarias/pages/UnidadesOrcamentariasListPage', () => ({
  default: () => <div data-testid='unidades-orcamentarias-list'>Unidades Orçamentárias List</div>,
}));
vi.mock(
  '@/modules/configuracoes/unidades-orcamentarias/pages/UnidadesOrcamentariasCreatePage',
  () => ({
    default: () => <div data-testid='unidades-orcamentarias-create'>Unidades Orçamentárias Create</div>,
  }),
);
vi.mock('@/modules/configuracoes/unidades-orcamentarias/pages/UnidadesOrcamentariasViewPage', () => ({
  default: () => <div data-testid='unidades-orcamentarias-view'>Unidades Orçamentárias View</div>,
}));

describe('AppRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar a página de login para a rota raiz se não autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      loginError: null,
      loginAsync: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('deve redirecionar para /home se tentar acessar login e já estiver autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      mustChangePassword: false,
      user: {
        id: 1,
        username: 'test',
        nome: 'Test User',
        email: 'test@example.com',
        rf: '1234567',
        is_gestor_patrimonio: false,
        is_operador_inventario: true,
        must_change_password: false,
        uo_ativa: null,
        ua_ativa: null,
        opcoes_escopo: { grupos: [] },
      },
      login: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      loginError: null,
      loginAsync: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('deve permitir acesso a rotas protegidas se autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      mustChangePassword: false,
      user: {
        id: 1,
        username: 'test',
        nome: 'Test User',
        email: 'test@example.com',
        rf: '1234567',
        is_gestor_patrimonio: false,
        is_operador_inventario: true,
        must_change_password: false,
        uo_ativa: null,
        ua_ativa: null,
        opcoes_escopo: { grupos: [] },
      },
      login: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      loginError: null,
      loginAsync: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('deve redirecionar para login se tentar acessar rota protegida sem autenticação', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      loginError: null,
      loginAsync: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('deve renderizar loading quando estiver verificando autenticação', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      loginError: null,
      loginAsync: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('deve redirecionar para rota inexistente para login ou home', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      mustChangePassword: false,
      login: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      loginError: null,
      loginAsync: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/rota-que-nao-existe']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  describe('Rotas de Módulos (Protegidas)', () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        mustChangePassword: false,
        user: {
          id: 1,
          username: 'test',
          nome: 'Test',
          email: 'test@example.com',
          rf: '123',
          is_gestor_patrimonio: true,
          is_operador_inventario: true,
          must_change_password: false,
          uo_ativa: null,
          ua_ativa: null,
          opcoes_escopo: { grupos: [] },
        },
        login: vi.fn(),
        logout: vi.fn(),
        isLoggingIn: false,
        loginError: null,
        loginAsync: vi.fn(),
      });
    });

    it('deve navegar para lista de bens', () => {
      render(
        <MemoryRouter initialEntries={['/bens-patrimoniais']}>
          <AppRoutes />
        </MemoryRouter>,
      );
      expect(screen.getByTestId('bens-list')).toBeInTheDocument();
    });

    it('deve navegar para criação de bem', () => {
      render(
        <MemoryRouter initialEntries={['/bens-patrimoniais/novo']}>
          <AppRoutes />
        </MemoryRouter>,
      );
      expect(screen.getByTestId('bem-create')).toBeInTheDocument();
    });

    it('deve navegar para movimentações', () => {
      render(
        <MemoryRouter initialEntries={['/movimentacoes']}>
          <AppRoutes />
        </MemoryRouter>,
      );
      expect(screen.getByTestId('movimentacoes-list')).toBeInTheDocument();
    });

    it('deve navegar para cadastro de movimentação', () => {
      render(
        <MemoryRouter initialEntries={['/movimentacoes/novo']}>
          <AppRoutes />
        </MemoryRouter>,
      );
      expect(screen.getByTestId('movimentacao-create')).toBeInTheDocument();
    });

    it('deve navegar para baixas', () => {
      render(
        <MemoryRouter initialEntries={['/baixas-fisicas']}>
          <AppRoutes />
        </MemoryRouter>,
      );
      expect(screen.getByTestId('baixas-list')).toBeInTheDocument();
    });

    it('deve navegar para inventários', () => {
      render(
        <MemoryRouter initialEntries={['/inventarios']}>
          <AppRoutes />
        </MemoryRouter>,
      );
      expect(screen.getByTestId('inventario-list')).toBeInTheDocument();
    });

    it('deve navegar para unidades administrativas', () => {
      render(
        <MemoryRouter initialEntries={['/unidades-administrativas']}>
          <AppRoutes />
        </MemoryRouter>,
      );
      expect(screen.getByTestId('unidades-administrativas-list')).toBeInTheDocument();
    });

    it('deve navegar para cadastro de unidade administrativa', () => {
      render(
        <MemoryRouter initialEntries={['/unidades-administrativas/novo']}>
          <AppRoutes />
        </MemoryRouter>,
      );
      expect(screen.getByTestId('unidades-administrativas-create')).toBeInTheDocument();
    });

    it('deve navegar para visualização de unidade administrativa', () => {
      render(
        <MemoryRouter initialEntries={['/unidades-administrativas/10']}>
          <AppRoutes />
        </MemoryRouter>,
      );
      expect(screen.getByTestId('unidades-administrativas-view')).toBeInTheDocument();
    });

    it('deve navegar para lista de unidades orçamentárias', () => {
      render(
        <MemoryRouter initialEntries={['/unidades-orcamentarias']}>
          <AppRoutes />
        </MemoryRouter>,
      );
      expect(screen.getByTestId('unidades-orcamentarias-list')).toBeInTheDocument();
    });

    it('deve navegar para cadastro de unidade orçamentária', () => {
      render(
        <MemoryRouter initialEntries={['/unidades-orcamentarias/novo']}>
          <AppRoutes />
        </MemoryRouter>,
      );
      expect(screen.getByTestId('unidades-orcamentarias-create')).toBeInTheDocument();
    });

    it('deve navegar para visualização de unidade orçamentária', () => {
      render(
        <MemoryRouter initialEntries={['/unidades-orcamentarias/10']}>
          <AppRoutes />
        </MemoryRouter>,
      );
      expect(screen.getByTestId('unidades-orcamentarias-view')).toBeInTheDocument();
    });
  });

  it('deve redirecionar para primeiro acesso quando must_change_password for true', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      mustChangePassword: true,
      user: {
        id: 1,
        username: 'test',
        nome: 'Test User',
        email: 'test@example.com',
        rf: '1234567',
        is_gestor_patrimonio: false,
        is_operador_inventario: true,
        must_change_password: true,
        uo_ativa: null,
        ua_ativa: null,
        opcoes_escopo: { grupos: [] },
      },
      login: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      loginError: null,
      loginAsync: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/home']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('first-access')).toBeInTheDocument();
  });
});
