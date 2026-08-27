import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Eye,
  FileText,
  Network,
  Minus,
  Search,
  X,
  CircleAlert,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/auth/useAuth'
import type { EscopoGrupo } from '@/auth/auth.service'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePagination } from '../../bem/hooks/usePagination'
import { FilterSelect } from '@/modules/bem-patrimonial/components/FilterSelect'
import { movimentacaoService } from '../services/movimentacao.service'
import type { MovimentacaoBemPatrimonialListItem } from '../types/movimentacao.types'

type UaOption = {
  id: number
  label: string
}

type StatusFilterValue = 'todos' | 'true' | 'false'

type StatusOption = {
  value: string
  label: string
}

type SelectOption = {
  value: string
  label: string
}

type MovimentacaoAction = 'aprovar' | 'rejeitar' | 'cancelar'

const PAGE_SIZE = 10
const DIAS_ATRASO = 7

const ACTION_BUTTON_CLASS = `
  h-10 px-6 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white font-semibold rounded-md transition-colors
`

const INPUT_CLASS =
  'h-10 w-full rounded-xs border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-[#2F7D57]'

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'enviada', label: 'Enviada' },
  { value: 'aceita', label: 'Aceita' },
  { value: 'rejeitada', label: 'Rejeitada' },
  { value: 'cancelada', label: 'Cancelada' },
]

const STATUS_BADGE_CLASS: Record<string, string> = {
  enviada: 'text-[#00703C]',
  aceita: 'text-blue-700',
  rejeitada: 'text-red-600',
  cancelada: 'text-gray-500',
}

export function isMovimentacaoAtrasada(movimentacao: Pick<MovimentacaoBemPatrimonialListItem, 'status' | 'criado_em'>): boolean {
  if (movimentacao.status !== 'enviada') return false
  const criado = new Date(movimentacao.criado_em)
  if (Number.isNaN(criado.getTime())) return false
  const limite = new Date()
  limite.setDate(limite.getDate() - DIAS_ATRASO)
  return criado <= limite
}

function getActionErrorMessage(action: MovimentacaoAction) {
  if (action === 'aprovar') return 'Erro ao aprovar movimentações'
  if (action === 'rejeitar') return 'Erro ao rejeitar movimentações'
  return 'Erro ao cancelar movimentações'
}

function getActionSuccessMessage(action: MovimentacaoAction, ids: number[]) {
  const firstId = String(ids[0]).padStart(4, '0')
  const quantity = ids.length

  if (quantity === 1) {
    if (action === 'aprovar') {
      return `Movimentação #${firstId} aprovada com sucesso. Bens desbloqueados.`
    }
    if (action === 'rejeitar') {
      return `Movimentação #${firstId} rejeitada com sucesso. Bens desbloqueados.`
    }
    return `Movimentação #${firstId} cancelada com sucesso. Bens desbloqueados.`
  }

  if (action === 'aprovar') {
    return `${quantity} movimentações aprovadas com sucesso. Bens desbloqueados.`
  }
  if (action === 'rejeitar') {
    return `${quantity} movimentações rejeitadas com sucesso. Bens desbloqueados.`
  }
  return `${quantity} movimentações canceladas com sucesso. Bens desbloqueados.`
}

function getActionFn(action: MovimentacaoAction) {
  if (action === 'aprovar') return movimentacaoService.aprovar
  if (action === 'rejeitar') return movimentacaoService.rejeitar
  return movimentacaoService.cancelar
}

function canSelectMovimentacaoForUser(
  user:
    | {
        id?: number
        is_gestor_patrimonio?: boolean
        is_operador_inventario?: boolean
        is_superuser?: boolean
      }
    | null
    | undefined,
  movimentacao: MovimentacaoBemPatrimonialListItem,
) {
  if (movimentacao.status !== 'enviada') {
    return false
  }

  if (!user) {
    return false
  }

  if (user.is_gestor_patrimonio || user.is_superuser) {
    return true
  }

  if (user.is_operador_inventario) {
    return movimentacao.solicitado_por.id === user.id
  }

  return false
}

function formatDateTimeBR(dateString: string) {
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
  unidade: MovimentacaoBemPatrimonialListItem['unidade_administrativa_origem'],
) {
  return `${unidade.codigo} - ${unidade.sigla || unidade.nome}`
}

function buildUaOptions(
  grupos: EscopoGrupo[] | null | undefined,
): UaOption[] {
  const options = (grupos ?? []).flatMap((grupo) =>
    (grupo.uas ?? []).map((ua) => ({
      id: ua.unidade_administrativa_id,
      label: ua.label ?? `${ua.codigo} - ${ua.nome}`,
    })),
  )

  const unique = new Map<number, UaOption>()
  options.forEach((option) => {
    if (!unique.has(option.id)) unique.set(option.id, option)
  })

  return [...unique.values()].sort((a, b) => a.label.localeCompare(b.label))
}

