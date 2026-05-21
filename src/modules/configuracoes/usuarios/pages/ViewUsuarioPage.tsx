import { ArrowLeft, Settings } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import { AppBreadcrumb } from "@/components/AppBreadcrumb"
import { usuarioService, type Usuario } from "../service/usuario.service"
import { authService } from "../../../../auth/auth.service"

const INPUT_TEXT_CLASS =
  "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-gray-50 cursor-not-allowed"

const ACTION_BUTTON_CLASS = `
  h-10 px-6 bg-white border border-[#2F7D57]
  text-[#2F7D57] hover:bg-[#2F7D57]
  hover:text-white font-semibold rounded-md transition-colors
`

type CampoProps = {
  readonly label: string
  readonly value: string | null | undefined
  readonly required?: boolean
}

function Campo({ label, value, required }: Readonly<CampoProps>) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <input
        type="text"
        disabled
        value={value ?? "—"}
        className={INPUT_TEXT_CLASS}
      />
    </div>
  )
}

function ListaUas({ unidades }: Readonly<{ unidades: string[] }>) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-gray-700">Unidades Administrativas</span>
      <div className="min-h-20 max-h-36 w-full rounded-xs border border-gray-300 px-3 py-3 text-sm text-gray-700 bg-gray-50 overflow-y-auto cursor-not-allowed">
        {unidades.length === 0 ? (
          <span className="text-gray-500">Nenhuma unidade administrativa selecionada.</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unidades.map((unidade) => (
              <span
                key={unidade}
                className="inline-flex items-center rounded-xs border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
              >
                {unidade}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ListaUasComHelper({
  unidades,
  exibirHelperTodas,
}: Readonly<{ unidades: string[]; exibirHelperTodas: boolean }>) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">Unidades Administrativas</span>
        {exibirHelperTodas && (
          <span className="inline-flex items-center rounded-xs border border-green-300 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-800">
            Todas da UO
          </span>
        )}
      </div>
      <div className="min-h-20 max-h-36 w-full rounded-xs border border-gray-300 px-3 py-3 text-sm text-gray-700 bg-gray-50 overflow-y-auto cursor-not-allowed">
        {unidades.length === 0 ? (
          <span className="text-gray-500">Nenhuma unidade administrativa selecionada.</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unidades.map((unidade) => (
              <span
                key={unidade}
                className="inline-flex items-center rounded-xs border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700"
              >
                {unidade}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getUnidadeOrcamentariaLabel(usuario: Usuario) {
  if (usuario.unidade_orcamentaria_codigo && usuario.unidade_orcamentaria_nome) {
    return `${usuario.unidade_orcamentaria_codigo} - ${usuario.unidade_orcamentaria_nome}`
  }
  return "—"
}

export default function ViewUsuarioPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uaLabelsById, setUaLabelsById] = useState<Record<number, string>>({})
  const [uoLabelsById, setUoLabelsById] = useState<Record<number, string>>({})
  const [uasByUoId, setUasByUoId] = useState<Record<number, string[]>>({})

  useEffect(() => {
    const carregarUsuario = async () => {
      if (!id) return

      try {
        setLoading(true)
        const data = await usuarioService.retrieve(Number(id))
        let me: any = null
        try {
          const meResponse = await authService.getCurrentUser()
          me = meResponse?.data
        } catch {
          me = null
        }
        const labels = (me?.opcoes_escopo?.grupos ?? [])
          .flatMap((g) => g.uas ?? [])
          .reduce<Record<number, string>>((acc, ua) => {
            acc[ua.unidade_administrativa_id] = `${ua.codigo} - ${ua.nome}`
            return acc
          }, {})
        const uasPorUo = (me?.opcoes_escopo?.grupos ?? []).reduce<Record<number, string[]>>((acc, g) => {
          if (!g?.uo?.id) return acc
          acc[g.uo.id] = (g.uas ?? []).map((ua) => `${ua.codigo} - ${ua.nome}`)
          return acc
        }, {})
        const uoLabels = (me?.opcoes_escopo?.grupos ?? []).reduce<Record<number, string>>((acc, g) => {
          if (g?.uo?.id && g?.uo?.label) acc[g.uo.id] = g.uo.label
          return acc
        }, {})
        setUaLabelsById(labels)
        setUasByUoId(uasPorUo)
        setUoLabelsById(uoLabels)
        setUsuario(data)
      } catch {
        setErrorMessage("Erro ao carregar os dados do usuário.")
      } finally {
        setLoading(false)
      }
    }

    carregarUsuario()
  }, [id])

  const handleEditar = () => {
    navigate(`/usuarios/${id}/editar`)
  }

  const isTodasUasDaUo = (item: Usuario): boolean => {
    const ids = Array.isArray(item.unidades_administrativas) ? item.unidades_administrativas : []
    const grupo = String(item.grupo_nome ?? "").toUpperCase()
    const isGestor = grupo.includes("GESTOR")
    return isGestor && ids.length === 0
  }

  const getUnidadesView = (item: Usuario): string[] => {
    const ids = Array.isArray(item.unidades_administrativas) ? item.unidades_administrativas : []
    if (ids.length > 0) {
      return ids.map((uaId) => uaLabelsById[uaId] ?? `UA ${uaId}`)
    }
    if (isTodasUasDaUo(item)) {
      const uoId = typeof (item as any).unidade_orcamentaria === "number" ? (item as any).unidade_orcamentaria : null
      if (uoId && uasByUoId[uoId]?.length) return uasByUoId[uoId]
      return []
    }
    if (item.unidade_codigo && item.unidade_nome) {
      return [`${item.unidade_codigo} - ${item.unidade_nome}`]
    }
    return []
  }

  const getUoViewLabel = (item: Usuario): string => {
    const labelDireto = getUnidadeOrcamentariaLabel(item)
    if (labelDireto !== "—") return labelDireto
    const uoId = (item as any).unidade_orcamentaria
    if (typeof uoId === "number" && uoLabelsById[uoId]) return uoLabelsById[uoId]
    return "—"
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <span className="text-gray-500 text-sm">Carregando...</span>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-4">

      <AppBreadcrumb
        items={[
          { label: "Configurações", icon: Settings },
          { label: "Usuários" },
          { label: "Visualizar Usuário", isActive: true },
        ]}
      />

      <div className="flex items-center justify-between">

        <h1 className="text-xl font-bold tracking-tight text-gray-700">
          Visualizar Usuário
        </h1>

        <div className="flex items-center gap-3">

          <Button
            type="button"
            onClick={() => navigate("/usuarios")}
            className={ACTION_BUTTON_CLASS}
          >
            <ArrowLeft size={18} />
          </Button>

          <Button
            onClick={handleEditar}
            className={ACTION_BUTTON_CLASS}
          >
            Editar
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded">
          {errorMessage}
        </div>
      )}

      {usuario && (
        <Card className="p-6 space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* 1 */}
            <Campo
              label="Nome Completo"
              value={usuario.nome}
              required
            />

            {/* 2 */}
            <Campo
              label="RF"
              value={usuario.rf}
              required
            />

            {/* 3 */}
            <Campo
              label="Nome de Usuário de Acesso"
              value={usuario.username}
            />

            {/* 4 */}
            <Campo
              label="E-mail do Usuário"
              value={usuario.email}
              required
            />

            {/* 5 */}
            <Campo
              label="Grupo de Permissionamento"
              value={usuario.grupo_nome}
              required
            />

            {/* 6 */}
            <Campo
              label="Status"
              value={usuario.status_display}
              required
            />

            {/* 7 */}
            <Campo
              label="Unidade Orçamentária"
              value={getUoViewLabel(usuario)}
              required
            />

            {/* 8 */}
            <ListaUasComHelper
              unidades={getUnidadesView(usuario)}
              exibirHelperTodas={isTodasUasDaUo(usuario)}
            />

          </div>

        </Card>
      )}

    </div>
  )
}
