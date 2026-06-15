import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  Eye,
  FileText,
  Network,
  Search,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/auth/useAuth'
import type { EscopoGrupo } from '@/auth/auth.service'
import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePagination } from '../../bem/hooks/usePagination'
import { movimentacaoService } from '../services/movimentacao.service'
import type { MovimentacaoBemPatrimonialListItem } from '../types/movimentacao.types'

type UaOption = {
  id: number
  label: string
}

type StatusFilterValue = 'todos' | 'sim' | 'nao'

type StatusOption = {
  value: string
  label: string
}

type SelectOption = {
  value: string
  label: string
}

const PAGE_SIZE = 10

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

function resolveSolicitante(
  usuario: MovimentacaoBemPatrimonialListItem['solicitado_por'],
) {
  return usuario.nome_completo ?? usuario.username
}

function isAtrasada(movimentacao: MovimentacaoBemPatrimonialListItem) {
  if (movimentacao.status !== 'enviada') return false

  const dataCriacao = new Date(movimentacao.criado_em)
  if (Number.isNaN(dataCriacao.getTime())) return false

  const limite = new Date()
  limite.setDate(limite.getDate() - 7)

  return dataCriacao <= limite
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

function FilterSelect(props: Readonly<{
  label: string
  value: string
  placeholder: string
  options: SelectOption[]
  onChange: (value: string) => void
}>) {
  const { label, value, placeholder, options, onChange } = props

  return (
    <label className='space-y-2 text-sm font-semibold text-gray-700'>
      <span>{label}</span>
      <Select
        value={value}
        onValueChange={(nextValue) => {
          onChange(nextValue)
        }}
      >
        <SelectTrigger className={INPUT_CLASS}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position='popper' className='w-(--radix-select-trigger-width)'>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
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
      { value: 'sim', label: 'Sim' },
      { value: 'nao', label: 'Não' },
    ],
    [],
  )

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
            unidadeOrigemFilter !== 'todas' ? Number(unidadeOrigemFilter) : undefined,
          unidade_administrativa_destino:
            unidadeDestinoFilter !== 'todas' ? Number(unidadeDestinoFilter) : undefined,
          atrasada: atrasadaFilter === 'sim' ? 'true' : undefined,
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
  ])

  const movimentacoesVisiveis = useMemo(() => {
    if (atrasadaFilter !== 'nao') return movimentacoes
    return movimentacoes.filter((movimentacao) => !isAtrasada(movimentacao))
  }, [movimentacoes, atrasadaFilter])

  const handleVisualizar = (id: number) => {
    navigate(`/movimentacoes/${id}`)
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
      <td colSpan={6} className='py-10 text-center text-gray-400'>
        Nenhuma movimentação encontrada.
      </td>
    </tr>
  )

  if (loading) {
    tableBody = (
      <tr>
        <td colSpan={6} className='py-10 text-center text-gray-500'>
          Carregando...
        </td>
      </tr>
    )
  } else if (movimentacoesVisiveis.length > 0) {
    tableBody = (
      <>
        {movimentacoesVisiveis.map((movimentacao) => (
          <tr key={movimentacao.id} className='border-b hover:bg-gray-50'>
            <td className='p-3'>
              {resolveUaLabel(movimentacao.unidade_administrativa_origem)}
            </td>
            <td className='p-3'>
              {resolveUaLabel(movimentacao.unidade_administrativa_destino)}
            </td>
            <td className='p-3'>{resolveSolicitante(movimentacao.solicitado_por)}</td>
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
                onClick={() => handleVisualizar(movimentacao.id)}
              >
                <Eye size={18} />
              </Button>
            </td>
          </tr>
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

          <Button type='button' className={ACTION_BUTTON_CLASS} disabled>
            Aprovar
          </Button>

          <Button type='button' className={ACTION_BUTTON_CLASS} disabled>
            Rejeitar
          </Button>

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
                <th className='p-3'>Unidade Administrativa de Origem</th>
                <th className='p-3'>Unidade Administrativa de Destino</th>
                <th className='p-3'>Solicitado Por</th>
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
