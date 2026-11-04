import { AxiosError, AxiosHeaders } from 'axios';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/auth/auth.service';
import UnidadesAdministrativasCreatePage from '../UnidadesAdministrativasCreatePage';

const navigateMock = vi.fn();
const createMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

const baseUser: User = {
  id: 7,
  username: 'gestor',
  nome: 'Gestor',
  email: 'gestor@sme.sp.gov.br',
  rf: '123',
  is_gestor_patrimonio: true,
  is_operador_inventario: false,
  must_change_password: false,
  uo_ativa: {
    id: 11,
    codigo: '01.16.10',
    nome: 'SECRETARIA MUNICIPAL DE EDUCAÇÃO',
    label: '01.16.10 - SECRETARIA MUNICIPAL DE EDUCAÇÃO',
  },
  ua_ativa: null,
  opcoes_escopo: { grupos: [] },
};

let mockUser: User = baseUser;

function buildAxiosError(status: number, data: unknown) {
  const error = new AxiosError('Request failed');
  error.response = {
    status,
    statusText: String(status),
    headers: {},
    data,
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/auth/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

vi.mock('../../services/unidades-administrativas.service', () => ({
  unidadesAdministrativasService: {
    create: (...args: unknown[]) => createMock(...args),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

describe('UnidadesAdministrativasCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = structuredClone(baseUser);
  });

  it('envia payload correto e redireciona em caso de sucesso', async () => {
    createMock.mockResolvedValueOnce({ id: 1 });

    render(
      <MemoryRouter>
        <UnidadesAdministrativasCreatePage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Código (final)'), { target: { value: '286' } });
    fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: 'dipat' } });
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'DIVISÃO DE PATRIMÔNIO' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith({
        unidade_orcamentaria: 11,
        codigo: '01.16.10.286',
        sigla: 'DIPAT',
        nome: 'DIVISÃO DE PATRIMÔNIO',
        status: 'ativa',
      });

      expect(toastSuccessMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith('/unidades-administrativas');
    });
  });

  it('valida código final com exatamente 3 dígitos', async () => {
    render(
      <MemoryRouter>
        <UnidadesAdministrativasCreatePage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Código (final)'), { target: { value: '28' } });
    fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: 'DIPAT' } });
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Divisão de Patrimônio' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(screen.getByText('Informe exatamente 3 dígitos numéricos.')).toBeInTheDocument();
      expect(createMock).not.toHaveBeenCalled();
    });
  });

  it('impede submit quando usuário não possui UO ativa no escopo', async () => {
    mockUser = {
      ...baseUser,
      uo_ativa: null,
    };

    render(
      <MemoryRouter>
        <UnidadesAdministrativasCreatePage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Código (final)'), { target: { value: '286' } });
    fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: 'DIPAT' } });
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Divisão de Patrimônio' },
    });

    fireEvent.submit(document.querySelector('form') as HTMLFormElement);

    await waitFor(() => {
      expect(createMock).not.toHaveBeenCalled();
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Não foi possível identificar a Unidade Orçamentária do seu escopo.',
      );
      expect(
        screen.getByText('Não foi possível identificar a Unidade Orçamentária do seu escopo.'),
      ).toBeInTheDocument();
    });
  });

  it('exibe erros de campo vindos do backend (400)', async () => {
    createMock.mockRejectedValueOnce(
      buildAxiosError(400, {
        codigo: ['Código de UA já utilizado em outro registro.'],
      }),
    );

    render(
      <MemoryRouter>
        <UnidadesAdministrativasCreatePage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Código (final)'), { target: { value: '286' } });
    fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: 'DIPAT' } });
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Divisão de Patrimônio' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Corrija os campos destacados para continuar.');
      expect(
        screen.getByText('Código de UA já utilizado em outro registro.'),
      ).toBeInTheDocument();
    });
  });

  it('exibe mensagem detail do backend (400) como erro geral', async () => {
    createMock.mockRejectedValueOnce(
      buildAxiosError(400, {
        detail: 'Você não possui permissão para cadastrar nesta UO.',
      }),
    );

    render(
      <MemoryRouter>
        <UnidadesAdministrativasCreatePage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Código (final)'), { target: { value: '286' } });
    fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: 'DIPAT' } });
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Divisão de Patrimônio' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Você não possui permissão para cadastrar nesta UO.');
      expect(
        screen.getByText('Você não possui permissão para cadastrar nesta UO.'),
      ).toBeInTheDocument();
    });
  });

  it('exibe erro de unidade orçamentária retornado pelo backend', async () => {
    createMock.mockRejectedValueOnce(
      buildAxiosError(400, {
        unidade_orcamentaria: ['Unidade Orçamentária fora do escopo do gestor.'],
      }),
    );

    render(
      <MemoryRouter>
        <UnidadesAdministrativasCreatePage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Código (final)'), { target: { value: '286' } });
    fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: 'DIPAT' } });
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Divisão de Patrimônio' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Unidade Orçamentária fora do escopo do gestor.');
      expect(
        screen.getByText('Unidade Orçamentária fora do escopo do gestor.'),
      ).toBeInTheDocument();
    });
  });

  it('exibe erro genérico quando falha inesperada ocorre', async () => {
    createMock.mockRejectedValueOnce(new Error('Erro inesperado ao cadastrar.'));

    render(
      <MemoryRouter>
        <UnidadesAdministrativasCreatePage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Código (final)'), { target: { value: '286' } });
    fireEvent.change(screen.getByLabelText('Sigla'), { target: { value: 'DIPAT' } });
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Divisão de Patrimônio' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Erro inesperado ao cadastrar.');
      expect(screen.getByText('Erro inesperado ao cadastrar.')).toBeInTheDocument();
    });
  });
});
