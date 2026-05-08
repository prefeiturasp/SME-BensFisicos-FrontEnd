import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UnidadesOrcamentariasViewPage from '../UnidadesOrcamentariasViewPage';
import type { UnidadeOrcamentaria } from '../../types/unidades-orcamentarias.types';

const navigateMock = vi.fn();
const mutateAsyncMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
let routeId = '12';

const unidadeMock: UnidadeOrcamentaria = {
  id: 12,
  codigo: '10.10.10',
  sigla: 'UO1',
  nome: 'UNIDADE ORCAMENTARIA 1',
  ativa: true,
  ativa_display: 'Ativa',
};

const useUnidadeOrcamentariaByIdMock = vi.fn();
const useUnidadeOrcamentariaUpdateMock = vi.fn();
const handleUnidadeOrcamentariaBadRequestErrorMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ id: routeId }),
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

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock('../../hooks/useUnidadeOrcamentaria', () => ({
  useUnidadeOrcamentariaById: (...args: unknown[]) => useUnidadeOrcamentariaByIdMock(...args),
  useUnidadeOrcamentariaUpdate: () => useUnidadeOrcamentariaUpdateMock(),
}));

vi.mock('../../utils/form-error-handler', () => ({
  handleUnidadeOrcamentariaBadRequestError: (...args: unknown[]) =>
    handleUnidadeOrcamentariaBadRequestErrorMock(...args),
}));

describe('UnidadesOrcamentariasViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeId = '12';

    useUnidadeOrcamentariaByIdMock.mockReturnValue({
      data: unidadeMock,
      isLoading: false,
      isError: false,
      error: null,
    });

    useUnidadeOrcamentariaUpdateMock.mockReturnValue({
      mutateAsync: mutateAsyncMock,
      isPending: false,
    });

    handleUnidadeOrcamentariaBadRequestErrorMock.mockReturnValue(false);
  });

  it('renderiza página de visualização com dados da unidade orçamentária', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Visualizar Unidade Orçamentária' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('10.10.10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('UO1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('UNIDADE ORCAMENTARIA 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });

  it('exibe mensagem de id inválido quando rota é inválida', () => {
    routeId = 'abc';

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Identificador da Unidade Orçamentária inválido.')).toBeInTheDocument();
  });

  it('exibe estado de loading enquanto carrega a unidade', () => {
    useUnidadeOrcamentariaByIdMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Carregando unidade orçamentária...')).toBeInTheDocument();
  });

  it('exibe mensagem da query quando ocorre erro no carregamento', () => {
    useUnidadeOrcamentariaByIdMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Falha ao carregar UO'),
    });

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Falha ao carregar UO')).toBeInTheDocument();
  });

  it('exibe mensagem padrão quando não há unidade e a query não retorna erro tipado', () => {
    useUnidadeOrcamentariaByIdMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText('Não foi possível carregar a unidade orçamentária.'),
    ).toBeInTheDocument();
  });

  it('envia atualização ao salvar edição', async () => {
    mutateAsyncMock.mockResolvedValueOnce({
      ...unidadeMock,
      nome: 'NOVA UO',
    });

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('UNIDADE ORCAMENTARIA 1')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    });

    const nomeInput = screen.getByLabelText('Nome');

    await waitFor(() => {
      expect(nomeInput).not.toBeDisabled();
    });

    await act(async () => {
      fireEvent.change(nomeInput, {
        target: { value: 'Nova UO' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    });

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        id: 12,
        payload: {
          nome: 'NOVA UO',
        },
      });
    });
  });

  it('não envia update quando nenhum campo foi alterado', async () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewPage />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    });

    await waitFor(() => {
      expect(mutateAsyncMock).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    });
  });

  it('exibe estado de salvamento quando a mutação está pendente em modo de edição', async () => {
    useUnidadeOrcamentariaUpdateMock.mockReturnValue({
      mutateAsync: mutateAsyncMock,
      isPending: true,
    });

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled();
  });

  it('exibe erro genérico quando a atualização falha fora do fluxo 400 tratado', async () => {
    mutateAsyncMock.mockRejectedValueOnce(new Error('Falha inesperada ao atualizar'));

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewPage />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Nome'), {
        target: { value: 'Nova UO' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    });

    await waitFor(() => {
      expect(handleUnidadeOrcamentariaBadRequestErrorMock).toHaveBeenCalled();
      expect(screen.getByText('Falha inesperada ao atualizar')).toBeInTheDocument();
      expect(toastErrorMock).toHaveBeenCalledWith('Falha inesperada ao atualizar');
    });
  });

  it('interrompe o fluxo quando o erro 400 é tratado pelo handler do formulário', async () => {
    const badRequestError = new AxiosError('Bad Request');
    handleUnidadeOrcamentariaBadRequestErrorMock.mockReturnValueOnce(true);
    mutateAsyncMock.mockRejectedValueOnce(badRequestError);

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewPage />
      </MemoryRouter>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Nome'), {
        target: { value: 'Nova UO' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    });

    await waitFor(() => {
      expect(handleUnidadeOrcamentariaBadRequestErrorMock).toHaveBeenCalledWith(
        badRequestError,
        expect.any(Object),
      );
      expect(toastErrorMock).not.toHaveBeenCalled();
      expect(toastSuccessMock).not.toHaveBeenCalled();
    });
  });

  it('volta para a listagem ao clicar em Cancelar', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasViewPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(navigateMock).toHaveBeenCalledWith('/unidades-orcamentarias');
  });
});