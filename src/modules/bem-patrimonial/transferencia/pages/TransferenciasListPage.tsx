import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, FileText, Network, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { AppBreadcrumb } from '@/components/AppBreadcrumb'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { FilterSelect } from '@/modules/bem-patrimonial/components/FilterSelect'
import { usePagination } from '@/modules/bem-patrimonial/bem/hooks/usePagination'
import { unidadesOrcamentariasService } from '@/modules/configuracoes/unidades-orcamentarias/services/unidades-orcamentarias.service'
import { transferenciaService } from '../services/transferencia.service'
import type { TransferenciaBemPatrimonialListItem } from '../types/transferencia.types'

type PaginationItem = number | '...'
type UoOption = {
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

function formatUoLabel(
  unidade: TransferenciaBemPatrimonialListItem['unidade_orcamentaria_origem'],
) {
  return unidade.label ?? `${unidade.codigo} - ${unidade.sigla || unidade.nome}`
}

function formatBemLabel(nomeBem: string | null | undefined) {
  return nomeBem?.trim() || '-'
}

function getNextSelectedIds(
  current: number[],
  selectedAll: boolean,
  transferencias: TransferenciaBemPatrimonialListItem[],
) {
  if (selectedAll) {
    return current.filter((id) => !transferencias.some((item) => item.id === id))
  }

  return [...new Set([...current, ...transferencias.map((item) => item.id)])]
}

function TransferenciaTableRow(props: Readonly<{
  transferencia: TransferenciaBemPatrimonialListItem
  selected: boolean
  onToggleSelected: (id: number) => void
  onVisualizar: (id: number) => void
}>) {
  const { transferencia, selected, onToggleSelected, onVisualizar } = props

  return (
    <tr className={`border-b hover:bg-gray-50 ${selected ? 'bg-green-50' : ''}`}>
      <td className='p-3 align-middle'>
        <Checkbox
          checked={selected}
          aria-label={`Selecionar transferência ${transferencia.id}`}
          onCheckedChange={() => onToggleSelected(transferencia.id)}
        />
      </td>
      <td className='p-3 text-sm text-gray-700'>{formatBemLabel(transferencia.nome_bem)}</td>
      <td className='p-3 font-mono text-sm text-gray-700'>
        {transferencia.numero_ntbpm ?? '-'}
      </td>
      <td className='p-3 text-sm text-gray-700'>
        {transferencia.numero_processo ?? '-'}
      </td>
      <td className='p-3 text-sm text-gray-700'>
        {formatUoLabel(transferencia.unidade_orcamentaria_origem)}
      </td>
      <td className='p-3 text-sm text-gray-700'>
        {transferencia.unidade_orcamentaria_destino.label ??
          `${transferencia.unidade_orcamentaria_destino.codigo} - ${transferencia.unidade_orcamentaria_destino.sigla || transferencia.unidade_orcamentaria_destino.nome}`}
      </td>
      <td className='p-3 text-center'>
        <Button
          type='button'
          size='icon'
          variant='ghost'
          aria-label={`Visualizar transferência ${transferencia.id}`}
          onClick={() => onVisualizar(transferencia.id)}
        >
          <Eye size={18} />
        </Button>
      </td>
    </tr>
  )
}

function PaginationItem(props: Readonly<{
  item: PaginationItem
  index: number
  currentPage: number
  onPageChange: (page: number) => void
}>) {
  const { item, index, currentPage, onPageChange } = props

  if (item === '...') {
    return (
      <span key={`pagination-ellipsis-${index}`} className='px-2 text-sm text-gray-500'>
        ...
      </span>
    )
  }

  return (
    <Button
      key={item}
      size='sm'
      variant='outline'
      onClick={() => onPageChange(Number(item))}
      className={currentPage === item ? 'border-[#00703C] bg-[#00703C] text-white' : ''}
    >
      {item}
    </Button>
  )
}

type TransferenciasTableBodyProps = Readonly<{
  loading: boolean
  transferencias: TransferenciaBemPatrimonialListItem[]
  selectedIds: number[]
  onToggleSelected: (id: number) => void
  onVisualizar: (id: number) => void
}>

function TransferenciasTableBody(props: TransferenciasTableBodyProps) {
  const { loading, transferencias, selectedIds, onToggleSelected, onVisualizar } = props

  if (loading) {
    return (
      <tr>
        <td colSpan={7} className='py-10 text-center text-gray-500'>
          Carregando...
        </td>
      </tr>
    )
  }

  if (transferencias.length === 0) {
    return (
      <tr>
        <td colSpan={7} className='py-10 text-center text-gray-400'>
          Nenhuma transferência encontrada.
        </td>
      </tr>
    )
  }

  return (
    <>
      {transferencias.map((transferencia) => (
        <TransferenciaTableRow
          key={transferencia.id}
          transferencia={transferencia}
          selected={selectedIds.includes(transferencia.id)}
          onToggleSelected={onToggleSelected}
          onVisualizar={onVisualizar}
        />
      ))}
    </>
  )
}

export default function TransferenciasListPage() {
  const navigate = useNavigate()

  const [transferencias, setTransferencias] = useState<TransferenciaBemPatrimonialListItem[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [uoOptions, setUoOptions] = useState<UoOption[]>([])
  const [numeroNtbpmInput, setNumeroNtbpmInput] = useState('')
  const [numeroNtbpm, setNumeroNtbpm] = useState('')
  const [nomeBemInput, setNomeBemInput] = useState('')
  const [nomeBem, setNomeBem] = useState('')
  const [numeroProcessoInput, setNumeroProcessoInput] = useState('')
  const [numeroProcesso, setNumeroProcesso] = useState('')
  const [uoOrigemFilter, setUoOrigemFilter] = useState('todos')
  const [uoDestinoFilter, setUoDestinoFilter] = useState('todos')

  const { pages, totalPages } = usePagination({
    page,
    totalItems: count,
    pageSize: PAGE_SIZE,
  })

  const selectedAll = useMemo(
    () => transferencias.length > 0 && transferencias.every((item) => selectedIds.includes(item.id)),
    [selectedIds, transferencias],
  )

  const uoFilterOptions = useMemo(
    () => [{ value: 'todos', label: 'Todos' }, ...uoOptions],
    [uoOptions],
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      setNumeroNtbpm(numeroNtbpmInput.trim())
      setPage(1)
    }, 350)

    return () => clearTimeout(timeout)
  }, [numeroNtbpmInput])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setNumeroProcesso(numeroProcessoInput.trim())
      setPage(1)
    }, 350)

    return () => clearTimeout(timeout)
  }, [numeroProcessoInput])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setNomeBem(nomeBemInput.trim())
      setPage(1)
    }, 350)

    return () => clearTimeout(timeout)
  }, [nomeBemInput])

  useEffect(() => {
    let active = true

    const loadUoOptions = async () => {
      try {
        const response = await unidadesOrcamentariasService.list({ pageSize: 1000 })
        if (!active) return

        setUoOptions(
          response.results.map((uo) => ({
            value: String(uo.id),
            label: `${uo.codigo} - ${uo.sigla || uo.nome}`,
          })),
        )
      } catch {
        if (!active) return
        setUoOptions([])
      }
    }

    void loadUoOptions()

    return () => {
      active = false
    }
  }, [])

  const loadTransferencias = useCallback(async () => {
    return transferenciaService.list({
      page,
      pageSize: PAGE_SIZE,
      nome_bem: nomeBem || undefined,
      numero_ntbpm: numeroNtbpm || undefined,
      numero_processo: numeroProcesso || undefined,
      unidade_orcamentaria_origem:
        uoOrigemFilter === 'todos' ? undefined : Number(uoOrigemFilter),
      unidade_orcamentaria_destino:
        uoDestinoFilter === 'todos' ? undefined : Number(uoDestinoFilter),
      ordering: '-criado_em',
    })
  }, [nomeBem, numeroNtbpm, numeroProcesso, page, uoDestinoFilter, uoOrigemFilter])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      try {
        const data = await loadTransferencias()

        if (!active) return

        setTransferencias(data.results)
        setCount(data.count)
      } catch (error) {
        if (!active) return
        console.error(error)
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [loadTransferencias])

  useEffect(() => {
    setSelectedIds([])
  }, [nomeBem, numeroNtbpm, numeroProcesso, page, uoDestinoFilter, uoOrigemFilter])

  function toggleSelectedId(id: number) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id],
    )
  }

  function toggleAll() {
    setSelectedIds((current) => getNextSelectedIds(current, selectedAll, transferencias))
  }

  return (
    <div className='p-8 space-y-4'>
      <AppBreadcrumb
        items={[
          { label: 'Bem Patrimonial', icon: Network },
          { label: 'Transferência de Bens Patrimoniais', icon: Network, isActive: true },
        ]}
      />

      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <h1 className='text-xl font-bold tracking-tight text-gray-700'>
          Transferência de Bens Patrimoniais
        </h1>

        <div className='flex flex-wrap items-center gap-3'>
          <Button
            type='button'
            className={ACTION_BUTTON_CLASS}
            aria-label='Voltar'
            onClick={() => navigate('/home')}
          >
            <ArrowLeft size={16} />
          </Button>

          <Button
            type='button'
            className={ACTION_BUTTON_CLASS}
            onClick={() => navigate('/transferencias/novo')}
          >
            Adicionar Transferência
          </Button>

          <Button type='button' className={ACTION_BUTTON_CLASS} disabled>
            <FileText size={16} />
            Relatório
          </Button>
        </div>
      </div>

      <Card className='space-y-4 p-6'>
        <div className='grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)] xl:items-start'>
          <div className='flex min-w-0 flex-col gap-1 text-sm font-semibold text-gray-700'>
            <label
              htmlFor='transferencias-filtro-nome-bem'
              className='flex min-h-[2.75rem] items-end leading-tight'
            >
              Filtrar por Nome do Bem
            </label>
            <div className='relative'>
              <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
              <Input
                id='transferencias-filtro-nome-bem'
                aria-label='Filtrar por Nome do Bem'
                type='text'
                value={nomeBemInput}
                onChange={(event) => setNomeBemInput(event.target.value)}
                placeholder='Digite o nome do bem'
                className={`${INPUT_CLASS} pl-10`}
              />
            </div>
          </div>

          <div className='flex min-w-0 flex-col gap-1 text-sm font-semibold text-gray-700'>
            <label
              htmlFor='transferencias-filtro-ntbpm'
              className='flex min-h-[2.75rem] items-end leading-tight'
            >
              Filtrar por NTBPM
            </label>
            <div className='relative'>
              <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
              <Input
                id='transferencias-filtro-ntbpm'
                aria-label='Filtrar por NTBPM'
                type='text'
                value={numeroNtbpmInput}
                onChange={(event) => setNumeroNtbpmInput(event.target.value)}
                placeholder='Digite o NTBPM'
                className={`${INPUT_CLASS} pl-10`}
              />
            </div>
          </div>

          <div className='flex min-w-0 flex-col gap-1 text-sm font-semibold text-gray-700'>
            <label
              htmlFor='transferencias-filtro-numero-processo'
              className='flex min-h-[2.75rem] items-end leading-tight'
            >
              Filtrar por Número do Processo
            </label>
            <div className='relative'>
              <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400' />
              <Input
                id='transferencias-filtro-numero-processo'
                aria-label='Filtrar por Número do Processo'
                type='text'
                value={numeroProcessoInput}
                onChange={(event) => setNumeroProcessoInput(event.target.value)}
                placeholder='Digite o número do processo'
                className={`${INPUT_CLASS} pl-10`}
              />
            </div>
          </div>

          <FilterSelect
            label='Filtrar por Unidade Orçamentária de Origem'
            value={uoOrigemFilter}
            placeholder='Todos'
            options={uoFilterOptions}
            className='min-w-0'
            onChange={(value) => {
              setUoOrigemFilter(value)
              setPage(1)
            }}
          />

          <FilterSelect
            label='Filtrar por Unidade Orçamentária de Destino'
            value={uoDestinoFilter}
            placeholder='Todos'
            options={uoFilterOptions}
            className='min-w-0'
            onChange={(value) => {
              setUoDestinoFilter(value)
              setPage(1)
            }}
          />
        </div>
        <h2 className='text-sm font-semibold text-[#00703C]'>
          Transferências de Bem Patrimonial Cadastradas
        </h2>

        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='border-b bg-[#F5F5F5]'>
              <tr className='text-left font-semibold text-gray-600'>
                <th className='p-3'>
                  <Checkbox
                    checked={selectedAll}
                    aria-label='Selecionar todas as transferências'
                    onCheckedChange={toggleAll}
                    disabled={transferencias.length === 0}
                  />
                </th>
                <th className='p-3'>Nome do Bem</th>
                <th className='p-3'>Número NTBPM</th>
                <th className='p-3'>Número do Processo</th>
                <th className='p-3'>Unidade Orçamentária de Origem</th>
                <th className='p-3'>Unidade Orçamentária de Destino</th>
                <th className='p-3 text-center'>Ações</th>
              </tr>
            </thead>

            <tbody>
              <TransferenciasTableBody
                loading={loading}
                transferencias={transferencias}
                selectedIds={selectedIds}
                onToggleSelected={toggleSelectedId}
                onVisualizar={(id) => navigate(`/transferencias/${id}`)}
              />
            </tbody>
          </table>
        </div>

        <div className='flex items-center justify-center gap-2 pt-4'>
          <Button
            size='icon'
            variant='ghost'
            disabled={page === 1}
            onClick={() => setPage((current) => current - 1)}
            aria-label='Página anterior'
          >
            <ChevronLeft size={16} />
          </Button>

          {pages.map((item, index) => (
            <PaginationItem
              key={`${item}-${index}`}
              item={item}
              index={index}
              currentPage={page}
              onPageChange={setPage}
            />
          ))}

          <Button
            size='icon'
            variant='ghost'
            disabled={page === totalPages}
            onClick={() => setPage((current) => current + 1)}
            aria-label='Próxima página'
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </Card>
    </div>
  )
}