function StatusBadge(props: Readonly<{ status: string; statusDisplay: string }>) {
  const { status, statusDisplay } = props

  return (
    <span className={`text-sm font-semibold ${STATUS_BADGE_CLASS[status] ?? 'text-gray-600'}`}>
      {statusDisplay}
    </span>
  )
}

function AlertaAtrasada() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className='inline-flex items-center'
          aria-label='Movimentação em atraso'
          data-testid='alerta-atrasada'
        >
          <CircleAlert className='size-4 text-red-600' />
        </span>
      </TooltipTrigger>
      <TooltipContent side='top' sideOffset={6} className='max-w-70'>
        Movimentação pendente há mais de {DIAS_ATRASO} dias
      </TooltipContent>
    </Tooltip>
  )
}

type MovimentacaoTableRowProps = Readonly<{
  movimentacao: MovimentacaoBemPatrimonialListItem
  selected: boolean
  disabled: boolean
  onToggleSelected: (id: number) => void
  onVisualizar: (id: number) => void
}>

function MovimentacaoTableRow(props: MovimentacaoTableRowProps) {
  const { movimentacao, selected, disabled, onToggleSelected, onVisualizar } = props
  const atrasada = isMovimentacaoAtrasada(movimentacao)

  return (
    <tr key={movimentacao.id} className='border-b hover:bg-gray-50'>
      <td className='p-3 align-middle'>
        <Checkbox
          checked={selected}
          disabled={disabled}
          aria-label={`Selecionar movimentação ${movimentacao.id}`}
          onCheckedChange={() => onToggleSelected(movimentacao.id)}
        />
      </td>
      <td className='p-3'>
        <span className='inline-flex items-center gap-1.5'>
          {movimentacao.numero_cimbpm ?? '-'}
          {atrasada && <AlertaAtrasada />}
        </span>
      </td>
      <td className='p-3'>{resolveUaLabel(movimentacao.unidade_administrativa_origem)}</td>
      <td className='p-3'>{resolveUaLabel(movimentacao.unidade_administrativa_destino)}</td>
      <td className='p-3'>{formatDateTimeBR(movimentacao.atualizado_em)}</td>
      <td className='p-3'>
        <StatusBadge
          status={movimentacao.status}
          statusDisplay={movimentacao.status_display}
        />
      </td>
      <td className='p-3 text-center'>
        <Button
          type='button'
          size='icon'
          variant='ghost'
          aria-label={`Visualizar movimentação ${movimentacao.id}`}
          onClick={() => onVisualizar(movimentacao.id)}
        >
          <Eye className='size-[22px] text-[#00703C]' />
        </Button>
      </td>
    </tr>
  )
}

