import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditarFaixaDialog } from './EditarFaixaDialog';
import { movimentacaoService } from '../services/movimentacao.service';
import type { MovimentacaoBemBusca } from '../types/movimentacao.types';

vi.mock('../services/movimentacao.service', () => ({
  movimentacaoService: { listBensMovimentaveis: vi.fn() },
}));

const cadeira: MovimentacaoBemBusca = {
  id: 1,
  numero_patrimonial: '001.900001001-1',
  nome: 'Cadeira',
  descricao: '',
  localizacao: null,
  apto: true,
  motivo: null,
};
const mesa = { ...cadeira, id: 2, numero_patrimonial: '001.900001002-2', nome: 'Mesa' };
const monitor = { ...cadeira, id: 3, numero_patrimonial: '001.900001003-3', nome: 'Monitor' };
const faixa = {
  id: 'faixa',
  tipo: 'faixa' as const,
  numeroDe: cadeira.numero_patrimonial!,
  numeroAte: mesa.numero_patrimonial,
  bens: [cadeira, mesa],
};

function abrir(onValidar = vi.fn().mockResolvedValue([mesa, monitor])) {
  const onAplicar = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(
    <EditarFaixaDialog
      faixa={faixa}
      unidadeAdministrativaId={29}
      onValidar={onValidar}
      onAplicar={onAplicar}
      onClose={onClose}
    />,
  );
  return { onValidar, onAplicar, onClose };
}

describe('EditarFaixaDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(movimentacaoService.listBensMovimentaveis).mockResolvedValue([]);
  });

  it('atualiza a prévia com novos, mantidos e removidos sem aplicar a seleção', async () => {
    const x = abrir();
    expect(screen.getByRole('columnheader', { name: /Situação/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sobre a prévia da faixa' })).toBeInTheDocument();
    expect(screen.queryByText(/^Verde: novos/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Número Patrimonial - De'), {
      target: { value: mesa.numero_patrimonial },
    });
    fireEvent.change(screen.getByLabelText('Número Patrimonial - Até'), {
      target: { value: monitor.numero_patrimonial },
    });
    expect(screen.getByRole('status').tagName).toBe('OUTPUT');
    expect(screen.getByRole('status')).toHaveTextContent('Atualizando prévia');
    expect(await screen.findByText('Será removido')).toBeInTheDocument();
    expect(screen.getByText('Bens da faixa após aplicar (2)')).toBeInTheDocument();
    expect(screen.getByText('Novo').closest('tr')).toHaveClass('bg-green-50');
    expect(screen.getByText('Mantido').closest('tr')).toHaveClass('bg-white');
    expect(screen.getByText('Será removido').closest('tr')).toHaveClass('bg-red-50');
    expect(
      screen
        .getAllByRole('row')
        .slice(1)
        .map((row) => within(row).getAllByRole('cell')[0].textContent),
    ).toEqual([cadeira.numero_patrimonial, mesa.numero_patrimonial, monitor.numero_patrimonial]);
    expect(
      within(screen.getByText('Será removido').closest('tr')!).getByText('Cadeira'),
    ).toBeInTheDocument();
    expect(x.onAplicar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar faixa' }));
    await waitFor(() =>
      expect(x.onAplicar).toHaveBeenCalledWith(mesa.numero_patrimonial, monitor.numero_patrimonial),
    );
  });

  it('uma faixa inválida não faz a seleção original parecer removida', async () => {
    const x = abrir(vi.fn().mockRejectedValue(new Error('Há um número ausente na sequência.')));
    fireEvent.change(screen.getByLabelText('Número Patrimonial - Até'), {
      target: { value: monitor.numero_patrimonial },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Há um número ausente');
    expect(screen.getByText('Cadeira')).toBeInTheDocument();
    expect(screen.getByText('Mesa')).toBeInTheDocument();
    expect(screen.queryByText('Será removido')).not.toBeInTheDocument();
    expect(x.onAplicar).not.toHaveBeenCalled();
  });

  it('ignora a resposta atrasada de uma prévia anterior', async () => {
    let concluir!: (bens: MovimentacaoBemBusca[]) => void;
    const validar = vi
      .fn()
      .mockReturnValueOnce(
        new Promise<MovimentacaoBemBusca[]>((resolve) => {
          concluir = resolve;
        }),
      )
      .mockResolvedValueOnce([cadeira]);
    abrir(validar);
    fireEvent.change(screen.getByLabelText('Número Patrimonial - Até'), {
      target: { value: monitor.numero_patrimonial },
    });
    await waitFor(() => expect(validar).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText('Número Patrimonial - Até'), {
      target: { value: cadeira.numero_patrimonial },
    });
    await screen.findByText('Bens da faixa após aplicar (1)');
    await act(async () => concluir([cadeira, mesa, monitor]));
    expect(screen.getByText('Bens da faixa após aplicar (1)')).toBeInTheDocument();
    expect(screen.queryByText('Monitor')).not.toBeInTheDocument();
  });

  it.each(['De', 'Até'])(
    'reutiliza o autocomplete no campo %s e cancela sem aplicar',
    async (campo) => {
      vi.mocked(movimentacaoService.listBensMovimentaveis).mockResolvedValue([
        { ...monitor, status: 'aprovado' },
      ]);
      const x = abrir();
      const input = screen.getByLabelText(`Número Patrimonial - ${campo}`);
      fireEvent.focus(input);
      fireEvent.click(
        await screen.findByRole('button', { name: `${monitor.numero_patrimonial} - Monitor` }),
      );
      expect(input).toHaveValue(monitor.numero_patrimonial);
      expect(movimentacaoService.listBensMovimentaveis).toHaveBeenCalledWith(
        29,
        expect.any(String),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(x.onClose).toHaveBeenCalledOnce();
      expect(x.onAplicar).not.toHaveBeenCalled();
    },
  );

  it('não permite escolher outra sugestão enquanto aplica a faixa', async () => {
    vi.mocked(movimentacaoService.listBensMovimentaveis).mockResolvedValue([
      { ...monitor, status: 'aprovado' },
    ]);
    let concluir!: () => void;
    const onAplicar = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          concluir = resolve;
        }),
    );
    render(
      <EditarFaixaDialog
        faixa={faixa}
        unidadeAdministrativaId={29}
        onValidar={vi.fn().mockResolvedValue([cadeira, mesa])}
        onAplicar={onAplicar}
        onClose={vi.fn()}
      />,
    );
    fireEvent.focus(screen.getByLabelText('Número Patrimonial - De'));
    await screen.findByRole('button', { name: `${monitor.numero_patrimonial} - Monitor` });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar faixa' }));
    expect(screen.getByLabelText('Número Patrimonial - De')).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: `${monitor.numero_patrimonial} - Monitor` }),
    ).not.toBeInTheDocument();
    expect(onAplicar).toHaveBeenCalledOnce();
    await act(async () => concluir());
  });
});
