import { ArrowLeft, Network } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { Button } from '@/components/ui/button'

const ACTION_BUTTON_CLASS =
  'h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors'

export default function MovimentacoesListPage() {
  const navigate = useNavigate()

  return (
    <div className='p-8 space-y-4'>
      <AppBreadcrumb
        items={[
          { label: 'Bem Patrimonial', icon: Network },
          { label: 'Movimentações de Bem Patrimonial', isActive: true },
        ]}
      />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>
          Movimentações de Bem Patrimonial
        </h1>

        <div className='flex flex-wrap items-center justify-end gap-3'>
          <Button
            type='button'
            onClick={() => navigate(-1)}
            className={ACTION_BUTTON_CLASS}
            aria-label='Voltar'
          >
            <ArrowLeft size={16} />
          </Button>

          <Button
            type='button'
            onClick={() => navigate('/movimentacoes/novo')}
            className={ACTION_BUTTON_CLASS}
          >
            Adicionar Movimentação
          </Button>
        </div>
      </div>

      <div className='border rounded-lg p-8 border-dashed flex justify-center items-center text-muted-foreground bg-muted/20 h-64'>
        Histórico e Gestão de Movimentações
      </div>
    </div>
  )
}
