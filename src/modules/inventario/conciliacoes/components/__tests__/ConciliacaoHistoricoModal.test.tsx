import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConciliacaoHistoricoModal } from '../ConciliacaoHistoricoModal';
import { conciliacoesService } from '../../services/conciliacoes.service';

vi.mock('../../services/conciliacoes.service', () => ({
  conciliacoesService: {
    historico: vi.fn(),
  },
}));

const onCloseMock = vi.fn();

function renderModal(conciliacaoId = 42) {
  return render(
    <ConciliacaoHistoricoModal
      conciliacaoId={conciliacaoId}
      onClose={onCloseMock}
    />,
  );
}

describe('ConciliacaoHistoricoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega o historico e renderiza os grupos', async () => {
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
      {
        alterado_em: '2026-03-12T10:00:00Z',
        alterado_por: 2,
        alterado_por_nome: 'João da Silva',
        acoes: [
          {
            campo: 'status',
            valor_antigo: 'em_aberto',
            valor_novo: 'Fechada',
            justificativa: 'Conciliação finalizada via API',
          },
          {
            campo: 'fechado_por',
            valor_antigo: '',
            valor_novo: 'João da Silva (RF 7654321)',
            justificativa: 'Conciliação finalizada via API',
          },
        ],
      },
    ]);

    renderModal(1);

    await waitFor(() => {
      expect(conciliacoesService.historico).toHaveBeenCalledWith(1);
    });

    expect(await screen.findByTestId('conciliacao-historico-modal')).toBeInTheDocument();
    expect(screen.getByText('Conciliação criada')).toBeInTheDocument();
    expect(screen.getAllByText(/Usuário:\s*Maria José/).length).toBeGreaterThan(0);
  });

  it('exibe estado de carregamento inicial', () => {
    vi.mocked(conciliacoesService.historico).mockReturnValueOnce(
      new Promise(() => undefined),
    );

    renderModal(99);

    expect(screen.getByTestId('conciliacao-historico-loading')).toBeInTheDocument();
  });

  it('exibe estado vazio quando o historico nao tem registros', async () => {
    vi.mocked(conciliacoesService.historico).mockResolvedValueOnce([]);

    renderModal(7);

    expect(await screen.findByTestId('conciliacao-historico-empty')).toBeInTheDocument();
  });

  it('exibe mensagem de erro quando o service falha', async () => {
    vi.mocked(conciliacoesService.historico).mockRejectedValueOnce(
      new Error('Falha ao buscar histórico'),
    );

    renderModal(7);

    expect(await screen.findByTestId('conciliacao-historico-error')).toHaveTextContent(
      'Falha ao buscar histórico',
    );
  });

  it('seleciona um grupo diferente ao clicar em outra entrada da lista', async () => {
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
            justificativa: 'Conciliação criada',
          },
        ],
      },
      {
        alterado_em: '2026-03-12T10:00:00Z',
        alterado_por: 2,
        alterado_por_nome: 'João da Silva',
        acoes: [
          {
            campo: 'status',
            valor_antigo: 'em_aberto',
            valor_novo: 'Fechada',
            justificativa: '',
          },
        ],
      },
    ]);

    renderModal(1);

    await screen.findByTestId('conciliacao-historico-modal');

    const buttonJoao = await screen.findByRole('button', { name: /João da Silva/ });
    fireEvent.click(buttonJoao);

    expect(await screen.findByText('Conciliação finalizada')).toBeInTheDocument();
    expect(screen.getByText('Campo "status": em_aberto → Fechada')).toBeInTheDocument();
  });

  it('fecha o modal ao clicar no botao de fechar', async () => {
    vi.mocked(conciliacoesService.historico).mockResolvedValueOnce([]);

    renderModal(1);

    await waitFor(() => {
      expect(conciliacoesService.historico).toHaveBeenCalled();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Fechar histórico' }));
    });

    expect(onCloseMock).toHaveBeenCalled();
  });
});
