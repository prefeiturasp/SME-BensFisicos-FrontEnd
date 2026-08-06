import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { toast } from 'sonner';
import RegistarOcorrenciaPage from '../RegistarOcorrenciaPage';
import {
  useConciliacaoItem,
  useConciliacaoItemSituacoesDisponiveis,
  useConciliacaoOcorrenciaRemover,
  useConciliacaoOcorrenciaUpsert,
} from '../../hooks/useConciliacoes';
import type {
  ConciliacaoItemDetail,
  ConciliacaoSituacaoDisponivel,
} from '../../types/conciliacoes.types';

const navigateMock = vi.fn();
let routeParams: { id?: string; itemId?: string } = { id: '1', itemId: '42' };

let authUser = {
  is_superuser: true,
  is_gestor_patrimonio: true,
  is_operador_inventario: true,
};

const itemDetail: ConciliacaoItemDetail = {
  id: 42,
  conciliacao: 1,
  conciliacao_numero: '001.0002/2026/005',
  conciliacao_status: 'em_aberto',
  unidade_administrativa: 7,
  unidade_administrativa_sigla: 'COTIC',
  bem: {
    id: 123,
    numero_patrimonial: '001.0002/2026/005',
    nome: '00.00.00.002 - COTIC',
    descricao: '',
    marca: '',
    modelo: '',
    valor_unitario: '0',
    status: 'ativo',
    localizacao: '',
    bloqueado_conciliacao: false,
  },
  situacao: 'nao_encontrado',
  situacao_display: 'Não encontrado',
  observacao: 'item não encontrado',
  divergencia: '',
  tem_ocorrencia: false,
  permite_registrar_ocorrencia: true,
  atualizado_por: null,
  atualizado_por_nome: '',
  atualizado_em: '2025-01-15T10:00:00Z',
  pode_marcar_como_encontrado: true,
  pode_resolver_situacao: false,
  conciliacao_esta_aberto: true,
  ocorrencias: [],
};

const opcoes: ConciliacaoSituacaoDisponivel[] = [
  { value: 'encontrado', label: 'Encontrado' },
  { value: 'nao_encontrado', label: 'Não encontrado' },
  { value: 'divergente', label: 'Divergente' },
  { value: 'em_processo_de_baixa_fisica', label: 'Em processo de baixa' },
];

let itemState: {
  data: ConciliacaoItemDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
} = {
  data: itemDetail,
  isLoading: false,
  isError: false,
  error: null,
};

let opcoesState: {
  data: ConciliacaoSituacaoDisponivel[] | undefined;
  isLoading: boolean;
  isError: boolean;
} = {
  data: opcoes,
  isLoading: false,
  isError: false,
};

const upsertMutateAsync = vi.fn();
const removerMutateAsync = vi.fn();
let upsertPending = false;
let removerPending = false;
let upsertIsError = false;
let upsertError: unknown = null;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => routeParams,
  };
});

vi.mock('@/auth/useAuth', () => ({
  useAuth: () => ({ user: authUser }),
}));

