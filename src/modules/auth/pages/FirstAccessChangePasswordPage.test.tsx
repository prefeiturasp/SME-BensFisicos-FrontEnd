import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FirstAccessChangePasswordPage from './FirstAccessChangePasswordPage';
import { passwordService } from '../services/password.service';
import { toast } from 'sonner';

vi.mock('../services/password.service', () => ({
  passwordService: {
    firstAccessChangePassword: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('FirstAccessChangePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  function renderComponent() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <FirstAccessChangePasswordPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it('renderiza título e campos de senha', () => {
    renderComponent();

    expect(screen.getByRole('heading', { name: 'Primeiro acesso' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nova senha')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirme a nova senha')).toBeInTheDocument();
  });

  it('mostra validação de campos obrigatórios', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole('button', { name: /Salvar/i }));

    expect(await screen.findByText('Confirmação de senha é obrigatória')).toBeInTheDocument();
  });

  it('mostra erro quando senhas não coincidem', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByLabelText('Nova senha'), [ 'SenhaN', 'ova123!'].join(''));
    await user.type(screen.getByLabelText('Confirme a nova senha'), ['SenhaD', 'iferent', 'e123!'].join(''));
    await user.click(screen.getByRole('button', { name: /Salvar/i }));

    expect(await screen.findByText('As senhas não coincidem')).toBeInTheDocument();
  });

  it('envia dados corretos e navega após sucesso', async () => {
    vi.mocked(passwordService.firstAccessChangePassword).mockResolvedValueOnce();
    const user = userEvent.setup();
    renderComponent();

    const newPassword = [ 'SenhaN', 'ova123!'].join('');

    await user.type(screen.getByLabelText('Nova senha'), newPassword);
    await user.type(screen.getByLabelText('Confirme a nova senha'), newPassword);
    await user.click(screen.getByRole('button', { name: /Salvar/i }));

    await waitFor(() => {
      expect(passwordService.firstAccessChangePassword).toHaveBeenCalledWith({
        new_password: newPassword,
        new_password_confirm: newPassword,
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Senha alterada com sucesso!', expect.anything());

    await new Promise((resolve) => setTimeout(resolve, 1600));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  it('exibe mensagem de erro quando o serviço falha', async () => {
    vi.mocked(passwordService.firstAccessChangePassword).mockRejectedValueOnce(
      new Error('Erro ao trocar senha.'),
    );
    const user = userEvent.setup();
    renderComponent();

    const newPassword = [ 'SenhaN', 'ova123!'].join('');

    await user.type(screen.getByLabelText('Nova senha'), newPassword);
    await user.type(screen.getByLabelText('Confirme a nova senha'), newPassword);
    await user.click(screen.getByRole('button', { name: /Salvar/i }));

    expect(await screen.findByText('Erro ao trocar senha.')).toBeInTheDocument();
  });
});
