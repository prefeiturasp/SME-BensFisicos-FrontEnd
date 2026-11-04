import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  it.each(['default', 'wide'] as const)(
    'mantém ações fora do conteúdo rolável no tamanho %s',
    (size) => {
      render(
        <ConfirmDialog
          open
          size={size}
          title='Revisar e salvar'
          message={<p>Lista de bens</p>}
          confirmLabel='Salvar'
          cancelLabel='Voltar'
          errorMessage='Falha ao salvar'
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />,
      );
      const body = screen.getByTestId('confirm-dialog-body');
      const footer = screen.getByTestId('confirm-dialog-footer');
      expect(body).toHaveClass('min-h-0', 'overflow-y-auto');
      expect(within(body).getByText('Lista de bens')).toBeInTheDocument();
      expect(within(body).queryByRole('button')).not.toBeInTheDocument();
      expect(footer).toHaveClass('shrink-0');
      expect(within(footer).getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
      expect(within(footer).getByRole('button', { name: 'Voltar' })).toBeInTheDocument();
      expect(within(footer).getByRole('alert')).toHaveTextContent('Falha ao salvar');
      expect(body.parentElement).toBe(footer.parentElement);
    },
  );

  it('preserva confirmação obrigatória e bloqueio durante o salvamento no rodapé', () => {
    const onConfirm = vi.fn();
    const props = {
      open: true,
      title: 'Confirmar',
      message: 'Resumo',
      onConfirm,
      onClose: vi.fn(),
      confirmationCheckboxLabel: 'Li o resumo',
    };
    const { rerender } = render(<ConfirmDialog {...props} />);
    const footer = within(screen.getByTestId('confirm-dialog-footer'));
    expect(footer.getByRole('button', { name: 'Confirmar' })).toBeDisabled();
    fireEvent.click(footer.getByRole('checkbox'));
    expect(footer.getByRole('button', { name: 'Confirmar' })).toBeEnabled();
    rerender(<ConfirmDialog {...props} loading loadingLabel='Salvando...' />);
    expect(footer.getByRole('button', { name: 'Salvando...' })).toBeDisabled();
    expect(footer.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(footer.getByRole('checkbox')).toBeDisabled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
