import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ParametrosConciliacaoAnualListPage from '../ParametrosConciliacaoAnualListPage';

const navigateMock = vi.fn();
const dismissMock = vi.fn();
const setPageMock = vi.fn();
const setOrderingMock = vi.fn();
const setAnoInputMock = vi.fn();
const setStatusFilterMock = vi.fn();
let authUser = {
  is_superuser: true,
  is_gestor_patrimonio: true,
};

const listState = {
  parametros: [
    {
      id: 7,
      unidade_orcamentaria: 9,
      unidade_orcamentaria_codigo: '01.16.10',
      unidade_orcamentaria_nome: 'SECRETARIA MUNICIPAL DE EDUCACAO',
      unidade_orcamentaria_sigla: 'SME',
      ano_referencia: 2026,
      periodo_inicial: '2026-04-01',
      periodo_final: '2026-04-30',
      ativo: true,
      esta_vigente: true,
    },
  ],
  page: 1,
  count: 1,
  loading: false,
  fetching: false,
  anoInput: '',
  statusFilter: 'todos' as const,
  setPage: setPageMock,
  setOrdering: setOrderingMock,
  setAnoInput: setAnoInputMock,
  setStatusFilter: setStatusFilterMock,
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('sonner', () => ({
  toast: {
    dismiss: (...args: unknown[]) => dismissMock(...args),
  },
}));

vi.mock('../../hooks/useParametrosConciliacaoAnual', () => ({
  useParametrosConciliacaoAnualList: () => listState,
}));

vi.mock('@/auth/useAuth', () => ({
  useAuth: () => ({
    user: authUser,
  }),
}));

vi.mock('@/hooks/useUnidadesPagination', () => ({
  useUnidadesPagination: () => ({
    pages: [{ type: 'page', id: '1', value: 1 }],
    totalPages: 1,
  }),
}));

describe('ParametrosConciliacaoAnualListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authUser = {
      is_superuser: true,
      is_gestor_patrimonio: true,
    };
  });

  it('renderiza filtros, listagem e navega para cadastro', () => {
    render(
      <MemoryRouter>
        <ParametrosConciliacaoAnualListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Cadastrados/i)).toBeInTheDocument();
    expect(screen.getByText(/01.16.10 - SECRETARIA MUNICIPAL DE EDUCACAO/)).toBeInTheDocument();
    expect(screen.getByText('2026')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Adicionar/i }));

    expect(dismissMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/parametros-conciliacao-anual/novo');
  });

  it('aplica filtros e abre o detalhe do parametro', () => {
    render(
      <MemoryRouter>
        <ParametrosConciliacaoAnualListPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole('textbox', { name: /Ano/i }), {
      target: { value: '2026' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Visualizar par.metro 2026/i }));

    expect(setAnoInputMock).toHaveBeenCalledWith('2026');
    expect(navigateMock).toHaveBeenCalledWith('/parametros-conciliacao-anual/7');
  });

  it('ordena pela coluna selecionada', () => {
    render(
      <MemoryRouter>
        <ParametrosConciliacaoAnualListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Ano de refer.ncia/i }));

    expect(setPageMock).toHaveBeenCalledWith(1);
    expect(setOrderingMock).toHaveBeenCalledWith(expect.any(Function));
    const updateOrdering = setOrderingMock.mock.calls[0][0] as (current: string) => string;
    expect(updateOrdering('-ano_referencia')).toBe('ano_referencia');
    expect(updateOrdering('ativo')).toBe('ano_referencia');
  });

  it('bloqueia acesso ao modulo para operador', () => {
    authUser = {
      is_superuser: false,
      is_gestor_patrimonio: false,
    };

    render(
      <MemoryRouter>
        <ParametrosConciliacaoAnualListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/não tem permissão/i)).toBeInTheDocument();
  });
});