vi.mock('../../hooks/useConciliacoes', () => ({
  useConciliacaoItem: vi.fn(),
  useConciliacaoItemSituacoesDisponiveis: vi.fn(),
  useConciliacaoOcorrenciaUpsert: vi.fn(),
  useConciliacaoOcorrenciaRemover: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function setupMocks() {
  vi.mocked(useConciliacaoItem).mockImplementation(
    () => itemState as unknown as ReturnType<typeof useConciliacaoItem>,
  );
  vi.mocked(useConciliacaoItemSituacoesDisponiveis).mockImplementation(
    () => opcoesState as unknown as ReturnType<typeof useConciliacaoItemSituacoesDisponiveis>,
  );
  vi.mocked(useConciliacaoOcorrenciaUpsert).mockReturnValue({
    mutateAsync: upsertMutateAsync,
    isPending: upsertPending,
    isError: upsertIsError,
    error: upsertError,
  } as never);
  vi.mocked(useConciliacaoOcorrenciaRemover).mockReturnValue({
    mutateAsync: removerMutateAsync,
    isPending: removerPending,
  } as never);
}

function renderPage() {
  return render(
    <MemoryRouter>
      <RegistarOcorrenciaPage />
    </MemoryRouter>,
  );
}

describe('RegistarOcorrenciaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeParams = { id: '1', itemId: '42' };
    authUser = {
      is_superuser: true,
      is_gestor_patrimonio: true,
      is_operador_inventario: true,
    };
    itemState = {
      data: itemDetail,
      isLoading: false,
      isError: false,
      error: null,
    };
    opcoesState = {
      data: opcoes,
      isLoading: false,
      isError: false,
    };
    upsertPending = false;
    removerPending = false;
    upsertIsError = false;
    upsertError = null;
    upsertMutateAsync.mockResolvedValue({});
    removerMutateAsync.mockResolvedValue({});
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza breadcrumb, dados do bem, opcoes e botoes', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Registrar Ocorrência' })).toBeInTheDocument();
    expect(screen.getByTestId('dados-bem-section')).toBeInTheDocument();
    expect(screen.getByTestId('ocorrencia-form')).toBeInTheDocument();
    expect(screen.getByTestId('ocorrencia-opcoes-list')).toBeInTheDocument();
    expect(screen.getByTestId('ocorrencia-mensagem-condicional')).toBeInTheDocument();
    expect(screen.getByTestId('registrar-ocorrencia-salvar')).toBeInTheDocument();
    expect(screen.getByTestId('registrar-ocorrencia-cancelar')).toBeInTheDocument();
  });

  it('renderiza mensagem condicional para o status "nao_encontrado"', () => {
    renderPage();

    expect(screen.getByTestId('ocorrencia-mensagem-condicional')).toHaveAttribute(
      'data-situacao-anterior',
      'nao_encontrado',
    );
  });

  it('exibe "Excluir" apenas quando o item ja tem ocorrencia', () => {
    itemState = {
      ...itemState,
      data: { ...itemDetail, tem_ocorrencia: true, observacao: 'anterior' },
    };

    renderPage();

    expect(screen.getByTestId('registrar-ocorrencia-excluir')).toBeInTheDocument();
    expect(screen.queryByTestId('registrar-ocorrencia-excluir')).toBeInTheDocument();
  });

  it.each([
    {
      name: 'estado normal',
      setup: () => {},
      expected: '/conciliacoes/1',
    },
    {
      name: 'ids invalidos',
      setup: () => {
        routeParams = { id: 'abc', itemId: 'xyz' };
      },
      expected: '/conciliacoes',
    },
    {
      name: 'estado de erro',
      setup: () => {
        itemState = {
          data: undefined,
          isLoading: false,
          isError: true,
          error: new Error('Falha'),
        };
      },
      expected: '/conciliacoes/1',
    },
  ])('navega ao cancelar em $name', ({ setup, expected }) => {
    setup();

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(navigateMock).toHaveBeenCalledWith(expected);
  });

  it('salva a ocorrencia e navega para a conciliacao apos sucesso', async () => {
    upsertMutateAsync.mockResolvedValue(itemDetail);

    renderPage();

    fireEvent.click(screen.getByTestId('ocorrencia-opcao-encontrado'));
    fireEvent.click(screen.getByTestId('registrar-ocorrencia-salvar'));

    await waitFor(() => {
      expect(upsertMutateAsync).toHaveBeenCalledWith({
        conciliacaoId: 1,
        itemId: 42,
        payload: {
          situacao: 'encontrado',
          observacao: '',
          divergencia: '',
        },
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Ocorrência registrada com sucesso.',
        expect.any(Object),
      );
    });

    expect(navigateMock).toHaveBeenCalledWith('/conciliacoes/1');
  });

  it('envia divergencia ao salvar com a opcao "divergente"', async () => {
    upsertMutateAsync.mockResolvedValue(itemDetail);

    renderPage();

    fireEvent.click(screen.getByTestId('ocorrencia-opcao-divergente'));
    fireEvent.change(screen.getByTestId('ocorrencia-descricao-divergencia'), {
      target: { value: 'detalhes da divergencia' },
    });
    fireEvent.click(screen.getByTestId('registrar-ocorrencia-salvar'));

    await waitFor(() => {
      expect(upsertMutateAsync).toHaveBeenCalledWith({
        conciliacaoId: 1,
        itemId: 42,
        payload: {
          situacao: 'divergente',
          divergencia: 'detalhes da divergencia',
          observacao: '',
        },
      });
    });
  });

  it('exibe toast de erro quando o salvamento falha', async () => {
    upsertMutateAsync.mockRejectedValue(new Error('Erro de validação'));

    renderPage();

    fireEvent.click(screen.getByTestId('ocorrencia-opcao-encontrado'));
    fireEvent.click(screen.getByTestId('registrar-ocorrencia-salvar'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Não foi possível registrar a ocorrência.',
        expect.objectContaining({ description: 'Erro de validação' }),
      );
    });
  });

  it('mapeia erro 400 do campo "divergencia" para o form e exibe toast', async () => {
    const error = new AxiosError('Bad Request', '400', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
      data: { divergencia: ['Detalhe a divergência com mais clareza.'] },
    });
    upsertMutateAsync.mockRejectedValue(error);

    renderPage();

    fireEvent.click(screen.getByTestId('ocorrencia-opcao-divergente'));
    fireEvent.change(screen.getByTestId('ocorrencia-descricao-divergencia'), {
      target: { value: 'curto' },
    });
    fireEvent.click(screen.getByTestId('registrar-ocorrencia-salvar'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Não foi possível registrar a ocorrência.',
        expect.objectContaining({
          description: 'Detalhe a divergência com mais clareza.',
        }),
      );
    });

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('mapeia erro 400 com "detail" para o erro raiz do form', async () => {
    const error = new AxiosError('Bad Request', '400', undefined, undefined, {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
      data: { detail: 'Item já possui ocorrência registrada.' },
    });
    upsertMutateAsync.mockRejectedValue(error);

    renderPage();

    fireEvent.click(screen.getByTestId('ocorrencia-opcao-encontrado'));
    fireEvent.click(screen.getByTestId('registrar-ocorrencia-salvar'));

    await waitFor(() => {
      expect(screen.getByTestId('ocorrencia-form-root-error')).toHaveTextContent(
        'Item já possui ocorrência registrada.',
      );
    });

    expect(toast.error).toHaveBeenCalledWith(
      'Não foi possível registrar a ocorrência.',
      expect.objectContaining({
        description: 'Item já possui ocorrência registrada.',
      }),
    );
  });

  it('exibe erro inline no modal de exclusao quando a remocao falha', async () => {
    itemState = {
      ...itemState,
      data: { ...itemDetail, tem_ocorrencia: true },
    };
    removerMutateAsync.mockRejectedValue(new Error('Erro ao remover'));

    renderPage();

    fireEvent.click(screen.getByTestId('registrar-ocorrencia-excluir'));
    fireEvent.click(screen.getByTestId('ocorrencia-modal-exclusao-confirm'));

    await waitFor(() => {
      expect(screen.getByTestId('ocorrencia-modal-exclusao-error')).toHaveTextContent(
        'Erro ao remover',
      );
    });

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('abre modal de exclusao e confirma a remocao', async () => {
    itemState = {
      ...itemState,
      data: { ...itemDetail, tem_ocorrencia: true },
    };
    removerMutateAsync.mockResolvedValue(itemDetail);

    renderPage();

    fireEvent.click(screen.getByTestId('registrar-ocorrencia-excluir'));

    expect(screen.getByTestId('ocorrencia-modal-exclusao')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('ocorrencia-modal-exclusao-confirm'));

    await waitFor(() => {
      expect(removerMutateAsync).toHaveBeenCalledWith({
        conciliacaoId: 1,
        itemId: 42,
      });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Ocorrência excluída com sucesso.');
    });

    expect(navigateMock).toHaveBeenCalledWith('/conciliacoes/1');
  });

  it('fecha o modal de exclusao ao cancelar', () => {
    itemState = {
      ...itemState,
      data: { ...itemDetail, tem_ocorrencia: true },
    };

    renderPage();

    fireEvent.click(screen.getByTestId('registrar-ocorrencia-excluir'));
    expect(screen.getByTestId('ocorrencia-modal-exclusao')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('ocorrencia-modal-exclusao-cancel'));

    expect(screen.queryByTestId('ocorrencia-modal-exclusao')).not.toBeInTheDocument();
  });

  it('exibe mensagem de id invalido quando a rota nao tem ids validos', () => {
    routeParams = { id: 'abc', itemId: 'xyz' };

    renderPage();

    expect(
      screen.getByText('Identificadores da Conciliação ou do Item inválidos.'),
    ).toBeInTheDocument();
  });

  it('exibe estado de carregamento enquanto busca o item', () => {
    itemState = {
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    };

    renderPage();

    expect(screen.getByText('Carregando dados do bem...')).toBeInTheDocument();
  });

  it('exibe mensagem de erro quando o item nao pode ser carregado', () => {
    itemState = {
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Falha ao buscar item'),
    };

    renderPage();

    expect(screen.getByText('Falha ao buscar item')).toBeInTheDocument();
  });

  it('bloqueia acesso para usuarios sem perfil', () => {
    authUser = {
      is_superuser: false,
      is_gestor_patrimonio: false,
      is_operador_inventario: false,
    };

    renderPage();

    expect(screen.getByText(/não tem permissão/i)).toBeInTheDocument();
  });

  it('desabilita o botao Salvar enquanto a situacao nao for selecionada', () => {
    renderPage();

    expect(screen.getByTestId('registrar-ocorrencia-salvar')).toBeDisabled();
  });

  it('desabilita o botao Salvar para "divergente" sem descricao preenchida', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('ocorrencia-opcao-divergente'));

    expect(screen.getByTestId('registrar-ocorrencia-salvar')).toBeDisabled();
  });

  it('omite a mensagem condicional quando o item ja possui ocorrencia registrada', () => {
    itemState = {
      ...itemState,
      data: {
        ...itemDetail,
        tem_ocorrencia: true,
        situacao: 'nao_encontrado',
        observacao: 'observacao anterior',
      },
    };

    renderPage();

    expect(
      screen.queryByTestId('ocorrencia-mensagem-condicional'),
    ).not.toBeInTheDocument();
  });

  it('pre-fill do formulario com ocorrencia existente habilita o botao Salvar', () => {
    itemState = {
      ...itemState,
      data: {
        ...itemDetail,
        tem_ocorrencia: true,
        situacao: 'encontrado',
        observacao: 'observacao anterior',
        ocorrencias: [
          {
            id: 99,
            situacao: 'encontrado',
            situacao_display: 'Encontrado',
            observacao: 'observacao anterior',
            divergencia: '',
            registrado_por: 7,
            registrado_por_nome: 'Maria',
            registrado_por_rf: '7654321',
            registrado_em: '2025-06-10T14:25:00Z',
          },
        ],
      },
    };

    renderPage();

    expect(screen.getByTestId('registrar-ocorrencia-salvar')).toBeEnabled();
  });

  it('mantem botao Excluir habilitado mesmo quando o formulario nao esta completo', () => {
    itemState = {
      ...itemState,
      data: { ...itemDetail, tem_ocorrencia: true },
    };

    renderPage();

    expect(screen.getByTestId('registrar-ocorrencia-salvar')).toBeDisabled();
    expect(screen.getByTestId('registrar-ocorrencia-excluir')).toBeEnabled();
  });

  it('exibe banner e desabilita formulario quando a conciliacao esta fechada', () => {
    itemState = {
      ...itemState,
      data: {
        ...itemDetail,
        tem_ocorrencia: true,
        conciliacao_status: 'fechado',
        conciliacao_esta_aberto: false,
      },
    };

    renderPage();

    expect(
      screen.getByTestId('registrar-ocorrencia-conciliacao-fechada'),
    ).toHaveTextContent(/conciliação está fechada/i);
    expect(screen.getByTestId('registrar-ocorrencia-salvar')).toBeDisabled();
    expect(screen.getByTestId('registrar-ocorrencia-excluir')).toBeDisabled();
    expect(screen.getByTestId('ocorrencia-opcao-encontrado')).toBeDisabled();
    expect(screen.getByTestId('ocorrencia-observacao')).toBeDisabled();
  });
});
