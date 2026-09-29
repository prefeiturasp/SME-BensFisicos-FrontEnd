import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '@/auth/useAuth';
import type { User } from '@/auth/auth.service';
import NbbpmDetailPage from '../NbbpmDetailPage';
import { nbbpmService } from '../../services/nbbpm.service';
import { baixaFisicaService } from '../../../baixa-fisica/service/baixas.service';
import type { NbbpmDetail } from '../../types/nbbpm.types';

vi.mock('@/auth/useAuth');

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../services/nbbpm.service', () => ({
  nbbpmService: {
    list: vi.fn(),
    retrieve: vi.fn(),
  },
}));

vi.mock('../../../baixa-fisica/service/baixas.service', () => ({
  baixaFisicaService: {
    baixarNbbpmPdf: vi.fn(),
  },
  downloadBlob: vi.fn(),
}));

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    username: 'gestor',
    nome: 'Gestor',
    email: 'gestor@example.com',
    rf: '1234567',
    is_superuser: false,
    is_gestor_patrimonio: true,
    is_operador_inventario: false,
    must_change_password: false,
    uo_ativa: null,
    ua_ativa: null,
    opcoes_escopo: { grupos: [] },
    ...overrides,
  };
}

function mockAuth(user: User | null) {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: Boolean(user),
    isLoading: false,
    mustChangePassword: false,
    user: user ?? undefined,
    login: vi.fn(),
    logout: vi.fn(),
    isLoggingIn: false,
    loginError: null,
    loginAsync: vi.fn(),
  } as unknown as ReturnType<typeof useAuth>);
}

function makeNbbpmDetail(overrides: Partial<NbbpmDetail> = {}): NbbpmDetail {
  return {
    id: 7,
    numero: '001.0000007/2026',
    numero_processo_baixa: '6016.2026/0000123-4',
    data_autorizacao: '2026-07-17',
    responsavel: 'Maria Responsável',
    numero_processo_destinacao_final: '',
    criado_por: {
      id: 3,
      username: 'gestor',
      nome_completo: 'Gestor Patrimônio',
      email: 'gestor@example.com',
      rf: '7654321',
    },
    data_criacao: new Date(2026, 6, 18, 14, 30).toISOString(),
    baixas: [
      {
        id: 12,
        numero_processo_baixa: '6016.2026/0000123-4',
        unidade_administrativa_origem: {
          id: 5,
          nome: 'Diretoria Regional',
          sigla: 'DRE-BT',
          codigo: '016510',
          status: 'ativa',
        },
        itens: [
          {
            id: 100,
            bem: {
              id: 200,
              numero_patrimonial: '123',
              nome: 'Notebook',
              descricao: '',
              status: 'baixado',
            },
          },
        ],
      },
      {
        id: 13,
        numero_processo_baixa: '6016.2026/0000456-7',
        unidade_administrativa_origem: {
          id: 6,
          nome: 'Escola Municipal X',
          sigla: 'EMEF-X',
          codigo: '016520',
          status: 'ativa',
        },
        itens: [
          {
            id: 101,
            bem: {
              id: 201,
              numero_patrimonial: '456',
              nome: 'Cadeira',
              descricao: '',
              status: 'baixado',
            },
          },
        ],
      },
    ],
    ...overrides,
  };
}

