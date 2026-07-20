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

  useEffect(() => {
    setError(errorMessage);
  }, [errorMessage]);

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
              onClick={onConfirm}
              className='h-10 bg-[#2F7D57] px-5 text-sm font-semibold text-white hover:bg-[#256947]'
              disabled={loading}
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
