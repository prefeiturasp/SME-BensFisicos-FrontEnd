import { ArrowLeft, Settings } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppBreadcrumb } from "@/components/AppBreadcrumb"

import { usuarioService } from "../service/usuario.service"
import { authService, type EscopoGrupo, type EscopoUa } from "../../../../auth/auth.service"
import { UnidadesAdministrativasSelector } from "../components/UnidadesAdministrativasSelector"
import { type EditarUsuarioFormData, editarUsuarioSchema } from "../validators/editarUsuario"
import {
  ACTION_BUTTON_CLASS,
  API_FIELD_PASSWORD,
  API_FIELD_PASSWORD_CONFIRM,
  API_FIELD_UNIDADE_ADMINISTRATIVA,
  API_FIELD_UNIDADES_ADMINISTRATIVAS,
  INPUT_CLASS,
  INPUT_TEXT_CLASS,
  PasswordStatusSection,
  REQUIRED,
  applyApiFieldErrors,
} from "./usuarioFormShared"

interface ValoresOriginais {
  nome: string
  rf: string
  email: string
  grupo: string
  status: string
  unidadeIds: number[]
  unidadeOrcamentariaId: number | null
}

function getIdsUsuario(dadosUsuario: any): number[] {
  if (dadosUsuario.unidades_administrativas?.length) return dadosUsuario.unidades_administrativas
  if (dadosUsuario.unidade_administrativa) return [dadosUsuario.unidade_administrativa]
  return []
}

function mountPayload(
  data: EditarUsuarioFormData,
  valoresOriginais: ValoresOriginais | null,
  selecionadas: EscopoUa[],
  todasUnidades: boolean,
  uoSelecionadaId: number | null
) {
  const payload: Record<string, unknown> = {}
  if (data.nome !== valoresOriginais?.nome) payload.nome = data.nome
  if (data.rf !== valoresOriginais?.rf) payload.rf = data.rf
  if (data.email !== valoresOriginais?.email) payload.email = data.email
  if (data.grupo !== valoresOriginais?.grupo) payload.group_name = data.grupo

  const isActiveAtual = data.status === "ativo"
  const isActiveOriginal = valoresOriginais?.status === "ativo"
  if (isActiveAtual !== isActiveOriginal) payload.is_active = isActiveAtual

  const semSelecaoGestor = data.grupo === "GESTOR_PATRIMONIO" && (todasUnidades || selecionadas.length === 0)
  const idsAtuais = selecionadas.map((ua) => ua.unidade_administrativa_id).sort((a, b) => a - b)
  const idsOriginais = [...(valoresOriginais?.unidadeIds ?? [])].sort((a, b) => a - b)
  const houveMudancaUo = (uoSelecionadaId ?? null) !== (valoresOriginais?.unidadeOrcamentariaId ?? null)
  if (JSON.stringify(idsAtuais) !== JSON.stringify(idsOriginais) || houveMudancaUo) {
    if (semSelecaoGestor) {
      payload.unidades_administrativas = []
      payload.unidade_administrativa = null
      payload.unidade_orcamentaria = uoSelecionadaId ?? null
    } else {
      payload.unidades_administrativas = idsAtuais
      payload.unidade_administrativa = idsAtuais[0] ?? null
      payload.unidade_orcamentaria = selecionadas[0]?.unidade_orcamentaria_id ?? uoSelecionadaId ?? null
    }
  }

  if (data.senha) {
    payload[API_FIELD_PASSWORD] = data.senha
    payload[API_FIELD_PASSWORD_CONFIRM] = data.confirmarSenha
  }

  return payload
}

