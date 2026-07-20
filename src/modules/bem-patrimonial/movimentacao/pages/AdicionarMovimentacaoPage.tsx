import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Network } from 'lucide-react'

import { useAuth } from '@/auth/useAuth'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { BemCadastroPageShell } from '@/modules/bem-patrimonial/components/BemCadastroPageShell'
import { BemSelectorRow } from '@/modules/bem-patrimonial/components/BemSelectorRow'
import { useBemSelectionRows } from '@/modules/bem-patrimonial/components/useBemSelectionRows'
import { unidadesAdministrativasService } from '@/modules/configuracoes/unidades-administrativas/services/unidades-administrativas.service'
import { bemService } from '../../bem/services/bem.service'
import { movimentacaoService } from '../services/movimentacao.service'
import type { MovimentacaoUoCadastroOption } from '../types/movimentacao.types'
import type { UnidadeAdministrativa } from '@/modules/configuracoes/unidades-administrativas/types/unidades-administrativas.types'

type UaOption = {
  id: number
  label: string
  unidade_orcamentaria_id: number
}

type UoOption = {
  id: number
  label: string
  tem_ponto_central: boolean
}

const INPUT_CLASS =
  'h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white'

const PAGE_SIZE_BENS = 20
const MENSAGEM_SEM_PONTO_CENTRAL =
  'Não há ponto central cadastrado na Unidade Orçamentária de destino. Por favor, entrar em contato com o gestor.'

function buildUaOptions(
  unidadesAdministrativas: UnidadeAdministrativa[],
  uoId: number | null,
  uaOrigemId: number | null,
): UaOption[] {
  if (!uoId) return []

  return unidadesAdministrativas
    .filter((ua) => ua.unidade_orcamentaria === uoId)
    .filter((ua) => ua.id !== uaOrigemId)
    .map((ua) => ({
      id: ua.id,
      label: `${ua.codigo} - ${ua.sigla || ua.nome}`,
      unidade_orcamentaria_id: ua.unidade_orcamentaria,
    }))
}

export default function AdicionarMovimentacaoPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const originUaId = user?.ua_ativa?.id ?? null
  const referenceUoId = user?.uo_ativa?.id ?? null
  const originUaLabel = user?.ua_ativa?.label ?? user?.ua_ativa?.codigo ?? '-'

  const [selectedUoId, setSelectedUoId] = useState('')
  const [selectedUaId, setSelectedUaId] = useState('')
  const [observacao, setObservacao] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uoOptions, setUoOptions] = useState<UoOption[]>([])
  const [unidadesAdministrativas, setUnidadesAdministrativas] = useState<UnidadeAdministrativa[]>(
    [],
  )
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
        const options = await movimentacaoService.listOpcoesCadastro()
        if (!isMounted) return

        setUoOptions(
          options.map((uo: MovimentacaoUoCadastroOption) => ({
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
  const destinoMesmaUo =
    referenceUoId !== null &&
    selectedUoNumericId !== null &&
    selectedUoNumericId === referenceUoId
  const selectedUoOption = useMemo(
    () => uoOptions.find((uo) => uo.id === selectedUoNumericId) ?? null,
    [selectedUoNumericId, uoOptions],
  )
  const destinoSemPontoCentral =
    !!selectedUoNumericId &&
    !destinoMesmaUo &&
    selectedUoOption !== null &&
    !selectedUoOption.tem_ponto_central
  const uaOptions = useMemo(
    () => buildUaOptions(unidadesAdministrativas, selectedUoNumericId, originUaId),
    [originUaId, selectedUoNumericId, unidadesAdministrativas],
  )
  const searchBens = useCallback(
    async (query: string) => {
      if (!originUaId) return []

      const response = await bemService.list({
        search: query,
        status: 'aprovado',
        unidade_administrativa: originUaId,
        pageSize: PAGE_SIZE_BENS,
      })
      return response.results
    },
    [originUaId],
  )
  let uaDestinoPlaceholder = 'Selecione a UO de destino primeiro'
  if (selectedUoId) {
    if (destinoSemPontoCentral) {
      uaDestinoPlaceholder = 'Nenhuma UA disponível'
    } else if (destinoMesmaUo) {
      uaDestinoPlaceholder = 'Selecione a UA de destino'
    } else {
      uaDestinoPlaceholder = 'UA de destino definida pelo ponto central'
    }
  }
  const canSave =
    !!originUaId &&
    !!selectedUoNumericId &&
    (destinoMesmaUo ? !!selectedUaId : Boolean(selectedUoOption?.tem_ponto_central)) &&
    rows.some((row) => row.bem) &&
    !submitting

  useEffect(() => {
    if (!selectedUoId) {
      setSelectedUaId('')
      return
    }

    if (destinoMesmaUo) {
      if (selectedUaId && !uaOptions.some((ua) => String(ua.id) === selectedUaId)) {
        setSelectedUaId('')
      }
      return
    }

    if (selectedUaId) {
      setSelectedUaId('')
    }
  }, [
    destinoMesmaUo,
    selectedUoId,
    selectedUaId,
    uaOptions,
  ])

  useEffect(() => {
    if (uoOptions.length === 1 && !selectedUoId) {
      setSelectedUoId(String(uoOptions[0].id))
    }
  }, [selectedUoId, uoOptions])

  useEffect(() => {
    if (destinoMesmaUo && uaOptions.length === 1 && !selectedUaId) {
      setSelectedUaId(String(uaOptions[0].id))
    }
  }, [destinoMesmaUo, selectedUaId, uaOptions])

  const handleSave = async () => {
    setError(null)

    if (!originUaId) {
      setError('Não foi possível identificar a UA de origem.')
      return
    }

    if (!selectedUoNumericId) {
      setError('Selecione a Unidade Orçamentária de destino.')
      return
    }

    if (destinoSemPontoCentral) {
      setError(MENSAGEM_SEM_PONTO_CENTRAL)
      return
    }

    if (destinoMesmaUo && !selectedUaId) {
      setError('Selecione a Unidade Administrativa de destino.')
      return
    }

    const itens = rows
      .filter((row) => row.bem)
      .map((row) => ({ bem: row.bem!.id }))

    if (itens.length === 0) {
      setError('Adicione ao menos um item de movimentação.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        unidade_administrativa_origem: originUaId,
        unidade_orcamentaria_destino: selectedUoNumericId,
        observacao,
        itens,
        ...(destinoMesmaUo ? { unidade_administrativa_destino: Number(selectedUaId) } : {}),
      }

      await movimentacaoService.create({
        ...payload,
      })

      toast.success(
        'Cadastro realizado com sucesso - A movimentação do bem foi cadastrada e enviada para aprovação.',
      )
      navigate('/movimentacoes')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar movimentação.'
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
        { label: 'Movimentações de Bem Patrimonial', to: '/movimentacoes' },
        { label: 'Adicionar Movimentação de Bem Patrimonial', isActive: true },
      ]}
      title='Adicionar Movimentação de Bem Patrimonial'
      onCancel={() => navigate('/movimentacoes')}
      onSave={handleSave}
      canSave={canSave}
      submitting={submitting}
      error={error}
    >
        <div className='flex flex-col gap-2'>
          <label htmlFor='ua-origem' className='text-sm font-semibold text-gray-700'>
            Unidade Administrativa de Origem
          </label>
          <Input
            id='ua-origem'
            value={originUaLabel}
            disabled
            className={`${INPUT_CLASS} bg-gray-50 text-gray-500 cursor-not-allowed`}
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
                setSelectedUaId('')
                setError(null)
              }}
            >
              <SelectTrigger id='uo-destino' className={INPUT_CLASS}>
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
            <label htmlFor='ua-destino' className='text-sm font-semibold text-gray-700'>
              Unidade Administrativa de Destino
            </label>
            <Select
              value={selectedUaId}
              onValueChange={(value) => {
                setSelectedUaId(value)
                setError(null)
              }}
              disabled={!selectedUoId || !destinoMesmaUo}
            >
              <SelectTrigger id='ua-destino' className={INPUT_CLASS}>
                <SelectValue placeholder={uaDestinoPlaceholder} />
              </SelectTrigger>
              <SelectContent>
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
          </div>
        </div>

        {destinoSemPontoCentral ? (
          <div
            className='text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-4 py-2'
            role='alert'
          >
            {MENSAGEM_SEM_PONTO_CENTRAL}
          </div>
        ) : null}

        <div className='flex flex-col gap-2'>
          <label htmlFor='observacao' className='text-sm font-semibold text-gray-700'>
            Observação
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
          <div>
            <h2 className='text-sm font-semibold text-[#00703C]'>Itens de Movimentação</h2>
          </div>

          <div className='space-y-2'>
            {rows.map((row, index) => (
              <BemSelectorRow
                key={row.id}
                rowId={row.id}
                bem={row.bem}
                originDisabled={!originUaId}
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
