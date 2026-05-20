import { ArrowLeft, Eye, EyeOff, Settings } from "lucide-react"
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

const INPUT_CLASS = "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white flex items-center"
const INPUT_TEXT_CLASS = "h-11 w-full rounded-xs border border-gray-300 px-4 text-sm text-gray-700 bg-white"
const ACTION_BUTTON_CLASS = "h-10 px-6 bg-white border border-[#2F7D57] text-[#2F7D57] hover:bg-[#2F7D57] hover:text-white font-semibold rounded-md transition-colors"
const REQUIRED = <span className="text-red-500 ml-1">*</span>

interface ValoresOriginais {
  nome: string
  rf: string
  email: string
  grupo: string
  status: string
  unidadeIds: number[]
}

function getIdsUsuario(dadosUsuario: any): number[] {
  if (dadosUsuario.unidades_administrativas?.length) {
    return dadosUsuario.unidades_administrativas
  }
  if (dadosUsuario.unidade_administrativa) {
    return [dadosUsuario.unidade_administrativa]
  }
  return []
}

function getSelecionadasEfetivas(
  selecionadas: EscopoUa[],
  grupo: string,
  todasDaUo: EscopoUa[]
) {
  if (selecionadas.length > 0) return selecionadas
  if (grupo === "GESTOR_PATRIMONIO") return todasDaUo
  return []
}

