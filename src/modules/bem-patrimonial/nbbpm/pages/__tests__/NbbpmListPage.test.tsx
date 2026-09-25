import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '@/auth/useAuth';
import type { User } from '@/auth/auth.service';
import NbbpmListPage from '../NbbpmListPage';
import { nbbpmService } from '../../services/nbbpm.service';
import type { NbbpmListItem, NbbpmPaginatedResponse } from '../../types/nbbpm.types';

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
  },
}));

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const DEFAULT_ORDERING = '-data_criacao,-numero';

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

function makeNbbpm(overrides: Partial<NbbpmListItem> = {}): NbbpmListItem {
  return {
    id: 1,
    numero: '001.0000001/2026',
    baixas: [12],
    unidade_administrativa_origem: {
      id: 5,
      nome: 'Diretoria Regional',
      sigla: 'DRE-BT',
      codigo: '016510',
      status: 'ativa',
    },
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
    ...overrides,
  };
}

function makeResponse(results: NbbpmListItem[], count = results.length): NbbpmPaginatedResponse {
  return { count, next: null, previous: null, results };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <NbbpmListPage />
    </MemoryRouter>,
  );
}

function lastListCall() {
  const calls = vi.mocked(nbbpmService.list).mock.calls;
  return calls[calls.length - 1][0];
}

