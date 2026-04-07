import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UseFormReturn } from 'react-hook-form';
import type { UnidadeAdministrativa } from '../../types/unidades-administrativas.types';
import type { UnidadeAdministrativaFormData } from '../../validators/unidade-administrativa-form.schema';
import UnidadesAdministrativasViewPage from '../UnidadesAdministrativasViewPage';

const navigateMock = vi.fn();
const mutateAsyncMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const badRequestHandlerMock = vi.fn();

const unidadeMock: UnidadeAdministrativa = {
  id: 10,
  codigo: '01.16.10.286',
  sigla: 'DIPAT',
  nome: 'Divisão de Patrimônio',
  status: 'ativa',
  status_display: 'Ativa',
  unidade_orcamentaria: 1,
  unidade_orcamentaria_codigo: '01.16.10',
  unidade_orcamentaria_nome: 'SECRETARIA MUNICIPAL DE EDUCAÇÃO',
  unidade_orcamentaria_sigla: 'SME',
  created_at: '2026-03-18T10:00:00-03:00',
  updated_at: '2026-03-18T10:00:00-03:00',
};

let canManage = true;
let queryLoading = false;
let queryError: Error | null = null;
let queryData: UnidadeAdministrativa | undefined = unidadeMock;
let mutationPending = false;
let routeId = '10';
let formOverrides: Partial<UnidadeAdministrativaFormData> | null = null;

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
    user: {
      is_gestor_patrimonio: canManage,
    },
  }),
}));

vi.mock('../../hooks/useUnidadeAdministrativa', () => ({
  useUnidadeAdministrativaById: () => ({
    data: queryData,
    isLoading: queryLoading,
    isError: Boolean(queryError),
    error: queryError,
  }),
  useUnidadeAdministrativaUpdate: () => ({
    mutateAsync: (...args: unknown[]) => mutateAsyncMock(...args),
    isPending: mutationPending,
  }),
}));

vi.mock('../../components/UnidadeAdministrativaForm', () => ({
  UnidadeAdministrativaForm: ({
    disabled,
    form,
  }: {
    disabled: boolean;
    form: UseFormReturn<UnidadeAdministrativaFormData>;
  }) => {
    useEffect(() => {
      form.register('codigoFinal');
      form.register('sigla');
      form.register('nome');
      form.register('status');

      return () => {
        form.unregister('codigoFinal');
        form.unregister('sigla');
        form.unregister('nome');
        form.unregister('status');
      };
    }, [form]);

    useEffect(() => {
      if (disabled || !formOverrides) {
        return;
      }

      form.reset({
        ...form.getValues(),
        ...formOverrides,
      });
    }, [disabled, form]);

    return (
      <div data-testid='ua-form' data-disabled={String(disabled)}>
        Formulário
      </div>
    );
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock('../../utils/form-error-handler', () => ({
  handleUnidadeAdministrativaBadRequestError: (...args: unknown[]) => badRequestHandlerMock(...args),
}));

describe('UnidadesAdministrativasViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canManage = true;
    queryLoading = false;
    queryError = null;
    queryData = unidadeMock;
    mutationPending = false;
    routeId = '10';
    formOverrides = null;
    badRequestHandlerMock.mockReturnValue(false);
  });

  it('inicia em modo de visualização com formulário desabilitado', () => {
    render(
      <MemoryRouter>
        <UnidadesAdministrativasViewPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Visualizar Unidade Administrativa' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByTestId('ua-form')).toHaveAttribute('data-disabled', 'true');
  });

  it('volta para visualização sem salvar quando não há alterações', async () => {
    mutateAsyncMock.mockResolvedValueOnce(unidadeMock);

    render(
      <MemoryRouter>
        <UnidadesAdministrativasViewPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    expect(screen.getByRole('heading', { name: 'Editar Unidade Administrativa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
    expect(screen.getByTestId('ua-form')).toHaveAttribute('data-disabled', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(mutateAsyncMock).not.toHaveBeenCalled();
    });

    expect(
      screen.getByRole('heading', { name: 'Visualizar Unidade Administrativa' }),
    ).toBeInTheDocument();
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalledWith('/unidades-administrativas');
  });

  it('retorna para listagem ao clicar em Cancelar', () => {
    render(
      <MemoryRouter>
        <UnidadesAdministrativasViewPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(navigateMock).toHaveBeenCalledWith('/unidades-administrativas');
  });

  it('não exibe ação de edição para usuário sem permissão de gestão', () => {
    canManage = false;

    render(
      <MemoryRouter>
        <UnidadesAdministrativasViewPage />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('exibe mensagem quando identificador da rota é inválido', () => {
    routeId = 'abc';

    render(
      <MemoryRouter>
        <UnidadesAdministrativasViewPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Identificador da Unidade Administrativa inválido.')).toBeInTheDocument();
  });

  it('renderiza estado de carregamento', () => {
    queryLoading = true;

    render(
      <MemoryRouter>
        <UnidadesAdministrativasViewPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Carregando unidade administrativa...')).toBeInTheDocument();
  });

  it('renderiza estado de erro da consulta', () => {
    queryError = new Error('Falha ao carregar');
    queryData = undefined;

    render(
      <MemoryRouter>
        <UnidadesAdministrativasViewPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Falha ao carregar')).toBeInTheDocument();
  });

  it('impede salvamento quando código da UO está ausente', async () => {
    queryData = {
      ...unidadeMock,
      unidade_orcamentaria_codigo: '   ',
    };

    render(
      <MemoryRouter>
        <UnidadesAdministrativasViewPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Não foi possível identificar o código da Unidade Orçamentária desta UA.',
      );
      expect(mutateAsyncMock).not.toHaveBeenCalled();
    });
  });

  it('mostra estado de salvamento quando mutação está pendente', () => {
    const { rerender } = render(
      <MemoryRouter>
        <UnidadesAdministrativasViewPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    mutationPending = true;
    rerender(
      <MemoryRouter>
        <UnidadesAdministrativasViewPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeInTheDocument();
  });
});
