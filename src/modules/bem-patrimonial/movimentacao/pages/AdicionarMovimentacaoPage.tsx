import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent as ReactChangeEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronDown, Network, Plus, Trash2, X } from 'lucide-react'

import { useAuth } from '@/auth/useAuth'
import type { EscopoGrupo } from '@/auth/auth.service'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { bemService, type Bem } from '../../bem/services/bem.service'
import { movimentacaoService } from '../services/movimentacao.service'

type ItemRow = {
  id: string
  bem: Bem | null
}

type UoOption = {
  id: number
  label: string
}

type UaOption = {
  id: number
  label: string
}

const INPUT_CLASS =
  'h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white'

const ACTION_BUTTON_CLASS = `
  h-10 px-6 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white font-semibold rounded-md transition-colors
`

const PRIMARY_BUTTON_CLASS =
  'h-10 px-6 bg-[#00703C] hover:bg-[#005a30] text-white font-semibold rounded-md'

const PAGE_SIZE_BENS = 20
const CODIGO_UA_PONTO_CENTRAL = '001'
const MENSAGEM_SEM_PONTO_CENTRAL =
  'Não há ponto central cadastrado na Unidade Orçamentária de destino. Por favor, entrar em contato com o gestor.'

function createEmptyRow(): ItemRow {
  return { id: crypto.randomUUID(), bem: null }
}

function buildUoOptions(grupos: EscopoGrupo[] | null | undefined): UoOption[] {
  const seen = new Map<number, UoOption>()

  for (const grupo of grupos ?? []) {
    const uo = grupo?.uo
    if (!uo?.id || seen.has(uo.id)) continue

    seen.set(uo.id, {
      id: uo.id,
      label: uo.label ?? uo.nome ?? `UO ${uo.id}`,
    })
  }

  return [...seen.values()]
}

function isUaPontoCentral(codigo?: string | null) {
  return codigo === CODIGO_UA_PONTO_CENTRAL || codigo?.endsWith(`.${CODIGO_UA_PONTO_CENTRAL}`)
}

function findGrupoDestino(grupos: EscopoGrupo[] | null | undefined, uoId: number | null) {
  if (!uoId) return null
  return (grupos ?? []).find((item) => item?.uo?.id === uoId) ?? null
}

function buildUaOptions(
  grupos: EscopoGrupo[] | null | undefined,
  uoId: number | null,
  uoReferenciaId: number | null,
  uaOrigemId: number | null,
): UaOption[] {
  if (!uoId) return []

  const grupo = findGrupoDestino(grupos, uoId)
  const uas = grupo?.uas ?? []
  const destinoMesmaUo = uoReferenciaId !== null && uoId === uoReferenciaId

  if (destinoMesmaUo) {
    return uas
      .filter((ua) => ua.unidade_administrativa_id !== uaOrigemId)
      .map((ua) => ({
        id: ua.unidade_administrativa_id,
        label: ua.label ?? ua.nome ?? `UA ${ua.unidade_administrativa_id}`,
      }))
  }

  const uaPontoCentral = uas.find((ua) => isUaPontoCentral(ua.codigo))
  if (!uaPontoCentral) return []

  return [
    {
      id: uaPontoCentral.unidade_administrativa_id,
      label:
        uaPontoCentral.label ??
        uaPontoCentral.nome ??
        `UA ${uaPontoCentral.unidade_administrativa_id}`,
    },
  ]
}

