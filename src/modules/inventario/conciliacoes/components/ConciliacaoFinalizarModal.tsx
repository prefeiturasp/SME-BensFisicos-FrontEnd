import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConciliacaoFinalizarModalProps {
  readonly open: boolean;
  readonly conciliacaoId: number;
  readonly loading: boolean;
  readonly errorMessage: string | null;
  readonly onConfirm: () => void;
  readonly onClose: () => void;
}

export function ConciliacaoFinalizarModal({
  open,
  loading,
  errorMessage,
  onConfirm,
  onClose,
}: Readonly<ConciliacaoFinalizarModalProps>) {
  const [error, setError] = useState<string | null>(errorMessage);
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    setError(errorMessage);
  }, [errorMessage]);

  useEffect(() => {
    if (open) {
      setConfirmado(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <dialog
      open
      className='fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-none bg-black/40 p-0'
      aria-label='Finalizar conciliação'
      onClose={onClose}
    >
      <div
        className='mx-4 w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl'
        data-testid='conciliacao-finalizar-modal'
      >
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <h2 className='text-lg font-semibold text-gray-800'>Finalizar conciliação</h2>
          <button
            type='button'
            onClick={onClose}
            className='text-gray-400 transition-colors hover:text-gray-600'
            aria-label='Fechar modal de finalização'
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div className='space-y-4 px-6 py-5'>
          <p className='text-sm text-gray-700'>
            Tem certeza que deseja finalizar esta conciliação? Esta ação não
            pode ser desfeita e os itens em processo de baixa serão
            confirmados como <strong>Baixa Física</strong>.
          </p>

          {error && (
            <div
              className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'
              role='alert'
              data-testid='conciliacao-finalizar-error'
            >
              {error}
            </div>
          )}

          <label className='flex items-start gap-2 text-sm text-gray-700'>
            <input
              type='checkbox'
              checked={confirmado}
              onChange={(e) => setConfirmado(e.target.checked)}
              disabled={loading}
              className='mt-0.5 h-4 w-4 accent-[#C20F06]'
              data-testid='conciliacao-finalizar-confirmacao'
            />
            {/*  */}
            Estou ciente que esta ação não pode ser desfeita.
          </label>

          <div className='flex items-center justify-end gap-3 pt-2'>
            <Button
              type='button'
              onClick={onClose}
              className='h-10 border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 hover:bg-gray-100'
              disabled={loading}
              data-testid='conciliacao-finalizar-cancel'
            >
              Cancelar
            </Button>
            <Button
              type='button'
              onClick={() => {
                if (!confirmado) return;
                onConfirm();
              }}
              className='h-10 bg-[#C20F06] px-5 text-sm font-semibold text-white hover:bg-[#A70C05] disabled:cursor-not-allowed disabled:opacity-50'
              disabled={loading || !confirmado}
              data-testid='conciliacao-finalizar-confirm'
            >
              {loading ? 'Finalizando...' : 'Finalizar'}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}