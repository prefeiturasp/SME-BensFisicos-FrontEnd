import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { bemService, type Bem } from '../services/bem.service'

interface UseBensListProps {
  pageSize: number
}

const SEARCH_DEBOUNCE_MS = 400

export function useBensList({ pageSize }: UseBensListProps) {
  const [bens, setBens] = useState<Bem[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [escopoFilter, setEscopoFilter] = useState<string>('todas')
  const [baixadosAntigos, setBaixadosAntigos] = useState(false)
  const [ordering, setOrdering] = useState<string>('')

  // debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [searchInput])

  const fetchData = useCallback(async () => {
    setLoading(true)

    try {
      const data = await bemService.list({
        page,
        search,
        status: statusFilter === 'todos' ? undefined : statusFilter,
        unidade_administrativa:
          escopoFilter.startsWith('ua:')
            ? escopoFilter.replace('ua:', '')
            : undefined,
        unidade_orcamentaria:
          escopoFilter.startsWith('uo:')
            ? escopoFilter.replace('uo:', '')
            : undefined,
        baixados_mais_de_um_periodo: baixadosAntigos || undefined,
        ordering,
      })

      setBens(data.results)
      setCount(data.count)
    } catch {
      toast.error('Erro ao listar bens')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, escopoFilter, baixadosAntigos, ordering])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleSelect = (bem: Bem) => {
    if (bem.status !== 'aguardando_aprovacao') return

    setSelectedIds(prev =>
      prev.includes(bem.id)
        ? prev.filter(id => id !== bem.id)
        : [...prev, bem.id]
    )
  }

  const atualizarStatusSelecionados = async (
    action: 'aprovar' | 'reprovar',
    successMessage: string,
    errorMessage: string
  ) => {
    if (!selectedIds.length) return

    try {
      await bemService[action](selectedIds)
      toast.success(successMessage)
      setSelectedIds([])
      fetchData()
    } catch {
      toast.error(errorMessage)
    }
  }

  return {
    bens,
    selectedIds,
    page,
    count,
    loading,
    searchInput,
    statusFilter,
    escopoFilter,
    baixadosAntigos,
    ordering,

    setPage,
    setSearchInput,
    setStatusFilter,
    setEscopoFilter,
    setBaixadosAntigos,
    setOrdering,
    toggleSelect,
    atualizarStatusSelecionados,
  }
}