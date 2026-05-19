import { AxiosError, AxiosHeaders } from 'axios';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UnidadesOrcamentariasCreatePage from '../UnidadesOrcamentariasCreatePage';

const navigateMock = vi.fn();
const createMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const hookState = {
  isPending: false,
};

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
    isLoading: false,
    user: {
      is_superuser: true,
    },
  }),
}));

vi.mock('../../hooks/useUnidadeOrcamentaria', () => ({
  useUnidadeOrcamentariaCreate: () => ({
    mutateAsync: (...args: unknown[]) => createMock(...args),
    isPending: hookState.isPending,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

describe('UnidadesOrcamentariasCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState.isPending = false;
  });

  it('renderiza formulário de criação', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasCreatePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Adicionar Unidade Orçamentária' })).toBeInTheDocument();
    expect(screen.getByLabelText('Código da UO')).toBeInTheDocument();
    expect(screen.getByLabelText('Sigla da UO')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome da UO')).toBeInTheDocument();
    expect(screen.getByLabelText('Sigla do órgão')).toBeInTheDocument();
    expect(screen.getByLabelText('Código do órgão')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do órgão')).toBeInTheDocument();
  });

  it('envia payload correto e redireciona em caso de sucesso', async () => {
    createMock.mockResolvedValueOnce({ id: 1 });

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasCreatePage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Código da UO'), { target: { value: '60.60.60' } });
    fireEvent.change(screen.getByLabelText('Sigla da UO'), { target: { value: 'uo60' } });
    fireEvent.change(screen.getByLabelText('Nome da UO'), { target: { value: 'uo 60' } });
    fireEvent.change(screen.getByLabelText('Sigla do órgão'), { target: { value: 'sme' } });
    fireEvent.change(screen.getByLabelText('Código do órgão'), { target: { value: '6060' } });
    fireEvent.change(screen.getByLabelText('Nome do órgão'), { target: { value: 'secretaria externa 60' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith({
        codigo: '60.60.60',
        sigla: 'UO60',
        nome: 'UO 60',
        sigla_orgao: 'SME',
        orgao: 'SECRETARIA EXTERNA 60',
        codigo_orgao: '60.60',
        ativa: true,
      });
      expect(toastSuccessMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith('/unidades-orcamentarias');
    });
  });

  it('valida o código do órgão no padrão 00.00 quando informado', async () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasCreatePage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Código da UO'), { target: { value: '60.60' } });
    fireEvent.change(screen.getByLabelText('Sigla da UO'), { target: { value: 'UO60' } });
    fireEvent.change(screen.getByLabelText('Nome da UO'), { target: { value: 'UO 60' } });
    fireEvent.change(screen.getByLabelText('Código do órgão'), { target: { value: '606' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(screen.getByText('Informe o código do órgão no padrão 00.00.')).toBeInTheDocument();
      expect(createMock).not.toHaveBeenCalled();
    });
  });

  it('exibe erros de campo vindos do backend (400)', async () => {
    createMock.mockRejectedValueOnce(
      buildAxiosError(400, {
        codigo: ['Código de UO já utilizado em outro registro.'],
      }),
    );

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasCreatePage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Código da UO'), { target: { value: '60.60.60' } });
    fireEvent.change(screen.getByLabelText('Sigla da UO'), { target: { value: 'UO60' } });
    fireEvent.change(screen.getByLabelText('Nome da UO'), { target: { value: 'UO 60' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Corrija os campos destacados para continuar.');
      expect(
        screen.getByText('Código de UO já utilizado em outro registro.'),
      ).toBeInTheDocument();
    });
  });

  it('volta para a listagem ao clicar em Cancelar', () => {
    render(
      <MemoryRouter>
        <UnidadesOrcamentariasCreatePage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(navigateMock).toHaveBeenCalledWith('/unidades-orcamentarias');
  });

  it('exibe estado de carregamento enquanto o cadastro está em andamento', () => {
    hookState.isPending = true;

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasCreatePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled();
  });

  it('exibe erro inesperado retornado como Error', async () => {
    createMock.mockRejectedValueOnce(new Error('Erro inesperado ao cadastrar UO.'));

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasCreatePage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Código da UO'), { target: { value: '60.60.60' } });
    fireEvent.change(screen.getByLabelText('Sigla da UO'), { target: { value: 'UO60' } });
    fireEvent.change(screen.getByLabelText('Nome da UO'), { target: { value: 'UO 60' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Erro inesperado ao cadastrar UO.');
      expect(screen.getByText('Erro inesperado ao cadastrar UO.')).toBeInTheDocument();
    });
  });

  it('exibe mensagem padrão quando ocorre falha não tratável', async () => {
    createMock.mockRejectedValueOnce({ status: 500 });

    render(
      <MemoryRouter>
        <UnidadesOrcamentariasCreatePage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Código da UO'), { target: { value: '60.60.60' } });
    fireEvent.change(screen.getByLabelText('Sigla da UO'), { target: { value: 'UO60' } });
    fireEvent.change(screen.getByLabelText('Nome da UO'), { target: { value: 'UO 60' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Erro ao cadastrar unidade orçamentária.');
      expect(screen.getByText('Erro ao cadastrar unidade orçamentária.')).toBeInTheDocument();
    });
  });
});