describe('NbbpmListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockAuth(makeUser());
    vi.mocked(nbbpmService.list).mockResolvedValue(makeResponse([makeNbbpm()]));
  });

  describe('estrutura da tela', () => {
    it('exibe título, breadcrumb e cabeçalhos da listagem', async () => {
      renderPage();

      expect(
        screen.getByRole('heading', { name: 'Notas de Baixa de Bens Patrimoniais (NBBPM)' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Bem Patrimonial')).toBeInTheDocument();
      expect(screen.getByText('NBBPMs Geradas')).toBeInTheDocument();

      for (const header of [
        'Número da NBBPM',
        'Nº do Processo de Baixa',
        'Unidade Administrativa',
        'Data da Autorização',
        'Gerada por',
        'Data de Criação',
      ]) {
        expect(screen.getByRole('columnheader', { name: header })).toBeInTheDocument();
      }

      await screen.findByText('001.0000001/2026');
    });

    it('volta para a Home pelo botão Voltar', async () => {
      const user = userEvent.setup();
      renderPage();
      await screen.findByText('001.0000001/2026');

      await user.click(screen.getByRole('button', { name: 'Voltar' }));

      expect(navigateMock).toHaveBeenCalledWith('/home');
    });

    it('é somente consulta: não oferece ações de criar, gerar, editar ou excluir', async () => {
      renderPage();
      await screen.findByText('001.0000001/2026');

      expect(
        screen.queryByRole('button', { name: /adicionar|gerar|novo|editar|excluir|remover/i }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });
  });

  describe('dados exibidos', () => {
    it('apresenta as informações de identificação de cada NBBPM', async () => {
      renderPage();

      const row = (await screen.findByText('001.0000001/2026')).closest('tr') as HTMLElement;

      expect(within(row).getByText('6016.2026/0000123-4')).toBeInTheDocument();
      expect(within(row).getByText('DRE-BT')).toBeInTheDocument();
      expect(within(row).getByText('17/07/2026')).toBeInTheDocument();
      expect(within(row).getByText('Gestor Patrimônio (RF 7654321)')).toBeInTheDocument();
      expect(within(row).getByText('18/07/2026 - 14:30')).toBeInTheDocument();
    });

    it('mantém o vínculo com a Baixa Física por link para o detalhe', async () => {
      renderPage();

      const link = await screen.findByRole('link', { name: 'Visualizar Baixa Física 12' });

      expect(link).toHaveAttribute('href', '/baixas-fisicas/12');
      expect(link).toHaveTextContent('#012');
    });

    it('exibe todas as Baixas Físicas quando a NBBPM é de um lote', async () => {
      vi.mocked(nbbpmService.list).mockResolvedValue(
        makeResponse([makeNbbpm({ baixas: [3, 4, 25] })]),
      );

      renderPage();

      const links = await screen.findAllByRole('link', { name: /Visualizar Baixa Física/ });

      expect(links.map((link) => link.getAttribute('href'))).toEqual([
        '/baixas-fisicas/3',
        '/baixas-fisicas/4',
        '/baixas-fisicas/25',
      ]);
      expect(links.map((link) => link.textContent)).toEqual(['#003', '#004', '#025']);
    });

    it('usa placeholder quando não há Baixa vinculada nem Unidade Administrativa', async () => {
      vi.mocked(nbbpmService.list).mockResolvedValue(
        makeResponse([makeNbbpm({ baixas: [], unidade_administrativa_origem: null })]),
      );

      renderPage();

      const row = (await screen.findByText('001.0000001/2026')).closest('tr') as HTMLElement;

      expect(within(row).queryByRole('link')).not.toBeInTheDocument();
      expect(within(row).getAllByText('-')).toHaveLength(2);
    });

    it('usa o nome da UA quando a sigla não está disponível', async () => {
      vi.mocked(nbbpmService.list).mockResolvedValue(
        makeResponse([
          makeNbbpm({
            unidade_administrativa_origem: {
              id: 5,
              nome: 'Diretoria Regional',
              sigla: '',
              codigo: '016510',
              status: 'ativa',
            },
          }),
        ]),
      );

      renderPage();

      expect(await screen.findByText('Diretoria Regional')).toBeInTheDocument();
    });

    it('mostra a autoria de forma explícita quando o RF não vem do backend', async () => {
      vi.mocked(nbbpmService.list).mockResolvedValue(
        makeResponse([
          makeNbbpm({
            criado_por: {
              id: 3,
              username: 'gestor',
              nome_completo: 'Gestor Patrimônio',
              email: 'gestor@example.com',
            },
          }),
        ]),
      );

      renderPage();

      expect(await screen.findByText('Gestor Patrimônio')).toBeInTheDocument();
    });

    it('exibe somente registros retornados pela API (sem duplicar ou criar)', async () => {
      vi.mocked(nbbpmService.list).mockResolvedValue(
        makeResponse([
          makeNbbpm({ id: 1, numero: '001.0000002/2026' }),
          makeNbbpm({ id: 2, numero: '001.0000001/2026' }),
        ]),
      );

      renderPage();

      await screen.findByText('001.0000002/2026');
      const bodyRows = screen
        .getAllByRole('row')
        .filter((row) => within(row).queryAllByRole('columnheader').length === 0);

      expect(bodyRows).toHaveLength(2);
    });
  });

  describe('consulta e ordenação', () => {
    it('carrega a primeira página com a ordenação inicial por data de criação e número', async () => {
      renderPage();
      await screen.findByText('001.0000001/2026');

      expect(nbbpmService.list).toHaveBeenCalledTimes(1);
      expect(nbbpmService.list).toHaveBeenCalledWith({
        page: 1,
        pageSize: 10,
        search: undefined,
        ordering: DEFAULT_ORDERING,
      });
    });

    it('indica a coluna ordenada inicialmente (Data de Criação, decrescente)', async () => {
      renderPage();
      await screen.findByText('001.0000001/2026');

      expect(screen.getByRole('columnheader', { name: 'Data de Criação' })).toHaveAttribute(
        'aria-sort',
        'descending',
      );
      expect(screen.getByRole('columnheader', { name: 'Data da Autorização' })).toHaveAttribute(
        'aria-sort',
        'none',
      );
    });

    it('alterna a ordenação ao clicar na coluna e mantém o número como desempate', async () => {
      const user = userEvent.setup();
      renderPage();
      await screen.findByText('001.0000001/2026');

      await user.click(screen.getByRole('button', { name: 'Data de Criação' }));
      await waitFor(() =>
        expect(lastListCall()).toMatchObject({ ordering: 'data_criacao,numero' }),
      );
      expect(screen.getByRole('columnheader', { name: 'Data de Criação' })).toHaveAttribute(
        'aria-sort',
        'ascending',
      );

      await user.click(screen.getByRole('button', { name: 'Data de Criação' }));
      await waitFor(() => expect(lastListCall()).toMatchObject({ ordering: DEFAULT_ORDERING }));

      await user.click(screen.getByRole('button', { name: 'Data da Autorização' }));
      await waitFor(() =>
        expect(lastListCall()).toMatchObject({ ordering: 'data_autorizacao,numero' }),
      );
    });

    it('busca com atraso, envia o termo e volta para a primeira página', async () => {
      const user = userEvent.setup();
      renderPage();
      await screen.findByText('001.0000001/2026');

      await user.type(
        screen.getByLabelText('Buscar por NBBPM, Nº do Processo ou Unidade Administrativa'),
        '  6016  ',
      );

      await waitFor(() => expect(lastListCall()).toMatchObject({ search: '6016', page: 1 }));
    });
  });

  describe('paginação', () => {
    it('navega entre páginas e desabilita "Página anterior" na primeira', async () => {
      const user = userEvent.setup();
      vi.mocked(nbbpmService.list).mockResolvedValue(makeResponse([makeNbbpm()], 25));

      renderPage();
      await screen.findByText('001.0000001/2026');

      expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Próxima página' }));

      await waitFor(() => expect(lastListCall()).toMatchObject({ page: 2 }));

      await user.click(screen.getByRole('button', { name: '3' }));

      await waitFor(() => expect(lastListCall()).toMatchObject({ page: 3 }));
      expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled();

      await user.click(screen.getByRole('button', { name: 'Página anterior' }));

      await waitFor(() => expect(lastListCall()).toMatchObject({ page: 2 }));
    });
  });

  describe('estados', () => {
    it('exibe "Carregando..." enquanto a consulta está em andamento', () => {
      vi.mocked(nbbpmService.list).mockReturnValue(new Promise(() => undefined));

      renderPage();

      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('exibe o estado de ausência de registros no padrão do sistema', async () => {
      vi.mocked(nbbpmService.list).mockResolvedValue(makeResponse([]));

      renderPage();

      expect(await screen.findByText('Nenhuma NBBPM encontrada.')).toBeInTheDocument();
      expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
      expect(screen.queryByText('Não foi possível carregar as NBBPMs.')).not.toBeInTheDocument();
    });

    it('informa a falha da consulta sem confundir com ausência de registros', async () => {
      vi.mocked(nbbpmService.list).mockRejectedValue(new Error('Erro de conexão com o servidor.'));

      renderPage();

      expect(await screen.findByText('Não foi possível carregar as NBBPMs.')).toBeInTheDocument();
      expect(screen.queryByText('Nenhuma NBBPM encontrada.')).not.toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Erro de conexão com o servidor.');
    });

    it('usa mensagem padrão no toast quando o erro não é uma Error', async () => {
      vi.mocked(nbbpmService.list).mockRejectedValue('falha');

      renderPage();

      await screen.findByText('Não foi possível carregar as NBBPMs.');
      expect(toast.error).toHaveBeenCalledWith('Erro ao listar NBBPMs.');
    });
  });

  describe('permissões', () => {
    it('permite superusuário', async () => {
      mockAuth(makeUser({ is_superuser: true, is_gestor_patrimonio: false }));

      renderPage();

      expect(await screen.findByText('001.0000001/2026')).toBeInTheDocument();
    });

    it('bloqueia perfis sem acesso e não consulta a API', () => {
      mockAuth(makeUser({ is_gestor_patrimonio: false, is_operador_inventario: true }));

      renderPage();

      expect(
        screen.getByText(
          'Você não tem permissão para acessar as Notas de Baixa de Bens Patrimoniais.',
        ),
      ).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      expect(nbbpmService.list).not.toHaveBeenCalled();
    });

    it('bloqueia usuário não carregado e não consulta a API', () => {
      mockAuth(null);

      renderPage();

      expect(
        screen.getByText(
          'Você não tem permissão para acessar as Notas de Baixa de Bens Patrimoniais.',
        ),
      ).toBeInTheDocument();
      expect(nbbpmService.list).not.toHaveBeenCalled();
    });
  });
});
