import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { CircleHelp, Network } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/auth/useAuth'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { BemCadastroPageShell } from '@/modules/bem-patrimonial/components/BemCadastroPageShell'
import { BemSelectorRow } from '@/modules/bem-patrimonial/components/BemSelectorRow'
import { useBemSelectionRows } from '@/modules/bem-patrimonial/components/useBemSelectionRows'
import { bemService } from '@/modules/bem-patrimonial/bem/services/bem.service'
import { unidadesAdministrativasService } from '@/modules/configuracoes/unidades-administrativas/services/unidades-administrativas.service'
import type { UnidadeAdministrativa } from '@/modules/configuracoes/unidades-administrativas/types/unidades-administrativas.types'
import { transferenciaService } from '../services/transferencia.service'
import type { TransferenciaBemPatrimonialCreatePayload, TransferenciaUoCadastroOption } from '../types/transferencia.types'

type UoOption = {
  id: number
  label: string
  tem_ponto_central: boolean
}

type UaOption = {
  id: number
  label: string
}

const FIELD_CLASS =
  'h-11 w-full rounded-xs border border-gray-300 bg-white px-4 py-0 text-sm text-gray-700'

const PAGE_SIZE_BENS = 20
const MENSAGEM_SEM_PONTO_CENTRAL =
  'Não há ponto central cadastrado na Unidade Orçamentária de destino. Por favor, entrar em contato com o gestor.'
const TOOLTIP_TEXT =
  'Use este filtro para localizar bens de uma UA específica. Os bens já adicionados permanecem na lista mesmo quando o filtro mudar'

