import { AxiosError, AxiosHeaders } from 'axios';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdicionarConciliacaoPage from '../AdicionarConciliacaoPage';

vi.mock('../../components/DatepickerConciliacao', () => ({
  DatepickerConciliacao: ({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (value: string) => void;
    label: string;
  }) => (
    <div>
      <label htmlFor='mock-datepicker'>{label}</label>
      <input
        id='mock-datepicker'
        aria-label='Período Final'
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  ),
}));

const navigateMock = vi.fn();
const createMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
const hookState = {
  isPending: false,
};

function buildAxiosError(status: number, data: unknown, message = 'Request failed') {
  const error = new AxiosError(message);
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
      is_superuser: false,
      is_gestor_patrimonio: true,
      is_operador_inventario: true,
      uo_ativa: { id: 1, codigo: '00.00.00', nome: 'UO TESTE', label: '00.00.00 - UO TESTE' },
      ua_ativa: { id: 7, codigo: '00.00.00.002', nome: 'COTIC', label: '00.00.00.002 - COTIC' },
    },
  }),
}));

vi.mock('../../hooks/useConciliacoes', () => ({
  useConciliacaoCreate: () => ({
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

function fillPeriodoFinal() {
  fireEvent.change(screen.getByLabelText('Período Final'), {
    target: { value: '31/12/2025' },
  });
}

describe('AdicionarConciliacaoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState.isPending = false;
  });

  it('renderiza titulo, breadcrumb, campos readonly e datepicker', () => {
    render(
      <MemoryRouter>
        <AdicionarConciliacaoPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Adicionar Conciliação' })).toBeInTheDocument();

    const uaInput = screen.getByLabelText('Unidade Administrativa') as HTMLInputElement;
    expect(uaInput.value).toBe('00.00.00.002 - COTIC');

    const tipoInput = screen.getByLabelText('Tipo') as HTMLInputElement;
    expect(tipoInput.value).toBe('Eventual');

    expect(screen.getByLabelText('Período Final')).toBeInTheDocument();
  });

  it('nao exibe erro visual no campo de data ao abrir a tela', () => {
    render(
      <MemoryRouter>
        <AdicionarConciliacaoPage />
      </MemoryRouter>,
    );

    const input = screen.getByLabelText('Período Final') as HTMLInputElement;
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.queryByText('Data final do período da conciliação é obrigatória.'),
    ).not.toBeInTheDocument();
  });

  it('mantem o botao Salvar desabilitado ate o formulario estar valido', async () => {
    render(
      <MemoryRouter>
        <AdicionarConciliacaoPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    fillPeriodoFinal();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
    });
  });

  it('envia payload correto, exibe toast e redireciona para a listagem em caso de sucesso', async () => {
    createMock.mockResolvedValueOnce({ id: 1 });

    render(
      <MemoryRouter>
        <AdicionarConciliacaoPage />
      </MemoryRouter>,
    );

    fillPeriodoFinal();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith({
        unidade_administrativa: 7,
        periodo_final: '2025-12-31',
      });
      expect(toastSuccessMock).toHaveBeenCalledWith(
        'Cadastro realizado com sucesso!',
        expect.objectContaining({
          description: expect.stringContaining('A Conciliação foi adicionada com sucesso'),
        }),
      );
      expect(navigateMock).toHaveBeenCalledWith('/conciliacoes');
    });
  });

  it('exibe erro de campo do backend com texto estatico e mensagem do backend no toast', async () => {
    createMock.mockRejectedValueOnce(
      buildAxiosError(400, {
        periodo_final: ['Data final invalida.'],
      }),
    );

    render(
      <MemoryRouter>
        <AdicionarConciliacaoPage />
      </MemoryRouter>,
    );

    fillPeriodoFinal();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(screen.getByText('Data final do período da conciliação.')).toBeInTheDocument();
      expect(screen.queryByText('Data final invalida.')).not.toBeInTheDocument();
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Não foi possível criar a conciliação.',
        expect.objectContaining({ description: 'Data final invalida.' }),
      );
    });
  });

  it('exibe erro de conciliacao em aberto com texto estatico no campo e mensagem do backend no toast', async () => {
    const backendMessage =
      'Já existe uma conciliação em aberto para esta Unidade Administrativa. Feche a conciliação anterior para criar uma nova.';

    createMock.mockRejectedValueOnce(
      buildAxiosError(400, {
        unidade_administrativa: [backendMessage],
      }),
    );

    render(
      <MemoryRouter>
        <AdicionarConciliacaoPage />
      </MemoryRouter>,
    );

    fillPeriodoFinal();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(screen.getByText('Data final do período da conciliação.')).toBeInTheDocument();
      expect(screen.queryByText(backendMessage)).not.toBeInTheDocument();
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Não foi possível criar a conciliação.',
        expect.objectContaining({ description: backendMessage }),
      );
    });
  });

  it('exibe mensagem amigavel quando o backend retorna 400 sem corpo interpretavel', async () => {
    createMock.mockRejectedValueOnce(
      buildAxiosError(400, {}, 'Request failed with status code 400'),
    );

    render(
      <MemoryRouter>
        <AdicionarConciliacaoPage />
      </MemoryRouter>,
    );

    fillPeriodoFinal();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Não foi possível criar a conciliação.',
        expect.objectContaining({
          description: expect.stringContaining('Tente novamente'),
        }),
      );
      const description = toastErrorMock.mock.calls[0]?.[1]?.description as string | undefined;
      expect(description).not.toContain('Request failed');
    });
  });

  it('volta para a listagem ao clicar em Cancelar', () => {
    render(
      <MemoryRouter>
        <AdicionarConciliacaoPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(navigateMock).toHaveBeenCalledWith('/conciliacoes');
  });

  it('exibe estado de carregamento enquanto o cadastro esta em andamento', () => {
    hookState.isPending = true;

    render(
      <MemoryRouter>
        <AdicionarConciliacaoPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled();
  });
});
