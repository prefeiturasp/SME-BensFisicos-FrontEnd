import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  afterEach,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import VisualizarConciliacaoPage from '../VisualizarConciliacaoPage';
import type { Conciliacao } from '../../types/conciliacoes.types';
import { conciliacoesService } from '../../services/conciliacoes.service';
import { toast } from 'sonner';

const navigateMock = vi.fn();
let routeId = '1';

let authUser = {
  is_superuser: true,
  is_gestor_patrimonio: true,
  is_operador_inventario: true,
};

const conciliacao: Conciliacao = {
  id: 1,
  numero_conciliacao: '001.0002/2026/005',
  unidade_administrativa: 7,
  unidade_administrativa_codigo: '00.00.00.002',
  unidade_administrativa_nome: 'COTIC',
  unidade_administrativa_sigla: 'COTIC',
  unidade_orcamentaria_codigo: '00.00.00',
  unidade_orcamentaria_nome: 'SME',
  tipo: 'eventual',
  tipo_display: 'Eventual',
  periodo_final: '2026-03-15',
  status: 'em_aberto',
  status_display: 'Aberta',
  total_itens: 2,
  resumo_situacoes: {
    encontrados: 1,
    nao_encontrados: 1,
    divergentes: 0,
    em_processo_baixa: 0,
    baixa_fisica: 0,
    encontrados_com_divergencia: 0,
  },
  ano_vigencia: 2026,
  criado_em: '2026-03-10T15:24:00Z',
  criado_por: 1,
  criado_por_nome: 'Maria José',
  criado_por_rf: '1234567',
  fechado_em: null,
  fechado_por: null,
  fechado_por_nome: '',
  fechado_por_rf: '',
  esta_aberto: true,
};

const useConciliacaoByIdMock = vi.fn();
const useConciliacaoItensMock = vi.fn();
const useConciliacaoFinalizarMock = vi.fn();

let conciliacaoByIdState: {
  data: Conciliacao | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
} = {
  data: conciliacao,
  isLoading: false,
  isError: false,
  error: null,
};

let conciliacaoItensState = {
  itens: [],
  count: 0,
  loading: false,
  fetching: false,
  page: 1,
  ordering: 'bem__numero_patrimonial' as const,
  numeroPatrimonialInput: '',
  nomeInput: '',
  situacaoFilter: [] as const,
  setPage: vi.fn(),
  setOrdering: vi.fn(),
  setNumeroPatrimonialInput: vi.fn(),
  setNomeInput: vi.fn(),
  setSituacaoFilter: vi.fn(),
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ id: routeId }),
  };
});

vi.mock('@/auth/useAuth', () => ({
  useAuth: () => ({ user: authUser }),
}));

vi.mock('../../hooks/useConciliacoes', () => ({
  useConciliacaoById: (...args: unknown[]) => useConciliacaoByIdMock(...args),
  useConciliacaoItens: (...args: unknown[]) => useConciliacaoItensMock(...args),
  useConciliacaoFinalizar: () => useConciliacaoFinalizarMock(),
}));

