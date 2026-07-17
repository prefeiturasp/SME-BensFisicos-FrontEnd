import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Download,
  History,
  Loader2,
  Minus,
  Network,
  Pencil,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/auth/useAuth'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BemDetailField, BemItemRow } from '@/modules/bem-patrimonial/components/BemDetailParts'
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

function resolveUoLabel(
  unidade: MovimentacaoBemPatrimonialDetail['unidade_orcamentaria_origem'],
) {
  return `${unidade.codigo} - ${unidade.sigla || unidade.nome}`
}

function resolveUaLabel(
  unidade: MovimentacaoBemPatrimonialDetail['unidade_administrativa_origem'],
) {
  return `${unidade.codigo} - ${unidade.sigla || unidade.nome}`
}

function resolveUsuario(
  usuario:
    | MovimentacaoBemPatrimonialDetail['solicitado_por']
    | MovimentacaoBemPatrimonialDetail['aprovado_por']
    | MovimentacaoBemPatrimonialDetail['rejeitado_por']
    | MovimentacaoBemPatrimonialDetail['cancelado_por'],
) {
  if (!usuario) return '-'
  return usuario.nome_completo ?? usuario.username
}

function resolveResponsavelLabel(movimentacao: MovimentacaoBemPatrimonialDetail) {
  if (movimentacao.aprovado_por) return 'Aprovado por'
  if (movimentacao.rejeitado_por) return 'Rejeitado por'
  if (movimentacao.cancelado_por) return 'Cancelado por'
  return 'Aprovado por'
}

function resolveResponsavelValue(movimentacao: MovimentacaoBemPatrimonialDetail) {
  return (
    movimentacao.aprovado_por ??
    movimentacao.rejeitado_por ??
    movimentacao.cancelado_por ??
    null
  )
}

