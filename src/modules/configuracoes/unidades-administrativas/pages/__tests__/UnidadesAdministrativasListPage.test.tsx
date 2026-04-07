import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UnidadesAdministrativasListPage from '../UnidadesAdministrativasListPage';

const navigateMock = vi.fn();
const exportarMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

const createObjectURLMock = vi.fn(() => 'blob:download-url');
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
      codigo: '01.16.10.286',
      sigla: 'GAB',
      nome: 'Gabinete do Secretário',
      status: 'ativa' as const,
      status_display: 'Ativa',
      unidade_orcamentaria: 1,
      unidade_orcamentaria_codigo: '01.16.10',
      unidade_orcamentaria_nome: 'SME',
      unidade_orcamentaria_sigla: 'SME',
      created_at: '2026-03-18T10:00:00-03:00',
      updated_at: '2026-03-18T10:00:00-03:00',
    },
  ],
  page: 1,
  count: 1,
  loading: false,
  fetching: false,
  ordering: 'codigo',
  codigoInput: '',
  nomeOuSiglaInput: '',
  codigoFiltro: '01.16',
  nomeOuSiglaFiltro: 'gab',
  statusFilter: 'todos' as const,
  setPage: setPageMock,
  setOrdering: setOrderingMock,
  setCodigoInput: setCodigoInputMock,
  setNomeOuSiglaInput: setNomeOuSiglaInputMock,
  setStatusFilter: setStatusFilterMock,
};

let isGestor = true;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/auth/useAuth', () => ({
  useAuth: () => ({
    user: {
      is_gestor_patrimonio: isGestor,
    },
  }),
}));

vi.mock('../../services/unidades-administrativas.service', () => ({
  unidadesAdministrativasService: {
    exportar: (...args: unknown[]) => exportarMock(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock('../../hooks/useUnidadeAdministrativaList', () => ({
  useUnidadeAdministrativaList: () => hookState,
}));

vi.mock('../../hooks/usePagination', () => ({
  usePagination: () => ({
    pages: [{ type: 'page', value: 1, id: 'page-1' }],
    totalPages: 1,
  }),
}));

describe('UnidadesAdministrativasListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isGestor = true;
    Object.defineProperty(window, 'URL', {
      value: {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      },
      writable: true,
    });
  });

  it('exibe ações de gestão para perfil gestor', () => {
    render(
      <MemoryRouter>
        <UnidadesAdministrativasListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Adicionar Unidade')).toBeInTheDocument();
    expect(screen.getByText('Relatório')).toBeInTheDocument();
  });

  it('oculta ações de gestão para operador', () => {
    isGestor = false;

    render(
      <MemoryRouter>
        <UnidadesAdministrativasListPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Adicionar Unidade')).not.toBeInTheDocument();
    expect(screen.queryByText('Relatório')).not.toBeInTheDocument();
  });

  it('navega para detalhe ao clicar em visualizar', () => {
    render(
      <MemoryRouter>
        <UnidadesAdministrativasListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText('Visualizar unidade Gabinete do Secretário'));

    expect(navigateMock).toHaveBeenCalledWith('/unidades-administrativas/1');
  });

  it('navega para tela de nova unidade ao clicar em Adicionar Unidade', () => {
    render(
      <MemoryRouter>
        <UnidadesAdministrativasListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Unidade' }));

    expect(navigateMock).toHaveBeenCalledWith('/unidades-administrativas/novo');
  });

  it('volta para rota anterior ao clicar em Voltar', () => {
    render(
      <MemoryRouter>
        <UnidadesAdministrativasListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(navigateMock).toHaveBeenCalledWith(-1);
  });

  it('dispara ordenação ao clicar no cabeçalho da tabela', () => {
    render(
      <MemoryRouter>
        <UnidadesAdministrativasListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Código' }));

    expect(setPageMock).toHaveBeenCalledWith(1);
    expect(setOrderingMock).toHaveBeenCalled();
  });

  it('aplica ciclo de ordenação asc, desc e asc novamente', () => {
    render(
      <MemoryRouter>
        <UnidadesAdministrativasListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Código' }));

    const sortUpdater = setOrderingMock.mock.calls[0][0] as (current: string) => string;

    expect(sortUpdater('sigla')).toBe('codigo');
    expect(sortUpdater('codigo')).toBe('-codigo');
    expect(sortUpdater('-codigo')).toBe('codigo');
  });

  it('exporta relatório ao clicar em Relatório', async () => {
    exportarMock.mockResolvedValueOnce({
      blob: new Blob(['xlsx-content']),
      fileName: 'unidades.xlsx',
    });

    render(
      <MemoryRouter>
        <UnidadesAdministrativasListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Relatório' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Exportar XLSX' }));

    await waitFor(() => {
      expect(exportarMock).toHaveBeenCalledWith('xlsx', {
        codigo: '01.16',
        nomeOuSigla: 'gab',
        status: 'todos',
        ordering: 'codigo',
      });
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(appendChildMock).toHaveBeenCalled();
      expect(clickMock).toHaveBeenCalled();
      expect(removeMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:download-url');
      expect(toastSuccessMock).toHaveBeenCalledWith('Relatório exportado com sucesso.');
    });
  });

  it('exporta no formato selecionado no seletor', async () => {
    exportarMock.mockResolvedValueOnce({
      blob: new Blob(['pdf-content']),
      fileName: 'unidades.pdf',
    });

    render(
      <MemoryRouter>
        <UnidadesAdministrativasListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Relatório' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Exportar PDF' }));

    await waitFor(() => {
      expect(exportarMock).toHaveBeenCalledWith('pdf', {
        codigo: '01.16',
        nomeOuSigla: 'gab',
        status: 'todos',
        ordering: 'codigo',
      });
    });
  });

  it('mostra erro ao falhar exportação do relatório', async () => {
    exportarMock.mockRejectedValueOnce(new Error('Sem permissão para exportar.'));

    render(
      <MemoryRouter>
        <UnidadesAdministrativasListPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Relatório' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Exportar XLSX' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Sem permissão para exportar.');
    });
  });
});
