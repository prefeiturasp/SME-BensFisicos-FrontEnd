import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MovimentacaoHistoricoModal } from './MovimentacaoHistoricoModal';
import { movimentacaoService } from '../services/movimentacao.service';

vi.mock('../services/movimentacao.service', () => ({
  movimentacaoService: {
    historico: vi.fn(),
  },
}));

const onCloseMock = vi.fn();

function renderModal(id = 1) {
  return render(<MovimentacaoHistoricoModal movimentacaoId={id} onClose={onCloseMock} />);
}

describe('MovimentacaoHistoricoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exibe linha do tempo com situação, data e responsável', async () => {
    vi.mocked(movimentacaoService.historico).mockResolvedValueOnce([
      {
        alterado_em: '2026-06-11T12:00:00Z',
        alterado_por: 7,
        alterado_por_nome: 'Gestor Exemplo',
        acoes: [
          {
            campo: 'status',
            valor_antigo: 'Enviada',
            valor_novo: 'Aceita',
            justificativa: 'Movimentação aprovada',
          },
        ],
      },
    ]);

    renderModal();

    expect(screen.getByTestId('movimentacao-historico-loading')).toBeInTheDocument();
    expect(await screen.findByTestId('movimentacao-historico-modal')).toBeInTheDocument();
    expect(movimentacaoService.historico).toHaveBeenCalledWith(1);
    expect(await screen.findAllByText('Movimentação aprovada')).not.toHaveLength(0);
    expect(screen.getAllByText(/Usuário: Gestor Exemplo/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Ações:')).toBeInTheDocument();
  });

  it('limpa sufixo legado via API da justificativa', async () => {
    vi.mocked(movimentacaoService.historico).mockResolvedValueOnce([
      {
        alterado_em: '2026-06-11T12:00:00Z',
        alterado_por: 7,
        alterado_por_nome: 'Gestor Exemplo',
        acoes: [
          {
            campo: 'status',
            valor_antigo: 'Enviada',
            valor_novo: 'Aceita',
            justificativa: 'Movimentação aprovada via API',
          },
        ],
      },
    ]);

    renderModal();

    expect(await screen.findAllByText('Movimentação aprovada')).not.toHaveLength(0);
    expect(screen.queryByText('Movimentação aprovada via API')).not.toBeInTheDocument();
  });

  it('exibe qual bem foi incluído na movimentação', async () => {
    vi.mocked(movimentacaoService.historico).mockResolvedValueOnce([
      {
        alterado_em: '2026-06-11T12:00:00Z',
        alterado_por: 5,
        alterado_por_nome: 'Operador Exemplo',
        acoes: [
          {
            campo: 'itens',
            valor_antigo: '',
            valor_novo: '001.000000001-1 - Notebook',
            justificativa: 'Bem incluído na movimentação',
          },
        ],
      },
    ]);

    renderModal();

    expect(
      await screen.findByText('Bem incluído na movimentação: 001.000000001-1 - Notebook'),
    ).toBeInTheDocument();
  });

  it('não agrupa eventos do mesmo minuto e não duplica justificativa', async () => {
    vi.mocked(movimentacaoService.historico).mockResolvedValueOnce([
      {
        alterado_em: '2026-10-14T14:12:45Z',
        alterado_por: 9,
        alterado_por_nome: 'Usuario Exemplo',
        acoes: [
          { campo: 'status', valor_antigo: 'Enviada', valor_novo: 'Aceita', justificativa: 'Movimentação aprovada' },
          { campo: 'aprovado_por', valor_antigo: '', valor_novo: 'Usuario Exemplo', justificativa: 'Movimentação aprovada' },
        ],
      },
      {
        alterado_em: '2026-10-14T14:12:10Z',
        alterado_por: 9,
        alterado_por_nome: 'Usuario Exemplo',
        acoes: [
          { campo: 'status', valor_antigo: '', valor_novo: 'Enviada', justificativa: 'Movimentação criada' },
        ],
      },
    ]);

    renderModal();

    expect(await screen.findByTestId('movimentacao-historico-modal')).toBeInTheDocument();
    expect(await screen.findByText('Movimentação criada')).toBeInTheDocument();
    expect(screen.getAllByText('Movimentação aprovada')).toHaveLength(2);
    fireEvent.click(screen.getByText('Movimentação criada'));
    expect(screen.getAllByText('Movimentação criada')).toHaveLength(2);
  });

  it('exibe estado vazio quando não há histórico', async () => {
    vi.mocked(movimentacaoService.historico).mockResolvedValueOnce([]);

    renderModal();

    expect(await screen.findByTestId('movimentacao-historico-empty')).toBeInTheDocument();
  });

  it('exibe erro quando a API falha', async () => {
    vi.mocked(movimentacaoService.historico).mockRejectedValueOnce(new Error('falha'));

    renderModal();

    expect(await screen.findByTestId('movimentacao-historico-error')).toHaveTextContent('falha');
  });

  it('fecha o modal ao clicar em fechar', async () => {
    vi.mocked(movimentacaoService.historico).mockResolvedValueOnce([
      {
        alterado_em: '2026-06-11T12:00:00Z',
        alterado_por: 7,
        alterado_por_nome: 'Gestor Exemplo',
        acoes: [{ campo: 'status', valor_antigo: 'Enviada', valor_novo: 'Aceita', justificativa: '' }],
      },
    ]);

    renderModal();

    await screen.findByTestId('movimentacao-historico-modal');
    fireEvent.click(screen.getByRole('button', { name: /fechar histórico/i }));
    expect(onCloseMock).toHaveBeenCalled();

    await waitFor(() => {
      expect(movimentacaoService.historico).toHaveBeenCalledWith(1);
    });
  });
});