export default function MovimentacaoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [movimentacao, setMovimentacao] = useState<MovimentacaoBemPatrimonialDetail | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

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

  const isGestor = !!user?.is_gestor_patrimonio
  const isOperador = !!user?.is_operador_inventario
  const isSuperuser = !!user?.is_superuser
  const isOwner = movimentacao.solicitado_por.id === user?.id
  const canCancelMovimentacao =
    movimentacao.status === 'enviada' &&
    (isGestor || isSuperuser || (isOperador && isOwner))

  const responsavelLabel = resolveResponsavelLabel(movimentacao)
  const responsavelValue = resolveUsuario(resolveResponsavelValue(movimentacao))

  async function handleAbrirDocumentoCimbpm() {
    try {
      const blob = await movimentacaoService.baixarDocumentoCimbpm(movimentacao.id)
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.target = '_blank'
      link.rel = 'noreferrer'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      link.remove()

      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao baixar documento CIMBPM'
      toast.error(message || 'Erro ao baixar documento CIMBPM')
    }
  }

  async function handleCancelar() {
    if (!canCancelMovimentacao || actionLoading) return

    setActionLoading(true)
    try {
      await movimentacaoService.cancelar(movimentacao.id)
      toast.success(
        `Movimentação #${String(movimentacao.id).padStart(4, '0')} cancelada com sucesso. Bens desbloqueados.`,
      )
      navigate('/movimentacoes')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao cancelar movimentação'
      toast.error(message || 'Erro ao cancelar movimentação')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className='space-y-6 p-8'>
      <AppBreadcrumb
        items={[
          { label: 'Bem Patrimonial', icon: Network },
          { label: 'Movimentações de Bem Patrimonial', to: '/movimentacoes' },
          { label: 'Visualizar Movimentação de Bem Patrimonial', isActive: true },
        ]}
      />

      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>
          Visualizar Movimentação de Bem Patrimonial
        </h1>

        <div className='flex flex-wrap items-center justify-end gap-3'>
          <Button
            type='button'
            className={`${ACTION_BUTTON_CLASS} disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-white disabled:hover:text-gray-400`}
            disabled
          >
            <Pencil size={16} />
            Salvar Edição
          </Button>

          <Button
            type='button'
            className={ACTION_BUTTON_CLASS}
            disabled={!canCancelMovimentacao || actionLoading}
            onClick={() => void handleCancelar()}
          >
            <Minus size={16} />
            {actionLoading ? 'Cancelando...' : 'Cancelar'}
          </Button>

          {movimentacao.url_historico ? (
            <Button asChild className={ACTION_BUTTON_CLASS}>
              <a href={movimentacao.url_historico} target='_blank' rel='noreferrer'>
                <History size={16} />
                Histórico
              </a>
            </Button>
          ) : (
            <Button
              type='button'
              className={`${ACTION_BUTTON_CLASS} disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-white disabled:hover:text-gray-400`}
              disabled
            >
              <History size={16} />
              Histórico
            </Button>
          )}

          <Button
            type='button'
            onClick={() => navigate('/movimentacoes')}
            className={ACTION_BUTTON_CLASS}
          >
            <ArrowLeft size={16} />
            Voltar
          </Button>
        </div>
      </div>

      <Card className='overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-3'>
          <span className='text-sm font-bold text-[#2F7D57]'>
            Solicitação #{String(movimentacao.id).padStart(4, '0')}
          </span>
          <span className='text-sm font-semibold text-[#00703C]'>
            Status: {movimentacao.status_display}
          </span>
        </div>

        <div className='divide-y divide-gray-100'>
          <div className='grid gap-x-8 gap-y-2 px-6 py-2.5 lg:grid-cols-2'>
            <BemDetailField label='Número CIMBPM'>
              {movimentacao.numero_cimbpm ?? '-'}
            </BemDetailField>

            <BemDetailField label='Documento CIMBPM'>
              {movimentacao.url_documento_cimbpm ? (
                <button
                  type='button'
                  onClick={() => void handleAbrirDocumentoCimbpm()}
                  className='inline-flex items-center gap-2 text-[#0070C0] hover:underline'
                >
                  <Download className='size-4 shrink-0' aria-hidden='true' />
                  Baixar Documento CIMBPM
                </button>
              ) : (
                'Número CIMBPM não gerado'
              )}
            </BemDetailField>
          </div>

          <div className='grid gap-x-8 gap-y-2 px-6 py-2.5 lg:grid-cols-2'>
            <BemDetailField label='Solicitado por'>
              <span className='text-[#2F7D57]'>{resolveUsuario(movimentacao.solicitado_por)}</span>
            </BemDetailField>

            <BemDetailField label={responsavelLabel}>
              <span className='text-[#2F7D57]'>{responsavelValue}</span>
            </BemDetailField>
          </div>

          <div className='grid gap-x-8 gap-y-2 px-6 py-2.5 lg:grid-cols-2'>
            <BemDetailField label='Unidade orçamentária de origem'>
              {resolveUoLabel(movimentacao.unidade_orcamentaria_origem)}
            </BemDetailField>

            <BemDetailField label='Unidade administrativa de origem'>
              {resolveUaLabel(movimentacao.unidade_administrativa_origem)}
            </BemDetailField>
          </div>

          <div className='grid gap-x-8 gap-y-2 px-6 py-2.5 lg:grid-cols-2'>
            <BemDetailField label='Unidade orçamentária de destino'>
              {resolveUoLabel(movimentacao.unidade_orcamentaria_destino)}
            </BemDetailField>

            <BemDetailField label='Unidade administrativa de destino'>
              {resolveUaLabel(movimentacao.unidade_administrativa_destino)}
            </BemDetailField>
          </div>

          <div className='space-y-1.5 px-6 py-2.5'>
            <span className='text-sm font-semibold text-gray-700'>Observação</span>
            <div className='min-h-16 text-sm text-gray-700'>
              {movimentacao.observacao || '-'}
            </div>
          </div>

          <div className='space-y-1.5 px-6 py-2.5'>
            <h2 className='text-sm font-semibold text-[#00703C]'>Itens de Movimentação</h2>

            {movimentacao.itens.length === 0 ? (
              <div className='text-sm text-gray-400'>
                Nenhum item encontrado.
              </div>
            ) : (
              <div className='space-y-1'>
                {movimentacao.itens.map((item) => (
                  <BemItemRow
                    key={item.id ?? item.bem.id}
                    label={`${item.bem.numero_patrimonial ?? '-'} ${item.bem.nome}`}
                    showChevron
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