export default function EditarUsuarioPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [unidadesAdministrativas, setUnidadesAdministrativas] = useState<EscopoUa[]>([])
  const [gruposEscopo, setGruposEscopo] = useState<EscopoGrupo[]>([])
  const [uoSelecionadaId, setUoSelecionadaId] = useState<number | null>(null)
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState<EscopoUa[]>([])
  const [filtroUa, setFiltroUa] = useState("")
  const [todasUnidades, setTodasUnidades] = useState(false)
  const [loadingDados, setLoadingDados] = useState(true)
  const [loadingSalvar, setLoadingSalvar] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [usernameAcesso, setUsernameAcesso] = useState("")
  const [valoresOriginais, setValoresOriginais] = useState<ValoresOriginais | null>(null)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false)

  const { register, handleSubmit, setValue, setError, watch, formState: { errors } } = useForm<EditarUsuarioFormData>({
    resolver: zodResolver(editarUsuarioSchema),
    defaultValues: { nome: "", rf: "", email: "", unidade: [], grupo: "", status: "ativo", senha: "", confirmarSenha: "" },
  })

  const grupoSelecionado = watch("grupo")
  const statusSelecionado = watch("status")
  const unidadeObrigatoria = grupoSelecionado === "OPERADOR_INVENTARIO"

  const idsSelecionados = useMemo(() => new Set(unidadesSelecionadas.map((ua) => ua.unidade_administrativa_id)), [unidadesSelecionadas])
  const uosDisponiveis = useMemo(() => gruposEscopo.filter((g) => g?.uo?.id).map((g) => ({ id: g.uo.id, label: g.uo.label })), [gruposEscopo])
  const unidadesListadas = useMemo(() => {
    const termo = filtroUa.trim().toLowerCase()
    if (!termo) return unidadesAdministrativas
    return unidadesAdministrativas.filter((ua) => `${ua.codigo} ${ua.nome}`.toLowerCase().includes(termo))
  }, [filtroUa, unidadesAdministrativas])

  const syncFormUnidades = (selecionadas: EscopoUa[]) => {
    setValue("unidade", selecionadas.map((ua) => String(ua.unidade_administrativa_id)), { shouldValidate: true })
  }

  const toggleUa = (ua: EscopoUa) => {
    if (todasUnidades) {
      setTodasUnidades(false)
      const next = unidadesAdministrativas.filter((item) => item.unidade_administrativa_id !== ua.unidade_administrativa_id)
      setUnidadesSelecionadas(next)
      syncFormUnidades(next)
      return
    }
    const jaSelecionada = idsSelecionados.has(ua.unidade_administrativa_id)
    const next = jaSelecionada
      ? unidadesSelecionadas.filter((item) => item.unidade_administrativa_id !== ua.unidade_administrativa_id)
      : [...unidadesSelecionadas, ua]
    const selecionouTodasManualmente = unidadesAdministrativas.length > 0 && next.length === unidadesAdministrativas.length
    setTodasUnidades(selecionouTodasManualmente)
    setUnidadesSelecionadas(next)
    syncFormUnidades(next)
  }

  useEffect(() => {
    const carregar = async () => {
      if (!id) return
      try {
        setLoadingDados(true)
        const [dadosUsuario, { data: me }] = await Promise.all([usuarioService.retrieve(Number(id)), authService.getCurrentUser()])
        setValue("nome", dadosUsuario.nome ?? "")
        setValue("rf", dadosUsuario.rf ?? "")
        setValue("email", dadosUsuario.email ?? "")
        setUsernameAcesso(dadosUsuario.username ?? "")
        setValue("grupo", dadosUsuario.grupo_nome ?? "")
        setValue("status", dadosUsuario.status ?? "ativo")

        const grupos = (me.opcoes_escopo?.grupos ?? []).filter((g) => g?.uo?.id)
        setGruposEscopo(grupos)
        const uas = grupos.flatMap((g) => g.uas)
        setUnidadesAdministrativas(uas)

        const idsUsuario = getIdsUsuario(dadosUsuario)
        const selecionadas = uas.filter((ua) => idsUsuario.includes(ua.unidade_administrativa_id))
        setUnidadesSelecionadas(selecionadas)
        syncFormUnidades(selecionadas)
        setTodasUnidades((dadosUsuario.grupo_nome ?? "") === "GESTOR_PATRIMONIO" && idsUsuario.length === 0)

        const uoUsuarioId = typeof dadosUsuario.unidade_orcamentaria === "number" ? dadosUsuario.unidade_orcamentaria : null
        const uoInicial = uoUsuarioId ?? selecionadas[0]?.unidade_orcamentaria_id ?? grupos[0]?.uo.id ?? null
        setUoSelecionadaId(uoInicial)

        setValoresOriginais({
          nome: dadosUsuario.nome ?? "",
          rf: dadosUsuario.rf ?? "",
          email: dadosUsuario.email ?? "",
          grupo: dadosUsuario.grupo_nome ?? "",
          status: dadosUsuario.status ?? "ativo",
          unidadeIds: selecionadas.map((ua) => ua.unidade_administrativa_id),
          unidadeOrcamentariaId: uoInicial,
        })
      } catch {
        setErrorMessage("Erro ao carregar os dados do usuário.")
      } finally {
        setLoadingDados(false)
      }
    }
    carregar()
  }, [id, setValue])

  useEffect(() => {
    if (!uoSelecionadaId) {
      setUnidadesAdministrativas([])
      setUnidadesSelecionadas([])
      setFiltroUa("")
      syncFormUnidades([])
      return
    }
    const grupo = gruposEscopo.find((g) => g.uo.id === uoSelecionadaId)
    const uasDaUo = grupo?.uas ?? []
    setUnidadesAdministrativas(uasDaUo)
    setUnidadesSelecionadas((prev) => {
      const filtradas = prev.filter((ua) => ua.unidade_orcamentaria_id === uoSelecionadaId)
      syncFormUnidades(filtradas)
      return filtradas
    })
  }, [uoSelecionadaId, gruposEscopo])

  const onSubmit = async (data: EditarUsuarioFormData) => {
    if (!id) return
    try {
      setLoadingSalvar(true)
      setErrorMessage(null)
      const payload = mountPayload(data, valoresOriginais, unidadesSelecionadas, todasUnidades, uoSelecionadaId)
      await usuarioService.partialUpdate(Number(id), payload)
      navigate(`/usuarios/${id}`)
    } catch (error: any) {
      const apiErrors = error?.response?.data
      if (apiErrors && typeof apiErrors === "object") {
        const fieldMap: Record<string, keyof EditarUsuarioFormData> = {
          rf: "rf",
          email: "email",
          nome: "nome",
          group_name: "grupo",
          [API_FIELD_PASSWORD]: "senha",
          [API_FIELD_PASSWORD_CONFIRM]: "confirmarSenha",
          [API_FIELD_UNIDADES_ADMINISTRATIVAS]: "unidade",
          [API_FIELD_UNIDADE_ADMINISTRATIVA]: "unidade",
        }
        const hasFieldError = applyApiFieldErrors<EditarUsuarioFormData>(apiErrors, fieldMap, setError)
        if (typeof apiErrors.detail === "string") setErrorMessage(apiErrors.detail)
        else setErrorMessage(hasFieldError ? "Corrija os campos destacados." : "Erro de validação ao salvar usuário.")
      } else {
        setErrorMessage(error?.message ?? "Erro ao salvar usuário.")
      }
    } finally {
      setLoadingSalvar(false)
    }
  }

  if (loadingDados) return <div className="p-8 flex items-center justify-center"><span className="text-gray-500 text-sm">Carregando...</span></div>

  return (
    <div className="p-8 space-y-4">
      <AppBreadcrumb items={[{ label: "Configurações", icon: Settings }, { label: "Usuários" }, { label: "Editar Usuário", isActive: true }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-gray-700">Editar Usuário</h1>
        <div className="flex items-center gap-3">
          <Button type="button" onClick={() => navigate(-1)} className={ACTION_BUTTON_CLASS}><ArrowLeft size={18} /></Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={loadingSalvar} className="h-10 px-6 bg-[#2F7D57] text-white hover:bg-[#256947] rounded-md font-semibold">{loadingSalvar ? "Salvando..." : "Salvar"}</Button>
          <Button onClick={() => navigate("/usuarios")} className={ACTION_BUTTON_CLASS}>Cancelar</Button>
        </div>
      </div>
      {errorMessage && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded">{errorMessage}</div>}

      <Card className="p-6 space-y-6">
        <form className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Nome Completo{REQUIRED}</span><input {...register("nome")} className={INPUT_TEXT_CLASS} placeholder="Digite o nome completo" />{errors.nome && <span className="text-red-600 text-sm">{errors.nome.message}</span>}</div>
          <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">RF{REQUIRED}</span><input {...register("rf")} className={INPUT_TEXT_CLASS} placeholder="Digite o rf" />{errors.rf && <span className="text-red-600 text-sm">{errors.rf.message}</span>}</div>
          <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Nome de Usuário de Acesso</span><input value={usernameAcesso} disabled className={`${INPUT_TEXT_CLASS} bg-gray-100 cursor-not-allowed`} placeholder="Não editável" /></div>
          <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">E-mail do Usuário{REQUIRED}</span><input {...register("email")} className={INPUT_TEXT_CLASS} placeholder="Digite o e-mail" />{errors.email && <span className="text-red-600 text-sm">{errors.email.message}</span>}</div>
          <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Grupo de Permissionamento{REQUIRED}</span><Select value={grupoSelecionado} onValueChange={(value) => { setValue("grupo", value, { shouldValidate: true }); setUnidadesSelecionadas([]); syncFormUnidades([]); if (value !== "GESTOR_PATRIMONIO") setTodasUnidades(false) }}><SelectTrigger className={INPUT_CLASS}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="GESTOR_PATRIMONIO">Gestor</SelectItem><SelectItem value="OPERADOR_INVENTARIO">Operador</SelectItem></SelectContent></Select></div>
          <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Unidade Orçamentária{REQUIRED}</span><Select value={uoSelecionadaId ? String(uoSelecionadaId) : undefined} onValueChange={(value) => setUoSelecionadaId(Number(value))}><SelectTrigger className={INPUT_CLASS}><SelectValue placeholder="Selecione a UO" /></SelectTrigger><SelectContent>{uosDisponiveis.map((uo) => <SelectItem key={uo.id} value={String(uo.id)}>{uo.label}</SelectItem>)}</SelectContent></Select></div>
          <div>
            <UnidadesAdministrativasSelector
              unidadesListadas={unidadesListadas}
              isSelecionada={(uaId) => idsSelecionados.has(uaId)}
              todasUnidades={todasUnidades}
              filtroUa={filtroUa}
              inputClassName={INPUT_TEXT_CLASS}
              requiredNode={unidadeObrigatoria ? REQUIRED : undefined}
              errorMessage={errors.unidade?.message}
              onFiltroChange={setFiltroUa}
              onToggleTodasUnidades={() => {
                setTodasUnidades((prev) => {
                  const next = !prev
                  if (next) {
                    setUnidadesSelecionadas([])
                    syncFormUnidades([])
                    setFiltroUa("")
                  }
                  return next
                })
              }}
              onToggleUa={toggleUa}
            />
          </div>
        </form>

        <PasswordStatusSection
          senhaId="senha"
          confirmarSenhaId="confirmarSenha"
          senhaField={register("senha")}
          confirmarSenhaField={register("confirmarSenha")}
          showSenha={mostrarSenha}
          showConfirmarSenha={mostrarConfirmarSenha}
          onToggleSenha={() => setMostrarSenha((v) => !v)}
          onToggleConfirmarSenha={() => setMostrarConfirmarSenha((v) => !v)}
          senhaError={errors.senha?.message}
          confirmarSenhaError={errors.confirmarSenha?.message}
          statusValue={statusSelecionado}
          onStatusChange={(v) => setValue("status", v, { shouldValidate: true })}
        />
      </Card>
    </div>
  )
}