function BemSelectorRow({
  row,
  originUaId,
  allSelectedIds,
  canRemove,
  onSelect,
  onClear,
  onRemove,
  onAdd,
  isLast,
}: Readonly<{
  row: ItemRow
  originUaId: number | null
  allSelectedIds: number[]
  canRemove: boolean
  onSelect: (rowId: string, bem: Bem) => void
  onClear: (rowId: string) => void
  onRemove: (rowId: string) => void
  onAdd: () => void
  isLast: boolean
}>) {
  const [open, setOpen] = useState(false)
  const [openUpwards, setOpenUpwards] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [results, setResults] = useState<Bem[]>([])
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const updateDropdownDirection = () => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    setOpenUpwards(spaceBelow < 280 && spaceAbove > spaceBelow)
  }

  const search = async (query: string) => {
    if (!originUaId) return

    setLoading(true)
    try {
      const response = await bemService.list({
        search: query,
        status: 'aprovado',
        unidade_administrativa: originUaId,
        pageSize: PAGE_SIZE_BENS,
      })
      setResults(response.results)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleFocus = () => {
    if (row.bem || !originUaId) return

    setOpen(true)
    updateDropdownDirection()
    if (results.length === 0) {
      void search('')
    }
  }

  const handleInputChange = (event: ReactChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setInputValue(value)
    setOpen(true)
    updateDropdownDirection()

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      void search(value)
    }, 300)
  }

  const handleSelect = (bem: Bem) => {
    onSelect(row.id, bem)
    setInputValue('')
    setOpen(false)
  }

  const handleClear = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onClear(row.id)
    setInputValue('')
    setResults([])
    setOpen(false)
  }

  const renderResults = () => {
    if (loading) {
      return <li className='px-3 py-2 text-sm text-gray-400'>Buscando...</li>
    }

    if (results.length === 0) {
      return <li className='px-3 py-2 text-sm text-gray-400'>Nenhum bem encontrado.</li>
    }

    return results.map((bem) => {
      const alreadyAdded = allSelectedIds.includes(bem.id)

      return (
        <li key={bem.id} className='border-b border-gray-100 last:border-0'>
          <button
            type='button'
            disabled={alreadyAdded}
            onClick={() => handleSelect(bem)}
            className={`w-full text-left px-3 py-2 text-sm ${
              alreadyAdded
                ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                : 'hover:bg-[#2F7D57] hover:text-white cursor-pointer'
            }`}
          >
            <span className='font-mono mr-2'>{bem.numero_patrimonial ?? '-'}</span>
            {bem.nome}
          </button>
        </li>
      )
    })
  }

  const disabled = !originUaId

  return (
    <div className='flex items-center gap-2'>
      <div className='flex-1 relative' ref={ref}>
        {row.bem ? (
          <div className='h-11 w-full rounded-xs border border-gray-300 px-3 bg-white flex items-center justify-between'>
            <span className='text-sm text-gray-700 truncate'>
              <span className='font-mono mr-2 text-gray-500'>
                {row.bem.numero_patrimonial ?? '-'}
              </span>
              {row.bem.nome}
            </span>
            <div className='flex items-center gap-1 shrink-0 ml-2'>
              <button
                type='button'
                onClick={handleClear}
                className='text-gray-400 hover:text-gray-600 p-1'
                aria-label='Limpar bem selecionado'
              >
                <X size={14} />
              </button>
              <ChevronDown size={14} className='text-gray-400' />
            </div>
          </div>
        ) : (
          <div className='relative'>
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleFocus}
              placeholder={disabled ? 'Aguarde a unidade de origem' : 'Buscar bem patrimonial'}
              disabled={disabled}
              className={`${INPUT_CLASS} pr-8 ${
                disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''
              }`}
              aria-label='Buscar bem patrimonial'
            />
            <ChevronDown
              size={14}
              className='absolute right-3 top-3.5 text-gray-400 pointer-events-none'
            />

            {open && !disabled ? (
              <ul
                className={`absolute left-0 right-0 bg-white border border-gray-300 rounded shadow-lg z-20 max-h-56 overflow-auto pb-2 ${
                  openUpwards ? 'bottom-full mb-1' : 'top-full mt-0'
                }`}
              >
                {renderResults()}
              </ul>
            ) : null}
          </div>
        )}
      </div>

      {isLast ? (
        <button
          type='button'
          onClick={onAdd}
          className='h-10 w-10 flex items-center justify-center rounded border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white transition-colors shrink-0'
          aria-label='Adicionar item'
        >
          <Plus size={18} />
        </button>
      ) : (
        <div className='w-10 shrink-0' />
      )}

      <button
        type='button'
        onClick={() => onRemove(row.id)}
        disabled={!canRemove}
        className='h-10 w-10 flex items-center justify-center rounded border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#2F7D57]'
        aria-label='Remover item'
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

export default function AdicionarMovimentacaoPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const grupos = user?.opcoes_escopo?.grupos ?? []
  const originUaId = user?.ua_ativa?.id ?? null
  const referenceUoId = user?.uo_ativa?.id ?? null
  const originUaLabel = user?.ua_ativa?.label ?? user?.ua_ativa?.codigo ?? '-'

  const uoOptions = useMemo(() => buildUoOptions(grupos), [grupos])

  const [selectedUoId, setSelectedUoId] = useState('')
  const [selectedUaId, setSelectedUaId] = useState('')
  const [observacao, setObservacao] = useState('')
  const [rows, setRows] = useState<ItemRow[]>([createEmptyRow()])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedUoNumericId = selectedUoId ? Number(selectedUoId) : null
  const grupoDestino = useMemo(
    () => findGrupoDestino(grupos, selectedUoNumericId),
    [grupos, selectedUoNumericId],
  )
  const destinoMesmaUo =
    referenceUoId !== null &&
    selectedUoNumericId !== null &&
    selectedUoNumericId === referenceUoId
  const uaPontoCentralDestino = useMemo(
    () => grupoDestino?.uas.find((ua) => isUaPontoCentral(ua.codigo)) ?? null,
    [grupoDestino],
  )
  const destinoSemPontoCentral =
    !!selectedUoNumericId && !destinoMesmaUo && !uaPontoCentralDestino
  const uaOptions = useMemo(
    () => buildUaOptions(grupos, selectedUoNumericId, referenceUoId, originUaId),
    [grupos, originUaId, referenceUoId, selectedUoNumericId],
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
    !!selectedUaId &&
    !destinoSemPontoCentral &&
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

    if (uaPontoCentralDestino) {
      const centralId = String(uaPontoCentralDestino.unidade_administrativa_id)
      if (selectedUaId !== centralId) {
        setSelectedUaId(centralId)
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
    uaPontoCentralDestino,
  ])

  useEffect(() => {
    if (uoOptions.length === 1 && !selectedUoId) {
      setSelectedUoId(String(uoOptions[0].id))
    }
  }, [selectedUoId, uoOptions])

  useEffect(() => {
    if (uaOptions.length === 1 && !selectedUaId) {
      setSelectedUaId(String(uaOptions[0].id))
    }
  }, [selectedUaId, uaOptions])

  const allSelectedIds = rows.filter((row) => row.bem).map((row) => row.bem!.id)

  const handleSelectBem = (rowId: string, bem: Bem) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, bem } : row)))
    setError(null)
  }

  const handleClearBem = (rowId: string) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, bem: null } : row)))
    setError(null)
  }

  const handleRemoveBem = (rowId: string) => {
    setRows((prev) => {
      if (prev.length === 1) {
        return [createEmptyRow()]
      }
      return prev.filter((row) => row.id !== rowId)
    })
    setError(null)
  }

  const handleAddBem = () => {
    setRows((prev) => [...prev, createEmptyRow()])
    setError(null)
  }

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

    if (!selectedUaId) {
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
      await movimentacaoService.create({
        unidade_administrativa_origem: originUaId,
        unidade_orcamentaria_destino: selectedUoNumericId,
        unidade_administrativa_destino: Number(selectedUaId),
        observacao,
        itens,
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
    <div className='p-8 space-y-4'>
      <AppBreadcrumb
        items={[
          { label: 'Bem Patrimonial', icon: Network },
          { label: 'Movimentações de Bem Patrimonial', to: '/movimentacoes' },
          { label: 'Adicionar Movimentação de Bem Patrimonial', isActive: true },
        ]}
      />

      <div className='flex items-center justify-between gap-4'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>
          Adicionar Movimentação de Bem Patrimonial
        </h1>

        <div className='flex items-center gap-3'>
          <Button
            type='button'
            onClick={() => navigate('/movimentacoes')}
            className={ACTION_BUTTON_CLASS}
          >
            Cancelar
          </Button>
          <Button
            type='button'
            onClick={handleSave}
            disabled={!canSave}
            className={`${PRIMARY_BUTTON_CLASS} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {submitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {error ? (
        <div
          className='text-sm text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2'
          role='alert'
        >
          {error}
        </div>
      ) : null}

      <Card className='p-6 space-y-4'>
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
                row={row}
                originUaId={originUaId}
                allSelectedIds={allSelectedIds}
                canRemove={rows.length > 1}
                onSelect={handleSelectBem}
                onClear={handleClearBem}
                onRemove={handleRemoveBem}
                onAdd={handleAddBem}
                isLast={index === rows.length - 1}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
