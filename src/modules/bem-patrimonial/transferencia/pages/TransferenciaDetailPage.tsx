import { useEffect, useState } from 'react'
import { ArrowLeft, Download, Loader2, Network } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BemDetailField, BemItemRow } from '@/modules/bem-patrimonial/components/BemDetailParts'
import { downloadBlobFile } from '@/lib/unidades-list-page'
import { transferenciaService } from '../services/transferencia.service'
import type { TransferenciaBemPatrimonialDetail } from '../types/transferencia.types'

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
  unidade: TransferenciaBemPatrimonialDetail['unidade_orcamentaria_origem'],
) {
  return unidade.label ?? `${unidade.codigo} - ${unidade.sigla || unidade.nome}`
}

function resolveUaLabel(
  unidade: TransferenciaBemPatrimonialDetail['unidade_administrativa_destino'],
) {
  return unidade.label ?? `${unidade.codigo} - ${unidade.sigla || unidade.nome}`
}

function resolveUsuario(usuario: TransferenciaBemPatrimonialDetail['criado_por']) {
  return usuario.nome_completo ?? usuario.username
}

export default function TransferenciaDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [transferencia, setTransferencia] =
    useState<TransferenciaBemPatrimonialDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const data = await transferenciaService.retrieve(Number(id))
        if (active) setTransferencia(data)
      } catch (error) {
        console.error(error)
        toast.error('Erro ao carregar transferência')
        navigate('/transferencias')
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

  if (!transferencia) return null

  async function handleBaixarDocumento() {
    if (!transferencia.url_documento_ntbpm || downloading) return

    setDownloading(true)
    try {
      const blob = await transferenciaService.baixarDocumentoNtBpm(
        transferencia.url_documento_ntbpm,
      )
      downloadBlobFile(blob, `ntbpm-${String(transferencia.id).padStart(4, '0')}.pdf`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao baixar documento NTBPM'
      toast.error(message || 'Erro ao baixar documento NTBPM')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className='space-y-6 p-8'>
      <AppBreadcrumb
        items={[
          { label: 'Bem Patrimonial', icon: Network },
          { label: 'Transferência de Bens Patrimoniais', to: '/transferencias' },
          { label: 'Visualizar Transferência de Bem Patrimonial', isActive: true },
        ]}
      />

      <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>
          Visualizar Transferência de Bem Patrimonial
        </h1>

        <div className='flex flex-wrap items-center justify-end gap-3'>
          {transferencia.url_documento_ntbpm ? (
            <Button
              type='button'
              className={ACTION_BUTTON_CLASS}
              disabled={downloading}
              onClick={() => void handleBaixarDocumento()}
            >
              <Download size={16} />
              {downloading ? 'Baixando...' : 'Baixar NTBPM'}
            </Button>
          ) : null}

          <Button
            type='button'
            onClick={() => navigate('/transferencias')}
            className={ACTION_BUTTON_CLASS}
          >
            <ArrowLeft size={16} />
            Voltar
          </Button>
        </div>
      </div>

      <Card className='overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm'>
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
          <span className='text-sm font-bold text-[#2F7D57]'>
            Solicitação #{String(transferencia.id).padStart(4, '0')}
          </span>
          <span className='text-sm font-semibold text-[#00703C]'>
            NTBPM: {transferencia.numero_ntbpm ?? '-'}
          </span>
        </div>

        <div className='divide-y divide-gray-100'>
          <div className='grid gap-x-8 gap-y-2 px-6 py-4 lg:grid-cols-2'>
            <BemDetailField label='Número NTBPM'>
              {transferencia.numero_ntbpm ?? '-'}
            </BemDetailField>

            <BemDetailField label='Número do processo'>
              {transferencia.numero_processo ?? '-'}
            </BemDetailField>
          </div>

          <div className='grid gap-x-8 gap-y-2 px-6 py-4 lg:grid-cols-2'>
            <BemDetailField label='Unidade Orçamentária de Origem'>
              {resolveUoLabel(transferencia.unidade_orcamentaria_origem)}
            </BemDetailField>

            <BemDetailField label='Unidade Orçamentária de Destino'>
              {transferencia.unidade_orcamentaria_destino.label ??
                `${transferencia.unidade_orcamentaria_destino.codigo} - ${transferencia.unidade_orcamentaria_destino.sigla || transferencia.unidade_orcamentaria_destino.nome}`}
            </BemDetailField>
          </div>

          <div className='grid gap-x-8 gap-y-2 px-6 py-4 lg:grid-cols-2'>
            <BemDetailField label='Unidade Administrativa de Destino'>
              {resolveUaLabel(transferencia.unidade_administrativa_destino)}
            </BemDetailField>

            <BemDetailField label='Criado por'>
              {resolveUsuario(transferencia.criado_por)}
            </BemDetailField>
          </div>

          <div className='grid gap-x-8 gap-y-2 px-6 py-4 lg:grid-cols-2'>
            <BemDetailField label='Criado em'>
              {formatDateTimeBR(transferencia.criado_em)}
            </BemDetailField>
          </div>

          <div className='space-y-1.5 px-6 py-4'>
            <span className='text-sm font-semibold text-gray-700'>Observação</span>
            <div className='min-h-16 text-sm text-gray-700'>
              {transferencia.observacao || '-'}
            </div>
          </div>

          <div className='space-y-2 px-6 py-4'>
            <h2 className='text-sm font-semibold text-[#00703C]'>Itens da Transferência</h2>

            {transferencia.itens.length === 0 ? (
              <div className='text-sm text-gray-400'>Nenhum item encontrado.</div>
            ) : (
              <div className='space-y-2'>
                {transferencia.itens.map((item) => (
                  <BemItemRow
                    key={item.id ?? item.bem.id}
                    label={`${item.bem.numero_patrimonial ?? '-'} ${item.bem.nome}`}
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
