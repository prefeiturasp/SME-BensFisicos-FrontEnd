import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import ParametroConciliacaoAnualFormPage from '../ParametroConciliacaoAnualFormPage';

const navigateMock = vi.fn();
const createMock = vi.fn();
const updateMutateAsyncMock = vi.fn();
const deleteMutateAsyncMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const toastDismissMock = vi.fn();

const queryState = {
  data: null as {
    id: number;
    unidade_orcamentaria: number;
    unidade_orcamentaria_codigo: string;
    unidade_orcamentaria_nome: string;
    unidade_orcamentaria_sigla: string;
    ano_referencia: number;
    periodo_inicial: string;
    periodo_final: string;
    ativo: boolean;
    esta_vigente: boolean;
  } | null,
  isLoading: false,
  isError: false,
};

const updateMutationState = {
  isPending: false,
  mutateAsync: updateMutateAsyncMock,
};

const deleteMutationState = {
  isPending: false,
  mutateAsync: deleteMutateAsyncMock,
};

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
});

const parametroEdit = {
  id: 2,
  unidade_orcamentaria: 9,
  unidade_orcamentaria_codigo: '01.16.10',
  unidade_orcamentaria_nome: 'SECRETARIA MUNICIPAL DE EDUCACAO',
  unidade_orcamentaria_sigla: 'SME',
  ano_referencia: 2026,
  periodo_inicial: '2026-04-01',
  periodo_final: '2026-04-30',
  ativo: true,
  esta_vigente: true,
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
    user: {
      is_superuser: true,
      is_gestor_patrimonio: true,
      uo_ativa: {
        id: 9,
        codigo: '01.16.10',
        nome: 'SECRETARIA MUNICIPAL DE EDUCACAO',
      },
    },
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
    dismiss: (...args: unknown[]) => toastDismissMock(...args),
  },
}));

vi.mock('../../hooks/useParametrosConciliacaoAnual', () => ({
  useParametroConciliacaoAnualById: () => queryState,
  useParametroConciliacaoAnualUpdate: () => updateMutationState,
  useParametroConciliacaoAnualDelete: () => deleteMutationState,
}));

vi.mock('../../services/parametros-conciliacao-anual.service', () => ({
  parametrosConciliacaoAnualService: {
    create: (...args: unknown[]) => createMock(...args),
  },
}));

function renderPage(initialPath = '/parametros-conciliacao-anual/novo') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path='/parametros-conciliacao-anual/novo'
          element={<ParametroConciliacaoAnualFormPage />}
        />
        <Route
          path='/parametros-conciliacao-anual/:id'
          element={<ParametroConciliacaoAnualFormPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

function fillCreateForm() {
  fireEvent.change(screen.getByPlaceholderText('Ex: 2026'), {
    target: { value: '2026' },
  });
  fireEvent.change(screen.getAllByPlaceholderText('dd/mm/aaaa')[0], {
    target: { value: '01/04/2026' },
  });
  fireEvent.change(screen.getAllByPlaceholderText('dd/mm/aaaa')[1], {
    target: { value: '30/04/2026' },
  });
}

describe('ParametroConciliacaoAnualFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryState.data = null;
    queryState.isLoading = false;
    queryState.isError = false;
    updateMutationState.isPending = false;
    deleteMutationState.isPending = false;
    createMock.mockResolvedValue({ id: 1 });
    updateMutateAsyncMock.mockResolvedValue({ id: 1 });
    deleteMutateAsyncMock.mockResolvedValue(undefined);
  });

  it('mantem o salvar desabilitado ate o formulario ficar valido no cadastro', async () => {
    renderPage();

    const saveButton = screen.getByRole('button', { name: 'Salvar' });
    expect(saveButton).toBeDisabled();

    fillCreateForm();

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
  });

  it('envia o payload convertido para formato iso no cadastro', async () => {
    renderPage();
    fillCreateForm();

    const saveButton = screen.getByRole('button', { name: 'Salvar' });

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith({
        unidade_orcamentaria: 9,
        ano_referencia: 2026,
        periodo_inicial: '2026-04-01',
        periodo_final: '2026-04-30',
        ativo: true,
      });
      expect(navigateMock).toHaveBeenCalledWith('/parametros-conciliacao-anual');
    });
  });

  it('na edicao so habilita salvar quando houver alteracao', async () => {
    queryState.data = parametroEdit;

    renderPage('/parametros-conciliacao-anual/2');

    const saveButton = await screen.findByRole('button', { name: 'Salvar' });
    expect(saveButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Ex: 2026'), {
      target: { value: '2027' },
    });

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
  });

  it('atualiza o parametro na edicao', async () => {
    queryState.data = parametroEdit;

    renderPage('/parametros-conciliacao-anual/2');

    const saveButton = await screen.findByRole('button', { name: 'Salvar' });
    fireEvent.change(screen.getByPlaceholderText('Ex: 2026'), {
      target: { value: '2027' },
    });

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateMutateAsyncMock).toHaveBeenCalledWith({
        id: 2,
        payload: {
          unidade_orcamentaria: 9,
          ano_referencia: 2027,
          periodo_inicial: '2026-04-01',
          periodo_final: '2026-04-30',
          ativo: true,
        },
      });
      expect(toastSuccessMock).toHaveBeenCalledWith(
        'Cadastro realizado com sucesso!',
        expect.any(Object),
      );
    });
  });

  it('mapeia erro de sobreposicao para os campos de periodo', async () => {
    createMock.mockRejectedValueOnce(
      new AxiosError('Bad request', '400', undefined, undefined, {
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as never,
        data: { non_field_errors: ['periodo se sobrepoe ao intervalo informado'] },
      }),
    );

    renderPage();
    fillCreateForm();

    const saveButton = screen.getByRole('button', { name: 'Salvar' });

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Não foi possível cadastrar o parâmetro.',
        expect.any(Object),
      );
      expect(navigateMock).not.toHaveBeenCalledWith('/parametros-conciliacao-anual');
    });
  });

  it('exclui o parametro pela modal de confirmacao', async () => {
    queryState.data = parametroEdit;

    renderPage('/parametros-conciliacao-anual/2');

    fireEvent.click(await screen.findByRole('button', { name: 'Excluir' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir' }).at(-1) as HTMLElement);

    await waitFor(() => {
      expect(deleteMutateAsyncMock).toHaveBeenCalledWith(2);
      expect(toastSuccessMock).toHaveBeenCalledWith(
        'Parâmetro excluído com sucesso!',
        expect.any(Object),
      );
      expect(navigateMock).toHaveBeenCalledWith('/parametros-conciliacao-anual');
    });
  });

  it('exibe mensagem quando o identificador da rota e invalido', () => {
    renderPage('/parametros-conciliacao-anual/abc');

    expect(screen.getByText(/Identificador/)).toBeInTheDocument();
  });

  it('exibe estado de carregamento na edicao', () => {
    queryState.isLoading = true;

    renderPage('/parametros-conciliacao-anual/2');

    expect(screen.getByText(/Carregando/)).toBeInTheDocument();
  });
});