function StatusMultiSelect(props: Readonly<{
  value: string[]
  onChange: (value: string[]) => void
}>) {
  const { value, onChange } = props
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedLabel = useMemo(() => {
    if (value.length === 0) return 'Todos'

    const labels = value
      .map((status) => STATUS_OPTIONS.find((option) => option.value === status)?.label)
      .filter(Boolean)

    if (labels.length > 0) {
      return labels.join(', ')
    }

    return 'Todos'
  }, [value])

  const toggleStatus = (status: string) => {
    onChange(
      value.includes(status)
        ? value.filter((item) => item !== status)
        : [...value, status],
    )
  }

  return (
    <div ref={ref} className='relative'>
      <button
        type='button'
        onClick={() => setOpen((prev) => !prev)}
        className={INPUT_CLASS}
        aria-haspopup='listbox'
        aria-expanded={open}
      >
        <span className='flex w-full items-center justify-between gap-2'>
          <span className='truncate text-left'>{selectedLabel}</span>
          <ChevronDown className='size-4 shrink-0 text-gray-500' />
        </span>
      </button>

      {open && (
        <div className='absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-xl'>
          <div className='p-1'>
            {STATUS_OPTIONS.map((option) => {
              const checked = value.includes(option.value)

              return (
                <label
                  key={option.value}
                  className='flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-sm text-gray-700 hover:bg-gray-50'
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleStatus(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MovimentacoesListPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoBemPatrimonialListItem[]>(
    [],
  )
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [unidadeOrigemFilter, setUnidadeOrigemFilter] = useState('todas')
  const [unidadeDestinoFilter, setUnidadeDestinoFilter] = useState('todas')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [atrasadaFilter, setAtrasadaFilter] = useState<StatusFilterValue>('todos')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshToken, setRefreshToken] = useState(0)

  const uoOptions = useMemo(
    () => buildUaOptions(user?.opcoes_escopo?.grupos),
    [user?.opcoes_escopo?.grupos],
  )

  const unidadeOptions = useMemo<SelectOption[]>(
    () => [{ value: 'todas', label: 'Todas' }, ...uoOptions.map((option) => ({
      value: String(option.id),
      label: option.label,
    }))],
    [uoOptions],
  )

  const atrasadaOptions = useMemo<SelectOption[]>(
    () => [
      { value: 'todos', label: 'Todos' },
      { value: 'true', label: 'Sim' },
      { value: 'false', label: 'Não' },
    ],
    [],
  )

  const eligibleMovimentacoes = useMemo(
    () => movimentacoes.filter((movimentacao) => canSelectMovimentacaoForUser(user, movimentacao)),
    [movimentacoes, user],
  )

  const eligibleIds = useMemo(
    () => eligibleMovimentacoes.map((movimentacao) => movimentacao.id),
    [eligibleMovimentacoes],
  )

  const selectedEligibleIds = useMemo(
    () => selectedIds.filter((id) => eligibleIds.includes(id)),
    [eligibleIds, selectedIds],
  )

  const allEligibleSelected =
    eligibleIds.length > 0 &&
    eligibleIds.every((id) => selectedEligibleIds.includes(id))

  const canUseSelection = selectedEligibleIds.length > 0 && !actionLoading
  const isGestor = !!user?.is_gestor_patrimonio
  const isOperador = !!user?.is_operador_inventario
  const isSuperuser = !!user?.is_superuser
  const canCancelMovimentacoes = isGestor || isOperador || isSuperuser

  const { pages, totalPages } = usePagination({
    page,
    totalItems: count,
    pageSize: PAGE_SIZE,
  })

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)

    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      try {
        const data = await movimentacaoService.list({
          page,
          pageSize: PAGE_SIZE,
          search: search || undefined,
          status: statusFilter.length > 0 ? statusFilter : undefined,
          unidade_administrativa_origem:
            unidadeOrigemFilter === 'todas' ? undefined : Number(unidadeOrigemFilter),
          unidade_administrativa_destino:
            unidadeDestinoFilter === 'todas' ? undefined : Number(unidadeDestinoFilter),
          atrasada: atrasadaFilter === 'todos' ? undefined : atrasadaFilter,
          ordering: '-criado_em',
        })

        if (!active) return

        setMovimentacoes(data.results)
        setCount(data.count)
      } catch (error) {
        if (!active) return
        console.error(error)
        toast.error('Erro ao listar movimentações')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [
    page,
    search,
    statusFilter,
    unidadeOrigemFilter,
    unidadeDestinoFilter,
    atrasadaFilter,
    refreshToken,
  ])

  useEffect(() => {
    setSelectedIds([])
  }, [page, search, statusFilter, unidadeOrigemFilter, unidadeDestinoFilter, atrasadaFilter])

  function getSelectedEligibleIds() {
    return selectedIds.filter((id) => eligibleIds.includes(id))
  }

  async function handleAction(action: MovimentacaoAction) {
    const ids = getSelectedEligibleIds()
    if (ids.length === 0) return

    setActionLoading(true)
    try {
      const actionFn = getActionFn(action)
      await Promise.all(ids.map((id) => actionFn(id)))
      toast.success(getActionSuccessMessage(action, ids))
      setSelectedIds([])
      setRefreshToken((current) => current + 1)
    } catch (error) {
      const message = error instanceof Error ? error.message : getActionErrorMessage(action)
      toast.error(message || getActionErrorMessage(action))
    } finally {
      setActionLoading(false)
    }
  }

  const handleVisualizar = (id: number) => {
    navigate(`/movimentacoes/${id}`)
  }

  function toggleSelectedId(id: number) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    )
  }

  function toggleAllEligibleSelection() {
    if (eligibleIds.length === 0 || actionLoading) return

    setSelectedIds((current) =>
      allEligibleSelected ? current.filter((id) => !eligibleIds.includes(id)) : [...new Set([...current, ...eligibleIds])],
    )
  }

  const renderPaginationItem = (item: number | '...', index: number) => {
    if (item === '...') {
      return (
        <span key={`${item}-${index}`} className='px-2 text-sm text-gray-500'>
          ...
        </span>
      )
    }

    return (
      <Button
        key={item}
        size='sm'
        variant='outline'
        onClick={() => setPage(Number(item))}
        className={page === item ? 'border-[#00703C] bg-[#00703C] text-white' : ''}
      >
        {item}
      </Button>
    )
  }

  let tableBody = (
    <tr>
      <td colSpan={7} className='py-10 text-center text-gray-400'>
        Nenhuma movimentação encontrada.
      </td>
    </tr>
  )

  if (loading) {
    tableBody = (
      <tr>
        <td colSpan={7} className='py-10 text-center text-gray-500'>
          Carregando...
        </td>
      </tr>
    )
  } else if (movimentacoes.length > 0) {
    tableBody = (
      <>
        {movimentacoes.map((movimentacao) => (
          <MovimentacaoTableRow
            key={movimentacao.id}
            movimentacao={movimentacao}
            selected={selectedIds.includes(movimentacao.id)}
            disabled={!eligibleIds.includes(movimentacao.id) || actionLoading}
            onToggleSelected={toggleSelectedId}
            onVisualizar={handleVisualizar}
          />
        ))}
      </>
    )
  }

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
            onClick={() => navigate('/home')}
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

          {isGestor ? (
            <>
              <Button
                type='button'
                className={ACTION_BUTTON_CLASS}
                disabled={!canUseSelection || actionLoading}
                onClick={() => void handleAction('aprovar')}
              >
                <Check size={16} />
                Aprovar
              </Button>

              <Button
                type='button'
                className={ACTION_BUTTON_CLASS}
                disabled={!canUseSelection || actionLoading}
                onClick={() => void handleAction('rejeitar')}
              >
                <X size={16} />
                Rejeitar
              </Button>
            </>
          ) : null}

          {canCancelMovimentacoes ? (
            <Button
              type='button'
              className={ACTION_BUTTON_CLASS}
              disabled={!canUseSelection || actionLoading}
              onClick={() => void handleAction('cancelar')}
            >
              <Minus size={16} />
              Cancelar
            </Button>
          ) : null}

          <Button type='button' className={ACTION_BUTTON_CLASS} disabled>
            <FileText size={16} />
            Relatório
          </Button>
        </div>
      </div>

      <Card className='space-y-1 p-6'>
        <div className='grid grid-cols-1 gap-4 xl:grid-cols-5'>
          <label className='space-y-2 text-sm font-semibold text-gray-700 xl:col-span-1'>
            <span>Pesquisa Geral</span>
            <div className='relative'>
              <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
              <input
                type='text'
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder='Pesquise por termo específico'
                className='h-10 w-full rounded-xs border border-gray-300 bg-white pl-10 pr-3 text-sm text-gray-700 outline-none transition focus:border-[#2F7D57]'
              />
            </div>
          </label>

          <FilterSelect
            label='Filtrar por Unidade de Origem'
            value={unidadeOrigemFilter}
            placeholder='Selecione uma unidade'
            options={unidadeOptions}
            onChange={(value) => {
              setUnidadeOrigemFilter(value)
              setPage(1)
            }}
          />

          <FilterSelect
            label='Filtrar por Unidade de Destino'
            value={unidadeDestinoFilter}
            placeholder='Selecione uma unidade'
            options={unidadeOptions}
            onChange={(value) => {
              setUnidadeDestinoFilter(value)
              setPage(1)
            }}
          />

          <label className='space-y-2 text-sm font-semibold text-gray-700'>
            <span>Filtrar por Status</span>
            <StatusMultiSelect
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
            />
          </label>

          <FilterSelect
            label='Movimentação Atrasada'
            value={atrasadaFilter}
            placeholder='Todos'
            options={atrasadaOptions}
            onChange={(value) => {
              setAtrasadaFilter(value as StatusFilterValue)
              setPage(1)
            }}
          />
        </div>

        <h2 className='text-sm font-semibold text-[#00703C]'>
          Bens Patrimoniais Movimentados
        </h2>

        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='border-b bg-[#F5F5F5]'>
              <tr className='text-left font-semibold text-gray-600'>
                <th className='p-3'>
                  <Checkbox
                    checked={allEligibleSelected}
                    disabled={eligibleIds.length === 0 || actionLoading}
                    aria-label='Selecionar todas as movimentações elegíveis'
                    onCheckedChange={toggleAllEligibleSelection}
                  />
                </th>
                <th className='p-3'>CIMBPM</th>
                <th className='p-3'>Unidade Administrativa de Origem</th>
                <th className='p-3'>Unidade Administrativa de Destino</th>
                <th className='p-3'>Atualizado em</th>
                <th className='p-3'>Status</th>
                <th className='p-3 text-center'>Ações</th>
              </tr>
            </thead>

            <tbody>{tableBody}</tbody>
          </table>
        </div>

        <div className='flex items-center justify-center gap-1 pt-2'>
          <Button
            size='icon'
            variant='ghost'
            disabled={page === 1}
            onClick={() => setPage((current) => current - 1)}
            aria-label='Página anterior'
          >
            ‹
          </Button>

          {pages.map((item, index) => renderPaginationItem(item, index))}

          <Button
            size='icon'
            variant='ghost'
            disabled={page === totalPages}
            onClick={() => setPage((current) => current + 1)}
            aria-label='Próxima página'
          >
            ›
          </Button>
        </div>
      </Card>
    </div>
  )
}