export default function EditarUsuarioPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const [unidadesAdministrativas, setUnidadesAdministrativas] = useState<EscopoUa[]>([])
  const [gruposEscopo, setGruposEscopo] = useState<EscopoGrupo[]>([])
  const [uoSelecionadaId, setUoSelecionadaId] = useState<number | null>(null)
  const [unidadesSelecionadas, setUnidadesSelecionadas] = useState<EscopoUa[]>([])
  const [filtroUa, setFiltroUa] = useState("")
  const [somenteSelecionadas, setSomenteSelecionadas] = useState(false)
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

  const idsSelecionados = useMemo(
    () => new Set(unidadesSelecionadas.map((ua) => ua.unidade_administrativa_id)),
    [unidadesSelecionadas]
  )

  const uosDisponiveis = useMemo(
    () =>
      gruposEscopo
      .filter((g) => g?.uo?.id)
      .map((g) => ({
        id: g.uo.id,
        label: g.uo.label,
      })),
    [gruposEscopo]
  )

  useEffect(() => {
    if (unidadesSelecionadas.length === 0 && somenteSelecionadas) setSomenteSelecionadas(false)
  }, [somenteSelecionadas, unidadesSelecionadas.length])

  const unidadesListadas = useMemo(() => {
    const base = somenteSelecionadas
      ? unidadesAdministrativas.filter((ua) => idsSelecionados.has(ua.unidade_administrativa_id))
      : unidadesAdministrativas
    const termo = filtroUa.trim().toLowerCase()
    if (!termo) return base
    return base.filter((ua) => `${ua.codigo} ${ua.nome}`.toLowerCase().includes(termo))
  }, [filtroUa, idsSelecionados, somenteSelecionadas, unidadesAdministrativas])

  const syncFormUnidades = (selecionadas: EscopoUa[]) => {
    setValue("unidade", selecionadas.map((ua) => String(ua.unidade_administrativa_id)), { shouldValidate: true })
  }

  const toggleUa = (ua: EscopoUa) => {
    const jaSelecionada = idsSelecionados.has(ua.unidade_administrativa_id)
    const next = jaSelecionada
      ? unidadesSelecionadas.filter((item) => item.unidade_administrativa_id !== ua.unidade_administrativa_id)
      : [...unidadesSelecionadas, ua]
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
        setUoSelecionadaId(selecionadas[0]?.unidade_orcamentaria_id ?? grupos[0]?.uo.id ?? null)

        setValoresOriginais({
          nome: dadosUsuario.nome ?? "",
          rf: dadosUsuario.rf ?? "",
          email: dadosUsuario.email ?? "",
          grupo: dadosUsuario.grupo_nome ?? "",
          status: dadosUsuario.status ?? "ativo",
          unidadeIds: selecionadas.map((ua) => ua.unidade_administrativa_id),
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
      const payload: Record<string, unknown> = {}

      if (data.nome !== valoresOriginais?.nome) payload.nome = data.nome
      if (data.rf !== valoresOriginais?.rf) payload.rf = data.rf
      if (data.email !== valoresOriginais?.email) payload.email = data.email
      if (data.grupo !== valoresOriginais?.grupo) payload.group_name = data.grupo

      const isActiveAtual = data.status === "ativo"
      const isActiveOriginal = valoresOriginais?.status === "ativo"
      if (isActiveAtual !== isActiveOriginal) payload.is_active = isActiveAtual

      const selecionadasEfetivas = getSelecionadasEfetivas(
        unidadesSelecionadas,
        data.grupo,
        unidadesAdministrativas
      )

      const idsAtuais = selecionadasEfetivas.map((ua) => ua.unidade_administrativa_id).sort((a, b) => a - b)
      const idsOriginais = [...(valoresOriginais?.unidadeIds ?? [])].sort((a, b) => a - b)
      if (JSON.stringify(idsAtuais) !== JSON.stringify(idsOriginais)) {
        payload.unidades_administrativas = idsAtuais
        payload.unidade_administrativa = idsAtuais[0] ?? null
        payload.unidade_orcamentaria = selecionadasEfetivas[0]?.unidade_orcamentaria_id ?? uoSelecionadaId ?? null
      }

      if (data.senha) {
        payload.password = data.senha
        payload.password_confirm = data.confirmarSenha
      }

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
          password: "senha",
          password_confirm: "confirmarSenha",
          unidades_administrativas: "unidade",
          unidade_administrativa: "unidade",
        }

        let hasFieldError = false
        Object.entries(fieldMap).forEach(([apiField, formField]) => {
          const value = apiErrors[apiField]
          if (value) {
            hasFieldError = true
            const msg = Array.isArray(value) ? String(value[0]) : String(value)
            setError(formField, { type: "server", message: msg })
          }
        })

        if (typeof apiErrors.detail === "string") {
          setErrorMessage(apiErrors.detail)
        } else if (hasFieldError) {
          setErrorMessage("Corrija os campos destacados.")
        } else {
          setErrorMessage("Erro de validação ao salvar usuário.")
        }
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
      <AppBreadcrumb items={[{ label: "Configuracoes", icon: Settings }, { label: "Usuarios" }, { label: "Editar Usuario", isActive: true }]} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-gray-700">Editar Usuario</h1>
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
          <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Grupo de Permissionamento{REQUIRED}</span><Select value={grupoSelecionado} onValueChange={(value) => { setValue("grupo", value, { shouldValidate: true }); setUnidadesSelecionadas([]); syncFormUnidades([]) }}><SelectTrigger className={INPUT_CLASS}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="GESTOR_PATRIMONIO">Gestor</SelectItem><SelectItem value="OPERADOR_INVENTARIO">Operador</SelectItem></SelectContent></Select></div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Nome de Usuario de Acesso</span><input value={usernameAcesso} disabled className={`${INPUT_TEXT_CLASS} bg-gray-100 cursor-not-allowed`} placeholder="Nao editavel" /></div>
            <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">E-mail do Usuario{REQUIRED}</span><input {...register("email")} className={INPUT_TEXT_CLASS} placeholder="Digite o e-mail" />{errors.email && <span className="text-red-600 text-sm">{errors.email.message}</span>}</div>
            <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Unidade Orçamentária{REQUIRED}</span><Select value={uoSelecionadaId ? String(uoSelecionadaId) : undefined} onValueChange={(value) => setUoSelecionadaId(Number(value))}><SelectTrigger className={INPUT_CLASS}><SelectValue placeholder="Selecione a UO" /></SelectTrigger><SelectContent>{uosDisponiveis.map((uo) => <SelectItem key={uo.id} value={String(uo.id)}>{uo.label}</SelectItem>)}</SelectContent></Select></div>
          </div>

                    <UnidadesAdministrativasSelector
            unidadesListadas={unidadesListadas}
            unidadesSelecionadasCount={unidadesSelecionadas.length}
            isSelecionada={(uaId) => idsSelecionados.has(uaId)}
            somenteSelecionadas={somenteSelecionadas}
            filtroUa={filtroUa}
            inputClassName={INPUT_TEXT_CLASS}
            requiredNode={unidadeObrigatoria ? REQUIRED : null}
            errorMessage={errors.unidade?.message}
            onFiltroChange={setFiltroUa}
            onToggleSomenteSelecionadas={() => setSomenteSelecionadas((prev) => !prev)}
            onToggleUa={toggleUa}
          />
        </form>
        <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Cadastre uma Senha</span><div className="relative"><input type={mostrarSenha ? "text" : "password"} placeholder="Cadastre uma senha" {...register("senha")} className={`${INPUT_TEXT_CLASS} pr-10`} /><button type="button" onClick={() => setMostrarSenha((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.senha && <span className="text-red-600 text-sm">{errors.senha.message}</span>}</div>
          <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Confirme a Senha</span><div className="relative"><input type={mostrarConfirmarSenha ? "text" : "password"} placeholder="Confirme a senha" {...register("confirmarSenha")} className={`${INPUT_TEXT_CLASS} pr-10`} /><button type="button" onClick={() => setMostrarConfirmarSenha((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{mostrarConfirmarSenha ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.confirmarSenha && <span className="text-red-600 text-sm">{errors.confirmarSenha.message}</span>}</div>
          <div className="flex flex-col gap-2"><span className="text-sm font-semibold text-gray-700">Status{REQUIRED}</span><Select value={statusSelecionado} onValueChange={(v) => setValue("status", v, { shouldValidate: true })}><SelectTrigger className={INPUT_CLASS}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent></Select></div>
        </div>
      </Card>
    </div>
  )
}



