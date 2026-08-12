import { X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export type ConfirmDialogVariant = 'primary' | 'destructive';

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly message: string | ReactNode;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly loadingLabel?: string;
  readonly loading?: boolean;
  readonly errorMessage?: string | null;
  readonly variant?: ConfirmDialogVariant;
  readonly testId?: string;
  readonly closeButtonLabel?: string;
  /**
   * Quando informado, exibe um check-box de confirmação com esse texto
   * abaixo da mensagem principal. O botão de confirmar fica desabilitado
   * até o usuário marcá-lo. Opcional — sem essa prop, o diálogo se
   * comporta exatamente como antes (compatível com usos existentes, como
   * o ModalExclusao).
   */
  readonly confirmationCheckboxLabel?: string;
  readonly testIds?: Partial<{
    container: string;
    confirm: string;
    cancel: string;
    error: string;
    checkbox: string;
  }>;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
}

const CANCEL_BUTTON_CLASS =
  'h-10 border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 hover:bg-gray-100';

const VARIANT_CONFIRM_CLASS: Record<ConfirmDialogVariant, string> = {
  primary: 'h-10 bg-[#2F7D57] px-5 text-sm font-semibold text-white hover:bg-[#256947]',
  destructive: 'h-10 bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700',
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loadingLabel,
  loading = false,
  errorMessage = null,
  variant = 'primary',
  testId = 'confirm-dialog',
  closeButtonLabel = 'Fechar modal',
  confirmationCheckboxLabel,
  testIds,
  onConfirm,
  onClose,
}: Readonly<ConfirmDialogProps>) {
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmado(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const exigeConfirmacao = !!confirmationCheckboxLabel;
  const podeConfirmar = !exigeConfirmacao || confirmado;

  const containerTestId = testIds?.container ?? testId;
  const confirmTestId = testIds?.confirm ?? `${testId}-confirm`;
  const cancelTestId = testIds?.cancel ?? `${testId}-cancel`;
  const errorTestId = testIds?.error ?? `${testId}-error`;
  const checkboxTestId = testIds?.checkbox ?? `${testId}-confirmacao`;

  return (
    <dialog
      open
      className='fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-none bg-black/40 p-0'
      aria-label={title}
      onClose={onClose}
    >
      <div
        className='mx-4 w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl'
        data-testid={containerTestId}
      >
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-800'>{title}</h2>
          <button
            type='button'
            onClick={onClose}
            disabled={loading}
            className='text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-50'
            aria-label={closeButtonLabel}
          >
            <X size={20} />
          </button>
        </div>

        <div className='space-y-4 px-6 py-5'>
          {typeof message === 'string' ? (
            <p className='text-sm text-gray-700'>{message}</p>
          ) : (
            message
          )}

          {errorMessage && (
            <div
              className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'
              role='alert'
              data-testid={errorTestId}
            >
              {errorMessage}
            </div>
          )}

          {exigeConfirmacao && (
            <label className='flex items-start gap-2 text-sm text-gray-700'>
              <input
                type='checkbox'
                checked={confirmado}
                onChange={(e) => setConfirmado(e.target.checked)}
                disabled={loading}
                className='mt-0.5 h-4 w-4 accent-red-600'
                data-testid={checkboxTestId}
              />
              {confirmationCheckboxLabel}
            </label>
          )}

          <div className='flex items-center justify-end gap-3 pt-2'>
            <Button
              type='button'
              onClick={onClose}
              className={CANCEL_BUTTON_CLASS}
              disabled={loading}
              data-testid={cancelTestId}
            >
              {cancelLabel}
            </Button>
            <Button
              type='button'
              onClick={() => {
                if (!podeConfirmar) return;
                onConfirm();
              }}
              className={cn(
                VARIANT_CONFIRM_CLASS[variant],
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
              disabled={loading || !podeConfirmar}
              data-testid={confirmTestId}
            >
              {loading ? (loadingLabel ?? 'Carregando...') : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}