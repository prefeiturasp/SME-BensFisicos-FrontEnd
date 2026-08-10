import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConciliacaoFinalizarModal } from '../ConciliacaoFinalizarModal';

describe('ConciliacaoFinalizarModal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('nao renderiza nada quando open = false', () => {
    const { container } = render(
      <ConciliacaoFinalizarModal
        open={false}
        loading={false}
        errorMessage={null}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('exibe titulo, mensagem de confirmacao e botoes', () => {
    render(
      <ConciliacaoFinalizarModal
        open
        loading={false}
        errorMessage={null}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId('conciliacao-finalizar-modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Finalizar conciliação' })).toBeInTheDocument();
    expect(
      screen.getByText(/Tem certeza que deseja finalizar esta conciliação/i),
    ).toBeInTheDocument();
  });

  it('dispara onConfirm ao clicar em Finalizar', () => {
    const onConfirm = vi.fn();

    render(
      <ConciliacaoFinalizarModal
        open
        loading={false}
        errorMessage={null}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('conciliacao-finalizar-confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('dispara onClose ao clicar em Cancelar', () => {
    const onClose = vi.fn();

    render(
      <ConciliacaoFinalizarModal
        open
        loading={false}
        errorMessage={null}
        onConfirm={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByTestId('conciliacao-finalizar-cancel'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dispara onClose ao clicar no botao X', () => {
    const onClose = vi.fn();

    render(
      <ConciliacaoFinalizarModal
        open
        loading={false}
        errorMessage={null}
        onConfirm={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fechar modal de finalização' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('desabilita os botoes quando loading = true', () => {
    render(
      <ConciliacaoFinalizarModal
        open
        loading
        errorMessage={null}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId('conciliacao-finalizar-confirm')).toBeDisabled();
    expect(screen.getByTestId('conciliacao-finalizar-cancel')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Fechar modal de finalização' })).toBeDisabled();
    expect(screen.getByTestId('conciliacao-finalizar-confirm')).toHaveTextContent(
      'Finalizando...',
    );
  });

  it('exibe mensagem de erro quando errorMessage e informada', () => {
    render(
      <ConciliacaoFinalizarModal
        open
        loading={false}
        errorMessage='Conciliacao ja finalizada.'
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId('conciliacao-finalizar-error')).toHaveTextContent(
      'Conciliacao ja finalizada.',
    );
  });

  it('limpa a mensagem de erro quando errorMessage muda para null', () => {
    const { rerender } = render(
      <ConciliacaoFinalizarModal
        open
        loading={false}
        errorMessage='Erro 1'
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId('conciliacao-finalizar-error')).toBeInTheDocument();

    rerender(
      <ConciliacaoFinalizarModal
        open
        loading={false}
        errorMessage={null}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('conciliacao-finalizar-error')).not.toBeInTheDocument();
  });
});
