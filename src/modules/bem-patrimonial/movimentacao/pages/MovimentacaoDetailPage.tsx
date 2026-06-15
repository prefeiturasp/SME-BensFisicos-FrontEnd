import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, Network } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { movimentacaoService } from '../services/movimentacao.service'
import type { MovimentacaoBemPatrimonialDetail } from '../types/movimentacao.types'

const ACTION_BUTTON_CLASS = `
  h-10 px-6 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white font-semibold rounded-md transition-colors
`

function formatDateTimeBR(dateString: string | null | undefined) {
  if (!dateString) return '-'

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function resolveUaLabel(
  unidade: MovimentacaoBemPatrimonialDetail['unidade_administrativa_origem'],
) {
  return `${unidade.codigo} - ${unidade.sigla || unidade.nome}`
}

function resolveSolicitante(
  usuario: MovimentacaoBemPatrimonialDetail['solicitado_por'],
) {
  return usuario.nome_completo ?? usuario.username
}

export default function MovimentacaoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [movimentacao, setMovimentacao] = useState<MovimentacaoBemPatrimonialDetail | null>(
    null,
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const data = await movimentacaoService.retrieve(Number(id))
        if (active) setMovimentacao(data)
      } catch (error) {
        console.error(error)
        toast.error('Erro ao carregar movimentação')
        navigate('/movimentacoes')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [id, navigate])

  if (loading) {
    return (
      <div className='p-10 text-center'>
        <Loader2 data-testid='loader' className='mx-auto animate-spin' />
      </div>
    )
  }

  if (!movimentacao) return null

  return (
    <div className='space-y-6 p-8'>
      <AppBreadcrumb
        items={[
          { label: 'Bem Patrimonial', icon: Network },
          { label: 'Movimentações de Bem Patrimonial', to: '/movimentacoes' },
          { label: 'Visualizar Movimentação', isActive: true },
        ]}
      />

      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>
          Visualizar Movimentação de Bem Patrimonial
        </h1>

        <div className='flex gap-3'>
          <Button
            type='button'
            onClick={() => navigate('/movimentacoes')}
            className={ACTION_BUTTON_CLASS}
          >
            <ArrowLeft size={16} className='mr-2' />
            Voltar
          </Button>
        </div>
      </div>

      <Card className='space-y-6 p-6'>
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          <div className='space-y-2'>
            <span className='text-sm font-semibold text-gray-700'>Status</span>
            <div className='rounded-xs border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-700'>
              {movimentacao.status_display}
            </div>
          </div>

          <div className='space-y-2'>
            <span className='text-sm font-semibold text-gray-700'>Atualizado em</span>
            <div className='rounded-xs border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-700'>
              {formatDateTimeBR(movimentacao.atualizado_em)}
            </div>
          </div>

          <div className='space-y-2'>
            <span className='text-sm font-semibold text-gray-700'>
              Unidade Administrativa de Origem
            </span>
            <div className='rounded-xs border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-700'>
              {resolveUaLabel(movimentacao.unidade_administrativa_origem)}
            </div>
          </div>

          <div className='space-y-2'>
            <span className='text-sm font-semibold text-gray-700'>
              Unidade Administrativa de Destino
            </span>
            <div className='rounded-xs border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-700'>
              {resolveUaLabel(movimentacao.unidade_administrativa_destino)}
            </div>
          </div>

          <div className='space-y-2'>
            <span className='text-sm font-semibold text-gray-700'>Solicitado por</span>
            <div className='rounded-xs border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-700'>
              {resolveSolicitante(movimentacao.solicitado_por)}
            </div>
          </div>

          <div className='space-y-2'>
            <span className='text-sm font-semibold text-gray-700'>Número CIMBPM</span>
            <div className='rounded-xs border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-700'>
              {movimentacao.numero_cimbpm ?? '-'}
            </div>
          </div>
        </div>

        <div className='space-y-2'>
          <span className='text-sm font-semibold text-gray-700'>Observação</span>
          <div className='min-h-28 rounded-xs border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-700'>
            {movimentacao.observacao || '-'}
          </div>
        </div>

        <div className='space-y-2'>
          <h2 className='text-sm font-semibold text-[#00703C]'>Itens de Movimentação</h2>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-[#F5F5F5] border-b'>
                <tr className='text-left text-gray-600 font-semibold'>
                  <th className='p-3'>Número Patrimonial</th>
                  <th className='p-3'>Nome do Bem</th>
                  <th className='p-3'>Status</th>
                </tr>
              </thead>
              <tbody>
                {movimentacao.itens.length === 0 ? (
                  <tr>
                    <td colSpan={3} className='py-10 text-center text-gray-400'>
                      Nenhum item encontrado.
                    </td>
                  </tr>
                ) : (
                  movimentacao.itens.map((item) => (
                    <tr key={item.id ?? item.bem.id} className='border-b hover:bg-gray-50'>
                      <td className='p-3'>{item.bem.numero_patrimonial ?? '-'}</td>
                      <td className='p-3'>{item.bem.nome}</td>
                      <td className='p-3'>{item.bem.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}