function renderPage(id = '7') {
  return render(
    <MemoryRouter initialEntries={[`/nbbpm/${id}`]}>
      <Routes>
        <Route path='/nbbpm/:id' element={<NbbpmDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('NbbpmDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth(makeUser());
    vi.mocked(nbbpmService.retrieve).mockResolvedValue(makeNbbpmDetail());
    vi.mocked(baixaFisicaService.baixarNbbpmPdf).mockResolvedValue(
      new Blob(['pdf'], { type: 'application/pdf' }),
    );
  });

  it('bloqueia o acesso para quem não tem permissão', async () => {
    mockAuth(makeUser({ is_gestor_patrimonio: false, is_superuser: false }));

    renderPage();

    expect(
      screen.getByText('Você não tem permissão para acessar as Notas de Baixa de Bens Patrimoniais.'),
    ).toBeInTheDocument();
    expect(nbbpmService.retrieve).not.toHaveBeenCalled();
  });

  it('carrega e exibe a identificação da NBBPM', async () => {
    renderPage();

    await waitFor(() => {
      expect(nbbpmService.retrieve).toHaveBeenCalledWith(7);
    });

    expect(
      screen.getByRole('heading', {
        name: 'Visualizar Nota de Baixa de Bem Patrimonial Móvel',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Número: 001.0000007/2026')).toBeInTheDocument();
    expect(screen.getByText('17/07/2026')).toBeInTheDocument();
    expect(screen.getByText('Maria Responsável')).toBeInTheDocument();
    expect(screen.getByTestId('nbbpm-criado-por-value')).toHaveTextContent(
      'Gestor Patrimônio (RF 7654321)',
    );
  });

  it('apresenta cada Baixa Física com sua própria UA e os bens vinculados', async () => {
    renderPage();

    await screen.findByRole('heading', { name: 'Baixas Físicas Vinculadas' });

    const baixa1 = screen.getByTestId('nbbpm-baixa-12');
    const baixa2 = screen.getByTestId('nbbpm-baixa-13');

    expect(within(baixa1).getByText('DRE-BT')).toBeInTheDocument();
    expect(screen.getByText('123 Notebook')).toBeInTheDocument();

    expect(within(baixa2).getByText('EMEF-X')).toBeInTheDocument();
    expect(screen.getByText('456 Cadeira')).toBeInTheDocument();

    const link = screen.getAllByRole('link', { name: 'Visualizar Baixa Física' });
    expect(link).toHaveLength(2);
  });

  it('não oferece nenhuma ação de edição', async () => {
    renderPage();
    await screen.findByText('Número: 001.0000007/2026');

    expect(
      screen.queryByRole('button', { name: /editar|excluir|remover|salvar/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('volta para a listagem pelo botão Voltar', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Número: 001.0000007/2026');

    await user.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(navigateMock).toHaveBeenCalledWith('/nbbpm');
  });

  it('baixa o documento da NBBPM usando o blob retornado pela API', async () => {
    const user = userEvent.setup();
    const { downloadBlob } = await import('../../../baixa-fisica/service/baixas.service');
    renderPage();

    await user.click(await screen.findByRole('button', { name: /Baixar NBBPM/i }));

    await waitFor(() => {
      expect(baixaFisicaService.baixarNbbpmPdf).toHaveBeenCalledWith(7);
      expect(downloadBlob).toHaveBeenCalledWith(
        expect.any(Blob),
        'NBBPM-001.0000007/2026.pdf',
      );
    });
  });

  it('exibe erro e redireciona quando a NBBPM não é encontrada', async () => {
    vi.mocked(nbbpmService.retrieve).mockRejectedValueOnce(new Error('NBBPM não encontrada'));

    renderPage();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('NBBPM não encontrada');
      expect(navigateMock).toHaveBeenCalledWith('/nbbpm');
    });
  });

  it('exibe erro quando o download do documento falha', async () => {
    const user = userEvent.setup();
    vi.mocked(baixaFisicaService.baixarNbbpmPdf).mockRejectedValueOnce(
      new Error('Erro ao baixar NBBPM'),
    );

    renderPage();

    await user.click(await screen.findByRole('button', { name: /Baixar NBBPM/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao baixar NBBPM');
    });
  });

  it('volta direto para a listagem sem chamar a API quando o id é inválido', async () => {
    renderPage('abc');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/nbbpm');
    });
    expect(nbbpmService.retrieve).not.toHaveBeenCalled();
  });

  it('volta direto para a listagem sem chamar a API quando o id é vazio', async () => {
    renderPage(' ');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/nbbpm');
    });
    expect(nbbpmService.retrieve).not.toHaveBeenCalled();
  });

  it('mostra traço quando a Baixa Física não tem bens ou UA', async () => {
    vi.mocked(nbbpmService.retrieve).mockResolvedValue(
      makeNbbpmDetail({
        baixas: [
          {
            id: 12,
            numero_processo_baixa: null,
            // @ts-expect-error simula backend enviando null em vez de [] / objeto ausente
            unidade_administrativa_origem: null,
            // @ts-expect-error simula backend enviando null em vez de []
            itens: null,
          },
        ],
      }),
    );

    renderPage();

    const baixa1 = await screen.findByTestId('nbbpm-baixa-12');
    expect(within(baixa1).getByText('Nenhum bem encontrado.')).toBeInTheDocument();
    expect(within(baixa1).getAllByText('-').length).toBeGreaterThan(0);
  });

  it('mostra traço quando um item vem sem bem vinculado', async () => {
    vi.mocked(nbbpmService.retrieve).mockResolvedValue(
      makeNbbpmDetail({
        baixas: [
          {
            id: 12,
            numero_processo_baixa: '6016.2026/0000123-4',
            unidade_administrativa_origem: {
              id: 5,
              nome: 'Diretoria Regional',
              sigla: 'DRE-BT',
              codigo: '016510',
              status: 'ativa',
            },
            // @ts-expect-error simula backend enviando bem nulo
            itens: [{ id: 100, bem: null }],
          },
        ],
      }),
    );

    renderPage();

    const baixa1 = await screen.findByTestId('nbbpm-baixa-12');
    expect(within(baixa1).getByText('-')).toBeInTheDocument();
  });

  it('mostra mensagem padrão quando a NBBPM não tem Baixas vinculadas (lista nula)', async () => {
    vi.mocked(nbbpmService.retrieve).mockResolvedValue(
      // @ts-expect-error simula backend enviando null em vez de []
      makeNbbpmDetail({ baixas: null }),
    );

    renderPage();

    expect(await screen.findByText('Nenhuma Baixa Física vinculada.')).toBeInTheDocument();
  });

  it('limpa a nota anterior e volta a carregar ao trocar de id pela URL', async () => {
    const user = userEvent.setup();

    function Harness() {
      return (
        <div>
          <Link to='/nbbpm/9'>Ir para a nota 9</Link>
          <NbbpmDetailPage />
        </div>
      );
    }

    render(
      <MemoryRouter initialEntries={['/nbbpm/7']}>
        <Routes>
          <Route path='/nbbpm/:id' element={<Harness />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText('Número: 001.0000007/2026');

    let resolveSegunda: (value: NbbpmDetail) => void = () => {};
    vi.mocked(nbbpmService.retrieve).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSegunda = resolve;
      }),
    );

    await user.click(screen.getByRole('link', { name: 'Ir para a nota 9' }));

    expect(screen.queryByText('Número: 001.0000007/2026')).not.toBeInTheDocument();
    expect(screen.getByTestId('loader')).toBeInTheDocument();

    resolveSegunda(makeNbbpmDetail({ id: 9, numero: '001.0000009/2026' }));

    await waitFor(() => {
      expect(screen.getByText('Número: 001.0000009/2026')).toBeInTheDocument();
    });
  });
});
