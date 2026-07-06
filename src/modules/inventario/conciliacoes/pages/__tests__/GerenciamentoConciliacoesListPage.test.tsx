import { fireEvent, render, screen } from '@testing-library/react';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GerenciamentoConciliacoesListPage from '../GerenciamentoConciliacoesListPage';

const navigateMock = vi.fn();

let authUser = {
  is_superuser: true,
  is_gestor_patrimonio: true,
  is_operador_inventario: true,
};

const conciliacoes = [
  {
    id: 7,
    numero_conciliacao: '001.0002/2026/005',
    unidade_administrativa: 7,
    unidade_administrativa_codigo: '00.00.00.002',
    unidade_administrativa_nome: 'COTIC',
    unidade_administrativa_sigla: 'COTIC',
    unidade_orcamentaria_codigo: '00.00.00',
    unidade_orcamentaria_nome: 'SME',
    tipo: 'eventual' as const,
    tipo_display: 'Eventual',
    periodo_final: '2026-02-27',
    status: 'em_aberto' as const,
    status_display: 'Aberta',
    total_itens: 11,
    resumo_situacoes: {
      encontrados: 1,
      nao_encontrados: 3,
      divergentes: 3,
      em_processo_baixa: 3,
      baixa_fisica: 1,
      encontrados_com_divergencia: 0,
    },
    ano_vigencia: 2026,
    criado_em: '2026-01-15T10:00:00Z',
    criado_por: 1,
    criado_por_nome: 'Teste',
    criado_por_rf: '1234567',
    fechado_em: null,
    fechado_por: null,
    fechado_por_nome: '',
    fechado_por_rf: '',
    esta_aberto: true,
  },
];

let listState = {
  conciliacoes,
  page: 1,
  count: 1,
  loading: false,
  fetching: false,
  error: null as unknown,
  searchInput: '',
  anoVigenciaInput: '',
  tipoFilter: 'todos' as const,
  statusFilter: 'todos' as const,
  setPage: vi.fn(),
  setOrdering: vi.fn(),
  setSearchInput: vi.fn(),
  setAnoVigenciaInput: vi.fn(),
  setTipoFilter: vi.fn(),
  setStatusFilter: vi.fn(),
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/auth/useAuth', () => ({
  useAuth: () => ({
    user: authUser,
  }),
}));

vi.mock('../../hooks/useConciliacoes', () => ({
  useConciliacoesList: () => listState,
  useConciliacaoCreate: () => ({ mutate: vi.fn(), mutateAsync: vi.fn() }),
}));

vi.mock('@/hooks/useUnidadesPagination', () => ({
  useUnidadesPagination: () => ({
    pages: [{ type: 'page', id: '1', value: 1 }],
    totalPages: 1,
  }),
}));

vi.mock('@/components/ui/select', () => {
  function Select({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value: string;
    onValueChange: (value: string) => void;
  }) {
    const childTestId = Children.toArray(children).find(
      (child): child is ReactElement<{ 'data-testid'?: string }> =>
        isValidElement(child) && 'data-testid' in (child.props as object),
    )?.props?.['data-testid'];

    return (
      <select
        data-testid={childTestId ?? `select-${value}`}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {children}
      </select>
    );
  }

  return {
    Select,
    SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
    SelectValue: () => null,
    SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
    SelectItem: ({ children, value }: { children: ReactNode; value: string }) => (
      <option value={value}>{children}</option>
    ),
  };
});

describe('GerenciamentoConciliacoesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authUser = {
      is_superuser: true,
      is_gestor_patrimonio: true,
      is_operador_inventario: true,
    };
    listState = {
      conciliacoes,
      page: 1,
      count: 1,
      loading: false,
      fetching: false,
      error: null,
      searchInput: '',
      anoVigenciaInput: '',
      tipoFilter: 'todos',
      statusFilter: 'todos',
      setPage: vi.fn(),
      setOrdering: vi.fn(),
      setSearchInput: vi.fn(),
      setAnoVigenciaInput: vi.fn(),
      setTipoFilter: vi.fn(),
      setStatusFilter: vi.fn(),
    };
  });

  it('renderiza breadcrumb, titulo, filtros e listagem', () => {
    render(
      <MemoryRouter>
        <GerenciamentoConciliacoesListPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Gerenciamento de Conciliações').length).toBeGreaterThan(0);
    expect(screen.getByText('Buscar Conciliação')).toBeInTheDocument();
    expect(screen.getByText('Filtrar por Tipo')).toBeInTheDocument();
    expect(screen.getByText('Filtrar por Status')).toBeInTheDocument();
    expect(screen.getByText('001.0002/2026/005')).toBeInTheDocument();
    expect(screen.getByText('00.00.00.002 - COTIC')).toBeInTheDocument();
    expect(screen.getByText('Até 27/02/2026')).toBeInTheDocument();
  });

  it('navega para a tela de adicionar conciliacao', () => {
    render(
      <MemoryRouter>
        <GerenciamentoConciliacoesListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Adicionar Conciliação/i }));

    expect(navigateMock).toHaveBeenCalledWith('/conciliacoes/novo');
  });

  it('navega para a home ao clicar em voltar', () => {
    render(
      <MemoryRouter>
        <GerenciamentoConciliacoesListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(navigateMock).toHaveBeenCalledWith('/home');
  });

  it('navega para o detalhe da conciliacao ao clicar em visualizar', () => {
    render(
      <MemoryRouter>
        <GerenciamentoConciliacoesListPage />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /Visualizar conciliação 001\.0002\/2026\/005/i,
      }),
    );

    expect(navigateMock).toHaveBeenCalledWith('/conciliacoes/7');
  });

  it('propaga alteracoes dos filtros para o hook', () => {
    render(
      <MemoryRouter>
        <GerenciamentoConciliacoesListPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByTestId('conciliacoes-search-input'), {
      target: { value: 'CONC' },
    });
    fireEvent.change(screen.getByTestId('conciliacoes-ano-select'), {
      target: { value: '2026' },
    });

    expect(listState.setSearchInput).toHaveBeenCalledWith('CONC');
    expect(listState.setAnoVigenciaInput).toHaveBeenCalledWith('2026');
  });

  it('ordena pela coluna selecionada e reseta para a pagina 1', () => {
    render(
      <MemoryRouter>
        <GerenciamentoConciliacoesListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Tipo/i }));

    expect(listState.setPage).toHaveBeenCalledWith(1);
    expect(listState.setOrdering).toHaveBeenCalledWith(expect.any(Function));
    const updateOrdering = listState.setOrdering.mock.calls[0][0] as (current: string) => string;
    expect(updateOrdering('-criado_em')).toBe('tipo');
    expect(updateOrdering('tipo')).toBe('-tipo');
  });

  it('bloqueia acesso para usuario sem perfil', () => {
    authUser = {
      is_superuser: false,
      is_gestor_patrimonio: false,
      is_operador_inventario: false,
    };

    render(
      <MemoryRouter>
        <GerenciamentoConciliacoesListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/não tem permissão/i)).toBeInTheDocument();
  });

  it('exibe estado de carregamento vindo do hook', () => {
    listState = {
      ...listState,
      loading: true,
      conciliacoes: [],
    };

    render(
      <MemoryRouter>
        <GerenciamentoConciliacoesListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Carregando concilia/i)).toBeInTheDocument();
  });
});
