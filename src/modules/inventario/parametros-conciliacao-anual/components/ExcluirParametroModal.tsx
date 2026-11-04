import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ParametroConciliacaoAnual } from '../types/parametros-conciliacao-anual.types';

interface Props {
  parametro: ParametroConciliacaoAnual;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export function ExcluirParametroModal({
  parametro,
  deleting,
  onClose,
  onConfirm,
}: Readonly<Props>) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4'>
      <div className='w-full max-w-4xl rounded-md bg-white p-8 shadow-xl'>
        <div className='flex items-start justify-between gap-4'>
          <h2 className='text-2xl font-bold text-gray-700'>
            Excluir Parâmetro de Conciliação Anual
          </h2>
          <button
            type='button'
            aria-label='Fechar'
            className='text-gray-600 hover:text-gray-900'
            onClick={onClose}
            disabled={deleting}
          >
            <X size={30} />
          </button>
        </div>

        <div className='mt-6 border-t border-gray-300 pt-6 text-xl text-gray-700'>
          <p>Deseja excluir o Parâmetro de Conciliação Anual:</p>
          <p className='mt-2 font-semibold text-[#005C35]'>
            {parametro.ano_referencia} | {formatDate(parametro.periodo_inicial)} -{' '}
            {formatDate(parametro.periodo_final)}
          </p>
          <p className='mt-8'>
            Essa ação não pode ser desfeita, todos os dados do parâmetro serão removidos.
          </p>
        </div>

        <div className='mt-8 flex justify-end gap-4 border-t border-gray-300 pt-6'>
          <Button
            type='button'
            variant='outline'
            className='h-14 min-w-40 border-[#006B5B] text-xl font-semibold text-[#00703C] hover:bg-[#EAF5EF]'
            onClick={onClose}
            disabled={deleting}
          >
            Manter
          </Button>
          <Button
            type='button'
            className='h-14 min-w-40 bg-[#C20F06] text-xl font-semibold text-white hover:bg-[#A70C05]'
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </div>
    </div>
  );
}
