import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { bemService, type Bem } from '../services/bem.service'

interface UseBensListProps {
  pageSize: number
  persistKey?: string
}

const SEARCH_DEBOUNCE_MS = 400

function parseBool(value: string | null): boolean {
  return value === 'true'
}

export function useBensList({ pageSize, persistKey }: UseBensListProps) {
  const [bens, setBens] = useState<Bem[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  // Lista de IDs de Unidades Administrativas selecionadas no filtro
  // "Filtrar por Unidade". Lista vazia representa "Todas as UAs".
  const [unidadesAdministrativas, setUnidadesAdministrativas] = useState<
    string[]
  >([])
  const [bensBaixados, setBensBaixados] = useState(() => {
    if (!persistKey) return false
    return parseBool(localStorage.getItem(`${persistKey}:bensBaixados`))
  })
  const [buscaGeralUos, setBuscaGeralUos] = useState(() => {
    if (!persistKey) return false
    return parseBool(localStorage.getItem(`${persistKey}:buscaGeralUos`))
  })
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
        // Lista vazia = "Todas as UAs" (o service omite o parâmetro e o
        // backend aplica o escopo padrão da UO do usuário).
        unidade_administrativa:
          unidadesAdministrativas.length > 0 ? unidadesAdministrativas : undefined,
        busca_geral_uos: buscaGeralUos || undefined,
        bens_baixados: bensBaixados || undefined,
        ordering,
      })

      setBens(data.results)
      setCount(data.count)
    } catch {
      toast.error('Erro ao listar bens')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, unidadesAdministrativas, bensBaixados, buscaGeralUos, ordering])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!persistKey) return
    setBensBaixados(parseBool(localStorage.getItem(`${persistKey}:bensBaixados`)))
    setBuscaGeralUos(parseBool(localStorage.getItem(`${persistKey}:buscaGeralUos`)))
  }, [persistKey])

  useEffect(() => {
    if (!persistKey) return
    localStorage.setItem(`${persistKey}:bensBaixados`, String(bensBaixados))
  }, [persistKey, bensBaixados])

  useEffect(() => {
    if (!persistKey) return
    localStorage.setItem(`${persistKey}:buscaGeralUos`, String(buscaGeralUos))
  }, [persistKey, buscaGeralUos])

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
    unidadesAdministrativas,
    bensBaixados,
    buscaGeralUos,
    ordering,

    setPage,
    setSearchInput,
    setStatusFilter,
    setUnidadesAdministrativas,
    setBensBaixados,
    setBuscaGeralUos,
    setOrdering,
    toggleSelect,
    atualizarStatusSelecionados,
  }
}