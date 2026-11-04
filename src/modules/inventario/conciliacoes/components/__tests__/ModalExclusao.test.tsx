import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModalExclusao } from '../ModalExclusao';

describe('ModalExclusao', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('nao renderiza nada quando open = false', () => {
    const { container } = render(
      <ModalExclusao open={false} onConfirm={vi.fn()} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('exibe titulo, mensagem e botoes quando aberto', () => {
    render(<ModalExclusao open onConfirm={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByTestId('ocorrencia-modal-exclusao')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excluir ocorrência' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.',
      ),
    ).toBeInTheDocument();
  });

  it('dispara onConfirm ao clicar em Excluir', () => {
    const onConfirm = vi.fn();
    render(<ModalExclusao open onConfirm={onConfirm} onClose={vi.fn()} />);

    fireEvent.click(screen.getByTestId('ocorrencia-modal-exclusao-confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('dispara onClose ao clicar em Cancelar', () => {
    const onClose = vi.fn();
    render(<ModalExclusao open onConfirm={vi.fn()} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('ocorrencia-modal-exclusao-cancel'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dispara onClose ao clicar no botao X', () => {
    const onClose = vi.fn();
    render(<ModalExclusao open onConfirm={vi.fn()} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar modal de exclusão' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('desabilita botoes quando loading = true', () => {
    render(<ModalExclusao open loading onConfirm={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByTestId('ocorrencia-modal-exclusao-confirm')).toBeDisabled();
    expect(screen.getByTestId('ocorrencia-modal-exclusao-cancel')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Fechar modal de exclusão' })).toBeDisabled();
    expect(screen.getByTestId('ocorrencia-modal-exclusao-confirm')).toHaveTextContent(
      'Excluindo...',
    );
  });

  it('exibe mensagem de erro quando informada', () => {
    render(
      <ModalExclusao
        open
        errorMessage='Erro ao excluir.'
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId('ocorrencia-modal-exclusao-error')).toHaveTextContent(
      'Erro ao excluir.',
    );
  });
});