function buildUaOptions(
  unidadesAdministrativas: UnidadeAdministrativa[],
  originUoId: number | null,
): UaOption[] {
  if (!originUoId) return []

  const options = unidadesAdministrativas
    .filter((ua) => ua.unidade_orcamentaria === originUoId)
    .map((ua) => ({
      id: ua.id,
      label: `${ua.codigo} - ${ua.sigla || ua.nome}`,
    }))

  const unique = new Map<number, UaOption>()
  options.forEach((option) => {
    if (!unique.has(option.id)) {
      unique.set(option.id, option)
    }
  })

  return [...unique.values()].sort((a, b) => a.label.localeCompare(b.label))
}
export default function AdicionarTransferenciaPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const originUoId = user?.uo_ativa?.id ?? null
  const originUoLabel = user?.uo_ativa?.label ?? user?.uo_ativa?.codigo ?? '-'

  const [selectedUoId, setSelectedUoId] = useState('')
  const [selectedUaFilterId, setSelectedUaFilterId] = useState('todas')
  const [numeroProcesso, setNumeroProcesso] = useState('')
  const [observacao, setObservacao] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uoOptions, setUoOptions] = useState<UoOption[]>([])
  const [unidadesAdministrativas, setUnidadesAdministrativas] = useState<UnidadeAdministrativa[]>([])
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  const {
    rows,
    allSelectedIds,
    handleSelectBem,
    handleClearBem,
    handleRemoveBem,
    handleAddBem,
  } = useBemSelectionRows(clearError)

  useEffect(() => {
    let isMounted = true

    const loadOptions = async () => {
      try {
        const options = await transferenciaService.listOpcoesCadastro()
        if (!isMounted) return

        setUoOptions(
          options
            .filter((uo) => !uo.codigo.startsWith('01.16.10'))
            .map((uo: TransferenciaUoCadastroOption) => ({
              id: uo.id,
              label: uo.label ?? (uo.codigo && uo.nome ? `${uo.codigo} - ${uo.nome}` : uo.nome),
              tem_ponto_central: uo.tem_ponto_central,
            })),
        )
      } catch {
        if (!isMounted) return
        setUoOptions([])
      }
    }

    const loadUnidadesAdministrativas = async () => {
      try {
        const response = await unidadesAdministrativasService.list({ pageSize: 1000 })
        if (!isMounted) return

        setUnidadesAdministrativas(response.results)
      } catch {
        if (!isMounted) return
        setUnidadesAdministrativas([])
      }
    }

    void loadOptions()
    void loadUnidadesAdministrativas()

    return () => {
      isMounted = false
    }
  }, [])

  const selectedUoNumericId = selectedUoId ? Number(selectedUoId) : null
  const selectedUoOption = useMemo(
    () => uoOptions.find((uo) => uo.id === selectedUoNumericId) ?? null,
    [selectedUoNumericId, uoOptions],
  )
  const selectedUoHasPointCentral = !!selectedUoOption?.tem_ponto_central
  const destinoSemPontoCentral = !!selectedUoId && !selectedUoHasPointCentral

  const uaOptions = useMemo(
    () => buildUaOptions(unidadesAdministrativas, originUoId),
    [originUoId, unidadesAdministrativas],
  )

  const searchBens = useCallback(
    async (query: string) => {
      if (!originUoId) return []

      const params =
        selectedUaFilterId === 'todas'
          ? {
              search: query,
              status: 'aprovado',
              unidade_orcamentaria: originUoId,
              pageSize: PAGE_SIZE_BENS,
            }
          : {
              search: query,
              status: 'aprovado',
              unidade_administrativa: Number(selectedUaFilterId),
              pageSize: PAGE_SIZE_BENS,
            }

      const response = await bemService.list(params)
      return response.results
    },
    [originUoId, selectedUaFilterId],
  )

  const canSave =
    !!originUoId &&
    !!selectedUoNumericId &&
    !!numeroProcesso.trim() &&
    rows.some((row) => row.bem) &&
    !submitting &&
    selectedUoHasPointCentral

  const handleSave = async () => {
    setError(null)

    if (!originUoId) {
      setError('Não foi possível identificar a UO de origem.')
      return
    }

    if (!selectedUoNumericId) {
      setError('Selecione a Unidade Orçamentária de destino.')
      return
    }

    if (!numeroProcesso.trim()) {
      setError('Informe o número do processo.')
      return
    }

    if (destinoSemPontoCentral) {
      setError(MENSAGEM_SEM_PONTO_CENTRAL)
      return
    }

    const itens = rows
      .filter((row) => row.bem)
      .map((row) => ({ bem: row.bem!.id }))

    if (itens.length === 0) {
      setError('Adicione ao menos um item de transferência.')
      return
    }

    setSubmitting(true)
    try {
      const payload: TransferenciaBemPatrimonialCreatePayload = {
        unidade_orcamentaria_destino: selectedUoNumericId,
        numero_processo: numeroProcesso.trim(),
        observacao,
        itens,
      }

      await transferenciaService.create(payload)

      toast.success(
        'Transferência cadastrada com sucesso. O bem foi transferido para a UA 001 da UO de destino.',
      )
      navigate('/transferencias')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar transferência.'
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BemCadastroPageShell
      breadcrumbItems={[
        { label: 'Bem Patrimonial', icon: Network },
        { label: 'Transferência de Bens Patrimoniais', to: '/transferencias' },
        { label: 'Adicionar Transferência de Bem Patrimonial', isActive: true },
      ]}
      title='Adicionar Transferência de Bem Patrimonial'
      onCancel={() => navigate('/transferencias')}
      onSave={handleSave}
      canSave={canSave}
      submitting={submitting}
      error={error}
    >
        <div className='flex flex-col gap-2'>
          <label htmlFor='uo-origem' className='text-sm font-semibold text-gray-700'>
            Unidade Orçamentária de Origem
          </label>
          <Input
            id='uo-origem'
            value={originUoLabel}
            disabled
            className={`${FIELD_CLASS} bg-gray-50 text-gray-500 cursor-not-allowed`}
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='flex flex-col gap-2'>
            <label htmlFor='uo-destino' className='text-sm font-semibold text-gray-700'>
              Unidade Orçamentária de Destino
            </label>
            <Select
              value={selectedUoId}
              onValueChange={(value) => {
                setSelectedUoId(value)
                setError(null)
              }}
            >
              <SelectTrigger id='uo-destino' className={FIELD_CLASS}>
                <SelectValue placeholder='Selecione a UO de destino' />
              </SelectTrigger>
              <SelectContent>
                {uoOptions.length === 0 ? (
                  <SelectItem value='__empty__' disabled>
                    Nenhuma UO disponível
                  </SelectItem>
                ) : (
                  uoOptions.map((uo) => (
                    <SelectItem key={uo.id} value={String(uo.id)}>
                      {uo.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-2'>
            <label htmlFor='numero-processo' className='text-sm font-semibold text-gray-700'>
              Número do Processo
            </label>
            <Input
              id='numero-processo'
              value={numeroProcesso}
              onChange={(event) => {
                setNumeroProcesso(event.target.value)
                setError(null)
              }}
              placeholder='Informe o número do processo'
              className={FIELD_CLASS}
            />
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <label htmlFor='observacao' className='text-sm font-semibold text-gray-700'>
            Observações
          </label>
          <Textarea
            id='observacao'
            value={observacao}
            onChange={(event) => {
              setObservacao(event.target.value)
              setError(null)
            }}
            placeholder='Digite uma observação'
            className='min-h-28'
          />
        </div>

        <div className='space-y-3'>
          <div className='space-y-1'>
            <h2 className='text-sm font-semibold text-[#00703C]'>
              Itens da Transferência de Bem
            </h2>

            <div className='flex items-center gap-2'>
              <span className='text-sm font-semibold text-gray-700'>
                Filtrar bens por Unidade Administrativa
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type='button'
                      className='inline-flex items-center justify-center text-[#2F7D57] hover:text-[#1f6849]'
                      aria-label='Ajuda sobre filtro de unidade administrativa'
                    >
                      <CircleHelp size={15} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='top' sideOffset={8} className='max-w-xs text-left'>
                    {TOOLTIP_TEXT}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <Select
            value={selectedUaFilterId}
            onValueChange={(value) => {
              setSelectedUaFilterId(value)
              setError(null)
            }}
          >
            <SelectTrigger
              aria-label='Filtrar bens por Unidade Administrativa'
              className='h-11 w-full max-w-md rounded-xs border border-gray-300 bg-white px-4 py-0 text-sm text-gray-700'
            >
              <SelectValue placeholder='Todas as UAs da UO de Origem' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='todas'>Todas as UAs da UO de Origem</SelectItem>
              {uaOptions.length === 0 ? (
                <SelectItem value='__empty__' disabled>
                  Nenhuma UA disponível
                </SelectItem>
              ) : (
                uaOptions.map((ua) => (
                  <SelectItem key={ua.id} value={String(ua.id)}>
                    {ua.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {destinoSemPontoCentral ? (
            <div
              className='text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-4 py-2'
              role='alert'
            >
              {MENSAGEM_SEM_PONTO_CENTRAL}
            </div>
          ) : null}

          <div className='space-y-2'>
            {rows.map((row, index) => (
              <BemSelectorRow
                key={row.id}
                rowId={row.id}
                bem={row.bem}
                originDisabled={!originUoId}
                allSelectedIds={allSelectedIds}
                canRemove={rows.length > 1}
                onSelect={handleSelectBem}
                onClear={handleClearBem}
                onRemove={handleRemoveBem}
                onAdd={handleAddBem}
                isLast={index === rows.length - 1}
                searchBens={searchBens}
              />
            ))}
          </div>
        </div>
    </BemCadastroPageShell>
  )
}