vi.mock('@/hooks/useUnidadesPagination', () => ({
  useUnidadesPagination: () => ({
    pages: [{ type: 'page' as const, id: '1', value: 1 }],
    totalPages: 1,
  }),
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({
    checked,
    disabled,
    onCheckedChange,
    'data-testid': testId,
    id,
  }: {
    checked?: boolean;
    disabled?: boolean;
    id?: string;
    'data-testid'?: string;
    onCheckedChange?: (checked: boolean) => void;
  }) => (
    <input
      type='checkbox'
      id={id}
      data-testid={testId}
      checked={!!checked}
      onChange={(event) => {
        if (disabled) return
        onCheckedChange?.(event.target.checked)
      }}
    />
  ),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../../services/conciliacoes.service', () => ({
  conciliacoesService: {
    historico: vi.fn(),
    exportar: vi.fn(),
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <VisualizarConciliacaoPage />
    </MemoryRouter>,
  );
}

describe('VisualizarConciliacaoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeId = '1';
    authUser = {
      is_superuser: true,
      is_gestor_patrimonio: true,
      is_operador_inventario: true,
    };

    conciliacaoByIdState = {
      data: conciliacao,
      isLoading: false,
      isError: false,
      error: null,
    };

    conciliacaoItensState = {
      itens: [],
      count: 0,
      loading: false,
      fetching: false,
      page: 1,
      ordering: 'bem__numero_patrimonial',
      numeroPatrimonialInput: '',
      nomeInput: '',
      situacaoFilter: [],
      setPage: vi.fn(),
      setOrdering: vi.fn(),
      setNumeroPatrimonialInput: vi.fn(),
      setNomeInput: vi.fn(),
      setSituacaoFilter: vi.fn(),
    };

    useConciliacaoByIdMock.mockImplementation(() => conciliacaoByIdState);
    useConciliacaoItensMock.mockReturnValue(conciliacaoItensState);
    useConciliacaoFinalizarMock.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('renderiza breadcrumb, titulo, subtitulo e secoes da conciliacao', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Visualizar Conciliação' })).toBeInTheDocument();
    expect(screen.getByTestId('visualizar-conciliacao-subtitulo')).toHaveTextContent(
      '001.0002/2026/005 — COTIC',
    );
    expect(screen.getByText('Informações gerais')).toBeInTheDocument();
    expect(screen.getByText('Auditoria')).toBeInTheDocument();
    expect(screen.getByText('Itens de conciliação')).toBeInTheDocument();
  });

  it('renderiza apenas o numero no subtitulo quando a sigla da UA e vazia', () => {
    useConciliacaoByIdMock.mockReturnValueOnce({
      data: { ...conciliacao, unidade_administrativa_sigla: '' },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderPage();

    expect(screen.getByTestId('visualizar-conciliacao-subtitulo')).toHaveTextContent(
      '001.0002/2026/005',
    );
  });

  it('exibe o status como "Aberta" para conciliacoes em_aberto', () => {
    renderPage();

    expect(screen.getByTestId('conciliacao-status-em_aberto')).toHaveTextContent('Aberta');
  });

  it('habilita o botao Finalizar quando a conciliacao esta em_aberto', () => {
    renderPage();

    expect(screen.getByTestId('visualizar-conciliacao-finalizar')).toBeEnabled();
  });

  it('desabilita o botao Finalizar quando a conciliacao esta fechada', () => {
    useConciliacaoByIdMock.mockReturnValueOnce({
      data: { ...conciliacao, status: 'fechado', esta_aberto: false },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderPage();

    expect(screen.getByTestId('visualizar-conciliacao-finalizar')).toBeDisabled();
  });

  it('exibe mensagem de id invalido quando a rota e invalida', () => {
    routeId = 'abc';

    renderPage();

    expect(
      screen.getByText('Identificador da Conciliação inválido.'),
    ).toBeInTheDocument();
  });

  it('exibe estado de carregamento enquanto a conciliacao e buscada', () => {
    useConciliacaoByIdMock.mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    renderPage();

    expect(
      screen.getByText('Carregando detalhes da conciliação...'),
    ).toBeInTheDocument();
  });

  it('exibe mensagem de erro quando ocorre falha no carregamento', () => {
    useConciliacaoByIdMock.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Falha ao carregar conciliacao'),
    });

    renderPage();

    expect(screen.getByText('Falha ao carregar conciliacao')).toBeInTheDocument();
  });

  it('exibe mensagem padrao quando a conciliacao nao e retornada', () => {
    useConciliacaoByIdMock.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderPage();

    expect(
      screen.getByText('Não foi possível carregar a conciliação.'),
    ).toBeInTheDocument();
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

  it('navega para a listagem ao clicar em Voltar', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(navigateMock).toHaveBeenCalledWith('/conciliacoes');
  });

  it('navega para a listagem ao clicar em Cancelar no estado de erro', () => {
    useConciliacaoByIdMock.mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Falha'),
    });

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(navigateMock).toHaveBeenCalledWith('/conciliacoes');
  });

  it('propaga os filtros dos itens para o hook', () => {
    renderPage();

    fireEvent.change(screen.getByTestId('conciliacao-itens-numero-input'), {
      target: { value: '001' },
    });
    fireEvent.change(screen.getByTestId('conciliacao-itens-nome-input'), {
      target: { value: 'Mesa' },
    });
    fireEvent.click(screen.getByTestId('conciliacao-itens-situacao-select'));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Divergente' }));

    expect(conciliacaoItensState.setNumeroPatrimonialInput).toHaveBeenCalledWith('001');
    expect(conciliacaoItensState.setNomeInput).toHaveBeenCalledWith('Mesa');
    expect(conciliacaoItensState.setSituacaoFilter).toHaveBeenCalledWith(['divergente']);
  });

  it('exibe os itens retornados pelo hook', () => {
    const itemMock = {
      id: 1,
      conciliacao: 1,
      conciliacao_numero: '001.0002/2026/005',
      conciliacao_status: 'em_aberto' as const,
      unidade_administrativa: 7,
      unidade_administrativa_sigla: 'COTIC',
      bem: {
        id: 123,
        numero_patrimonial: '001.052485928-0',
        nome: 'POLTRONA FIXA',
        descricao: '',
        marca: '',
        modelo: '',
        valor_unitario: '0',
        status: 'ativo',
        localizacao: '',
        bloqueado_conciliacao: false,
      },
      situacao: 'encontrado_sem_divergencia' as const,
      situacao_display: 'Encontrado sem divergência',
      observacao: '',
      divergencia: '',
      tem_ocorrencia: false,
      permite_registrar_ocorrencia: true,
      atualizado_por: null,
      atualizado_por_nome: '',
      atualizado_em: '2026-03-15T10:00:00Z',
    };

    useConciliacaoItensMock.mockReturnValueOnce({
      ...conciliacaoItensState,
      itens: [itemMock],
      count: 1,
    });

    renderPage();

    expect(screen.getByText('001.052485928-0')).toBeInTheDocument();
    expect(screen.getByText('POLTRONA FIXA')).toBeInTheDocument();
  });

  it('navega para a tela de registro de ocorrência ao clicar no botão de visualizar item', () => {
    const itemMock = {
      id: 1,
      conciliacao: 1,
      conciliacao_numero: '001.0002/2026/005',
      conciliacao_status: 'em_aberto' as const,
      unidade_administrativa: 7,
      unidade_administrativa_sigla: 'COTIC',
      bem: {
        id: 123,
        numero_patrimonial: '001.052485928-0',
        nome: 'POLTRONA FIXA',
        descricao: '',
        marca: '',
        modelo: '',
        valor_unitario: '0',
        status: 'ativo',
        localizacao: '',
        bloqueado_conciliacao: false,
      },
      situacao: 'encontrado_sem_divergencia' as const,
      situacao_display: 'Encontrado sem divergência',
      observacao: '',
      divergencia: '',
      tem_ocorrencia: false,
      permite_registrar_ocorrencia: true,
      atualizado_por: null,
      atualizado_por_nome: '',
      atualizado_em: '2026-03-15T10:00:00Z',
    };

    useConciliacaoItensMock.mockReturnValueOnce({
      ...conciliacaoItensState,
      itens: [itemMock],
      count: 1,
    });

    renderPage();

    fireEvent.click(screen.getByTestId('conciliacao-item-action-1'));

    expect(navigateMock).toHaveBeenCalledWith('/conciliacoes/1/itens/1/ocorrencia');
  });

  it('dispara setPage(1) ao ordenar coluna da tabela de itens', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Número Patrimonial/i }));

    await waitFor(() => {
      expect(conciliacaoItensState.setPage).toHaveBeenCalledWith(1);
    });
    expect(conciliacaoItensState.setOrdering).toHaveBeenCalled();
  });

  it('abre o modal de historico ao clicar em Historico e carrega dados', async () => {
    vi.mocked(conciliacoesService.historico).mockResolvedValueOnce([
      {
        alterado_em: '2026-03-10T15:24:00Z',
        alterado_por: 1,
        alterado_por_nome: 'Maria José',
        acoes: [
          {
            campo: 'acao',
            valor_antigo: '',
            valor_novo: 'criado',
            justificativa: 'Conciliação criada via API',
          },
        ],
      },
    ]);

    renderPage();

    fireEvent.click(screen.getByTestId('visualizar-conciliacao-historico'));

    await waitFor(() => {
      expect(conciliacoesService.historico).toHaveBeenCalledWith(1);
    });

    expect(await screen.findByTestId('conciliacao-historico-modal')).toBeInTheDocument();
    expect(await screen.findAllByText(/Usuário:\s*Maria José/)).not.toHaveLength(0);
  });

  it('fecha o modal de historico ao clicar no botao de fechar', async () => {
    vi.mocked(conciliacoesService.historico).mockResolvedValueOnce([]);

    renderPage();

    fireEvent.click(screen.getByTestId('visualizar-conciliacao-historico'));

    await waitFor(() => {
      expect(conciliacoesService.historico).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Fechar histórico' }));

    await waitFor(() => {
      expect(screen.queryByTestId('conciliacao-historico-modal')).not.toBeInTheDocument();
    });
  });

  it('exporta o PDF ao clicar em Exportar', async () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const createObjectURL = vi.fn(() => 'blob:fake-url');
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    const linkClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    vi.mocked(conciliacoesService.exportar).mockResolvedValueOnce(
      new Blob(['pdf'], { type: 'application/pdf' }),
    );

    try {
      renderPage();

      fireEvent.click(screen.getByTestId('visualizar-conciliacao-exportar'));

      await waitFor(() => {
        expect(conciliacoesService.exportar).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(createObjectURL).toHaveBeenCalled();
      });
      expect(linkClickSpy).toHaveBeenCalled();
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      linkClickSpy.mockRestore();
    }
  });

  it('exibe toast de erro quando a exportacao falha', async () => {
    vi.mocked(conciliacoesService.exportar).mockRejectedValueOnce(
      new Error('Falha ao exportar PDF'),
    );

    renderPage();

    fireEvent.click(screen.getByTestId('visualizar-conciliacao-exportar'));

    await waitFor(() => {
      expect(conciliacoesService.exportar).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Falha ao exportar PDF');
    });
  });

  it('exibe o botão com o texto "Finalizar Conciliação" e cor de fundo vermelha', () => {
    renderPage();

    const botao = screen.getByTestId('visualizar-conciliacao-finalizar');
    expect(botao).toHaveTextContent('Finalizar Conciliação');
    expect(botao.className).toContain('bg-[#C20F06]');
  });

  it('abre o modal de finalizacao ao clicar em Finalizar conciliação', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('visualizar-conciliacao-finalizar'));

    expect(screen.getByTestId('conciliacao-finalizar-modal')).toBeInTheDocument();
  });

  it('fecha o modal de finalizacao ao clicar em Cancelar', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('visualizar-conciliacao-finalizar'));
    expect(screen.getByTestId('conciliacao-finalizar-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('conciliacao-finalizar-cancel'));

    expect(screen.queryByTestId('conciliacao-finalizar-modal')).not.toBeInTheDocument();
  });

  it('chama mutateAsync ao confirmar a finalizacao e exibe toast de sucesso', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(conciliacao);
    useConciliacaoFinalizarMock.mockImplementation(() => ({
      mutateAsync,
      isPending: false,
      isError: false,
      error: null,
      reset: vi.fn(),
    }));

    renderPage();

    fireEvent.click(screen.getByTestId('visualizar-conciliacao-finalizar'));
    fireEvent.click(screen.getByTestId('conciliacao-finalizar-confirmacao'));
    fireEvent.click(screen.getByTestId('conciliacao-finalizar-confirm'));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Conciliação finalizada com sucesso.');
    });
  });

  it('exibe toast de erro quando a finalizacao falha', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Conciliacao ja finalizada.'));
    useConciliacaoFinalizarMock.mockImplementation(() => ({
      mutateAsync,
      isPending: false,
      isError: true,
      error: new Error('Conciliacao ja finalizada.'),
      reset: vi.fn(),
    }));

    renderPage();

    fireEvent.click(screen.getByTestId('visualizar-conciliacao-finalizar'));
    fireEvent.click(screen.getByTestId('conciliacao-finalizar-confirmacao'));
    fireEvent.click(screen.getByTestId('conciliacao-finalizar-confirm'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Conciliacao ja finalizada.');
    });
  });
});