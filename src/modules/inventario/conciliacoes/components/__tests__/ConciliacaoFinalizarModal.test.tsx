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
        conciliacaoId={1}
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
        conciliacaoId={1}
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
        conciliacaoId={1}
        loading={false}
        errorMessage={null}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('conciliacao-finalizar-confirmacao'));
    fireEvent.click(screen.getByTestId('conciliacao-finalizar-confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('mantém o botão Finalizar desabilitado até o check-box ser marcado', () => {
    const onConfirm = vi.fn();

    render(
      <ConciliacaoFinalizarModal
        open
        conciliacaoId={1}
        loading={false}
        errorMessage={null}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    const botaoFinalizar = screen.getByTestId('conciliacao-finalizar-confirm');
    expect(botaoFinalizar).toBeDisabled();

    fireEvent.click(botaoFinalizar);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('conciliacao-finalizar-confirmacao'));
    expect(botaoFinalizar).toBeEnabled();

    fireEvent.click(botaoFinalizar);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('exibe o texto de confirmação do check-box', () => {
    render(
      <ConciliacaoFinalizarModal
        open
        conciliacaoId={1}
        loading={false}
        errorMessage={null}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText('Estou ciente que esta ação não pode ser desfeita.'),
    ).toBeInTheDocument();
  });

  it('exibe o botão Finalizar com fundo vermelho', () => {
    render(
      <ConciliacaoFinalizarModal
        open
        conciliacaoId={1}
        loading={false}
        errorMessage={null}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const botao = screen.getByTestId('conciliacao-finalizar-confirm');
    expect(botao.className).toContain('bg-[#C20F06]');
  });

  it('dispara onClose ao clicar em Cancelar', () => {
    const onClose = vi.fn();

    render(
      <ConciliacaoFinalizarModal
        open
        conciliacaoId={1}
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
        conciliacaoId={1}
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
        conciliacaoId={1}
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
        conciliacaoId={1}
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
        conciliacaoId={1}
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
        conciliacaoId={1}
        loading={false}
        errorMessage={null}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('conciliacao-finalizar-error')).not.toBeInTheDocument();
  });
});