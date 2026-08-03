import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UnidadesOrcamentariasListPage from '../UnidadesOrcamentariasListPage';

const navigateMock = vi.fn();
const exportarMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

const createObjectURLMock = vi.fn(() => 'blob:uo-download-url');
const revokeObjectURLMock = vi.fn();

const appendChildMock = vi.spyOn(document.body, 'appendChild');

const clickMock = vi.fn();
const removeMock = vi.fn();
const originalCreateElement = document.createElement.bind(document);

vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
  if (tagName === 'a') {
    const anchor = originalCreateElement('a');
    anchor.click = clickMock;
    anchor.remove = removeMock;
    return anchor;
  }

  return originalCreateElement(tagName);
}) as typeof document.createElement);

const setPageMock = vi.fn();
const setOrderingMock = vi.fn();
const setCodigoInputMock = vi.fn();
const setNomeOuSiglaInputMock = vi.fn();
const setStatusFilterMock = vi.fn();

const hookState = {
  unidades: [
    {
      id: 1,
      codigo: '10.10.10',
      sigla: 'UO1',
      nome: 'Unidade Orçamentária 1',
      sigla_orgao: 'SME',
      orgao: 'Secretaria Municipal de Educacao',
      codigo_orgao: '10.10',
      ativa: true,
      ativa_display: 'Ativa',
    },
  ],
  page: 1,
  count: 1,
  loading: false,
  fetching: false,
  ordering: 'codigo',
  codigoInput: '',
  nomeOuSiglaInput: '',
  codigoFiltro: '10.10',
  nomeOuSiglaFiltro: 'UO1',
  statusFilter: 'todos' as const,
  setPage: setPageMock,
  setOrdering: setOrderingMock,
  setCodigoInput: setCodigoInputMock,
  setNomeOuSiglaInput: setNomeOuSiglaInputMock,
  setStatusFilter: setStatusFilterMock,
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
    isLoading: false,
    user: {
      is_superuser: true,
    },
  }),
}));

vi.mock('../../services/unidades-orcamentarias.service', () => ({
  unidadesOrcamentariasService: {
    exportar: (...args: unknown[]) => exportarMock(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock('../../hooks/useUnidadeOrcamentariaList', () => ({
  useUnidadeOrcamentariaList: () => hookState,
}));

vi.mock('../../hooks/usePagination', () => ({
  usePagination: () => ({
    pages: [{ type: 'page', value: 1, id: 'page-1' }],
    totalPages: 1,
  }),
}));

describe('UnidadesOrcamentariasListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState.loading = false;
    hookState.fetching = false;
    hookState.unidades = [
      {
        id: 1,
        codigo: '10.10.10',
        sigla: 'UO1',
        nome: 'Unidade Orçamentária 1',
        sigla_orgao: 'SME',
        orgao: 'Secretaria Municipal de Educacao',
        codigo_orgao: '10.10',
        ativa: true,
        ativa_display: 'Ativa',
      },
    ];
    Object.defineProperty(window, 'URL', {
      value: {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      },
      writable: true,
    });
  });

  it('exibe ações e dados da listagem', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Adicionar Unidade Orçamentária')).toBeInTheDocument();
    expect(screen.getByText('Relatório')).toBeInTheDocument();
    expect(screen.getByText('Unidade Orçamentária 1')).toBeInTheDocument();
    expect(screen.getByText('10.10')).toBeInTheDocument();
    expect(screen.getByText('Secretaria Municipal de Educacao')).toBeInTheDocument();
  });

  it('navega para detalhe ao clicar em visualizar', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('Visualizar unidade orçamentária Unidade Orçamentária 1'));

    expect(navigateMock).toHaveBeenCalledWith('/unidades-orcamentarias/1');
  });

  it('navega para tela de nova unidade ao clicar em Adicionar Unidade Orçamentária', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Unidade Orçamentária' }));

    expect(navigateMock).toHaveBeenCalledWith('/unidades-orcamentarias/novo');
  });

  it('volta para rota anterior ao clicar em Voltar', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(navigateMock).toHaveBeenCalledWith(-1);
  });

  it('dispara ordenação ao clicar no cabeçalho da tabela', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Código do Órgão' }));

    expect(setPageMock).toHaveBeenCalledWith(1);
    expect(setOrderingMock).toHaveBeenCalled();
  });

  it('aplica ciclo de ordenação asc, desc e asc novamente para os novos campos', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sigla do Órgão' }));

    const sortUpdater = setOrderingMock.mock.calls[0][0] as (current: string) => string;

    expect(sortUpdater('nome')).toBe('sigla_orgao');
    expect(sortUpdater('sigla_orgao')).toBe('-sigla_orgao');
    expect(sortUpdater('-sigla_orgao')).toBe('sigla_orgao');
  });

  it('mantém tabela em loading quando query ainda está buscando', () => {
    hookState.unidades = [];
    hookState.fetching = true;

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Carregando unidades orçamentárias...')).toBeInTheDocument();
  });

  it('exporta relatório ao clicar em Relatório', async () => {
    exportarMock.mockResolvedValueOnce({
      blob: new Blob(['xlsx-content']),
      fileName: 'unidades-orcamentarias.xlsx',
    });

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Relatório' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Exportar XLSX' }));

    await waitFor(() => {
      expect(exportarMock).toHaveBeenCalledWith('xlsx', {
        codigo: '10.10',
        nomeOuSigla: 'UO1',
        ativa: 'todos',
        ordering: 'codigo',
      });
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(appendChildMock).toHaveBeenCalled();
      expect(clickMock).toHaveBeenCalled();
      expect(removeMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:uo-download-url');
      expect(toastSuccessMock).toHaveBeenCalledWith('Relatório exportado com sucesso.');
    });
  });

  it('exibe erro quando a exportação falha', async () => {
    exportarMock.mockRejectedValueOnce(new Error('Falha ao exportar UOs'));

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Relatório' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Exportar PDF' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Falha ao exportar UOs');
    });
  });

  it('usa mensagem padrão quando a exportação falha com valor não Error', async () => {
    exportarMock.mockRejectedValueOnce({ detail: 'erro cru' });

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Relatório' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Exportar CSV' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Erro ao exportar relatório.');
    });
  });
});