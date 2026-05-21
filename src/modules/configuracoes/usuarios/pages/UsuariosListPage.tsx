import { Eye, ArrowLeft, ArrowUpDown, Settings, FileText } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { AppBreadcrumb } from "@/components/AppBreadcrumb"
import { useUsuariosList } from "../hooks/useUsuariosList"
import { usePagination } from "../hooks/usePagination"
import { authService, type EscopoUa } from "../../../../auth/auth.service"

const PAGE_SIZE = 10

const INPUT_CLASS =
  "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white flex items-center"
const INPUT_SEARCH_CLASS =
  "h-9 w-full border border-gray-300 rounded-xs px-4 text-sm text-gray-700 bg-white"
const ACTION_BUTTON_CLASS =
  "h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors"

const ORDERING_MAP: Record<string, string> = {
  id: "id",
  username: "username",
  nome: "nome",
  unidade_orcamentaria: "unidade_orcamentaria__nome",
  grupo: "grupo__nome",
  status: "status",
}

export default function UsuariosListPage() {
  const navigate = useNavigate()

  const [unidades, setUnidades] = useState<EscopoUa[]>([])
  const [uoLabelsById, setUoLabelsById] = useState<Record<number, string>>({})

  const {
    usuarios,
    page,
    count,
    loading,
    searchInput,
    unidadeFilter,
    uoFilter,
    grupoFilter,
    statusFilter,
    setPage,
    setSearchInput,
    setUnidadeFilter,
    setUoFilter,
    setGrupoFilter,
    setStatusFilter,
    setOrdering,
  } = useUsuariosList({ pageSize: PAGE_SIZE })

  const { pages, totalPages } = usePagination({
    page,
    totalItems: count,
    pageSize: PAGE_SIZE,
  })

  useEffect(() => {
    const carregarUnidadesDoEscopo = async () => {
      try {
        const { data: me } = await authService.getCurrentUser()
        const grupos = me.opcoes_escopo?.grupos ?? []
        const uas: EscopoUa[] = grupos.flatMap((grupo) => grupo.uas)
        const uoLabels = grupos.reduce<Record<number, string>>((acc, grupo) => {
          if (grupo?.uo?.id && grupo?.uo?.label) acc[grupo.uo.id] = grupo.uo.label
          return acc
        }, {})
        setUnidades(uas)
        setUoLabelsById(uoLabels)
      } catch (error) {
        console.error("Erro ao carregar unidades do escopo", error)
      }
    }

    carregarUnidadesDoEscopo()
  }, [])

  const unidadesFiltradasPorUo = useMemo(() => {
    if (uoFilter === "todas") return unidades
    const uoId = Number(uoFilter)
    return unidades.filter((ua) => ua.unidade_orcamentaria_id === uoId)
  }, [unidades, uoFilter])

  const handleSort = (field: string) => {
    const backendField = ORDERING_MAP[field] ?? field
    setPage(1)
    setOrdering((prev) => {
      if (prev === backendField) return `-${backendField}`
      if (prev === `-${backendField}`) return ""
      return backendField
    })
  }

  const handleNovoUsuario = () => navigate("/usuarios/novo")
  const handleDetalhar = (id: number) => navigate(`/usuarios/${id}`)

  return (
    <div className="p-8 space-y-4">
      <AppBreadcrumb
        items={[
          { label: "Configurações", icon: Settings },
          { label: "Usuários", isActive: true },
        ]}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-gray-700">Usuários</h1>

        <div className="flex items-center gap-3">
          <Button type="button" onClick={() => navigate(-1)} className={ACTION_BUTTON_CLASS}>
            <ArrowLeft size={18} />
          </Button>

          <Button className={ACTION_BUTTON_CLASS} disabled>
            <FileText size={16} />
            Relatório
          </Button>

          <Button onClick={handleNovoUsuario} className={ACTION_BUTTON_CLASS}>
            Adicionar Usuário
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Filtrar por Nome do Usuário
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={INPUT_SEARCH_CLASS}
                placeholder="Digite o nome do usuário"
              />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Filtrar por Unidade Orçamentária
              <Select
                value={uoFilter}
                onValueChange={(v) => {
                  setUoFilter(v)
                  setUnidadeFilter("todas")
                  setPage(1)
                }}
              >
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {Object.entries(uoLabelsById).map(([uoId, label]) => (
                    <SelectItem key={uoId} value={uoId}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Filtrar por Unidade Administrativa
              <Select
                value={unidadeFilter}
                onValueChange={(v) => {
                  setUnidadeFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {unidadesFiltradasPorUo.map((ua) => (
                    <SelectItem key={ua.unidade_administrativa_id} value={ua.codigo}>
                      {ua.codigo} - {ua.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Filtrar por Grupo de Permissionamento
              <Select
                value={grupoFilter}
                onValueChange={(v) => {
                  setGrupoFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="GESTOR_PATRIMONIO">Gestor</SelectItem>
                  <SelectItem value="OPERADOR_INVENTARIO">Operador</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Filtrar por Status
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F5F5] border-b">
              <tr className="text-left text-gray-600 font-semibold">
                {[
                  { label: "ID", field: "id" },
                  { label: "Usuário", field: "username" },
                  { label: "Nome do Usuário", field: "nome" },
                  { label: "Unidade Orçamentaria", field: "unidade_orcamentaria" },
                  { label: "Grupo de Permissionamento", field: "grupo" },
                  { label: "Status", field: "status" },
                ].map((col) => (
                  <th
                    key={col.field}
                    className="p-3 cursor-pointer"
                    onClick={() => handleSort(col.field)}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      <ArrowUpDown size={14} />
                    </div>
                  </th>
                ))}
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10">
                    Carregando...
                  </td>
                </tr>
              ) : (
                usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{usuario.id}</td>
                    <td className="p-3 font-medium">{usuario.username}</td>
                    <td className="p-3">{usuario.nome}</td>
                    <td className="p-3">
                      {usuario.unidade_orcamentaria_codigo && usuario.unidade_orcamentaria_nome
                        ? `${usuario.unidade_orcamentaria_codigo} - ${usuario.unidade_orcamentaria_nome}`
                        : usuario.unidade_orcamentaria
                          ? (uoLabelsById[usuario.unidade_orcamentaria] ?? `UO ${usuario.unidade_orcamentaria}`)
                          : "—"}
                    </td>
                    <td className="p-3">{usuario.grupo_nome}</td>
                    <td className="p-3">{usuario.status_display}</td>
                    <td className="p-3 text-center">
                      <Button size="icon" variant="ghost" onClick={() => handleDetalhar(usuario.id)}>
                        <Eye size={18} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              ‹
            </Button>

            {pages.map((item) =>
              item.type === "ellipsis" ? (
                <span key={item.id} className="px-2 text-gray-500">
                  ...
                </span>
              ) : (
                <Button
                  key={item.value}
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(item.value)}
                  className={page === item.value ? "bg-[#00703C] text-white border-[#00703C]" : ""}
                >
                  {item.value}
                </Button>
              )
            )}

            <Button
              size="icon"
              variant="ghost"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              ›
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
