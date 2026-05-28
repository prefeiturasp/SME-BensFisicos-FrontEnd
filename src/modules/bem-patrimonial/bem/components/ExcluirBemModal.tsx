import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Bem } from '../services/bem.service'

interface Props {
  bem: Bem
  deleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function ExcluirBemModal({ bem, deleting, onClose, onConfirm }: Readonly<Props>) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4'>
      <div className='w-full max-w-2xl rounded-md bg-white p-8 shadow-xl'>
        <div className='flex items-start justify-between gap-4'>
          <h2 className='text-2xl font-bold text-gray-700'>
            Excluir Bem Patrimonial
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
          <p>Deseja excluir o bem patrimonial:</p>
          <p className='mt-2 font-semibold text-[#005C35]'>
            {bem.numero_patrimonial ?? '-'} | {bem.nome}
          </p>
          <p className='mt-8'>Essa ação não pode ser desfeita.</p>
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
  )
}
