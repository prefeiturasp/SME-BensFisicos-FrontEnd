import { ArrowLeft, Settings } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AppBreadcrumb } from "@/components/AppBreadcrumb"
import { usuarioService, type Usuario } from "../service/usuario.service"
import { authService } from "../../../../auth/auth.service"
import { GESTOR_BADGE_TEXT } from "./usuarioFormShared"

const INPUT_TEXT_CLASS = "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-gray-50 cursor-not-allowed"
const ACTION_BUTTON_CLASS = "h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors"

type CampoProps = {
  readonly label: string
  readonly value: string | null | undefined
  readonly required?: boolean
  readonly badge?: string
}
type EscopoMaps = { uaLabelsById: Record<number, string>; uoLabelsById: Record<number, string>; uasByUoId: Record<number, string[]> }

function Campo({ label, value, required, badge }: Readonly<CampoProps>) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2 w-fit">
        <span>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {badge && (
          <span className="inline-flex items-center whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            {badge}
          </span>
        )}
      </Label>
      <input type="text" disabled value={value ?? "—"} className={INPUT_TEXT_CLASS} />
    </div>
  )
}

function ListaUas({
  unidades,
  exibirHelperTodas,
  label,
  emptyMessage,
}: Readonly<{ unidades: string[]; exibirHelperTodas: boolean; label: string; emptyMessage: string }>) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-semibold text-gray-700">{label}</Label>
        {exibirHelperTodas && <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">Todas selecionadas</span>}
      </div>
      <div className="min-h-20 max-h-36 w-full rounded-xs border border-gray-300 px-3 py-3 text-sm text-gray-700 bg-gray-50 overflow-y-auto cursor-not-allowed">
        {unidades.length === 0 ? <span className="text-gray-500">{emptyMessage}</span> : (
          <div className="flex flex-wrap gap-2">
            {unidades.map((unidade) => <span key={unidade} className="inline-flex items-center rounded-xs border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700">{unidade}</span>)}
          </div>
        )}
      </div>
    </div>
  )
}

function buildEscopoMaps(me: any): EscopoMaps {
  const grupos = me?.opcoes_escopo?.grupos ?? []
  return {
    uaLabelsById: grupos.flatMap((g: any) => g.uas ?? []).reduce((acc: Record<number, string>, ua: any) => {
      acc[ua.unidade_administrativa_id] = `${ua.codigo} - ${ua.nome}`
      return acc
    }, {}),
    uasByUoId: grupos.reduce((acc: Record<number, string[]>, g: any) => {
      if (g?.uo?.id) acc[g.uo.id] = (g.uas ?? []).map((ua: any) => `${ua.codigo} - ${ua.nome}`)
      return acc
    }, {}),
    uoLabelsById: grupos.reduce((acc: Record<number, string>, g: any) => {
      if (g?.uo?.id && g?.uo?.label) acc[g.uo.id] = g.uo.label
      return acc
    }, {}),
  }
}

export default function ViewUsuarioPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [maps, setMaps] = useState<EscopoMaps>({ uaLabelsById: {}, uoLabelsById: {}, uasByUoId: {} })

  useEffect(() => {
    const carregar = async () => {
      if (!id) return
      try {
        setLoading(true)
        const data = await usuarioService.retrieve(Number(id))
        setUsuario(data)
        try {
          const { data: me } = await authService.getCurrentUser()
          setMaps(buildEscopoMaps(me))
        } catch {
          setMaps({ uaLabelsById: {}, uoLabelsById: {}, uasByUoId: {} })
        }
      } catch {
        setErrorMessage("Erro ao carregar os dados do usuário.")
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [id])

  const viewData = useMemo(() => {
    if (!usuario) return { uoLabel: "—", unidades: [] as string[], todasDaUo: false, emptyMessage: "Nenhuma UA selecionada." }
    const ids = Array.isArray(usuario.unidades_administrativas) ? usuario.unidades_administrativas : []
    const grupo = String(usuario.grupo_nome ?? "").toUpperCase()
    const isGestor = grupo.includes("GESTOR")
    const uoId = typeof (usuario as any).unidade_orcamentaria === "number" ? (usuario as any).unidade_orcamentaria : null
    const uasDaUo = uoId ? (maps.uasByUoId[uoId] ?? []) : []
    const todasDaUo = isGestor && ids.length > 0 && uasDaUo.length > 0 && ids.length === uasDaUo.length
    const uoLabelDireto = usuario.unidade_orcamentaria_codigo && usuario.unidade_orcamentaria_nome
      ? `${usuario.unidade_orcamentaria_codigo} - ${usuario.unidade_orcamentaria_nome}`
      : null
    const uoLabel = uoLabelDireto ?? (uoId && maps.uoLabelsById[uoId] ? maps.uoLabelsById[uoId] : "—")
    if (ids.length > 0) return { uoLabel, unidades: ids.map((uaId) => maps.uaLabelsById[uaId] ?? `UA ${uaId}`), todasDaUo, emptyMessage: "Nenhuma UA selecionada." }
    if (isGestor) return { uoLabel, unidades: [], todasDaUo: false, emptyMessage: "Nenhuma UA selecionada." }
    if (usuario.unidade_codigo && usuario.unidade_nome) return { uoLabel, unidades: [`${usuario.unidade_codigo} - ${usuario.unidade_nome}`], todasDaUo, emptyMessage: "Nenhuma UA selecionada." }
    return { uoLabel, unidades: [], todasDaUo, emptyMessage: isGestor ? "Nenhuma UA selecionada." : "Nenhuma unidade administrativa selecionada." }
  }, [usuario, maps])

  const isGestor = String(usuario?.grupo_nome ?? "").toUpperCase().includes("GESTOR")

  if (loading) return <div className="p-8 flex items-center justify-center"><span className="text-gray-500 text-sm">Carregando...</span></div>

  return (
    <div className="p-8 space-y-4">
      <AppBreadcrumb items={[{ label: "Configurações", icon: Settings }, { label: "Usuários" }, { label: "Visualizar Usuário", isActive: true }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-gray-700">Visualizar Usuário</h1>
        <div className="flex items-center gap-3">
          <Button type="button" onClick={() => navigate("/usuarios")} className={ACTION_BUTTON_CLASS}><ArrowLeft size={18} /></Button>
          <Button onClick={() => navigate(`/usuarios/${id}/editar`)} className={ACTION_BUTTON_CLASS}>Editar</Button>
        </div>
      </div>
      {errorMessage && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded">{errorMessage}</div>}
      {usuario && (
        <Card className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Campo label="Nome Completo" value={usuario.nome} required />
            <Campo label="RF" value={usuario.rf} required />
            <Campo label="Nome de Usuário de Acesso" value={usuario.username} />
            <Campo label="E-mail do Usuário" value={usuario.email} required />
            <Campo
              label="Grupo de Permissionamento"
              value={usuario.grupo_nome}
              required
              badge={isGestor ? GESTOR_BADGE_TEXT : undefined}
            />
            <Campo label="Status" value={usuario.status_display} required />
            <Campo label="Unidade Orçamentária" value={viewData.uoLabel} required />
            <ListaUas
              label={isGestor ? "Notificações das UAs" : "Unidades Administrativas"}
              unidades={viewData.unidades}
              exibirHelperTodas={viewData.todasDaUo}
              emptyMessage={viewData.emptyMessage}
            />
          </div>
        </Card>
      )}
    </div>
  )
}
