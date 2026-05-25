import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { usuarioService, type Usuario } from "../service/usuario.service"

interface UseUsuariosListProps {
    pageSize: number
}

const SEARCH_DEBOUNCE_MS = 400

export function useUsuariosList({ pageSize: _pageSize }: UseUsuariosListProps) {

    const [usuarios, setUsuarios] = useState<Usuario[]>([])

    const [page, setPage] = useState(1)
    const [count, setCount] = useState(0)
    const [loading, setLoading] = useState(false)

    const [searchInput, setSearchInput] = useState("")
    const [search, setSearch] = useState("")

    const [unidadeFilter, setUnidadeFilter] = useState("todas")
    const [uoFilter, setUoFilter] = useState("todas")
    const [grupoFilter, setGrupoFilter] = useState("todos")
    const [statusFilter, setStatusFilter] = useState("todos")

    const [ordering, setOrdering] = useState("")

    // debounce search
    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearch(searchInput)
            setPage(1)
        }, SEARCH_DEBOUNCE_MS)

        return () => clearTimeout(timeout)
    }, [searchInput])

    // =========================
    // FETCH USUÁRIOS
    // =========================
    const fetchUsuarios = useCallback(async () => {

        setLoading(true)

        try {
            const data = await usuarioService.list({
                page,
                search,
                unidade: unidadeFilter === "todas" ? undefined : unidadeFilter,
                unidade_orcamentaria: uoFilter === "todas" ? undefined : uoFilter,
                grupo: grupoFilter === "todos" ? undefined : grupoFilter,
                status: statusFilter === "todos" ? undefined : statusFilter,
                ordering,
            })

            setUsuarios(data.results)
            setCount(data.count)

        } catch {
            toast.error("Erro ao listar usuários")
        } finally {
            setLoading(false)
        }

    }, [page, search, unidadeFilter, uoFilter, grupoFilter, statusFilter, ordering])

    useEffect(() => {
        fetchUsuarios()
    }, [fetchUsuarios])

    return {
        usuarios,

        page,
        count,
        loading,

        searchInput,
        unidadeFilter,
        grupoFilter,
        uoFilter,
        statusFilter,
        ordering,

        setPage,
        setSearchInput,
        setUnidadeFilter,
        setGrupoFilter,
        setUoFilter,
        setStatusFilter,
        setOrdering,
    }
}
