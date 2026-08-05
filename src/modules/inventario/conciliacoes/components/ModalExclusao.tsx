import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModalExclusaoProps {
  readonly open: boolean;
  readonly title?: string;
  readonly message?: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly loading?: boolean;
  readonly errorMessage?: string | null;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
}

const DEFAULT_TITLE = 'Excluir ocorrência';
const DEFAULT_MESSAGE =
  'Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.';
const DEFAULT_CONFIRM_LABEL = 'Excluir';
const DEFAULT_CANCEL_LABEL = 'Cancelar';

export function ModalExclusao({
  open,
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
  confirmLabel = DEFAULT_CONFIRM_LABEL,
  cancelLabel = DEFAULT_CANCEL_LABEL,
  loading = false,
  errorMessage = null,
  onConfirm,
  onClose,
}: Readonly<ModalExclusaoProps>) {
  if (!open) {
    return null;
  }

  return (
    <dialog
      open
      className='fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-none bg-black/40 p-0'
      aria-label={title}
      onClose={onClose}
    >
      <div
        className='mx-4 w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl'
        data-testid='ocorrencia-modal-exclusao'
      >
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-800'>{title}</h2>
          <button
            type='button'
            onClick={onClose}
            disabled={loading}
            className='text-gray-400 transition-colors hover:text-gray-600'
            aria-label='Fechar modal de exclusão'
          >
            <X size={20} />
          </button>
        </div>

        <div className='space-y-4 px-6 py-5'>
          <p className='text-sm text-gray-700'>{message}</p>

          {errorMessage && (
            <div
              className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'
              role='alert'
              data-testid='ocorrencia-modal-exclusao-error'
            >
              {errorMessage}
            </div>
          )}

          <div className='flex items-center justify-end gap-3 pt-2'>
            <Button
              type='button'
              onClick={onClose}
              className='h-10 border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 hover:bg-gray-100'
              disabled={loading}
              data-testid='ocorrencia-modal-exclusao-cancel'
            >
              {cancelLabel}
            </Button>
            <Button
              type='button'
              onClick={onConfirm}
              className='h-10 bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700'
              disabled={loading}
              data-testid='ocorrencia-modal-exclusao-confirm'
            >
              {loading ? 'Excluindo...' : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
