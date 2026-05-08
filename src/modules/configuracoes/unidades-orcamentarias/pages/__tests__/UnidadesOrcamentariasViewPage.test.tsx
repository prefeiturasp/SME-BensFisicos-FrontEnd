import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UnidadesOrcamentariasViewPage from '../UnidadesOrcamentariasViewPage';
import type { UnidadeOrcamentaria } from '../../types/unidades-orcamentarias.types';

const navigateMock = vi.fn();
const mutateAsyncMock = vi.fn();
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

vi.mock('../../hooks/useUnidadeOrcamentaria', () => ({
  useUnidadeOrcamentariaById: (...args: unknown[]) => useUnidadeOrcamentariaByIdMock(...args),
  useUnidadeOrcamentariaUpdate: () => useUnidadeOrcamentariaUpdateMock(),
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