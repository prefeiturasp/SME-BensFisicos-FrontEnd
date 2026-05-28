import { ArrowLeft, Settings } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AppBreadcrumb } from "@/components/AppBreadcrumb"

import { usuarioService } from "../service/usuario.service"
import { authService, type EscopoGrupo, type EscopoUa } from "../../../../auth/auth.service"
import { type EditarUsuarioFormData, editarUsuarioSchema } from "../validators/editarUsuario"
import {
  ACTION_BUTTON_CLASS,
  API_FIELD_PASSWORD,
  API_FIELD_PASSWORD_CONFIRM,
  PasswordStatusSection,
  UserTopSection,
  buildToggleTodasHandler,
  buildGrupoChangeHandler,
  applyApiFieldErrors,
  buildFieldMap,
  useUsuarioFormState,
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
  unidadesAdministrativas: EscopoUa[],
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

  const isGestor = data.grupo === "GESTOR_PATRIMONIO"
  const enviarTodasUas = isGestor && todasUnidades
  const unidadesParaEnvio = enviarTodasUas ? unidadesAdministrativas : selecionadas
  const idsAtuais = unidadesParaEnvio.map((ua) => ua.unidade_administrativa_id).sort((a, b) => a - b)
  const idsOriginais = [...(valoresOriginais?.unidadeIds ?? [])].sort((a, b) => a - b)
  const houveMudancaUo = (uoSelecionadaId ?? null) !== (valoresOriginais?.unidadeOrcamentariaId ?? null)
  if (JSON.stringify(idsAtuais) !== JSON.stringify(idsOriginais) || houveMudancaUo) {
    if (isGestor && !enviarTodasUas && unidadesParaEnvio.length === 0) {
      payload.unidades_administrativas = []
      payload.unidade_administrativa = null
      payload.unidade_orcamentaria = uoSelecionadaId ?? null
    } else {
      payload.unidades_administrativas = idsAtuais
      payload.unidade_administrativa = unidadesParaEnvio[0]?.unidade_administrativa_id ?? null
      payload.unidade_orcamentaria = unidadesParaEnvio[0]?.unidade_orcamentaria_id ?? uoSelecionadaId ?? null
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
    resolver: zodResolver(editarUsuarioSchema) as Resolver<EditarUsuarioFormData>,
    defaultValues: { nome: "", rf: "", email: "", unidade: [], grupo: "", status: "ativo", senha: "", confirmarSenha: "" },
  })

  const grupoSelecionado = watch("grupo")
  const statusSelecionado = watch("status")
  const unidadeObrigatoria = grupoSelecionado === "OPERADOR_INVENTARIO"

  const {
    idsSelecionados,
    uosDisponiveis,
    unidadesListadas,
    syncFormUnidades,
    toggleUa,
  } = useUsuarioFormState({
    gruposEscopo,
    uoSelecionadaId,
    unidadesAdministrativas,
    unidadesSelecionadas,
    filtroUa,
    todasUnidades,
    setUnidadesAdministrativas,
    setUnidadesSelecionadas,
    setFiltroUa,
    setTodasUnidades,
    setValue,
  })

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
        setValue("status", dadosUsuario.status === "inativo" ? "inativo" : "ativo")

        const grupos = (me.opcoes_escopo?.grupos ?? []).filter((g) => g?.uo?.id)
        setGruposEscopo(grupos)
        const uas = grupos.flatMap((g) => g.uas)
        setUnidadesAdministrativas(uas)

        const idsUsuario = getIdsUsuario(dadosUsuario)
        const selecionadas = uas.filter((ua) => idsUsuario.includes(ua.unidade_administrativa_id))
        setUnidadesSelecionadas(selecionadas)
        syncFormUnidades(selecionadas)

        const uoUsuarioId = typeof dadosUsuario.unidade_orcamentaria === "number" ? dadosUsuario.unidade_orcamentaria : null
        const uoInicial = uoUsuarioId ?? selecionadas[0]?.unidade_orcamentaria_id ?? grupos[0]?.uo.id ?? null
        setUoSelecionadaId(uoInicial)
        const uasDaUoInicial = uas.filter((ua) => ua.unidade_orcamentaria_id === uoInicial)
        const isGestor = (dadosUsuario.grupo_nome ?? "") === "GESTOR_PATRIMONIO"
        setTodasUnidades(isGestor && uasDaUoInicial.length > 0 && selecionadas.filter((ua) => ua.unidade_orcamentaria_id === uoInicial).length === uasDaUoInicial.length)

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

  const onSubmit: SubmitHandler<EditarUsuarioFormData> = async (data) => {
    if (!id) return
    try {
      setLoadingSalvar(true)
      setErrorMessage(null)
      const payload = mountPayload(data, valoresOriginais, unidadesAdministrativas, unidadesSelecionadas, todasUnidades, uoSelecionadaId)
      await usuarioService.partialUpdate(Number(id), payload)
      navigate(`/usuarios/${id}`)
    } catch (error: any) {
      const apiErrors = error?.response?.data
      if (apiErrors && typeof apiErrors === "object") {
        const fieldMap = buildFieldMap<EditarUsuarioFormData>("senha", "confirmarSenha", "unidade")
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
        <UserTopSection
          nomeValue={watch("nome")}
          rfValue={watch("rf")}
          usernameValue={usernameAcesso}
          usernameDisabled
          emailValue={watch("email")}
          grupoValue={watch("grupo")}
          statusValue={statusSelecionado}
          uoSelecionadaId={uoSelecionadaId}
          uosDisponiveis={uosDisponiveis}
          unidadeObrigatoria={unidadeObrigatoria}
          unidadesListadas={unidadesListadas}
          idsSelecionados={idsSelecionados}
          todasUnidades={todasUnidades}
          filtroUa={filtroUa}
          unidadeError={errors.unidade?.message}
          disableUaSelector={false}
          onNomeChange={(event) => setValue("nome", event.target.value, { shouldValidate: true })}
          onRfChange={(event) => setValue("rf", event.target.value, { shouldValidate: true })}
          onUsernameChange={() => undefined}
          onEmailChange={(event) => setValue("email", event.target.value, { shouldValidate: true })}
          onGrupoChange={buildGrupoChangeHandler(
            setValue,
            setUnidadesSelecionadas,
            syncFormUnidades,
            setTodasUnidades
          )}
          onStatusChange={(v) => setValue("status", v as "ativo" | "inativo", { shouldValidate: true })}
          onUoChange={setUoSelecionadaId}
          onFiltroUaChange={setFiltroUa}
          onToggleTodasUnidades={buildToggleTodasHandler(
            grupoSelecionado,
            setTodasUnidades,
            setUnidadesSelecionadas,
            syncFormUnidades,
            setFiltroUa,
            unidadesAdministrativas
          )}
          onToggleUa={toggleUa}
          nomeError={errors.nome?.message}
          rfError={errors.rf?.message}
          usernameError={undefined}
          emailError={errors.email?.message}
          grupoError={errors.grupo?.message}
        />

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
        />
      </Card>
    </div>
  )
}
