import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { bemService, type Bem } from '../services/bem.service'

interface EscopoGrupoHook {
  uo: { id: number | string }
  uas: { unidade_administrativa_id: number | string }[]
}

interface UseBensListProps {
  pageSize: number
  persistKey?: string
  /**
   * Grupos de escopo (UO + suas UAs) do usuário. Usado para otimizar a
   * consulta: quando uma UO tem todas as suas UAs selecionadas, envia-se o id
   * da UO em vez de enumerar cada UA (evitando URLs muito longas).
   */
  grupos?: EscopoGrupoHook[]
}

const SEARCH_DEBOUNCE_MS = 400

const GRUPOS_VAZIOS: EscopoGrupoHook[] = []

function parseBool(value: string | null): boolean {
  return value === 'true'
}

/**
 * Separa as UAs selecionadas em: UOs totalmente marcadas (enviadas como id de
 * UO) e UAs avulsas (UOs parcialmente marcadas, enviadas individualmente).
 *
 * Retorna { unidadesOrcamentarias, unidadesAdministrativas } já como listas de
 * strings prontas para a query.
 */
function consolidarSelecao(
  uaSelecionadas: string[],
  grupos: EscopoGrupoHook[],
): { unidadesOrcamentarias: string[]; unidadesAdministrativas: string[] } {
  if (uaSelecionadas.length === 0 || grupos.length === 0) {
    return {
      unidadesOrcamentarias: [],
      unidadesAdministrativas: uaSelecionadas,
    }
  }

  const selecionadas = new Set(uaSelecionadas)
  const unidadesOrcamentarias: string[] = []
  const unidadesAdministrativas: string[] = []
  const cobertasPorUo = new Set<string>()

  for (const grupo of grupos) {
    const idsUa = grupo.uas.map(ua => String(ua.unidade_administrativa_id))
    if (idsUa.length === 0) continue

    const todasMarcadas = idsUa.every(id => selecionadas.has(id))
    if (todasMarcadas) {
      unidadesOrcamentarias.push(String(grupo.uo.id))
      idsUa.forEach(id => cobertasPorUo.add(id))
    }
  }

  // UAs que não foram cobertas por uma UO totalmente marcada vão individualmente.
  for (const id of uaSelecionadas) {
    if (!cobertasPorUo.has(id)) {
      unidadesAdministrativas.push(id)
    }
  }

  return { unidadesOrcamentarias, unidadesAdministrativas }
}

export function useBensList({
  pageSize,
  persistKey,
  grupos = GRUPOS_VAZIOS,
}: UseBensListProps) {
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

    // Otimização: UOs totalmente marcadas viram id de UO; as demais UAs vão
    // individualmente. Lista vazia = "Todas as UAs" (escopo padrão do backend).
    const { unidadesOrcamentarias, unidadesAdministrativas: uasAvulsas } =
      consolidarSelecao(unidadesAdministrativas, grupos)

    try {
      const data = await bemService.list({
        page,
        search,
        status: statusFilter === 'todos' ? undefined : statusFilter,
        unidade_administrativa: uasAvulsas.length > 0 ? uasAvulsas : undefined,
        unidade_orcamentaria:
          unidadesOrcamentarias.length > 0 ? unidadesOrcamentarias : undefined,
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
  }, [page, search, statusFilter, unidadesAdministrativas, grupos, bensBaixados, buscaGeralUos, ordering])

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